import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Claim } from '../src/models/Claim.js';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, CLAIM_STATUS } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let testUser;
let otherUser;
let testUserToken;
let otherUserToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  testUser = new User({
    name: 'Test Student',
    email: 'test@campus.test',
    password: 'Password123!',
    department: 'Computer Science',
    year: 3,
    phone: '+1-555-0199',
  });
  await testUser.save();

  otherUser = new User({
    name: 'Other Student',
    email: 'other@campus.test',
    password: 'Password123!',
    department: 'Electrical Engineering',
    year: 2,
    phone: '+1-555-0188',
  });
  await otherUser.save();

  testUserToken = generateToken(testUser);
  otherUserToken = generateToken(otherUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Item.deleteMany({});
  await Claim.deleteMany({});
});

describe('Items API', () => {
  describe('POST /api/items', () => {
    it('creates an item with 201 status and standard envelope', async () => {
      const itemData = {
        title: 'Silver Apple iPad Air',
        description: 'Left on the wooden table near cafeteria juice corner.',
        category: CATEGORY.ELECTRONICS,
        type: ITEM_TYPE.LOST,
        location: 'Cafeteria',
        date: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(itemData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(itemData.title);
      expect(res.body.data.status).toBe(ITEM_STATUS.ACTIVE);
      expect(res.body.data.owner.toString()).toBe(testUser._id.toString());
    });

    it('returns 400 validation error for invalid body', async () => {
      const invalidData = {
        title: 'Hi', // too short (< 3)
        description: 'short', // too short (< 10)
        category: 'INVALID_CAT',
        type: 'LOST',
        location: 'C',
        date: new Date().toISOString(),
      };

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/items', () => {
    beforeEach(async () => {
      await Item.create([
        {
          title: 'Dell XPS 15 Laptop',
          description: 'Silver aluminum laptop with carbon fiber palm rest.',
          category: CATEGORY.ELECTRONICS,
          type: ITEM_TYPE.LOST,
          location: 'Library 3rd floor',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          owner: testUser._id,
          status: ITEM_STATUS.ACTIVE,
        },
        {
          title: 'Stainless steel water flask',
          description: 'Found blue insulated flask near tennis court.',
          category: CATEGORY.SPORTS,
          type: ITEM_TYPE.FOUND,
          location: 'Sports Complex',
          date: new Date(Date.now() - 48 * 60 * 60 * 1000),
          owner: otherUser._id,
          status: ITEM_STATUS.ACTIVE,
        },
        {
          title: 'Resolved Student ID',
          description: 'Card returned to student.',
          category: CATEGORY.ID_DOCUMENTS,
          type: ITEM_TYPE.LOST,
          location: 'Main Gate',
          date: new Date(),
          owner: testUser._id,
          status: ITEM_STATUS.RESOLVED,
        },
      ]);
    });

    it('returns active items by default with pagination metadata', async () => {
      const res = await request(app).get('/api/items');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2); // only ACTIVE
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
    });

    it('filters items by category', async () => {
      const res = await request(app).get('/api/items?category=ELECTRONICS');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].category).toBe(CATEGORY.ELECTRONICS);
    });

    it('filters items by type (LOST/FOUND)', async () => {
      const res = await request(app).get('/api/items?type=FOUND');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].type).toBe(ITEM_TYPE.FOUND);
    });

    it('filters items by location case-insensitively', async () => {
      const res = await request(app).get('/api/items?location=library');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].location).toContain('Library');
    });

    it('returns all statuses when status=ALL', async () => {
      const res = await request(app).get('/api/items?status=ALL');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(3);
    });
  });

  describe('GET /api/items/:id', () => {
    it('returns full item and hides owner contact details for unapproved claimants', async () => {
      const item = await Item.create({
        title: 'Sony Wireless Headphones',
        description: 'Over-ear headphones in zippered travel case.',
        category: CATEGORY.ELECTRONICS,
        type: ITEM_TYPE.LOST,
        location: 'Hostel Block A',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.ACTIVE,
      });

      const res = await request(app)
        .get(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(item._id.toString());
      expect(res.body.data.owner.name).toBe(testUser.name);
      // Privacy rule: email and phone stripped
      expect(res.body.data.owner.email).toBeUndefined();
      expect(res.body.data.owner.phone).toBeUndefined();
    });

    it('reveals contact details to the owner', async () => {
      const item = await Item.create({
        title: 'Sony Wireless Headphones',
        description: 'Over-ear headphones in zippered travel case.',
        category: CATEGORY.ELECTRONICS,
        type: ITEM_TYPE.LOST,
        location: 'Hostel Block A',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.ACTIVE,
      });

      const res = await request(app)
        .get(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.owner.email).toBe(testUser.email);
      expect(res.body.data.owner.phone).toBe(testUser.phone);
      expect(res.body.data.claimCount).toBeDefined();
    });

    it('returns 404 for non-existent item id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/items/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/items/:id/status', () => {
    it('updates status from ACTIVE to RESOLVED', async () => {
      const item = await Item.create({
        title: 'Green Umbrella',
        description: 'Left inside auditorium row 4.',
        category: CATEGORY.ACCESSORIES,
        type: ITEM_TYPE.FOUND,
        location: 'Auditorium',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.ACTIVE,
      });

      const res = await request(app)
        .patch(`/api/items/${item._id}/status`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ status: ITEM_STATUS.RESOLVED });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(ITEM_STATUS.RESOLVED);
      expect(res.body.data.resolvedAt).toBeDefined();
    });

    it('rejects illegal transition with 409', async () => {
      const item = await Item.create({
        title: 'Green Umbrella',
        description: 'Left inside auditorium row 4.',
        category: CATEGORY.ACCESSORIES,
        type: ITEM_TYPE.FOUND,
        location: 'Auditorium',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.RESOLVED,
      });

      const res = await request(app)
        .patch(`/api/items/${item._id}/status`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ status: ITEM_STATUS.RESOLVED });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('deletes active item when no approved claim exists', async () => {
      const item = await Item.create({
        title: 'Textbook to delete',
        description: 'Organic chemistry study guide.',
        category: CATEGORY.BOOKS_STATIONERY,
        type: ITEM_TYPE.FOUND,
        location: 'Library',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.ACTIVE,
      });

      const res = await request(app)
        .delete(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const found = await Item.findById(item._id);
      expect(found).toBeNull();
    });

    it('rejects deletion with 409 if an approved claim exists', async () => {
      const item = await Item.create({
        title: 'Important item with approved claim',
        description: 'This item has already been claimed and approved.',
        category: CATEGORY.ELECTRONICS,
        type: ITEM_TYPE.FOUND,
        location: 'Lab Block',
        date: new Date(),
        owner: testUser._id,
        status: ITEM_STATUS.CLAIMED,
      });

      await Claim.create({
        item: item._id,
        claimant: otherUser._id,
        message: 'This is my item and proof was accepted.',
        proof: 'Secret serial number 123456.',
        status: CLAIM_STATUS.APPROVED,
      });

      const res = await request(app)
        .delete(`/api/items/${item._id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });
});
