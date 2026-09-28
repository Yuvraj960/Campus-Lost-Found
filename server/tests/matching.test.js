import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Match } from '../src/models/Match.js';
import { Notification } from '../src/models/Notification.js';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, MATCH_STATUS, NOTIF_TYPE } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';
import { matchingService } from '../src/services/matchingService.js';
import { geminiClient } from '../src/services/ai/geminiClient.js';

let mongoServer;
let userA;
let userB;
let userC;
let tokenA;
let tokenB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  userA = await User.create({
    name: 'Student Alice',
    email: 'alice.matcher@campus.test',
    password: 'Password123!',
    phone: '+1-555-0101',
    department: 'Computer Science',
    year: 3,
  });

  userB = await User.create({
    name: 'Student Bob',
    email: 'bob.matcher@campus.test',
    password: 'Password123!',
    phone: '+1-555-0102',
    department: 'Electrical Engineering',
    year: 2,
  });

  userC = await User.create({
    name: 'Student Charlie',
    email: 'charlie.matcher@campus.test',
    password: 'Password123!',
    phone: '+1-555-0103',
    department: 'Mathematics',
    year: 1,
  });

  tokenA = generateToken(userA);
  tokenB = generateToken(userB);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Item.deleteMany({});
  await Match.deleteMany({});
  await Notification.deleteMany({});
});

describe('AI Matching & Intelligent Pairing', () => {
  it('seeded matching pair produces a match >= threshold and notifies both owners via heuristic fallback', async () => {
    // User A reports LOST black Samsung Galaxy phone at Main Library
    const lostItem = await Item.create({
      title: 'Lost Black Samsung Galaxy S23',
      description: 'Black phone with cracked bottom right corner left on 2nd floor desk',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Main Library 2nd floor study area',
      date: new Date('2026-09-15T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // User B reports FOUND black Samsung phone at Main Library
    const foundItem = await Item.create({
      title: 'Found Samsung Smartphone',
      description: 'Black Samsung Galaxy phone with small screen crack found on desk',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.FOUND,
      location: 'Main Library 2nd floor',
      date: new Date('2026-09-15T14:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // Run matching for foundItem
    const result = await matchingService.runForItem(foundItem._id);
    expect(result.created).toBe(1);

    // Verify Match was saved in DB
    const match = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
    expect(match).not.toBeNull();
    expect(match.score).toBeGreaterThanOrEqual(60);
    expect(match.status).toBe(MATCH_STATUS.SUGGESTED);
    expect(match.source).toBe('HEURISTIC');
    expect(match.matchingAttributes.length).toBeGreaterThan(0);

    // Verify notifications were created for both Alice (lost) and Bob (found)
    const notifA = await Notification.findOne({ recipient: userA._id, type: NOTIF_TYPE.MATCH_FOUND });
    expect(notifA).not.toBeNull();
    expect(notifA.message).toContain('Possible match found for');
    expect(notifA.link).toBe(`/items/${lostItem._id.toString()}`);

    const notifB = await Notification.findOne({ recipient: userB._id, type: NOTIF_TYPE.MATCH_FOUND });
    expect(notifB).not.toBeNull();
    expect(notifB.message).toContain('Possible match found for');
    expect(notifB.link).toBe(`/items/${foundItem._id.toString()}`);
  });

  it('near-miss pair produces score below threshold and creates no match or notification', async () => {
    // User A reports LOST Hydroflask water bottle at Gymnasium
    const lostItem = await Item.create({
      title: 'Lost Blue Hydroflask Water Bottle',
      description: '32oz blue metal insulated water bottle left near basketball court',
      category: CATEGORY.SPORTS,
      type: ITEM_TYPE.LOST,
      location: 'Campus Gymnasium',
      date: new Date('2026-09-10T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // User B reports FOUND red plastic bottle at Library (completely different brand, color, location)
    const foundItem = await Item.create({
      title: 'Found Red Plastic BlenderBottle',
      description: 'Clear and red shaker bottle with protein powder residue found near book stacks',
      category: CATEGORY.SPORTS,
      type: ITEM_TYPE.FOUND,
      location: 'Central Library Basement',
      date: new Date('2026-09-25T14:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const result = await matchingService.runForItem(foundItem._id);
    expect(result.created).toBe(0);

    const match = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
    expect(match).toBeNull();

    const notifCount = await Notification.countDocuments();
    expect(notifCount).toBe(0);
  });

  it('excludes candidates with same owner, inactive status, removed items, or outside date window', async () => {
    // Source item
    const sourceItem = await Item.create({
      title: 'Lost Set of Keys with Red Tag',
      description: 'Set of 3 dorm keys on metal ring with red plastic tag',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.LOST,
      location: 'Student Union Cafeteria',
      date: new Date('2026-09-01T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // 1. Same owner: User A finding keys -> should be excluded
    await Item.create({
      title: 'Found Set of Keys with Red Tag',
      description: 'Found keys with red tag in cafeteria',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Student Union Cafeteria',
      date: new Date('2026-09-01T12:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // 2. Inactive status: already RESOLVED -> should be excluded
    await Item.create({
      title: 'Found Keys Red Tag',
      description: 'Found keys in cafeteria',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Student Union Cafeteria',
      date: new Date('2026-09-01T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.RESOLVED,
    });

    // 3. Removed item: isRemoved = true -> should be excluded
    await Item.create({
      title: 'Found Keys Red Tag',
      description: 'Found keys in cafeteria',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Student Union Cafeteria',
      date: new Date('2026-09-01T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
      isRemoved: true,
    });

    // 4. Outside 30-day window: found 40 days prior to lost report -> should be excluded
    await Item.create({
      title: 'Found Keys Red Tag',
      description: 'Found keys in cafeteria',
      category: CATEGORY.KEYS,
      type: ITEM_TYPE.FOUND,
      location: 'Student Union Cafeteria',
      date: new Date('2026-07-20T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const result = await matchingService.runForItem(sourceItem._id);
    expect(result.created).toBe(0);

    const matchCount = await Match.countDocuments();
    expect(matchCount).toBe(0);
  });

  it('rerun matching does not duplicate Match records', async () => {
    const lostItem = await Item.create({
      title: 'Lost Leather Wallet',
      description: 'Brown leather bi-fold wallet containing student ID card',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.LOST,
      location: 'Auditorium Hall',
      date: new Date('2026-09-20T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const foundItem = await Item.create({
      title: 'Found Brown Leather Wallet',
      description: 'Brown leather wallet found under seats in Auditorium',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.FOUND,
      location: 'Auditorium Hall',
      date: new Date('2026-09-20T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    // First run
    const run1 = await matchingService.runForItem(foundItem._id);
    expect(run1.created).toBe(1);

    // Second run
    const run2 = await matchingService.runForItem(foundItem._id);
    expect(run2.created).toBe(0); // already exists, not newly created

    const totalMatches = await Match.countDocuments({
      lostItem: lostItem._id,
      foundItem: foundItem._id,
    });
    expect(totalMatches).toBe(1);
  });

  it('GET /api/matches/my returns suggested matches for current user items with hidden contact info', async () => {
    const lostItem = await Item.create({
      title: 'Lost Graphic Calculator',
      description: 'TI-84 Plus silver edition calculator',
      category: CATEGORY.BOOKS_STATIONERY,
      type: ITEM_TYPE.LOST,
      location: 'Math Building Room 101',
      date: new Date('2026-09-20T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const foundItem = await Item.create({
      title: 'Found TI-84 Calculator',
      description: 'TI-84 calculator found on desk in Math Building',
      category: CATEGORY.BOOKS_STATIONERY,
      type: ITEM_TYPE.FOUND,
      location: 'Math Building Room 101',
      date: new Date('2026-09-20T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    await Match.create({
      lostItem: lostItem._id,
      foundItem: foundItem._id,
      score: 88,
      reasoning: 'Matching calculator model and room location',
      matchingAttributes: ['Same category', 'Same building'],
      source: 'HEURISTIC',
      status: MATCH_STATUS.SUGGESTED,
    });

    // Alice requests my matches
    const resA = await request(app)
      .get('/api/matches/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(resA.body.data).toHaveLength(1);

    const matchData = resA.body.data[0];
    expect(matchData.score).toBe(88);
    expect(matchData.myItem.title).toBe(lostItem.title);
    expect(matchData.otherItem.title).toBe(foundItem.title);
    // Verify other item does not expose contact email or phone
    expect(matchData.otherItem).not.toHaveProperty('owner.email');
    expect(matchData.otherItem).not.toHaveProperty('owner.phone');
  });

  it('PATCH /api/matches/:id allows either item owner to dismiss the match', async () => {
    const lostItem = await Item.create({
      title: 'Lost Earbuds',
      description: 'White wireless earbuds in charging case',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.LOST,
      location: 'Campus Gym',
      date: new Date('2026-09-20T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const foundItem = await Item.create({
      title: 'Found Earbuds',
      description: 'White earbuds found in locker room',
      category: CATEGORY.ELECTRONICS,
      type: ITEM_TYPE.FOUND,
      location: 'Campus Gym',
      date: new Date('2026-09-20T12:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const match = await Match.create({
      lostItem: lostItem._id,
      foundItem: foundItem._id,
      score: 75,
      source: 'HEURISTIC',
      status: MATCH_STATUS.SUGGESTED,
    });

    // Bob dismisses the match
    const res = await request(app)
      .patch(`/api/matches/${match._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'DISMISSED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(MATCH_STATUS.DISMISSED);

    // Verify it no longer appears in suggested matches
    const myMatchesRes = await request(app)
      .get('/api/matches/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(myMatchesRes.body.data).toHaveLength(0);
  });

  it('POST /api/items/:id/rematch re-runs matching and returns created count', async () => {
    const lostItem = await Item.create({
      title: 'Lost Backpack',
      description: 'Black SwissGear backpack with laptop compartment',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.LOST,
      location: 'Science Library',
      date: new Date('2026-09-20T10:00:00Z'),
      owner: userA._id,
      status: ITEM_STATUS.ACTIVE,
    });

    await Item.create({
      title: 'Found Black Backpack',
      description: 'SwissGear black backpack found on table',
      category: CATEGORY.WALLET_BAGS,
      type: ITEM_TYPE.FOUND,
      location: 'Science Library 1st floor',
      date: new Date('2026-09-20T11:00:00Z'),
      owner: userB._id,
      status: ITEM_STATUS.ACTIVE,
    });

    const res = await request(app)
      .post(`/api/items/${lostItem._id}/rematch`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('created');
    expect(res.body.data.created).toBe(1);
  });

  it('handles malformed AI output gracefully by falling back to heuristic without crashing item creation', async () => {
    const generateJsonSpy = jest
      .spyOn(geminiClient, 'generateJson')
      .mockRejectedValueOnce(new Error('SyntaxError: Unexpected token < in JSON at position 0'));

    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('title', 'Lost Blue Notebook')
      .field('description', 'Spiral blue notebook for organic chemistry class')
      .field('category', CATEGORY.BOOKS_STATIONERY)
      .field('type', ITEM_TYPE.LOST)
      .field('location', 'Chemistry Building Room 201')
      .field('date', new Date().toISOString());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    generateJsonSpy.mockRestore();
  });
});
