import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { CATEGORY } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;
let user;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
    name: 'Assist Tester',
    email: 'assist@campus.test',
    password: 'Password123!',
  });

  token = generateToken(user);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('AI Assist API (POST /api/ai/assist)', () => {
  it('rejects unauthenticated requests with 401 UNAUTHENTICATED', async () => {
    const res = await request(app)
      .post('/api/ai/assist')
      .send({ text: 'I lost my black backpack in library' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects descriptions shorter than 3 characters with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/ai/assist')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects descriptions longer than 600 characters with 400 VALIDATION_ERROR', async () => {
    const longText = 'a'.repeat(601);
    const res = await request(app)
      .post('/api/ai/assist')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: longText });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns structured recommendations and detects ELECTRONICS category via dictionary fallback', async () => {
    const res = await request(app)
      .post('/api/ai/assist')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'left my iphone 13 with clear case on the 2nd floor library desk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toHaveProperty('suggestedTitle');
    expect(data.category).toBe(CATEGORY.ELECTRONICS);
    expect(Array.isArray(data.keywords)).toBe(true);
    expect(Array.isArray(data.likelyLocations)).toBe(true);
    expect(Array.isArray(data.clarifyingQuestions)).toBe(true);
  });

  it('detects KEYS category via dictionary fallback for keys description', async () => {
    const res = await request(app)
      .post('/api/ai/assist')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'found a brass keychain with three keys near cafeteria door' });

    expect(res.status).toBe(200);
    expect(res.body.data.category).toBe(CATEGORY.KEYS);
  });
});
