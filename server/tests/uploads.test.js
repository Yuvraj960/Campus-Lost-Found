import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { CATEGORY, ITEM_TYPE } from '../src/constants/enums.js';
import { generateToken } from '../src/utils/jwt.js';
import { imageService } from '../src/services/imageService.js';

let mongoServer;
let user;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  user = await User.create({
    name: 'Upload Tester',
    email: 'uploader@campus.test',
    password: 'Password123!',
    phone: '+1-555-9999',
    department: 'Design',
    year: 2,
  });

  token = generateToken(user);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Item.deleteMany({});
});

describe('Image Uploads & Cloudinary Flow', () => {
  it('accepts 1 image file when creating an item', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Blue Backpack')
      .field('description', 'Navy blue Herschel backpack left in lecture hall')
      .field('category', CATEGORY.WALLET_BAGS)
      .field('type', ITEM_TYPE.LOST)
      .field('location', 'Hall B, Room 102')
      .field('date', new Date().toISOString())
      .attach('images', Buffer.from('fake-image-bytes-1'), { filename: 'backpack.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0]).toHaveProperty('url');
    expect(res.body.data.images[0]).toHaveProperty('publicId');
  });

  it('accepts up to 5 image files when creating an item', async () => {
    let req = request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Found Electronics Set')
      .field('description', 'Bundle of cords and adapters found in study room')
      .field('category', CATEGORY.ELECTRONICS)
      .field('type', ITEM_TYPE.FOUND)
      .field('location', 'Library Study Room 3')
      .field('date', new Date().toISOString());

    for (let i = 1; i <= 5; i++) {
      req = req.attach('images', Buffer.from(`image-bytes-${i}`), {
        filename: `photo-${i}.png`,
        contentType: 'image/png',
      });
    }

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.images).toHaveLength(5);
  });

  it('rejects upload when 6th image file is attached', async () => {
    let req = request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Too Many Photos Item')
      .field('description', 'Attempting to attach more than 5 images to item')
      .field('category', CATEGORY.OTHER)
      .field('type', ITEM_TYPE.LOST)
      .field('location', 'Main Quad')
      .field('date', new Date().toISOString());

    for (let i = 1; i <= 6; i++) {
      req = req.attach('images', Buffer.from(`image-bytes-${i}`), {
        filename: `photo-${i}.webp`,
        contentType: 'image/webp',
      });
    }

    const res = await req;
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/Too many files uploaded/i);
  });

  it('rejects non-image file formats', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Lost Document Folder')
      .field('description', 'Folder with thesis documents and notes inside')
      .field('category', CATEGORY.ID_DOCUMENTS)
      .field('type', ITEM_TYPE.LOST)
      .field('location', 'Science Building')
      .field('date', new Date().toISOString())
      .attach('images', Buffer.from('fake pdf data'), {
        filename: 'documents.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/Only JPEG, PNG, and WebP are allowed/i);
  });

  it('rejects files larger than 5MB', async () => {
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5 MB
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Lost Giant Poster')
      .field('description', 'Poster with high resolution print')
      .field('category', CATEGORY.OTHER)
      .field('type', ITEM_TYPE.LOST)
      .field('location', 'Art Gallery')
      .field('date', new Date().toISOString())
      .attach('images', oversizedBuffer, {
        filename: 'oversized.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/File size exceeds allowed limit/i);
  });

  it('deletes associated images from image service when item is deleted', async () => {
    const deleteManySpy = jest.spyOn(imageService, 'deleteMany');

    // Create item with image
    const createRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Item To Delete')
      .field('description', 'This item will be deleted along with its images')
      .field('category', CATEGORY.KEYS)
      .field('type', ITEM_TYPE.FOUND)
      .field('location', 'Cafeteria')
      .field('date', new Date().toISOString())
      .attach('images', Buffer.from('img-bytes'), { filename: 'key.jpg', contentType: 'image/jpeg' });

    expect(createRes.status).toBe(201);
    const itemId = createRes.body.data.id;
    const publicId = createRes.body.data.images[0].publicId;

    // Delete item
    const deleteRes = await request(app)
      .delete(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteManySpy).toHaveBeenCalledWith([publicId]);

    deleteManySpy.mockRestore();
  });

  it('uploads profile photo on PATCH /api/auth/me', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .attach('profileImage', Buffer.from('avatar-bytes'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.profileImage).toBeDefined();
    expect(res.body.data.user.profileImage.url).toBeDefined();
  });
});
