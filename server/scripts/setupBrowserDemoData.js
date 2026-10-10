require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

async function setup() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not found');

  await mongoose.connect(uri);
  console.log(`Connected to Atlas: ${mongoose.connection.host}`);

  // Upsert Organizer
  let org = await User.findOne({ email: 'demo.organizer@campus.edu' });
  if (!org) {
    org = await User.create({
      name: 'Dr. Jane Organizer',
      email: 'demo.organizer@campus.edu',
      password: 'Password123!',
      role: 'organizer',
    });
  }

  // Upsert Admin
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

  // Upsert Students
  let s1 = await User.findOne({ email: 'demo.student1@campus.edu' });
  if (!s1) {
    s1 = await User.create({
      name: 'Alex Rivera',
      email: 'demo.student1@campus.edu',
      password: 'Password123!',
      role: 'attendee',
    });
  }

  let s2 = await User.findOne({ email: 'demo.student2@campus.edu' });
  if (!s2) {
    s2 = await User.create({
      name: 'Jordan Lee',
      email: 'demo.student2@campus.edu',
      password: 'Password123!',
      role: 'attendee',
    });
  }

  // Create or reset Event A (Published, for Roster & Check-in testing)
  let eventA = await Event.findOne({ title: 'Campus Tech Expo 2026', organizer: org._id });
  if (!eventA) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    eventA = await Event.create({
      title: 'Campus Tech Expo 2026',
      description: 'Annual campus technology showcase with student projects and industry exhibits.',
      date: futureDate,
      time: '10:00 AM',
      location: { venue: 'Main Hall A', city: 'Campus Center' },
      capacity: 50,
      price: 0,
      category: 'conference',
      status: 'published',
      organizer: org._id,
      registeredCount: 2,
    });
  } else {
    eventA.status = 'published';
    eventA.registeredCount = 2;
    await eventA.save();
  }

  // Clear existing registrations for eventA and recreate 1 attended, 1 confirmed
  await Registration.deleteMany({ event: eventA._id });

  const reg1 = await Registration.create({
    user: s1._id,
    event: eventA._id,
    status: 'attended',
    ticketType: 'standard',
    registeredAt: new Date(Date.now() - 3600000 * 2),
    checkedInAt: new Date(Date.now() - 1800000),
  });

  const reg2 = await Registration.create({
    user: s2._id,
    event: eventA._id,
    status: 'confirmed',
    ticketType: 'standard',
    registeredAt: new Date(Date.now() - 3600000),
  });

  // Create or reset Event B (Draft, for moderation workflow testing)
  let eventB = await Event.findOne({ title: 'AI Ethics & Society Seminar', organizer: org._id });
  if (!eventB) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    eventB = await Event.create({
      title: 'AI Ethics & Society Seminar',
      description: 'Campus forum on autonomous systems, fairness, and educational integrity.',
      date: futureDate,
      time: '02:00 PM',
      location: { venue: 'Lecture Hall 101', city: 'Campus Center' },
      capacity: 100,
      price: 0,
      category: 'seminar',
      status: 'draft',
      organizer: org._id,
    });
  } else {
    eventB.status = 'draft';
    eventB.rejectionReason = undefined;
    await eventB.save();
  }

  console.log('Demo data prepared:');
  console.log('- Organizer: demo.organizer@campus.edu / Password123!');
  console.log('- Admin: demo.admin@campus.edu / Password123!');
  console.log('- Student: demo.student1@campus.edu / Password123!');
  console.log('- Event A (Published):', eventA._id.toString());
  console.log('- Event B (Draft):', eventB._id.toString());

  await mongoose.disconnect();
}

setup().catch((e) => {
  console.error(e);
  process.exit(1);
});
