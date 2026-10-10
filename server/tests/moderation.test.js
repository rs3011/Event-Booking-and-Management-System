const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const User = require('../models/User');
const Event = require('../models/Event');
const generateToken = require('../utils/generateToken');

const db = setupTestDB();

describe('Campus Admin Moderation & Review Tests', () => {
  let adminToken;
  let adminId;
  let organizerToken;
  let organizerId;
  let studentToken;

  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clear();

    // 1. Create Admin directly (public registration restricts role to attendee/organizer)
    const adminUser = await User.create({
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      password: 'Password123!',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);
    adminId = adminUser._id;

    // 2. Create Organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Club Organizer',
        email: 'club@campus.edu',
        password: 'Password123!',
        role: 'organizer',
      });
    organizerToken = orgRes.body.data.token;
    organizerId = orgRes.body.data.user._id;

    // 3. Create Student (Attendee)
    const stuRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@campus.edu',
        password: 'Password123!',
        role: 'attendee',
      });
    studentToken = stuRes.body.data.token;
  });

  const getFutureDate = (daysAhead = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  };

  const createDraftEvent = async (customFields = {}) => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Robotics Workshop 2026',
        description: 'Comprehensive hands-on robotics building workshop for STEM students.',
        date: getFutureDate(14),
        location: {
          venue: 'Engineering Quad Lab 3',
          address: '400 Tech Boulevard',
          city: 'Campus City',
          country: 'USA',
        },
        capacity: 40,
        price: 0,
        category: 'workshop',
        ...customFields,
      });
    return res.body.data.event;
  };

  it('should allow an organizer to submit a complete draft event for review', async () => {
    const event = await createDraftEvent();
    assert.equal(event.status, 'draft');

    const submitRes = await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(submitRes.status, 200);
    assert.equal(submitRes.body.success, true);
    assert.equal(submitRes.body.data.event.status, 'pending_approval');
  });

  it('should prevent attendees from submitting events for approval (HTTP 403)', async () => {
    const event = await createDraftEvent();

    const submitRes = await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(submitRes.status, 403);
  });

  it('should fail submission if draft event is missing required venue details', async () => {
    // Insert raw document directly into collection to test controller validation
    const insertResult = await Event.collection.insertOne({
      title: 'Incomplete Event Without Location',
      slug: 'incomplete-event-without-location-' + Date.now(),
      description: 'Test description for event without complete location.',
      date: new Date(getFutureDate(7)),
      capacity: 20,
      category: 'meetup',
      organizer: organizerId,
      status: 'draft',
      location: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const submitRes = await request(app)
      .put(`/api/events/${insertResult.insertedId}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(submitRes.status, 400);
    assert.match(submitRes.body.message, /Missing required fields/);
  });

  it('should NOT list pending_approval events in public unauthenticated discovery', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    // Public listing
    const publicRes = await request(app).get('/api/events');
    assert.equal(publicRes.status, 200);
    const publicEventIds = publicRes.body.data.events.map((e) => e._id);
    assert.ok(!publicEventIds.includes(event._id), 'Pending review event leaked to public discovery');
  });

  it('should deny non-admins from approving or rejecting events (HTTP 403)', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    // Organizer attempts to approve
    const orgApprove = await request(app)
      .put(`/api/admin/events/${event._id}/approve`)
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.equal(orgApprove.status, 403);

    // Student attempts to reject
    const stuReject = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Spam' });
    assert.equal(stuReject.status, 403);
  });

  it('should allow campus admin to approve pending event and record audit fields', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const approveRes = await request(app)
      .put(`/api/admin/events/${event._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.success, true);
    assert.equal(approveRes.body.data.event.status, 'published');
    assert.equal(approveRes.body.data.event.moderatedBy.toString(), adminId.toString());
    assert.ok(approveRes.body.data.event.moderatedAt);
    assert.equal(approveRes.body.data.event.rejectionReason, '');

    // Now it should be visible in public discovery
    const publicRes = await request(app).get('/api/events');
    const publicEventIds = publicRes.body.data.events.map((e) => e._id);
    assert.ok(publicEventIds.includes(event._id));
  });

  it('should allow campus admin to reject event with reason and revert to draft', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const rejectReason = 'Please update the safety guidelines and specify lab equipment requirements.';
    const rejectRes = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: rejectReason });

    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.success, true);
    assert.equal(rejectRes.body.data.event.status, 'draft');
    assert.equal(rejectRes.body.data.event.rejectionReason, rejectReason);
    assert.equal(rejectRes.body.data.event.moderatedBy.toString(), adminId.toString());

    // Still excluded from public discovery
    const publicRes = await request(app).get('/api/events');
    const publicEventIds = publicRes.body.data.events.map((e) => e._id);
    assert.ok(!publicEventIds.includes(event._id));
  });

  it('should reject admin moderation if rejection reason is empty or missing (HTTP 400)', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const rejectRes = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '   ' });

    assert.equal(rejectRes.status, 400);
  });

  it('should allow organizer to cancel a pending_approval event to withdraw it', async () => {
    const event = await createDraftEvent();
    await request(app)
      .put(`/api/events/${event._id}/submit-for-approval`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const cancelRes = await request(app)
      .put(`/api/events/${event._id}/cancel`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.event.status, 'cancelled');
  });
});
