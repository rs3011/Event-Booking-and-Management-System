const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');

const db = setupTestDB();

describe('Organizer Dashboard & Metric Calculations', () => {
  let organizerToken;

  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clear();

    const orgRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dashboard Organizer',
        email: 'dashboard.org@campus.edu',
        password: 'Password123!',
        role: 'organizer',
      });
    organizerToken = orgRes.body.data.token;
  });

  const getFutureDate = (daysAhead = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  };

  it('should accurately compute dashboard metrics and label revenue as estimated', async () => {
    // Create and publish an event with price 15, capacity 50
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Paid Seminar',
        description: 'Testing metric calculation for registered count and estimated revenue.',
        date: getFutureDate(10),
        location: { venue: 'Auditorium', city: 'Campus' },
        capacity: 50,
        price: 15,
        category: 'seminar',
      });

    const eventId = eventRes.body.data.event._id;

    await request(app)
      .put(`/api/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`);

    // Register 2 attendees
    const att1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A1', email: 'a1@campus.edu', password: 'Password123!' });
    const att2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A2', email: 'a2@campus.edu', password: 'Password123!' });

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${att1.body.data.token}`);
    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${att2.body.data.token}`);

    // Fetch dashboard stats
    const statsRes = await request(app)
      .get('/api/organizer/dashboard')
      .set('Authorization', `Bearer ${organizerToken}`);

    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.body.success, true);
    const data = statsRes.body.data;

    assert.equal(data.totalEvents, 1);
    assert.equal(data.publishedEvents, 1);
    assert.equal(data.totalCapacity, 50);
    assert.equal(data.totalRegistered, 2);
    // Capacity utilization: 2 / 50 * 100 = 4%
    assert.equal(data.capacityUtilization, 4);
    // Estimated revenue: 15 * 2 = 30
    assert.equal(data.estimatedRevenue, 30);
    assert.equal(data.estimatedRegistrationValue, 30);
    assert.equal(data.totalRevenue, 30);
    assert.equal(data.thisMonthRegistrations, 2);
  });
});
