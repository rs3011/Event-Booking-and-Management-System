require('dotenv').config();
const nodemailer = require('nodemailer');
const env = require('../config/env');
const { sendEmail, verifyConnection, isEmailConfigured } = require('../utils/emailService');
const generateConfirmationEmail = require('../templates/confirmationEmail');

async function testEmail() {
  console.log('\n======================================================');
  console.log('   TRANSACTIONAL EMAIL SERVICE VERIFICATION');
  console.log('======================================================\n');

  console.log('Configuration status:');
  console.log(`  - SMTP Host:      ${env.SMTP_HOST || 'Not set'}`);
  console.log(`  - SMTP Port:      ${env.SMTP_PORT || 'Not set'} (Secure: ${env.SMTP_SECURE})`);
  console.log(`  - SMTP User:      ${env.SMTP_USER ? env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not set'}`);
  console.log(`  - From Name:      ${env.SMTP_FROM_NAME}`);
  console.log(`  - Configured:     ${isEmailConfigured() ? 'YES' : 'NO'}\n`);

  if (isEmailConfigured()) {
    console.log('Step 1: Verifying SMTP connection credentials...');
    const verified = await verifyConnection();
    if (!verified) {
      throw new Error('SMTP server verification failed. Please check host, port, user, and password in server/.env');
    }

    console.log('\nStep 2: Sending test ticket confirmation email...');
    const testRecipient = process.argv[2] || env.SMTP_USER;
    const html = generateConfirmationEmail({
      userName: 'Test Student',
      eventTitle: 'Campus Hackathon 2026',
      eventDate: new Date(Date.now() + 7 * 86400000),
      eventTime: '10:00 AM',
      venue: 'Main Auditorium',
      city: 'Campus Center',
      confirmationCode: 'TEST12345678',
      eventSlug: 'campus-hackathon-2026',
    });

    const result = await sendEmail({
      to: testRecipient,
      subject: 'Test Ticket Confirmation — Campus Hackathon 2026',
      html,
    });

    if (!result.success) {
      throw new Error(`Email delivery failed: ${result.error}`);
    }

    console.log(`[PASS] Test email delivered to ${testRecipient}! Message ID: ${result.messageId}`);
  } else {
    console.log('NOTICE: Real SMTP credentials are not configured in server/.env.');
    console.log('Generating an ephemeral Ethereal test account to preview email delivery...\n');

    const testAccount = await nodemailer.createTestAccount();
    console.log(`[PASS] Created Ethereal test inbox: ${testAccount.user}`);

    const etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const html = generateConfirmationEmail({
      userName: 'Campus Student',
      eventTitle: 'Annual Spring Showcase 2026',
      eventDate: new Date(Date.now() + 5 * 86400000),
      eventTime: '2:00 PM',
      venue: 'Engineering Hall',
      city: 'University Park',
      confirmationCode: 'ETHEREAL8899',
      eventSlug: 'annual-spring-showcase-2026',
    });

    const info = await etherealTransporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${testAccount.user}>`,
      to: 'student@campus.edu',
      subject: 'Your Ticket Confirmation — Annual Spring Showcase 2026',
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[PASS] Ethereal test email sent!`);
    console.log(`  - Message ID:  ${info.messageId}`);
    console.log(`  - Preview URL: ${previewUrl}`);
    console.log('\nYou can open the Preview URL in your browser to inspect the rendered HTML email ticket.');
  }

  console.log('\n======================================================');
  console.log('   EMAIL SERVICE VERIFICATION COMPLETED');
  console.log('======================================================\n');
}

testEmail()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nEMAIL TEST ERROR:', err.message || err);
    process.exit(1);
  });
