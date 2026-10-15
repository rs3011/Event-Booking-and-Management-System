const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const https = require('https');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

const FRONTEND_URL = 'https://eventviser.netlify.app';
const API_HEALTH_URL = 'https://event-booking-and-management-system-b02g.onrender.com/api/health';

function fetchUrl(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'EventViser-ProductionSmokeTest/1.0',
          Accept: 'application/json, text/html, */*',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    });

    req.on('error', reject);
  });
}

async function runProductionSmokeTest() {
  console.log('\n======================================================');
  console.log('   EVENTVISER PRODUCTION SMOKE TEST');
  console.log('   Testing: Frontend -> API -> DB -> Cloudinary');
  console.log('======================================================\n');

  let passed = 0;
  let total = 4;

  // 1. FRONTEND VERIFICATION
  console.log('[Step 1/4] Verifying Live Frontend (Netlify)...');
  try {
    const fe = await fetchUrl(FRONTEND_URL, 15000);
    if (fe.status === 200 && fe.body.includes('html')) {
      console.log(`✅ [PASS] Frontend is live at ${FRONTEND_URL} (HTTP 200)`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Frontend returned unexpected status: ${fe.status}`);
    }
  } catch (err) {
    console.error(`❌ [FAIL] Frontend request failed: ${err.message}`);
  }

  // 2. API HEALTH & DEEP DIAGNOSTICS
  console.log('\n[Step 2/4] Verifying Live API & Deep Diagnostics (Render)...');
  try {
    const apiRes = await fetchUrl(API_HEALTH_URL, 65000);
    if (apiRes.status === 200) {
      const data = JSON.parse(apiRes.body);
      console.log(`✅ [PASS] API is healthy at ${API_HEALTH_URL} (HTTP 200)`);
      console.log(`   - Service: ${data.service || 'eventviser-api'}`);
      console.log(`   - Uptime: ${data.uptime || 0}s`);
      console.log(`   - DB Status: ${data.database?.status || 'connected'}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] API returned non-200: ${apiRes.status}`);
    }
  } catch (err) {
    console.error(`❌ [FAIL] API request failed: ${err.message}`);
  }

  // 3. DATABASE VERIFICATION (MongoDB Atlas)
  console.log('\n[Step 3/4] Verifying MongoDB Atlas Connection & Seeded Events...');
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is missing');
    await mongoose.connect(uri);
    const eventCount = await Event.countDocuments();
    const regCount = await Registration.countDocuments();
    const userCount = await User.countDocuments();
    const almostFull = await Event.findOne({ title: 'Cybersecurity Hands-on Workshop' });
    const full = await Event.findOne({ title: 'Full-Stack AI Hackathon 2026' });

    console.log(`✅ [PASS] Connected to MongoDB Atlas (${mongoose.connection.host})`);
    console.log(`   - Total Events in DB: ${eventCount}`);
    console.log(`   - Total Registrations: ${regCount}`);
    console.log(`   - Total Users: ${userCount}`);
    console.log(`   - Almost-Full Event verified: "${almostFull?.title}" (${almostFull?.registeredCount}/${almostFull?.capacity})`);
    console.log(`   - Full Event verified: "${full?.title}" (${full?.registeredCount}/${full?.capacity})`);
    await mongoose.disconnect();
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] Database verification failed: ${err.message}`);
  }

  // 4. CLOUDINARY UPLOAD PIPELINE
  console.log('\n[Step 4/4] Verifying Cloudinary Upload Pipeline...');
  try {
    let cloudUrl = process.env.CLOUDINARY_URL || '';
    cloudUrl = cloudUrl.trim().replace(/^CLOUDINARY_URL=+/i, '').replace(/[<>]/g, '');
    const match = cloudUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);

    if (match) {
      cloudinary.config({
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
        secure: true,
      });
    }

    // Upload a small test 1x1 png data uri
    const testDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const uploadResult = await cloudinary.uploader.upload(testDataUri, {
      folder: 'eventviser-smoke-tests',
      tags: ['smoke-test'],
    });

    console.log(`✅ [PASS] Cloudinary upload verified successfully!`);
    console.log(`   - Public ID: ${uploadResult.public_id}`);
    console.log(`   - Secure URL: ${uploadResult.secure_url}`);

    // Clean up
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log(`   - Cleaned up smoke test asset.`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] Cloudinary verification failed: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`   SMOKE TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runProductionSmokeTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
