import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';
import { Item } from '../models/Item.js';
import { Claim } from '../models/Claim.js';
import { Notification } from '../models/Notification.js';
import { Match } from '../models/Match.js';
import { Report } from '../models/Report.js';
import {
  ROLE,
  USER_STATUS,
  ITEM_TYPE,
  ITEM_STATUS,
  CATEGORY,
  CLAIM_STATUS,
  NOTIF_TYPE,
  REPORT_REASON,
  REPORT_STATUS,
} from '../constants/enums.js';

import { resolveMongoUri } from '../utils/resolveMongoUri.js';

export const seedDatabase = async (customUri = null) => {
  const rawUri =
    customUri ||
    process.argv[2] ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    env.MONGODB_URI;

  const targetUri = resolveMongoUri(rawUri);

  const isRemote =
    targetUri.includes('mongodb+srv') ||
    (!targetUri.includes('localhost') && !targetUri.includes('127.0.0.1'));

  const maskedUri = targetUri.replace(/:([^:@]{3,})@/, ':****@');
  logger.info(`Attempting to connect to database (${maskedUri})...`);

  let memServer = null;

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: isRemote ? 30000 : 3000,
    });
    logger.info(`Connected to ${isRemote ? 'remote MongoDB Atlas' : 'local MongoDB'} successfully.`);
  } catch (err) {
    if (
      !isRemote &&
      (err.message.includes('ECONNREFUSED') ||
        err.name === 'MongooseServerSelectionError' ||
        err.name === 'MongoServerSelectionError')
    ) {
      logger.warn(
        `Local MongoDB is not running on ${maskedUri}. Spawning temporary in-memory MongoDB to verify seeding...`
      );
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      await mongoose.connect(memServer.getUri());
      logger.info('Connected to in-memory MongoDB instance for validation.');
    } else {
      logger.error(`MongoDB connection failed: ${err.message}`);
      throw err;
    }
  }

  logger.info('Wiping existing database collections...');
  await Promise.all([
    User.deleteMany({}),
    Item.deleteMany({}),
    Claim.deleteMany({}),
    Notification.deleteMany({}),
    Match.deleteMany({}),
    Report.deleteMany({}),
  ]);

  logger.info('Seeding users...');
  // 1 Admin
  const adminUser = new User({
    name: 'Dr. Sarah Jenkins',
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    studentId: 'FAC-2021',
    department: 'Campus Administration',
    role: ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
    phone: '+1-555-0100',
    profileImage: { url: 'https://picsum.photos/seed/admin1/200/200' },
  });
  await adminUser.save();

  // 5 Students
  const studentData = [
    {
      name: 'John Doe',
      email: 'john.doe@campus.test',
      password: 'Password123!',
      studentId: 'CS2023041',
      department: 'Computer Science',
      year: 3,
      phone: '+1-555-0141',
      profileImage: { url: 'https://picsum.photos/seed/john1/200/200' },
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@campus.test',
      password: 'Password123!',
      studentId: 'EE2024018',
      department: 'Electrical Engineering',
      year: 2,
      phone: '+1-555-0182',
      profileImage: { url: 'https://picsum.photos/seed/priya2/200/200' },
    },
    {
      name: 'Alex Chen',
      email: 'alex.chen@campus.test',
      password: 'Password123!',
      studentId: 'ME2022099',
      department: 'Mechanical Engineering',
      year: 4,
      phone: '+1-555-0199',
      profileImage: { url: 'https://picsum.photos/seed/alex3/200/200' },
    },
    {
      name: 'Marcus Williams',
      email: 'marcus.w@campus.test',
      password: 'Password123!',
      studentId: 'BA2025012',
      department: 'Business Administration',
      year: 1,
      phone: '+1-555-0125',
      profileImage: { url: 'https://picsum.photos/seed/marcus4/200/200' },
    },
    {
      name: 'Elena Rostova',
      email: 'elena.r@campus.test',
      password: 'Password123!',
      studentId: 'BI2023088',
      department: 'Biotechnology',
      year: 3,
      phone: '+1-555-0188',
      profileImage: { url: 'https://picsum.photos/seed/elena5/200/200' },
    },
  ];

  const students = [];
  for (const s of studentData) {
    const student = new User(s);
    await student.save();
    students.push(student);
  }

  logger.info('Seeding items (~25 items across campus locations)...');
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // 3 Deliberate Matching Pairs:
  // Pair 1: Samsung phone @ Library
  // Pair 2: Hydro Flask @ Sports Complex
  // Pair 3: Keychain @ Cafeteria
  // Near-miss 1: Backpack @ Lab Block vs Bag @ Hostel (different brand/color)
  // Near-miss 2: Calculator @ Classroom vs Calculator @ Library

  const itemSeeds = [
    // Pair 1
    {
      title: 'Black Samsung Galaxy S23 with cracked corner',
      description: 'Lost my black Samsung Galaxy S23 phone. Hairline crack on bottom right corner with transparent case.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Library',
      date: daysAgo(5),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/samsung23/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found black smartphone on 2nd floor desk',
      description: 'Found a black Samsung smartphone lying on table 14 near the silent study area on the 2nd floor.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.FOUND,
      location: 'Library',
      date: daysAgo(5),
      owner: students[1]._id,
      images: [{ url: 'https://picsum.photos/seed/phonespot/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    // Pair 2
    {
      title: 'Blue Hydro Flask water bottle 32oz',
      description: 'Lost my navy blue Hydro Flask metal water bottle near the indoor badminton court.',
      category: CATEGORY.SPORTS,
      type: ITEM_TYPE.LOST,
      location: 'Sports Complex',
      date: daysAgo(3),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/flaskblue/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Blue metal water bottle found near court benches',
      description: 'Found a 32oz insulated metal water flask left on the wooden bleachers by court 2.',
      category: CATEGORY.SPORTS,
      type: ITEM_TYPE.FOUND,
      location: 'Sports Complex',
      date: daysAgo(3),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/flaskfound/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    // Pair 3
    {
      title: 'Keychain with 3 keys and mini skateboard charm',
      description: 'Lost a brass keychain with three silver door keys and a small blue plastic skateboard pendant.',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.LOST,
      location: 'Cafeteria',
      date: daysAgo(2),
      owner: students[1]._id,
      images: [{ url: 'https://picsum.photos/seed/keyslost/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found ring of door keys at cafe booth',
      description: 'Found a set of keys left under the booth near the juice counter.',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Cafeteria',
      date: daysAgo(2),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/keysfound/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    // Near-miss 1
    {
      title: 'Grey Herschel backpack with laptop and notebooks',
      description: 'Left my grey Herschel Little America backpack on the bench outside Lab 304.',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.LOST,
      location: 'Lab Block',
      date: daysAgo(7),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/backpack1/600/400' }],
      status: ITEM_STATUS.CLAIMED,
    },
    {
      title: 'Red sports duffel bag found in gym locker room',
      description: 'Found a red nylon gym bag left on top of the lockers.',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.FOUND,
      location: 'Sports Complex',
      date: daysAgo(7),
      owner: students[3]._id,
      images: [{ url: 'https://picsum.photos/seed/duffel/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    // Near-miss 2
    {
      title: 'Casio FX-991EX Scientific Calculator',
      description: 'Left scientific calculator in the engineering computer lab.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Lab Block',
      date: daysAgo(4),
      owner: students[4]._id,
      images: [{ url: 'https://picsum.photos/seed/calc2/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found TI-84 Plus CE Graphing Calculator',
      description: 'Found a black Texas Instruments graphing calculator left on the podium in room 102.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.FOUND,
      location: 'Classroom Block',
      date: daysAgo(4),
      owner: students[1]._id,
      images: [{ url: 'https://picsum.photos/seed/calc1/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    // Remaining Items
    {
      title: 'Student ID card in brown leather lanyard',
      description: 'Lost my university student card in a dark brown leather lanyard during the morning rush.',
      category: CATEGORY.ID_DOCUMENTS,
      type: ITEM_TYPE.LOST,
      location: 'Main Gate',
      date: daysAgo(8),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/lanyard1/600/400' }],
      status: ITEM_STATUS.RESOLVED,
      resolvedAt: daysAgo(2),
    },
    {
      title: 'Found black foldable umbrella with curved wooden handle',
      description: 'Found an umbrella standing in the corner by the entrance door of the auditorium.',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.FOUND,
      location: 'Auditorium',
      date: daysAgo(1),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/umbrella1/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Sony WH-1000XM4 Wireless Headphones (Silver)',
      description: 'Lost over-ear noise-cancelling silver Sony headphones in their hard zippered travel case.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Hostel Block A',
      date: daysAgo(6),
      owner: students[1]._id,
      images: [{ url: 'https://picsum.photos/seed/sonyheadphones/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found Organic Chemistry Textbook (Wade 9th Edition)',
      description: 'Found a thick chemistry textbook with extensive yellow highlighting in chapters 4-7.',
      category: CATEGORY.BOOKS_STATIONERY,
      type: ITEM_TYPE.FOUND,
      location: 'Admin Block',
      date: daysAgo(10),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/chembook/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Grey Nike zip-up hoodie (Size M)',
      description: 'Forgot my grey athletic hoodie on the bleachers next to the main football field.',
      category: CATEGORY.CLOTHING,
      type: ITEM_TYPE.LOST,
      location: 'Playground',
      date: daysAgo(12),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/nikehoodie/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found motorcycle helmet with smoked visor',
      description: 'Found a matte black full-face helmet resting on a scooter in row C.',
      category: CATEGORY.OTHER,
      type: ITEM_TYPE.FOUND,
      location: 'Parking',
      date: daysAgo(14),
      owner: students[3]._id,
      images: [{ url: 'https://picsum.photos/seed/helmet1/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Casio Vintage Digital Watch (Silver)',
      description: 'Lost my silver metal band Casio A168 watch in the shared washroom on the 1st floor.',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.LOST,
      location: 'Hostel Block B',
      date: daysAgo(15),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/casiowatch/600/400' }],
      status: ITEM_STATUS.CLOSED,
    },
    {
      title: 'Found black leather bifold wallet with campus card',
      description: 'Found a men’s black leather wallet between rows 4 and 5 in the ground floor lecture hall.',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.FOUND,
      location: 'Classroom Block',
      date: daysAgo(2),
      owner: students[4]._id,
      images: [{ url: 'https://picsum.photos/seed/walletfound/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Spiral Bound Linear Algebra Lecture Notebook',
      description: 'Green cover spiral notebook containing midterms revision notes for Math 201.',
      category: CATEGORY.BOOKS_STATIONERY,
      type: ITEM_TYPE.LOST,
      location: 'Library',
      date: daysAgo(9),
      owner: students[3]._id,
      images: [{ url: 'https://picsum.photos/seed/mathnotes/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found Badminton Racket in Yonex Cover',
      description: 'Found an isometric carbon fiber racket in a blue zippered sheath by court 1.',
      category: CATEGORY.SPORTS,
      type: ITEM_TYPE.FOUND,
      location: 'Sports Complex',
      date: daysAgo(11),
      owner: students[4]._id,
      images: [{ url: 'https://picsum.photos/seed/racket1/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Prescription Glasses with Tortoiseshell Frame',
      description: 'Lost reading glasses in an oval hard brown case near the campus cafeteria cashier.',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.LOST,
      location: 'Cafeteria',
      date: daysAgo(13),
      owner: students[1]._id,
      images: [{ url: 'https://picsum.photos/seed/glasses1/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found Apple Pencil 2nd Generation',
      description: 'Found a white magnetic stylus pen under the seminar chairs in the auditorium.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.FOUND,
      location: 'Auditorium',
      date: daysAgo(16),
      owner: students[2]._id,
      images: [{ url: 'https://picsum.photos/seed/applepencil/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Motorbike Ignition Keys with Ducati Tag',
      description: 'Lost motorcycle key with a red rubber Ducati Corse keychain near the main campus barrier.',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.LOST,
      location: 'Main Gate',
      date: daysAgo(18),
      owner: students[0]._id,
      images: [{ url: 'https://picsum.photos/seed/ducatikeys/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'Found Denim Jacket (Light Wash, Size L)',
      description: 'Left over the backrest of a chair in the central courtyard cafeteria patio.',
      category: CATEGORY.CLOTHING,
      type: ITEM_TYPE.FOUND,
      location: 'Cafeteria',
      date: daysAgo(20),
      owner: students[4]._id,
      images: [{ url: 'https://picsum.photos/seed/denimjacket/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
    {
      title: 'HP 65W USB-C Laptop Charger',
      description: 'Left black AC adapter plugged into the floor socket in the reading room.',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Library',
      date: daysAgo(21),
      owner: students[3]._id,
      images: [{ url: 'https://picsum.photos/seed/hpcharger/600/400' }],
      status: ITEM_STATUS.ACTIVE,
    },
  ];

  const createdItems = await Item.insertMany(itemSeeds);
  logger.info(`Inserted ${createdItems.length} items`);

  logger.info('Seeding claims (4 claims)...');
  const claimsData = [
    {
      item: createdItems[1]._id, // phone found
      claimant: students[0]._id,
      message: 'This is my Samsung S23 that I forgot on table 14 while studying for midterms.',
      proof: 'The lock screen wallpaper is a starry night sky with a quote, and there is a tiny GitHub octocat sticker inside the case.',
      status: CLAIM_STATUS.PENDING,
    },
    {
      item: createdItems[6]._id, // backpack lost
      claimant: students[1]._id,
      message: 'I picked this up from the bench outside Lab 304 and brought it to security.',
      proof: 'Inside the small front pocket there is a blue USB thumb drive labelled "Algorithms 2026".',
      status: CLAIM_STATUS.APPROVED,
      decidedAt: daysAgo(2),
      decisionNote: 'Verified thumb drive label and handed over.',
    },
    {
      item: createdItems[3]._id, // water bottle found
      claimant: students[2]._id,
      message: 'I left my water flask at the sports complex yesterday evening.',
      proof: 'It is a 24oz green bottle with a sports straw cap.',
      status: CLAIM_STATUS.REJECTED,
      decidedAt: daysAgo(1),
      decisionNote: 'Sorry, this bottle is 32oz navy blue with a standard screw lid.',
    },
    {
      item: createdItems[17]._id, // wallet found
      claimant: students[3]._id,
      message: 'I dropped my leather wallet in the lecture hall.',
      proof: 'Inside there is a debit card with name ending in Marcus W.',
      status: CLAIM_STATUS.PENDING,
    },
  ];
  await Claim.insertMany(claimsData);

  logger.info('Seeding notifications (6 notifications)...');
  const notifsData = [
    {
      recipient: students[1]._id,
      type: NOTIF_TYPE.CLAIM_RECEIVED,
      message: 'John Doe submitted a claim for “Found black smartphone on 2nd floor desk”.',
      item: createdItems[1]._id,
      link: `/items/${createdItems[1]._id}`,
      read: false,
    },
    {
      recipient: students[1]._id,
      type: NOTIF_TYPE.CLAIM_APPROVED,
      message: 'Your claim for “Grey Herschel backpack with laptop and notebooks” was approved!',
      item: createdItems[6]._id,
      link: '/my-claims',
      read: false,
    },
    {
      recipient: students[0]._id,
      type: NOTIF_TYPE.MATCH_FOUND,
      message: 'Possible match found (92% score) for your reported item “Black Samsung Galaxy S23”.',
      item: createdItems[0]._id,
      link: `/items/${createdItems[0]._id}`,
      read: false,
    },
    {
      recipient: students[2]._id,
      type: NOTIF_TYPE.CLAIM_REJECTED,
      message: 'Your claim for “Blue metal water bottle found near court benches” was declined.',
      item: createdItems[3]._id,
      link: '/my-claims',
      read: true,
    },
    {
      recipient: students[2]._id,
      type: NOTIF_TYPE.ITEM_RESOLVED,
      message: 'Your item “Student ID card in brown leather lanyard” was marked as resolved.',
      item: createdItems[10]._id,
      link: '/my-reports',
      read: true,
    },
    {
      recipient: students[0]._id,
      type: NOTIF_TYPE.WELCOME,
      message: 'Welcome to Campus Lost & Found! Report what you lose or find to help your peers.',
      link: '/dashboard',
      read: true,
    },
  ];
  await Notification.insertMany(notifsData);

  logger.info('Seeding AI matches (2 matches)...');
  const matchesData = [
    {
      lostItem: createdItems[0]._id,
      foundItem: createdItems[1]._id,
      score: 92,
      reasoning: 'Both listings describe a black Samsung smartphone reported at the Campus Library on the same afternoon.',
      matchingAttributes: [
        'Same campus location (Library)',
        'Matching electronic device brand (Samsung)',
        'Consistent black color',
        'Timestamps within 2 hours',
      ],
      source: 'GEMINI',
      status: 'SUGGESTED',
    },
    {
      lostItem: createdItems[2]._id,
      foundItem: createdItems[3]._id,
      score: 88,
      reasoning: 'Blue insulated water bottle reported lost and found at the Sports Complex on the evening of Sept 22.',
      matchingAttributes: [
        'Same location (Sports Complex)',
        'Identical color and material (blue metal flask)',
        'Approximate volume match (32oz)',
      ],
      source: 'HEURISTIC',
      status: 'SUGGESTED',
    },
  ];
  await Match.insertMany(matchesData);

  logger.info('Seeding abuse reports (2 reports)...');
  const reportsData = [
    {
      item: createdItems[15]._id,
      reporter: students[1]._id,
      reason: REPORT_REASON.SPAM,
      details: 'Duplicate listing posted twice within 5 minutes.',
      status: REPORT_STATUS.PENDING,
    },
    {
      item: createdItems[13]._id,
      reporter: students[2]._id,
      reason: REPORT_REASON.FAKE_LISTING,
      details: 'Suspected prank item description.',
      status: REPORT_STATUS.RESOLVED,
      resolvedBy: adminUser._id,
      resolutionNote: 'Listing reviewed and confirmed legitimate.',
    },
  ];
  await Report.insertMany(reportsData);

  logger.info('=============================================');
  logger.info('SEED COMPLETE! Ready for use.');
  logger.info('Admin Credentials:');
  logger.info(`  Email:    ${env.ADMIN_EMAIL}`);
  logger.info(`  Password: ${env.ADMIN_PASSWORD}`);
  logger.info('Student Accounts:');
  students.forEach((s) => {
    logger.info(`  ${s.name.padEnd(18)} | Email: ${s.email.padEnd(25)} | Password: Password123!`);
  });
  logger.info('=============================================');

  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  const cliUri = process.argv[2] || null;
  seedDatabase(cliUri)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err.message || err);
      process.exit(1);
    });
}
