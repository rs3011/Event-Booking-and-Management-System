const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const Event = require('../models/Event');
const User = require('../models/User');

const db = setupTestDB();

describe('Admin Moderation Workflow & Public Visibility Tests', () => {
  let adminToken;
  let organizerToken;
  let attendeeToken;
  let adminUser;
  let organizerUser;

  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clear();

    // 1. Create Admin directly via User model to grant admin role
    const generateToken = require('../utils/generateToken');
    const adminDoc = await User.create({
      name: 'System Admin',
      email: 'moderator.admin@campus.edu',
      password: 'Password123!',
      role: 'admin',
    });
    adminToken = generateToken(adminDoc._id);
    adminUser = adminDoc;

    // 2. Create Organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Event Host',
        email: 'moderator.org@campus.edu',
        password: 'Password123!',
        role: 'organizer',
      });
    organizerToken = orgRes.body.data.token;
    organizerUser = orgRes.body.data.user;

    // 3. Create Attendee
    const attRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Guest',
        email: 'moderator.att@campus.edu',
        password: 'Password123!',
        role: 'attendee',
      });
    attendeeToken = attRes.body.data.token;
  });

  const getFutureDate = (daysAhead = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  };

  const createDraftEvent = async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Campus Leadership Forum 2026',
        description: 'Annual gathering of student leaders, mentors, and keynote speakers.',
        date: getFutureDate(20),
        location: {
          venue: 'Main Auditorium',
          address: '500 University Ave',
          city: 'Campus Town',
          country: 'USA',
        },
        capacity: 150,
        price: 0,
        category: 'conference',
      });
    return res.body.data.event;
  };

  it('should reject unauthenticated and non-admin requests to moderation endpoints (authorization)', async () => {
    const event = await createDraftEvent();

    // Unauthenticated approve
    const unauthApprove = await request(app)
      .put(`/api/admin/events/${event._id}/approve`);
    assert.equal(unauthApprove.status, 401);

    // Unauthenticated reject
    const unauthReject = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .send({ reason: 'Violates policy' });
    assert.equal(unauthReject.status, 401);

    // Attendee approve
    const attApprove = await request(app)
      .put(`/api/admin/events/${event._id}/approve`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    assert.equal(attApprove.status, 403);
    assert.match(attApprove.body.message, /not authorized/i);

    // Organizer approve (even on own event)
    const orgApprove = await request(app)
      .put(`/api/admin/events/${event._id}/approve`)
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.equal(orgApprove.status, 403);
    assert.match(orgApprove.body.message, /not authorized/i);

    // Organizer reject
    const orgReject = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ reason: 'Self reject' });
    assert.equal(orgReject.status, 403);
  });

  it('should enforce rejection validation: reason is required', async () => {
    const event = await createDraftEvent();

    const noReasonRes = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    assert.equal(noReasonRes.status, 400);
    assert.equal(noReasonRes.body.success, false);
    assert.ok(
      noReasonRes.body.errors?.some(
        (e) => /reason/i.test(e.message || '') || /reason/i.test(e.field || '')
      ) || /reason/i.test(noReasonRes.body.message || ''),
      'Must flag missing reason'
    );
  });

  it('should allow admin to reject an event, set status to draft, and record rejection reason', async () => {
    const event = await createDraftEvent();

    const rejectRes = await request(app)
      .put(`/api/admin/events/${event._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Incomplete venue safety documentation.' });

    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.success, true);
    assert.equal(rejectRes.body.data.event.status, 'draft');
    assert.equal(
      rejectRes.body.data.event.rejectionReason,
      'Incomplete venue safety documentation.'
    );
    assert.equal(
      rejectRes.body.data.event.moderatedBy.toString(),
      adminUser._id.toString()
    );
    assert.ok(rejectRes.body.data.event.moderatedAt);

    // Verify draft event is NOT publicly visible
    const publicList = await request(app).get('/api/events');
    assert.equal(publicList.status, 200);
    const listed = publicList.body.data.events.some((e) => e._id === event._id);
    assert.equal(listed, false, 'Draft/rejected event must not appear in public listing');

    const publicSlug = await request(app).get(`/api/events/${event.slug}`);
    assert.equal(publicSlug.status, 404, 'Draft/rejected event must return 404 on public slug lookup');
  });

  it('should allow admin to approve an event, publish it, and make it publicly visible', async () => {
    const event = await createDraftEvent();

    // Verify draft is not public before approval
    const preCheckList = await request(app).get('/api/events');
    assert.equal(preCheckList.body.data.events.some((e) => e._id === event._id), false);

    const approveRes = await request(app)
      .put(`/api/admin/events/${event._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.success, true);
    assert.equal(approveRes.body.data.event.status, 'published');
    assert.equal(
      approveRes.body.data.event.moderatedBy.toString(),
      adminUser._id.toString()
    );
    assert.ok(approveRes.body.data.event.moderatedAt);
    assert.equal(approveRes.body.data.event.rejectionReason, '');

    // Verify public listing now contains the approved event
    const postCheckList = await request(app).get('/api/events');
    assert.equal(postCheckList.status, 200);
    const foundInList = postCheckList.body.data.events.some((e) => e._id === event._id);
    assert.equal(foundInList, true, 'Approved event must appear in public event list');

    // Verify public slug lookup returns the event
    const postCheckSlug = await request(app).get(`/api/events/${event.slug}`);
    assert.equal(postCheckSlug.status, 200);
    assert.equal(postCheckSlug.body.success, true);
    assert.equal(postCheckSlug.body.data.event._id, event._id);
    assert.equal(postCheckSlug.body.data.event.status, 'published');
  });
});
