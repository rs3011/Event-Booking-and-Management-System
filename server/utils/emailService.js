const nodemailer = require('nodemailer');
const env = require('../config/env');

// In-memory record for test suite verification
const sentEmails = [];

let cachedTransporter = null;

const isEmailConfigured = () => {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
};

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  if (isEmailConfigured()) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  return null;
};

/**
 * Sends an email via the configured SMTP transporter.
 * Failures are logged but never thrown — email errors
 * must not break the main application flow.
 */
const sendEmail = async ({ to, subject, html }) => {
  // 1. In automated tests, record in-memory and return simulated success
  if (env.NODE_ENV === 'test') {
    sentEmails.push({ to, subject, html, timestamp: new Date() });
    return { success: true, simulated: true };
  }

  // 2. In development without credentials, log simulation and return
  if (!isEmailConfigured()) {
    console.log(`[Email Simulated] To: ${to} | Subject: "${subject}"`);
    return { success: true, simulated: true };
  }

  // 3. Send real email via SMTP
  try {
    const transporter = getTransporter();
    if (!transporter) {
      throw new Error('Email transporter could not be initialized');
    }

    const fromAddress = env.SMTP_FROM_EMAIL || env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${fromAddress}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email sending failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verifies the SMTP connection at startup.
 * Logs a warning instead of crashing when SMTP is not configured
 * (typical in development mode).
 */
const verifyConnection = async () => {
  if (!isEmailConfigured()) {
    console.log('SMTP credentials not configured — email sending is simulated in development');
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('SMTP connection verified — email service is ready');
    return true;
  } catch (error) {
    console.warn('SMTP connection failed:', error.message);
    return false;
  }
};

const getSentEmails = () => [...sentEmails];
const clearSentEmails = () => {
  sentEmails.length = 0;
};

module.exports = {
  sendEmail,
  verifyConnection,
  isEmailConfigured,
  getSentEmails,
  clearSentEmails,
};
