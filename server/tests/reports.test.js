import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Report } from '../src/models/Report.js';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, REPORT_REASON, REPORT_STATUS } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let studentA;
let studentB;
let tokenA;
let tokenB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  studentA = await User.create({
    name: 'Reporter Student',
    email: 'reporter@campus.test',
    password: 'Password123!',
    department: 'Computer Science',
    year: 2,
  });

  studentB = await User.create({
    name: 'Second Reporter',
    email: 'reporter2@campus.test',
    password: 'Password123!',
    department: 'Physics',
    year: 3,
  });

  tokenA = generateToken(studentA);
  tokenB = generateToken(studentB);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Item.deleteMany({});
  await Report.deleteMany({});
});

describe('Abuse Reports API (POST /api/reports)', () => {
  const createTestItem = async (ownerId) => {
    return Item.create({
      title: 'Suspicious Expensive Watch',
      description: 'Found laying in the courtyard, looks suspiciously brand new.',
      category: CATEGORY.ACCESSORIES,
      type: ITEM_TYPE.FOUND,
      location: 'Courtyard',
      date: new Date(),
      status: ITEM_STATUS.ACTIVE,
      owner: ownerId,
    });
  };

  it('rejects unauthenticated report creation with 401', async () => {
    const item = await createTestItem(studentB._id);

    const res = await request(app)
      .post('/api/reports')
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.FAKE_LISTING,
        details: 'Looks completely fabricated',
      });

    expect(res.status).toBe(401);
  });

  it('creates an abuse report and marks item as flagged (isFlagged: true)', async () => {
    const item = await createTestItem(studentB._id);
    expect(item.isFlagged).toBe(false);

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.SPAM,
        details: 'Repeated duplicate post selling merchandise.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reason).toBe(REPORT_REASON.SPAM);
    expect(res.body.data.status).toBe(REPORT_STATUS.PENDING);

    // Verify item is flagged in database
    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.isFlagged).toBe(true);
  });

  it('prevents duplicate reports by the same user on the same item with 409 Conflict', async () => {
    const item = await createTestItem(studentB._id);

    // First report succeeds
    const firstRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.FAKE_LISTING,
        details: 'First report on this listing.',
      });

    expect(firstRes.status).toBe(201);

    // Second report by same user should be rejected with 409
    const secondRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.OTHER,
        details: 'Trying to report again.',
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.error.code).toBe('CONFLICT');
  });

  it('allows a different user to report the same item', async () => {
    const item = await createTestItem(studentA._id);

    const res1 = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.WRONG_INFO,
        details: 'Wrong room number.',
      });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.SPAM,
        details: 'Spam listing.',
      });
    expect(res2.status).toBe(201);
  });

  it('rejects reporting non-existent item with 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: fakeId,
        reason: REPORT_REASON.INAPPROPRIATE,
        details: 'Item does not exist.',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('validates required fields and length constraints', async () => {
    const item = await createTestItem(studentB._id);

    // Invalid reason enum
    const badReasonRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: 'NOT_A_VALID_REASON',
      });
    expect(badReasonRes.status).toBe(400);

    // Missing reason
    const missingReasonRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
      });
    expect(missingReasonRes.status).toBe(400);

    // Details exceeding 500 characters
    const longDetails = 'a'.repeat(501);
    const longDetailsRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        reason: REPORT_REASON.OTHER,
        details: longDetails,
      });
    expect(longDetailsRes.status).toBe(400);
  });
});
