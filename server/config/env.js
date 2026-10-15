// Sanitize Cloudinary environment variables early to prevent malformed URL crashes
if (process.env.CLOUDINARY_URL) {
  let cleanUrl = process.env.CLOUDINARY_URL.trim();
  if (cleanUrl.startsWith('CLOUDINARY_URL=')) {
    cleanUrl = cleanUrl.replace(/^CLOUDINARY_URL=/, '').trim();
  }
  cleanUrl = cleanUrl.replace(/[<>]/g, '');
  if (cleanUrl.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = cleanUrl;
  } else {
    delete process.env.CLOUDINARY_URL;
  }
}
if (process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME.trim().replace(/[<>]/g, '');
}
if (process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY.trim().replace(/[<>]/g, '');
}
if (process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET.trim().replace(/[<>]/g, '');
}

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI:
    process.env.MONGO_URI || 'mongodb://localhost:27017/event-booking',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-at-least-32-characters-long',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'EventViser',
  SMTP_FROM_EMAIL:
    process.env.SMTP_FROM_EMAIL ||
    (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('resend')
      ? 'onboarding@resend.dev'
      : process.env.SMTP_USER),
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5242880,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
};

const isProduction = env.NODE_ENV === 'production';

if (isProduction) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be set and at least 32 characters in production'
    );
  }

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn(
      '⚠️ [WARNING] SMTP_USER or SMTP_PASS not set in production. Outbound emails will be simulated to prevent server boot failure.'
    );
  }
}

module.exports = env;
