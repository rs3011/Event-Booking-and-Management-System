require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// 1x1 transparent PNG buffer
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const testBuffer = Buffer.from(TINY_PNG_BASE64, 'base64');

async function testCloudinaryUpload() {
  console.log('\n======================================================');
  console.log('   SAFE CLOUDINARY LIVE VERIFICATION TEST');
  console.log('======================================================\n');

  // 1. Verify Configuration
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    console.log('[PASS] Configured via CLOUDINARY_URL.');
  } else if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(`[PASS] Configured with cloud name: "${process.env.CLOUDINARY_CLOUD_NAME}".`);
  } else {
    throw new Error(
      'Cloudinary credentials not found in server/.env. Please configure CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }

  // 2. Ping Cloudinary API
  console.log('\nStep 1: Pinging Cloudinary API...');
  const pingResult = await cloudinary.api.ping();
  console.log(`[PASS] Cloudinary API status: "${pingResult.status}"`);

  // 3. Upload ephemeral test image
  console.log('\nStep 2: Streaming test image upload to folder "campus_events/test"...');
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campus_events/test',
        resource_type: 'image',
        tags: ['smoke_test', 'ephemeral'],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(testBuffer).pipe(stream);
  });

  console.log(`[PASS] Upload succeeded!`);
  console.log(`  - Secure URL: ${uploadResult.secure_url}`);
  console.log(`  - Public ID:  ${uploadResult.public_id}`);
  console.log(`  - Format:     ${uploadResult.format}`);
  console.log(`  - Bytes:      ${uploadResult.bytes}`);

  // 4. Clean up test image
  console.log('\nStep 3: Cleaning up test image from Cloudinary...');
  const destroyResult = await cloudinary.uploader.destroy(uploadResult.public_id);
  console.log(`[PASS] Destroy status: "${destroyResult.result}"`);

  console.log('\n======================================================');
  console.log('   CLOUDINARY INTEGRATION VERIFIED SUCCESSFULLY!');
  console.log('   (No MongoDB Atlas event or user data was affected)');
  console.log('======================================================\n');
}

testCloudinaryUpload()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nCLOUDINARY TEST ERROR:', err.message || err);
    process.exit(1);
  });
