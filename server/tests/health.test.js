import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('should return 200 with status ok and uptime', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('should return 200 for root GET / and HEAD / (Render health check)', async () => {
    const getRes = await request(app).get('/');
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.status).toBe('ok');

    const headRes = await request(app).head('/');
    expect(headRes.status).toBe(200);
  });

  it('should return 404 for unknown route in standardized envelope', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
