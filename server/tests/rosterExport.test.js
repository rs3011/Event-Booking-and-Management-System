const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const db = setupTestDB();

describe('Organizer Attendee Roster CSV Export & Analytics (ANA-01)', () => {
  let organizerToken;
  let organizerId;
  let otherOrganizerToken;
  let adminToken;
  let attendeeToken;
  let eventId;

  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  const registerUser = async (name, email, role = 'attendee') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password: 'Password123!', role });
    return { token: res.body.data.token, user: res.body.data.user };
  };

  const getFutureDate = (daysAhead = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  };

  beforeEach(async () => {
    await db.clear();

    // Create event organizer
    const org = await registerUser('CS Department Head', 'cshead@campus.edu', 'organizer');
    organizerToken = org.token;
    organizerId = org.user._id;

    // Create another organizer (unauthorized for this event)
    const otherOrg = await registerUser('Biology Dept Head', 'biohead@campus.edu', 'organizer');
    otherOrganizerToken = otherOrg.token;

    // Create campus administrator directly in DB (public signup forbids role=admin)
    const adminUser = await User.create({
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      password: 'Password123!',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    // Create standard attendee
    const att = await registerUser('Student Alice', 'alice@campus.edu', 'attendee');
    attendeeToken = att.token;

    // Create and publish an event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Annual Tech Symposium',
        description: 'Keynote speeches, tech workshops, and student presentations.',
        date: getFutureDate(14),
        location: { venue: 'Auditorium Hall', city: 'Campus' },
        capacity: 100,
        price: 15,
        category: 'conference',
      });

    eventId = eventRes.body.data.event._id;

    await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);
  });

  it('should require authentication for roster CSV export', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/registrations/export`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('should forbid attendee role from exporting roster CSV', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/registrations/export`)
      .set('Authorization', `Bearer ${attendeeToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('should forbid non-owner organizers from exporting roster CSV', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/registrations/export`)
      .set('Authorization', `Bearer ${otherOrganizerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('should allow event organizer to export roster CSV with correct headers and structure', async () => {
    // Register 2 students
    const s1 = await registerUser('Bob Builder', 'bob@campus.edu');
    const s2 = await registerUser('Charlie Brown', 'charlie@campus.edu');

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    const r2 = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s2.token}`);

    // Check in charlie
    const reg2Id = r2.body.data.registration._id;
    await request(app)
      .put(`/api/registrations/${reg2Id}/check-in`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const res = await request(app)
      .get(`/api/events/${eventId}/registrations/export`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment;\s*filename="roster-annual-tech-symposium-all\.csv"/i);
    assert.equal(res.headers['x-total-count'], '2');
    assert.equal(res.headers['x-checked-in-count'], '1');
    assert.equal(res.headers['x-check-in-rate'], '50');

    const csvText = res.text;
    assert.ok(csvText.includes('Registration ID'));
    assert.ok(csvText.includes('Confirmation Code'));
    assert.ok(csvText.includes('Attendee Name'));
    assert.ok(csvText.includes('Attendee Email'));
    assert.ok(csvText.includes('Bob Builder'));
    assert.ok(csvText.includes('Charlie Brown'));
    assert.ok(csvText.includes('--- EVENT ATTENDANCE & CHECK-IN ANALYTICS ---'));
    assert.ok(csvText.includes('Check-In Rate'));
    assert.ok(csvText.includes('50%'));
  });

  it('should allow campus admin to export roster CSV for any event', async () => {
    const s1 = await registerUser('Daisy Student', 'daisy@campus.edu');
    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    const res = await request(app)
      .get(`/api/events/${eventId}/registrations/export`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.ok(res.text.includes('Daisy Student'));
  });

  it('should filter roster by status (attended vs confirmed)', async () => {
    const s1 = await registerUser('Attendee One', 'att1@campus.edu');
    const s2 = await registerUser('Attendee Two', 'att2@campus.edu');

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    const r2 = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s2.token}`);

    // Check in Attendee Two
    await request(app)
      .put(`/api/registrations/${r2.body.data.registration._id}/check-in`)
      .set('Authorization', `Bearer ${organizerToken}`);

    // Request only attended
    const attendedRes = await request(app)
      .get(`/api/events/${eventId}/registrations/export?status=attended`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(attendedRes.status, 200);
    assert.match(attendedRes.headers['content-disposition'], /status=attended|all|attended/i);
    assert.ok(attendedRes.text.includes('Attendee Two'));
    assert.ok(!attendedRes.text.includes('Attendee One'));

    // Request only confirmed
    const confirmedRes = await request(app)
      .get(`/api/events/${eventId}/registrations/export?status=confirmed`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(confirmedRes.status, 200);
    assert.ok(confirmedRes.text.includes('Attendee One'));
    assert.ok(!confirmedRes.text.includes('Attendee Two'));
  });

  it('should filter roster by attendee search query', async () => {
    const s1 = await registerUser('Target Attendee', 'target@campus.edu');
    const s2 = await registerUser('Irrelevant Attendee', 'other@campus.edu');

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s2.token}`);

    const searchRes = await request(app)
      .get(`/api/events/${eventId}/registrations/export?search=target`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.text.includes('Target Attendee'));
    assert.ok(!searchRes.text.includes('Irrelevant Attendee'));
  });

  it('should record checkedInAt timestamp and calculate check-in rate accurately', async () => {
    const s1 = await registerUser('Checked Student', 'checked@campus.edu');
    const regRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    const regId = regRes.body.data.registration._id;

    const beforeCheckin = new Date();
    const checkinRes = await request(app)
      .put(`/api/registrations/${regId}/check-in`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(checkinRes.status, 200);
    const updatedReg = await Registration.findById(regId);
    assert.ok(updatedReg.checkedInAt, 'checkedInAt must be populated');
    assert.ok(new Date(updatedReg.checkedInAt) >= beforeCheckin);

    // Verify stats endpoint computes checkInRate and activeRegistrations
    const statsRes = await request(app)
      .get(`/api/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.body.data.stats.attendedCount, 1);
    assert.equal(statsRes.body.data.stats.activeRegistrations, 1);
    assert.equal(statsRes.body.data.stats.checkInRate, 100);
  });

  it('should sanitize CSV cells to prevent spreadsheet formula injection', async () => {
    // Register student with malicious formula prefix
    const s1 = await registerUser('=SUM(1+1)', 'formula@campus.edu');
    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`)
      .send({ notes: '@malicious_tag' });

    const exportRes = await request(app)
      .get(`/api/events/${eventId}/registrations/export`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(exportRes.status, 200);
    // Formula characters (=, +, -, @) must be escaped with a leading single quote
    assert.ok(exportRes.text.includes("''=SUM(1+1)\"") || exportRes.text.includes("''=SUM") || exportRes.text.includes("'=SUM(1+1)"));
    assert.ok(exportRes.text.includes("'@malicious_tag"));
  });

  it('should also work on the alias route /api/events/:id/attendees/export', async () => {
    const s1 = await registerUser('Alias Student', 'alias@campus.edu');
    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${s1.token}`);

    const res = await request(app)
      .get(`/api/events/${eventId}/attendees/export`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.ok(res.text.includes('Alias Student'));
  });
});
