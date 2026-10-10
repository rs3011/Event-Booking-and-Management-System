const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const setupTestDB = require('./setup');
const User = require('../models/User');

const db = setupTestDB();

describe('Authentication & Authorization Tests', () => {
  before(async () => {
    await db.start();
  });

  after(async () => {
    await db.stop();
  });

  beforeEach(async () => {
    await db.clear();
  });

  it('should successfully register an attendee', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        role: 'attendee',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'jane@example.com');
    assert.equal(res.body.data.user.role, 'attendee');
    assert.equal(res.body.data.user.password, undefined);
  });

  it('should reject registration with an existing email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already registered/i);
  });

  it('should not allow registering directly as admin (sanitizes to attendee)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'admin',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'attendee');
  });

  it('should login with correct credentials and return a token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'Password123!',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'login@example.com');
  });

  it('should lock account after 5 consecutive failed login attempts', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lockout User',
        email: 'lockout@example.com',
        password: 'Password123!',
      });

    for (let i = 0; i < 5; i++) {
      const failedRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lockout@example.com',
          password: 'WrongPassword!',
        });
      assert.equal(failedRes.status, 401);
    }

    // 6th attempt should return 423 locked
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'lockout@example.com',
        password: 'Password123!',
      });

    assert.equal(lockedRes.status, 423);
    assert.match(lockedRes.body.message, /temporarily locked/i);
  });

  it('should return current user profile via /api/auth/me with valid token', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Me User',
        email: 'me@example.com',
        password: 'Password123!',
      });

    const token = regRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.data.user.email, 'me@example.com');
  });

  it('should reject access to protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
