require('dotenv').config();
const { sendEmail, verifyConnection, isEmailConfigured } = require('../utils/emailService');
const generateConfirmationEmail = require('../templates/confirmationEmail');
const generateCancellationEmail = require('../templates/cancellationEmail');
const generateEventCancelledEmail = require('../templates/eventCancelledEmail');

async function testAllThreeAttendeeEmails() {
  console.log('\n======================================================');
  console.log('   VERIFYING 3 ATTENDEE TRANSACTIONAL EMAIL FLOWS');
  console.log('======================================================\n');

  const recipient = process.argv[2] || 'roshanpro3011@gmail.com';
  console.log(`Target Recipient: ${recipient}`);

  if (!isEmailConfigured()) {
    throw new Error('Email credentials are not configured in server/.env');
  }

  const isConnected = await verifyConnection();
  if (!isConnected) {
    throw new Error('SMTP connection verification failed.');
  }

  const sampleEvent = {
    title: 'Spring Tech Showcase 2026',
    date: new Date(Date.now() + 10 * 86400000),
    time: '02:00 PM',
    venue: 'Engineering Auditorium, Hall B',
    city: 'San Francisco, CA',
    slug: 'spring-tech-showcase-2026',
  };

  // 1. Ticket Registration Confirmation Email
  console.log('\n[1/3] Dispatching: Ticket Registration Confirmation Email...');
  const confirmHtml = generateConfirmationEmail({
    userName: 'Roshan',
    eventTitle: sampleEvent.title,
    eventDate: sampleEvent.date,
    eventTime: sampleEvent.time,
    venue: sampleEvent.venue,
    city: sampleEvent.city,
    confirmationCode: 'EV-CONF-884920',
    eventSlug: sampleEvent.slug,
  });

  const confirmRes = await sendEmail({
    to: recipient,
    subject: `Registration Confirmed — ${sampleEvent.title}`,
    html: confirmHtml,
  });

  if (!confirmRes.success) {
    throw new Error(`Confirmation email failed: ${confirmRes.error}`);
  }
  console.log(`✅ [PASS] Confirmation email delivered! (MessageId: ${confirmRes.messageId})`);

  // Wait 1 second between dispatches for rate-limiting hygiene
  await new Promise((r) => setTimeout(r, 1200));

  // 2. Ticket Cancellation by Attendee Email
  console.log('\n[2/3] Dispatching: Ticket Cancellation Email...');
  const cancelHtml = generateCancellationEmail({
    userName: 'Roshan',
    eventTitle: sampleEvent.title,
    eventDate: sampleEvent.date,
    venue: sampleEvent.venue,
    city: sampleEvent.city,
  });

  const cancelRes = await sendEmail({
    to: recipient,
    subject: `Registration Cancelled — ${sampleEvent.title}`,
    html: cancelHtml,
  });

  if (!cancelRes.success) {
    throw new Error(`Cancellation email failed: ${cancelRes.error}`);
  }
  console.log(`✅ [PASS] Cancellation email delivered! (MessageId: ${cancelRes.messageId})`);

  await new Promise((r) => setTimeout(r, 1200));

  // 3. Event Cancellation by Organizer Email
  console.log('\n[3/3] Dispatching: Event Cancellation by Organizer Email...');
  const eventCancelHtml = generateEventCancelledEmail({
    userName: 'Roshan',
    eventTitle: sampleEvent.title,
    eventDate: sampleEvent.date,
    venue: sampleEvent.venue,
    city: sampleEvent.city,
    organizerName: 'Campus Event Society',
  });

  const eventCancelRes = await sendEmail({
    to: recipient,
    subject: `Event Cancelled — ${sampleEvent.title}`,
    html: eventCancelHtml,
  });

  if (!eventCancelRes.success) {
    throw new Error(`Event cancellation email failed: ${eventCancelRes.error}`);
  }
  console.log(`✅ [PASS] Event cancelled email delivered! (MessageId: ${eventCancelRes.messageId})`);

  console.log('\n======================================================');
  console.log('   🎉 ALL 3 ATTENDEE EMAIL FLOWS DELIVERED SUCCESSFULLY');
  console.log('======================================================\n');
}

testAllThreeAttendeeEmails().catch((err) => {
  console.error('\n❌ Email test failed:', err.message);
  process.exit(1);
});
