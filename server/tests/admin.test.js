import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Claim } from '../src/models/Claim.js';
import { Report } from '../src/models/Report.js';
import { Notification } from '../src/models/Notification.js';
import {
  ROLE,
  USER_STATUS,
  CATEGORY,
  ITEM_TYPE,
  ITEM_STATUS,
  CLAIM_STATUS,
  REPORT_REASON,
  REPORT_STATUS,
  NOTIF_TYPE,
} from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let adminUser;
let secondAdmin;
let regularStudent;
let adminToken;
let secondAdminToken;
let studentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin Master',
    email: 'admin@campus.test',
    password: 'Password123!',
    role: ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  secondAdmin = await User.create({
    name: 'Admin Second',
    email: 'admin2@campus.test',
    password: 'Password123!',
    role: ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  regularStudent = await User.create({
    name: 'Student Simple',
    email: 'student@campus.test',
    password: 'Password123!',
    role: ROLE.STUDENT,
    status: USER_STATUS.ACTIVE,
  });

  adminToken = generateToken(adminUser);
  secondAdminToken = generateToken(secondAdmin);
  studentToken = generateToken(regularStudent);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Item.deleteMany({});
  await Claim.deleteMany({});
  await Report.deleteMany({});
  await Notification.deleteMany({});
});

describe('Admin API Authorization Guards', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('rejects student role requests with 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows administrator requests with 200', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/admin/stats', () => {
  it('returns aggregated analytics matching database records', async () => {
    const item1 = await Item.create({
      title: 'Lost Backpack',
      description: 'Black backpack with books.',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.LOST,
      location: 'Library',
      date: new Date(),
      status: ITEM_STATUS.ACTIVE,
      owner: regularStudent._id,
    });

    const item2 = await Item.create({
      title: 'Found Umbrella',
      description: 'Blue umbrella near cafeteria.',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.FOUND,
      location: 'Cafeteria',
      date: new Date(),
      status: ITEM_STATUS.RESOLVED,
      owner: regularStudent._id,
    });

    await Claim.create({
      item: item2._id,
      claimant: regularStudent._id,
      message: 'I lost my umbrella at cafeteria',
      proof: 'Has initials printed on handle',
      status: CLAIM_STATUS.PENDING,
    });

    await Report.create({
      item: item1._id,
      reporter: regularStudent._id,
      reason: REPORT_REASON.SPAM,
      details: 'Spam post.',
      status: REPORT_STATUS.PENDING,
    });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.totals.users).toBeGreaterThanOrEqual(3);
    expect(data.totals.lost).toBe(1);
    expect(data.totals.found).toBe(1);
    expect(data.totals.resolved).toBe(1);
    expect(data.totals.pendingClaims).toBe(1);
    expect(data.totals.openReports).toBe(1);

    expect(Array.isArray(data.byCategory)).toBe(true);
    expect(Array.isArray(data.byLocation)).toBe(true);
    expect(data.lostVsFound).toHaveLength(8);
    expect(data.reportsPerWeek).toHaveLength(8);
    expect(typeof data.resolutionRate).toBe('number');
  });
});

describe('User Management (/api/admin/users)', () => {
  it('lists paginated users without exposing password hashes', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.total).toBeGreaterThanOrEqual(3);

    res.body.data.items.forEach((u) => {
      expect(u.password).toBeUndefined();
    });
  });

  it('filters users by search query', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=Student')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].email).toBe('student@campus.test');
  });

  it('suspends and reactivates a user', async () => {
    const targetUser = await User.create({
      name: 'To Suspend',
      email: 'suspend@campus.test',
      password: 'Password123!',
      role: ROLE.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // Suspend user
    const suspendRes = await request(app)
      .patch(`/api/admin/users/${targetUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: USER_STATUS.SUSPENDED });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe(USER_STATUS.SUSPENDED);

    // Reactivate user
    const activateRes = await request(app)
      .patch(`/api/admin/users/${targetUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: USER_STATUS.ACTIVE });

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe(USER_STATUS.ACTIVE);
  });

  it('prevents an admin from suspending themselves', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: USER_STATUS.SUSPENDED });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ADMIN_SELF_ACTION');
  });

  it('cascades deletion of user, their items, claims, notifications, and reports', async () => {
    const tempUser = await User.create({
      name: 'Temp User',
      email: 'temp@campus.test',
      password: 'Password123!',
      role: ROLE.STUDENT,
    });

    const userItem = await Item.create({
      title: 'Temp Item',
      description: 'Description',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Gym',
      date: new Date(),
      owner: tempUser._id,
      images: [{ url: 'https://res.cloudinary.com/test/image.jpg', publicId: 'lost-found/temp123' }],
    });

    const claim = await Claim.create({
      item: userItem._id,
      claimant: tempUser._id,
      message: 'This is my item left behind',
      proof: 'Proof details description here',
    });

    await Notification.create({
      recipient: tempUser._id,
      type: NOTIF_TYPE.CLAIM_RECEIVED,
      title: 'Notification',
      message: 'Claim received',
    });

    await Report.create({
      item: userItem._id,
      reporter: tempUser._id,
      reason: REPORT_REASON.OTHER,
      details: 'Details',
    });

    const delRes = await request(app)
      .delete(`/api/admin/users/${tempUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);

    // Verify cascade
    expect(await User.findById(tempUser._id)).toBeNull();
    expect(await Item.findById(userItem._id)).toBeNull();
    expect(await Claim.findById(claim._id)).toBeNull();
    expect(await Notification.countDocuments({ recipient: tempUser._id })).toBe(0);
    expect(await Report.countDocuments({ reporter: tempUser._id })).toBe(0);
  });

  it('prevents an admin from deleting themselves', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ADMIN_SELF_ACTION');
  });
});

describe('Item Moderation (/api/admin/items)', () => {
  it('lists items with owner populated and filters by flag/removed', async () => {
    await Item.create({
      title: 'Flagged Watch',
      description: 'Reported item',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.FOUND,
      location: 'Lab',
      date: new Date(),
      owner: regularStudent._id,
      isFlagged: true,
    });

    const res = await request(app)
      .get('/api/admin/items?isFlagged=true')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].isFlagged).toBe(true);
    expect(res.body.data.items[0].owner.email).toBe(regularStudent.email);
  });

  it('removes item and sends ITEM_REMOVED notification to the owner', async () => {
    const item = await Item.create({
      title: 'Violating Item Post',
      description: 'Inappropriate listing content',
      category: CATEGORY.OTHER,
      type: ITEM_TYPE.FOUND,
      location: 'Quad',
      date: new Date(),
      owner: regularStudent._id,
      isFlagged: true,
    });

    const patchRes = await request(app)
      .patch(`/api/admin/items/${item._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isRemoved: true, isFlagged: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isRemoved).toBe(true);

    // Verify item is removed in DB
    const updated = await Item.findById(item._id);
    expect(updated.isRemoved).toBe(true);

    // Verify notification sent to owner
    const notifs = await Notification.find({
      recipient: regularStudent._id,
      type: NOTIF_TYPE.ITEM_REMOVED,
    });
    expect(notifs.length).toBe(1);
    expect(notifs[0].message).toContain('Violating Item Post');
  });
});

describe('Claim & Report Moderation', () => {
  it('lists claims via /api/admin/claims with populated claimants and items', async () => {
    const item = await Item.create({
      title: 'Keys found',
      description: 'Set of 3 brass keys',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Library',
      date: new Date(),
      owner: adminUser._id,
    });

    await Claim.create({
      item: item._id,
      claimant: regularStudent._id,
      message: 'I lost my keys at library',
      proof: 'Has a blue keychain attached.',
    });

    const res = await request(app)
      .get('/api/admin/claims')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].claimant.email).toBe(regularStudent.email);
    expect(res.body.data.items[0].item.title).toBe('Keys found');
  });

  it('updates report status with resolution note and resolvedBy admin', async () => {
    const item = await Item.create({
      title: 'Reported wallet',
      description: 'Wallet found',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.FOUND,
      location: 'Gym',
      date: new Date(),
      owner: regularStudent._id,
    });

    const report = await Report.create({
      item: item._id,
      reporter: regularStudent._id,
      reason: REPORT_REASON.WRONG_INFO,
      details: 'Not a wallet, it is a pouch.',
    });

    const patchRes = await request(app)
      .patch(`/api/admin/reports/${report._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: REPORT_STATUS.RESOLVED,
        resolutionNote: 'Reviewed and corrected item category.',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe(REPORT_STATUS.RESOLVED);
    expect(patchRes.body.data.resolutionNote).toBe('Reviewed and corrected item category.');

    const updated = await Report.findById(report._id);
    expect(updated.status).toBe(REPORT_STATUS.RESOLVED);
    expect(updated.resolvedBy.toString()).toBe(adminUser._id.toString());
  });
});
