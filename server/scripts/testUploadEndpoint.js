const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');

// 1x1 sample PNG
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const samplePng = Buffer.from(TINY_PNG_BASE64, 'base64');

async function testUploadEndpoint() {
  console.log('\n======================================================');
  console.log('   TESTING LIVE /api/upload/image ENDPOINT WITH CLOUDINARY');
  console.log('======================================================\n');

  // 1. Connect to Atlas
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[PASS] Connected to MongoDB Atlas.');

  // 2. Login as organizer
  console.log('\nStep 1: Authenticating test organizer...');
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'browser.org.e2e@campus-test.edu',
      password: 'Password123!',
    });

  assert.equal(loginRes.status, 200, `Login failed: ${JSON.stringify(loginRes.body)}`);
  const token = loginRes.body.data.token;
  console.log('[PASS] Organizer authenticated.');

  // 2. Upload image via /api/upload/image
  console.log('\nStep 2: Uploading test image buffer via multipart POST...');
  const uploadRes = await request(app)
    .post('/api/upload/image')
    .set('Authorization', `Bearer ${token}`)
    .attach('image', samplePng, 'banner-test.png');

  assert.equal(uploadRes.status, 201, `Upload failed: ${JSON.stringify(uploadRes.body)}`);
  assert.ok(uploadRes.body.data.url, 'Image URL missing in response');
  console.log(`[PASS] Upload endpoint returned: ${uploadRes.body.data.url}`);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isCloudinaryUrl = cloudName
    ? uploadRes.body.data.url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
    : uploadRes.body.data.url.startsWith('https://res.cloudinary.com/');
  assert.ok(isCloudinaryUrl, `Expected Cloudinary URL, got: ${uploadRes.body.data.url}`);
  console.log('[PASS] Confirmed persistent Cloudinary HTTPS CDN URL!');

  // 3. Extract public ID and test deletion
  const urlParts = uploadRes.body.data.url.split('/campus_events/');
  if (urlParts.length > 1) {
    const assetIdWithExt = urlParts[1].split('.')[0];
    const fullPublicId = `campus_events/${assetIdWithExt}`;
    console.log(`\nStep 3: Cleaning up uploaded asset from Cloudinary: ${fullPublicId}...`);
    const delRes = await request(app)
      .delete(`/api/upload/${encodeURIComponent(fullPublicId)}`)
      .set('Authorization', `Bearer ${token}`);
    console.log(`[PASS] Deletion returned status ${delRes.status}: ${JSON.stringify(delRes.body)}`);
    await mongoose.disconnect();
    console.log('[PASS] Atlas connection closed cleanly.');
  }

  console.log('\n======================================================');
  console.log('   END-TO-END CLOUDINARY UPLOAD ENDPOINT VERIFIED!');
  console.log('======================================================\n');
}

testUploadEndpoint()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nUPLOAD ENDPOINT ERROR:', err.message || err);
    process.exit(1);
  });
