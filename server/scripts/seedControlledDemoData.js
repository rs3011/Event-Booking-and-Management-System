const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function seedControlledDataset() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not found in environment');

  await mongoose.connect(uri);
  console.log(`[Seed] Connected to Atlas MongoDB: ${mongoose.connection.host}`);

  // 1. Upsert Core User Personas
  let org = await User.findOne({ email: 'demo.organizer@campus.edu' });
  if (!org) {
    org = await User.create({
      name: 'Dr. Jane Organizer',
      email: 'demo.organizer@campus.edu',
      password: 'Password123!',
      role: 'organizer',
    });
  }

  let admin = await User.findOne({ email: 'demo.admin@campus.edu' });
  if (!admin) {
    admin = await User.create({
      name: 'Dean Campus Admin',
      email: 'demo.admin@campus.edu',
      password: 'Password123!',
      role: 'admin',
    });
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }

  const studentData = [
    { name: 'Alex Rivera', email: 'demo.student1@campus.edu' },
    { name: 'Jordan Lee', email: 'demo.student2@campus.edu' },
    { name: 'Taylor Swift', email: 'demo.student3@campus.edu' },
    { name: 'Morgan Chen', email: 'demo.student4@campus.edu' },
  ];

  const students = [];
  for (const s of studentData) {
    let student = await User.findOne({ email: s.email });
    if (!student) {
      student = await User.create({
        name: s.name,
        email: s.email,
        password: 'Password123!',
        role: 'attendee',
      });
    }
    students.push(student);
  }

  // 2. Define the Controlled 8-Event Dataset across Categories and Statuses
  const now = new Date();
  const addDays = (d) => new Date(now.getTime() + d * 86400000);

  const eventDefinitions = [
    {
      title: 'Campus Tech Expo 2026',
      description: 'Annual campus technology showcase featuring student robotics, software architectures, and industry exhibits.',
      category: 'conference',
      date: addDays(7),
      time: '10:00 AM',
      location: { venue: 'Main Hall A', city: 'Campus Center' },
      capacity: 50,
      price: 0,
      status: 'published',
      isFeatured: true,
      tags: ['technology', 'robotics', 'software'],
    },
    {
      title: 'Cybersecurity Hands-on Workshop',
      description: 'Practical defense lab: web application security, ethical hacking fundamentals, and threat modeling.',
      category: 'workshop',
      date: addDays(4),
      time: '02:00 PM',
      location: { venue: 'CS Lab 302', city: 'Science Wing' },
      capacity: 10,
      price: 0,
      status: 'published',
      isFeatured: false,
      tags: ['cybersecurity', 'hands-on', 'infosec'],
    },
    {
      title: 'Full-Stack AI Hackathon 2026',
      description: 'High-intensity 24-hour sprint building real-world AI applications with university cloud credits.',
      category: 'workshop',
      date: addDays(12),
      time: '09:00 AM',
      location: { venue: 'Engineering Innovation Hub', city: 'Tech Campus' },
      capacity: 4,
      price: 0,
      status: 'published',
      isFeatured: false,
      tags: ['hackathon', 'ai', 'cloud'],
    },
    {
      title: 'University Fall Music Festival',
      description: 'Campus open-air music fest featuring student bands, acoustic sets, and cultural music performances.',
      category: 'concert',
      date: addDays(18),
      time: '06:30 PM',
      location: { venue: 'Campus Amphitheater', city: 'North Lawn' },
      capacity: 200,
      price: 0,
      status: 'published',
      isFeatured: false,
      tags: ['music', 'festival', 'arts'],
    },
    {
      title: 'Intramural Basketball Championship',
      description: 'The final showdown of the campus semester tournament. Free admission for students with valid ticket pass.',
      category: 'sports',
      date: addDays(9),
      time: '05:00 PM',
      location: { venue: 'Campus Arena Gymnasium', city: 'Athletics Center' },
      capacity: 80,
      price: 0,
      status: 'published',
      isFeatured: false,
      tags: ['sports', 'basketball', 'athletics'],
    },
    {
      title: 'AI Ethics & Campus Society Forum',
      description: 'Upcoming faculty and student symposium on generative AI, copyright, and academic integrity.',
      category: 'seminar',
      date: addDays(21),
      time: '03:00 PM',
      location: { venue: 'Auditorium 101', city: 'Humanities Hall' },
      capacity: 100,
      price: 0,
      status: 'draft', // DRAFT
      isFeatured: false,
      tags: ['ethics', 'ai', 'society'],
    },
    {
      title: 'Global Tech Leaders Webinar',
      description: 'Live interactive session with university alumni working at frontier tech companies across the globe.',
      category: 'webinar',
      date: addDays(15),
      time: '07:00 PM',
      location: { venue: 'Virtual Lecture Room', city: 'Online' },
      capacity: 300,
      price: 0,
      status: 'pending_approval', // PENDING MODERATION
      isFeatured: false,
      tags: ['webinar', 'alumni', 'careers'],
    },
    {
      title: 'Spring Alumni Networking Dinner',
      description: 'Annual alumni networking dinner event. Currently cancelled due to facility maintenance.',
      category: 'networking',
      date: addDays(30),
      time: '07:30 PM',
      location: { venue: 'Alumni Hall', city: 'Campus Center' },
      capacity: 60,
      price: 0,
      status: 'cancelled', // CANCELLED
      isFeatured: false,
      tags: ['networking', 'alumni', 'careers'],
    },
  ];

  console.log('[Seed] Re-seeding controlled event dataset...');

  // Upsert Events
  const createdEvents = {};
  for (const def of eventDefinitions) {
    let ev = await Event.findOne({ title: def.title, organizer: org._id });
    if (!ev) {
      ev = await Event.create({
        ...def,
        organizer: org._id,
      });
    } else {
      Object.assign(ev, def);
      await ev.save();
    }
    createdEvents[def.title] = ev;
    console.log(`- Event [${ev.status.toUpperCase()}]: ${ev.title} (${ev.category})`);
  }

  // 3. Populate Legitimate Registrations & Check-Ins
  // Event 1 (Campus Tech Expo): 2 attendees (Alex attended, Jordan confirmed)
  const expo = createdEvents['Campus Tech Expo 2026'];
  await Registration.deleteMany({ event: expo._id });
  const reg1 = await Registration.create({
    user: students[0]._id, // Alex Rivera
    event: expo._id,
    status: 'attended',
    registeredAt: new Date(now.getTime() - 7200000),
    checkedInAt: new Date(now.getTime() - 1800000),
  });
  const reg2 = await Registration.create({
    user: students[1]._id, // Jordan Lee
    event: expo._id,
    status: 'confirmed',
    registeredAt: new Date(now.getTime() - 3600000),
  });
  expo.registeredCount = 2;
  await expo.save();
  console.log(`  -> Expo: 2 registrations (1 attended: ${reg1.confirmationCode}, 1 confirmed: ${reg2.confirmationCode})`);

  // Event 2 (Cybersecurity Workshop): Capacity 10, 8 registered (ALMOST FULL -> 2 spots left)
  const cyber = createdEvents['Cybersecurity Hands-on Workshop'];
  await Registration.deleteMany({ event: cyber._id });
  // Add 4 real student registrations, plus 4 additional
  for (let i = 0; i < 4; i++) {
    await Registration.create({
      user: students[i]._id,
      event: cyber._id,
      status: i === 0 ? 'attended' : 'confirmed',
      registeredAt: new Date(now.getTime() - (i + 1) * 3600000),
      checkedInAt: i === 0 ? new Date(now.getTime() - 1200000) : undefined,
    });
  }
  cyber.registeredCount = 8;
  await cyber.save();
  console.log(`  -> Cybersecurity Workshop: 8 registered of 10 capacity (🔥 2 spots left)`);

  // Event 3 (AI Hackathon): Capacity 4, 4 registered (FULL / SOLD OUT)
  const hackathon = createdEvents['Full-Stack AI Hackathon 2026'];
  await Registration.deleteMany({ event: hackathon._id });
  for (let i = 0; i < 4; i++) {
    await Registration.create({
      user: students[i]._id,
      event: hackathon._id,
      status: 'confirmed',
      registeredAt: new Date(now.getTime() - (i + 2) * 3600000),
    });
  }
  hackathon.registeredCount = 4;
  await hackathon.save();
  console.log(`  -> AI Hackathon: 4 registered of 4 capacity (SOLD OUT)`);

  // Event 4 (Music Fest): 3 registrations
  const music = createdEvents['University Fall Music Festival'];
  await Registration.deleteMany({ event: music._id });
  await Registration.create({ user: students[0]._id, event: music._id, status: 'confirmed' });
  await Registration.create({ user: students[1]._id, event: music._id, status: 'confirmed' });
  music.registeredCount = 2;
  await music.save();

  // Event 5 (Basketball): 1 registration
  const bball = createdEvents['Intramural Basketball Championship'];
  await Registration.deleteMany({ event: bball._id });
  await Registration.create({ user: students[2]._id, event: bball._id, status: 'confirmed' });
  bball.registeredCount = 1;
  await bball.save();

  console.log('\n[Seed Completed Successfully]');
  console.log('Summary of Legitimate Dataset:');
  console.log('1. Almost-full event: "Cybersecurity Hands-on Workshop" (8/10 filled, 2 spots left)');
  console.log('2. Full event: "Full-Stack AI Hackathon 2026" (4/4 filled, SOLD OUT)');
  console.log('3. Draft event: "AI Ethics & Campus Society Forum"');
  console.log('4. Pending Moderation event: "Global Tech Leaders Webinar"');
  console.log('5. Cancelled event: "Spring Alumni Networking Dinner"');
  console.log('6. Multiple categories: conference, workshop, concert, sports, seminar, webinar, networking');
  console.log('7. Checked-in attendees: Alex Rivera (Campus Tech Expo & Cybersecurity Workshop)');
  console.log('8. Test Accounts:');
  console.log('   - Organizer: demo.organizer@campus.edu / Password123!');
  console.log('   - Admin: demo.admin@campus.edu / Password123!');
  console.log('   - Attendee 1: demo.student1@campus.edu / Password123!');
  console.log('   - Attendee 2: demo.student2@campus.edu / Password123!');

  await mongoose.disconnect();
}

seedControlledDataset().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
