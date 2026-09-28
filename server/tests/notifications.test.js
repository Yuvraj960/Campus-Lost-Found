import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Notification } from '../src/models/Notification.js';
import { NOTIF_TYPE } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let testUser;
let otherUser;
let testToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  testUser = await User.create({
    name: 'Test Student',
    email: 'test@campus.test',
    password: 'Password123!',
  });

  otherUser = await User.create({
    name: 'Other Student',
    email: 'other@campus.test',
    password: 'Password123!',
  });

  testToken = generateToken(testUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

describe('Notifications API', () => {
  it('fetches paginated notifications and unread count', async () => {
    // Create 3 unread notifications and 1 read notification for testUser
    await Notification.create([
      {
        recipient: testUser._id,
        type: NOTIF_TYPE.WELCOME,
        message: 'Welcome to Campus Lost & Found!',
        read: false,
      },
      {
        recipient: testUser._id,
        type: NOTIF_TYPE.CLAIM_RECEIVED,
        message: 'New claim on your item.',
        read: false,
      },
      {
        recipient: testUser._id,
        type: NOTIF_TYPE.MATCH_FOUND,
        message: 'Potential match discovered.',
        read: true,
      },
      {
        recipient: otherUser._id,
        type: NOTIF_TYPE.WELCOME,
        message: 'Notification for another user.',
        read: false,
      },
    ]);

    // 1. Check unread count
    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${testToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.data.count).toBe(2);

    // 2. Fetch all notifications
    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${testToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBe(3);
    expect(listRes.body.data.total).toBe(3);

    // 3. Filter by unread=true
    const unreadRes = await request(app)
      .get('/api/notifications?unread=true')
      .set('Authorization', `Bearer ${testToken}`);

    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data.items.length).toBe(2);
  });

  it('marks a single notification as read', async () => {
    const notif = await Notification.create({
      recipient: testUser._id,
      type: NOTIF_TYPE.WELCOME,
      message: 'Welcome to Campus Lost & Found!',
      read: false,
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated.read).toBe(true);
  });

  it('marks all notifications as read', async () => {
    await Notification.create([
      { recipient: testUser._id, type: NOTIF_TYPE.WELCOME, message: 'Message 1', read: false },
      { recipient: testUser._id, type: NOTIF_TYPE.WELCOME, message: 'Message 2', read: false },
    ]);

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);

    const unreadCount = await Notification.countDocuments({ recipient: testUser._id, read: false });
    expect(unreadCount).toBe(0);
  });
});
