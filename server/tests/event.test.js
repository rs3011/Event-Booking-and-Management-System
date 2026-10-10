const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const Registration = require('../models/Registration');

const db = setupTestDB();

describe('Event Lifecycle & Management Tests', () => {
  let organizerToken;
  let attendeeToken;
  let organizerId;

  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clear();

    // Create organizer
    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Event Organizer',
        email: 'organizer@campus.edu',
        password: 'Password123!',
        role: 'organizer',
      });
    organizerToken = orgRes.body.data.token;
    organizerId = orgRes.body.data.user._id;

    // Create attendee
    const attRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Attendee',
        email: 'student@campus.edu',
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

  it('should allow an organizer to create a draft event with slug generation', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Spring Campus Hackathon 2026',
        description: 'An annual weekend hackathon for engineering and design students.',
        date: getFutureDate(14),
        location: {
          venue: 'Student Union Hall B',
          address: '100 University Ave',
          city: 'College Town',
          country: 'USA',
        },
        capacity: 100,
        price: 0,
        category: 'workshop',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.event.status, 'draft');
    assert.equal(res.body.data.event.slug, 'spring-campus-hackathon-2026');
    assert.equal(res.body.data.event.capacity, 100);
    assert.equal(res.body.data.event.registeredCount, 0);
  });

  it('should prevent attendees from creating events', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        title: 'Unauthorized Event',
        description: 'This should be blocked by role authorization.',
        date: getFutureDate(5),
        location: { venue: 'Room 101', city: 'Campus' },
        capacity: 20,
        category: 'meetup',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('should reject event creation if date is in the past', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Past Event That Cannot Happen',
        description: 'Valid description for an invalid date event.',
        date: pastDate,
        location: { venue: 'Old Hall', city: 'Campus' },
        capacity: 50,
        category: 'seminar',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('should publish a draft event and make it discoverable in public listings', async () => {
    // 1. Create draft
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Campus Career Fair',
        description: 'Meet top employers and startup founders on campus.',
        date: getFutureDate(20),
        location: {
          venue: 'Main Gymnasium',
          city: 'College Town',
        },
        capacity: 500,
        category: 'networking',
      });

    const eventId = createRes.body.data.event._id;

    // 2. Draft should not appear in public listing
    const publicBefore = await request(app).get('/api/events');
    assert.equal(publicBefore.status, 200);
    assert.equal(publicBefore.body.data.events.length, 0);

    // 3. Publish
    const publishRes = await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.data.event.status, 'published');

    // 4. Published event now appears in public listing
    const publicAfter = await request(app).get('/api/events');
    assert.equal(publicAfter.status, 200);
    assert.equal(publicAfter.body.data.events.length, 1);
    assert.equal(publicAfter.body.data.events[0]._id, eventId);
  });

  it('should handle slug collisions gracefully by appending timestamp', async () => {
    const eventPayload = {
      title: 'Annual Robotics Showcase',
      description: 'Showcasing autonomous systems built by students.',
      date: getFutureDate(30),
      location: { venue: 'Robotics Lab', city: 'Campus' },
      capacity: 60,
      category: 'conference',
    };

    const first = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(eventPayload);

    const second = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(eventPayload);

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.notEqual(first.body.data.event.slug, second.body.data.event.slug);
    assert.ok(second.body.data.event.slug.startsWith('annual-robotics-showcase-'));
  });

  it('should cascade event cancellation to all active registrations and update their status', async () => {
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Event to Cancel',
        description: 'This event will be cancelled by the organizer.',
        date: getFutureDate(10),
        location: { venue: 'Hall C', city: 'Campus' },
        capacity: 50,
        category: 'seminar',
      });
    const eventId = eventRes.body.data.event._id;

    await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);

    const regRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`);
    assert.equal(regRes.status, 201);
    const regId = regRes.body.data.registration._id;

    const cancelRes = await request(app)
      .put(`/api/events/${eventId}/cancel`)
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.event.status, 'cancelled');

    const updatedReg = await Registration.findById(regId);
    assert.equal(updatedReg.status, 'cancelled');
    assert.ok(updatedReg.cancelledAt);
  });
});
