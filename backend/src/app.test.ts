import request from 'supertest';
import app from './app';

describe('GET /api/health', () => {
  it('should return API health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('uptime');

    expect(typeof res.body.data.uptime).toBe('number');
  });
});