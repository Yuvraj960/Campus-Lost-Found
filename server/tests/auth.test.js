import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { ROLE, USER_STATUS } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  const testStudent = {
    name: 'Jane Doe',
    email: 'jane.doe@campus.test',
    password: 'Password123!',
    department: 'Computer Science',
    year: 3,
    studentId: 'CS-2024-001',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new student and returns token and user without password', async () => {
      const res = await request(app).post('/api/auth/register').send(testStudent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');

      const { user, token } = res.body.data;
      expect(user.email).toBe(testStudent.email);
      expect(user.name).toBe(testStudent.name);
      expect(user.role).toBe(ROLE.STUDENT);
      expect(user.status).toBe(USER_STATUS.ACTIVE);
      expect(user).not.toHaveProperty('password');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      // Verify user saved in DB
      const dbUser = await User.findOne({ email: testStudent.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(testStudent.password); // Hashed
    });

    it('rejects registration with duplicate email with 409 CONFLICT', async () => {
      await request(app).post('/api/auth/register').send(testStudent);
      const res = await request(app).post('/api/auth/register').send(testStudent);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects registration with password lacking a number with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testStudent,
          email: 'another@campus.test',
          password: 'onlyletters',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with short password (<8 chars) with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testStudent,
          email: 'another@campus.test',
          password: 'Pass1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create(testStudent);
    });

    it('logs in successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: testStudent.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email);
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data).toHaveProperty('token');
    });

    it('returns generic 401 UNAUTHENTICATED on wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns generic 401 UNAUTHENTICATED on non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'doesnotexist@campus.test',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns 403 ACCOUNT_SUSPENDED when user is suspended', async () => {
      await User.findOneAndUpdate({ email: testStudent.email }, { status: USER_STATUS.SUSPENDED });

      const res = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: testStudent.password,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user profile with valid Bearer token', async () => {
      const user = await User.create(testStudent);
      const token = generateToken(user);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('returns 401 UNAUTHENTICATED when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 401 UNAUTHENTICATED when token is malformed', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 ACCOUNT_SUSPENDED when user is suspended after token issue', async () => {
      const user = await User.create({ ...testStudent, status: USER_STATUS.SUSPENDED });
      const token = generateToken(user);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('updates allowed user fields', async () => {
      const user = await User.create(testStudent);
      const token = generateToken(user);

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Jane Smith',
          phone: '+1 555-0199',
          department: 'Electrical Engineering',
          year: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Jane Smith');
      expect(res.body.data.user.phone).toBe('+1 555-0199');
      expect(res.body.data.user.department).toBe('Electrical Engineering');
      expect(res.body.data.user.year).toBe(4);
    });

    it('rejects invalid updates with 400 VALIDATION_ERROR', async () => {
      const user = await User.create(testStudent);
      const token = generateToken(user);

      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          year: 99, // Max is 6
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 with empty data object', async () => {
      const user = await User.create(testStudent);
      const token = generateToken(user);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});
    });
  });

  describe('Security invariants', () => {
    it('never leaks password or password hash in any auth response', async () => {
      const regRes = await request(app).post('/api/auth/register').send(testStudent);
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testStudent.email,
        password: testStudent.password,
      });
      const token = loginRes.body.data.token;
      const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      const patchRes = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      for (const res of [regRes, loginRes, meRes, patchRes]) {
        const rawJson = JSON.stringify(res.body);
        expect(rawJson).not.toContain('Password123!');
        expect(rawJson).not.toMatch(/"password":/i);
      }
    });
  });
});
