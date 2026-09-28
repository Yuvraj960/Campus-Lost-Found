import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Claim } from '../src/models/Claim.js';
import { Notification } from '../src/models/Notification.js';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, CLAIM_STATUS, NOTIF_TYPE } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let userA;
let userB;
let userC;
let tokenA;
let tokenB;
let tokenC;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  userA = await User.create({
    name: 'Alice Owner',
    email: 'alice@campus.test',
    password: 'Password123!',
    phone: '+1-555-0101',
    department: 'Architecture',
    year: 4,
  });

  userB = await User.create({
    name: 'Bob Claimant',
    email: 'bob@campus.test',
    password: 'Password123!',
    phone: '+1-555-0102',
    department: 'Civil Engineering',
    year: 2,
  });

  userC = await User.create({
    name: 'Charlie Claimant',
    email: 'charlie@campus.test',
    password: 'Password123!',
    phone: '+1-555-0103',
    department: 'Mechanical',
    year: 1,
  });

  tokenA = generateToken(userA);
  tokenB = generateToken(userB);
  tokenC = generateToken(userC);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Item.deleteMany({});
  await Claim.deleteMany({});
  await Notification.deleteMany({});
});

describe('Claims API & Approval Lifecycle', () => {
  const sampleItemData = {
    title: 'Blue Hydroflask with Stickers',
    description: 'Found on the 2nd floor library study table.',
    category: CATEGORY.SPORTS,
    type: ITEM_TYPE.FOUND,
    location: 'Library',
    date: new Date(),
    status: ITEM_STATUS.ACTIVE,
  };

  it('allows User B to claim User A item, notifies A, and creates PENDING claim', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        itemId: item._id.toString(),
        message: 'This is my water bottle. It has a NASA sticker on the bottom.',
        proof: 'Purchased from Amazon last semester; serial sticker underneath.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(CLAIM_STATUS.PENDING);

    // Verify User A received CLAIM_RECEIVED notification
    const notif = await Notification.findOne({ recipient: userA._id, type: NOTIF_TYPE.CLAIM_RECEIVED });
    expect(notif).not.toBeNull();
    expect(notif.message).toContain('Blue Hydroflask with Stickers');
  });

  it('rejects self-claims with 409 CONFLICT', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        itemId: item._id.toString(),
        message: 'Claiming my own item which is invalid.',
        proof: 'Proof details must be provided.',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects duplicate pending claims from the same user with 409 CONFLICT', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        itemId: item._id.toString(),
        message: 'First claim message here.',
        proof: 'First claim proof here.',
      });

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        itemId: item._id.toString(),
        message: 'Second claim attempt message.',
        proof: 'Second claim attempt proof.',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('hides owner contact info on GET /api/claims/my when claim is PENDING', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    await Claim.create({
      item: item._id,
      claimant: userB._id,
      message: 'Pending claim message.',
      proof: 'Pending claim proof.',
      status: CLAIM_STATUS.PENDING,
    });

    const res = await request(app)
      .get('/api/claims/my')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    const myClaim = res.body.data.items[0];

    // Contact info must be hidden
    expect(myClaim.contact).toBeNull();
    expect(myClaim.item.owner.email).toBeUndefined();
    expect(myClaim.item.owner.phone).toBeUndefined();
  });

  it('enforces full approval lifecycle: approves claim, marks item CLAIMED, rejects other claims, reveals contact info', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    // User B and User C both submit claims
    const claimB = await Claim.create({
      item: item._id,
      claimant: userB._id,
      message: 'Claim B message with good proof.',
      proof: 'Secret detail B.',
      status: CLAIM_STATUS.PENDING,
    });

    const claimC = await Claim.create({
      item: item._id,
      claimant: userC._id,
      message: 'Claim C message here.',
      proof: 'Detail C confidential proof.',
      status: CLAIM_STATUS.PENDING,
    });

    // Non-owner (User B) cannot approve claims
    const unauthorizedRes = await request(app)
      .patch(`/api/claims/${claimB._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: CLAIM_STATUS.APPROVED });
    expect(unauthorizedRes.status).toBe(403);

    // User A approves User B's claim
    const approveRes = await request(app)
      .patch(`/api/claims/${claimB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: CLAIM_STATUS.APPROVED, decisionNote: 'Verified via photo comparison' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe(CLAIM_STATUS.APPROVED);

    // 1. Item status should now be CLAIMED
    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.status).toBe(ITEM_STATUS.CLAIMED);

    // 2. User C's pending claim should automatically be REJECTED
    const updatedClaimC = await Claim.findById(claimC._id);
    expect(updatedClaimC.status).toBe(CLAIM_STATUS.REJECTED);
    expect(updatedClaimC.decisionNote).toContain('claimed by another party');

    // 3. User B received CLAIM_APPROVED notification
    const notifB = await Notification.findOne({ recipient: userB._id, type: NOTIF_TYPE.CLAIM_APPROVED });
    expect(notifB).not.toBeNull();

    // 4. User C received CLAIM_REJECTED notification
    const notifC = await Notification.findOne({ recipient: userC._id, type: NOTIF_TYPE.CLAIM_REJECTED });
    expect(notifC).not.toBeNull();

    // 5. User B can now see User A's contact info
    const myClaimsRes = await request(app)
      .get('/api/claims/my')
      .set('Authorization', `Bearer ${tokenB}`);

    const approvedClaim = myClaimsRes.body.data.items.find((c) => c.id === claimB._id.toString());
    expect(approvedClaim.contact).not.toBeNull();
    expect(approvedClaim.contact.name).toBe(userA.name);
    expect(approvedClaim.contact.email).toBe(userA.email);
    expect(approvedClaim.contact.phone).toBe(userA.phone);

    // 6. Cannot update an already approved claim (Terminal states are final)
    const illegalUpdateRes = await request(app)
      .patch(`/api/claims/${claimB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: CLAIM_STATUS.REJECTED });
    expect(illegalUpdateRes.status).toBe(409);

    // 7. When User A marks item RESOLVED, User B receives ITEM_RESOLVED notification
    await request(app)
      .patch(`/api/items/${item._id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: ITEM_STATUS.RESOLVED });

    const notifResolved = await Notification.findOne({ recipient: userB._id, type: NOTIF_TYPE.ITEM_RESOLVED });
    expect(notifResolved).not.toBeNull();
  });

  it('allows claimant to withdraw a pending claim', async () => {
    const item = await Item.create({ ...sampleItemData, owner: userA._id });

    const claim = await Claim.create({
      item: item._id,
      claimant: userB._id,
      message: 'Claim message to withdraw.',
      proof: 'Proof description.',
      status: CLAIM_STATUS.PENDING,
    });

    const res = await request(app)
      .patch(`/api/claims/${claim._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: CLAIM_STATUS.WITHDRAWN });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(CLAIM_STATUS.WITHDRAWN);

    // Owner should be notified of withdrawal
    const notif = await Notification.findOne({ recipient: userA._id, type: NOTIF_TYPE.CLAIM_WITHDRAWN });
    expect(notif).not.toBeNull();
  });
});
