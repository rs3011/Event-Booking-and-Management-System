require('dotenv').config();
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function runLiveAtlasSmokeTest() {
  console.log('\n======================================================');
  console.log('   STARTING SAFE LIVE ATLAS SMOKE TEST');
  console.log('======================================================\n');

  // 1. Connect to Atlas
  const uri = process.env.MONGO_URI;
  if (!uri || !uri.includes('mongodb+srv')) {
    throw new Error('MONGO_URI must be an Atlas connection string in server/.env');
  }

  console.log('Step 1: Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log(`[PASS] Connected to database: "${mongoose.connection.name}" on host: "${mongoose.connection.host}"`);

  const runId = Date.now();
  const orgEmail = `smoke.org.${runId}@campus-test.edu`;
  const student1Email = `smoke.s1.${runId}@campus-test.edu`;
  const student2Email = `smoke.s2.${runId}@campus-test.edu`;
  const student3Email = `smoke.s3.${runId}@campus-test.edu`;

  let orgToken;
  let s1Token;
  let s2Token;
  let s3Token;
  let eventId;
  let s1RegId;
  let s2RegId;

  try {
    // Step 2: Register test organizer
    console.log('\nStep 2: Testing organizer registration & authentication...');
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Smoke Test Organizer',
        email: orgEmail,
        password: 'Password123!',
        role: 'organizer',
      });
    assert.equal(orgRes.status, 201, `Organizer signup failed: ${JSON.stringify(orgRes.body)}`);
    assert.ok(orgRes.body.data.token, 'Token missing in response');
    orgToken = orgRes.body.data.token;
    console.log('[PASS] Organizer authenticated with valid JWT.');

    // Step 3: Register students
    console.log('\nStep 3: Registering test students...');
    const s1Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student One', email: student1Email, password: 'Password123!', role: 'attendee' });
    s1Token = s1Res.body.data.token;

    const s2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student Two', email: student2Email, password: 'Password123!', role: 'attendee' });
    s2Token = s2Res.body.data.token;

    const s3Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Student Three', email: student3Email, password: 'Password123!', role: 'attendee' });
    s3Token = s3Res.body.data.token;
    console.log('[PASS] 3 test student accounts created on Atlas.');

    // Step 4: Organizer creates a draft event with capacity 2
    console.log('\nStep 4: Creating a draft event with capacity 2...');
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({
        title: `Campus Live Smoke Lab ${runId}`,
        description: 'Automated live Atlas verification for campus event management.',
        date: futureDate,
        location: {
          venue: 'Science Hall 101',
          address: 'Campus Way',
          city: 'University Park',
          country: 'USA',
        },
        capacity: 2,
        price: 0,
        category: 'workshop',
      });

    assert.equal(eventRes.status, 201);
    eventId = eventRes.body.data.event._id;
    assert.equal(eventRes.body.data.event.status, 'draft');
    assert.equal(eventRes.body.data.event.capacity, 2);
    assert.equal(eventRes.body.data.event.registeredCount, 0);
    console.log(`[PASS] Draft event created on Atlas: ID=${eventId}, Slug=${eventRes.body.data.event.slug}`);

    // Step 5: Publish event
    console.log('\nStep 5: Publishing event...');
    const publishRes = await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${orgToken}`);
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.data.event.status, 'published');
    console.log('[PASS] Event status is now "published" on Atlas.');

    // Step 6: Student 1 registers
    console.log('\nStep 6: Student 1 registering...');
    const reg1Res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1Token}`)
      .send({ ticketType: 'standard' });
    assert.equal(reg1Res.status, 201);
    assert.ok(reg1Res.body.data.confirmationCode, 'Confirmation code missing');
    s1RegId = reg1Res.body.data.registration._id;
    console.log(`[PASS] Student 1 registered. Code=${reg1Res.body.data.confirmationCode}, Status=confirmed.`);

    // Verify Atlas event count
    let eventDoc = await Event.findById(eventId);
    assert.equal(eventDoc.registeredCount, 1);
    console.log('[PASS] Atlas registeredCount atomic increment verified: 1 / 2.');

    // Step 7: Duplicate registration prevention
    console.log('\nStep 7: Verifying duplicate registration prevention for Student 1...');
    const dupRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1Token}`);
    assert.equal(dupRes.status, 400);
    assert.match(dupRes.body.message, /already registered/i);
    console.log('[PASS] Duplicate registration rejected by Atlas compound unique index.');

    // Step 8: Student 2 registers (fills event to 2/2)
    console.log('\nStep 8: Student 2 registering (filling event to maximum capacity)...');
    const reg2Res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s2Token}`);
    assert.equal(reg2Res.status, 201);
    s2RegId = reg2Res.body.data.registration._id;

    eventDoc = await Event.findById(eventId);
    assert.equal(eventDoc.registeredCount, 2);
    console.log('[PASS] Student 2 registered. Event is now full: 2 / 2.');

    // Step 9: Student 3 registers (must be rejected as full)
    console.log('\nStep 9: Student 3 attempting registration on full event...');
    const fullRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s3Token}`);
    assert.equal(fullRes.status, 400);
    assert.match(fullRes.body.message, /event is full/i);
    console.log('[PASS] Registration rejected: capacity ceiling enforced by Atlas atomic $expr.');

    // Step 10: QR Code Check-in
    console.log('\nStep 10: Testing ticket check-in by organizer...');
    const checkinRes = await request(app)
      .put(`/api/registrations/${s1RegId}/check-in`)
      .set('Authorization', `Bearer ${orgToken}`);
    assert.equal(checkinRes.status, 200);
    assert.equal(checkinRes.body.data.registration.status, 'attended');
    console.log('[PASS] Student 1 checked in successfully on Atlas: Status=attended.');

    // Step 11: Duplicate check-in prevention
    console.log('\nStep 11: Testing duplicate check-in prevention...');
    const dupCheckin = await request(app)
      .put(`/api/registrations/${s1RegId}/check-in`)
      .set('Authorization', `Bearer ${orgToken}`);
    assert.equal(dupCheckin.status, 400);
    assert.match(dupCheckin.body.message, /already been checked in/i);
    console.log('[PASS] Duplicate check-in rejected.');

    // Step 12: Student 2 cancels registration (releases capacity)
    console.log('\nStep 12: Student 2 cancelling registration...');
    const cancelRegRes = await request(app)
      .delete(`/api/registrations/${s2RegId}`)
      .set('Authorization', `Bearer ${s2Token}`);
    assert.equal(cancelRegRes.status, 200);

    eventDoc = await Event.findById(eventId);
    assert.equal(eventDoc.registeredCount, 1, 'Capacity should be released');
    console.log('[PASS] Registration cancelled. Atlas capacity successfully released: 1 / 2.');

    // Step 12b: Student 3 registers into newly released spot (status = confirmed)
    console.log('\nStep 12b: Student 3 registering into released spot...');
    const reg3Res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s3Token}`);
    assert.equal(reg3Res.status, 201);
    const s3RegId = reg3Res.body.data.registration._id;
    console.log('[PASS] Student 3 registered in released spot (Status=confirmed).');

    // Step 13: Organizer cancels event (cascading cancellation)
    console.log('\nStep 13: Organizer cancelling event...');
    const cancelEventRes = await request(app)
      .put(`/api/events/${eventId}/cancel`)
      .set('Authorization', `Bearer ${orgToken}`);
    assert.equal(cancelEventRes.status, 200);
    assert.equal(cancelEventRes.body.data.event.status, 'cancelled');

    // Confirm Student 3's confirmed registration cascaded to cancelled
    const reg3Doc = await Registration.findById(s3RegId);
    assert.equal(reg3Doc.status, 'cancelled', 'Confirmed registration must be marked cancelled');
    assert.ok(reg3Doc.cancelledAt, 'cancelledAt must be recorded on Atlas');

    // Confirm Student 1's attended registration preserved attendance history
    const reg1Doc = await Registration.findById(s1RegId);
    assert.equal(reg1Doc.status, 'attended', 'Attended registration must preserve attendance history');

    eventDoc = await Event.findById(eventId);
    assert.equal(eventDoc.registeredCount, 0, 'Event registeredCount must reset to 0');
    console.log('[PASS] Event cancellation verified: confirmed registrations cascaded to cancelled, attendance history preserved on Atlas.');

    console.log('\n======================================================');
    console.log('   ALL ATLAS LIVE VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    // Clean up only this smoke test run's records
    console.log('Cleaning up smoke test data from Atlas...');
    const emails = [orgEmail, student1Email, student2Email, student3Email];
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map((u) => u._id);

    if (eventId) {
      await Registration.deleteMany({ event: eventId });
      await Event.findByIdAndDelete(eventId);
    }
    if (userIds.length > 0) {
      await User.deleteMany({ _id: { $in: userIds } });
    }
    console.log('Cleaned up smoke test records cleanly.');
    await mongoose.disconnect();
    console.log('Atlas connection closed cleanly.');
  }
}

runLiveAtlasSmokeTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSMOKE TEST ERROR:', err);
    process.exit(1);
  });
