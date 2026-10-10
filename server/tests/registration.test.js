const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const db = setupTestDB();

describe('Registration, Capacity & Check-in Tests', () => {
  let organizerToken;
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

    const org = await registerUser('Campus Director', 'director@campus.edu', 'organizer');
    organizerToken = org.token;

    // Create and publish an event with capacity 2
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Limited Seats Workshop',
        description: 'Hands-on lab with strictly limited seating.',
        date: getFutureDate(7),
        location: { venue: 'Lab 3', city: 'Campus' },
        capacity: 2,
        price: 0,
        category: 'workshop',
      });

    eventId = eventRes.body.data.event._id;

    await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);
  });

  it('should successfully register an attendee and return a confirmation code', async () => {
    const student = await registerUser('Student One', 's1@campus.edu');

    const res = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student.token}`)
      .send({ ticketType: 'standard' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.confirmationCode);
    assert.equal(res.body.data.registration.status, 'confirmed');

    // Verify event registeredCount incremented
    const updatedEvent = await Event.findById(eventId);
    assert.equal(updatedEvent.registeredCount, 1);
  });

  it('should prevent the same attendee from registering twice for the same event', async () => {
    const student = await registerUser('Student Double', 'double@campus.edu');

    const first = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student.token}`);
    assert.equal(first.status, 201);

    const second = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student.token}`);

    assert.equal(second.status, 400);
    assert.equal(second.body.success, false);
    assert.match(second.body.message, /already registered/i);

    const event = await Event.findById(eventId);
    assert.equal(event.registeredCount, 1);
  });

  it('should reject registration when event reaches maximum capacity', async () => {
    const student1 = await registerUser('Student A', 'a@campus.edu');
    const student2 = await registerUser('Student B', 'b@campus.edu');
    const student3 = await registerUser('Student C', 'c@campus.edu');

    const res1 = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student1.token}`);
    assert.equal(res1.status, 201);

    const res2 = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student2.token}`);
    assert.equal(res2.status, 201);

    // Event capacity is 2; 3rd registration should be rejected
    const res3 = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student3.token}`);

    assert.equal(res3.status, 400);
    assert.match(res3.body.message, /event is full/i);

    const event = await Event.findById(eventId);
    assert.equal(event.registeredCount, 2);
  });

  it('should prevent race conditions under concurrent simultaneous registrations', async () => {
    // Event capacity is 2. Create 5 distinct students racing for the 2 spots.
    const students = await Promise.all([
      registerUser('Racer 1', 'r1@campus.edu'),
      registerUser('Racer 2', 'r2@campus.edu'),
      registerUser('Racer 3', 'r3@campus.edu'),
      registerUser('Racer 4', 'r4@campus.edu'),
      registerUser('Racer 5', 'r5@campus.edu'),
    ]);

    // Send 5 requests concurrently using Promise.all
    const results = await Promise.all(
      students.map((s) =>
        request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${s.token}`)
          .send({ ticketType: 'standard' })
      )
    );

    const successful = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 400);

    assert.equal(successful.length, 2, 'Exactly 2 registrations should succeed');
    assert.equal(rejected.length, 3, 'Exactly 3 registrations should be rejected as full');

    const event = await Event.findById(eventId);
    assert.equal(event.registeredCount, 2, 'Event registeredCount must exactly equal capacity of 2');

    const confirmedInDb = await Registration.countDocuments({
      event: eventId,
      status: 'confirmed',
    });
    assert.equal(confirmedInDb, 2, 'Database must have exactly 2 confirmed registrations');
  });

  it('should decrement capacity and update status when an attendee cancels their registration', async () => {
    const student = await registerUser('Cancelling Student', 'cancel@campus.edu');

    const regRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student.token}`);

    const registrationId = regRes.body.data.registration._id;

    // Cancel registration
    const cancelRes = await request(app)
      .delete(`/api/registrations/${registrationId}`)
      .set('Authorization', `Bearer ${student.token}`);

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.success, true);

    const updatedReg = await Registration.findById(registrationId);
    assert.equal(updatedReg.status, 'cancelled');

    const updatedEvent = await Event.findById(eventId);
    assert.equal(updatedEvent.registeredCount, 0, 'Capacity should be released');
  });

  it('should check in an attendee once and prevent duplicate check-in', async () => {
    const student = await registerUser('Checkin Student', 'checkin@campus.edu');

    const regRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${student.token}`);

    const registrationId = regRes.body.data.registration._id;

    // Check-in by organizer
    const checkin1 = await request(app)
      .put(`/api/registrations/${registrationId}/check-in`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(checkin1.status, 200);
    assert.equal(checkin1.body.data.registration.status, 'attended');

    // Duplicate check-in attempt
    const checkin2 = await request(app)
      .put(`/api/registrations/${registrationId}/check-in`)
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(checkin2.status, 400);
    assert.match(checkin2.body.message, /already been checked in/i);
  });
});
