const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const SiteConfig = require('../models/SiteConfig');

// Use test database
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/ixadigital_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await SiteConfig.deleteMany({});
});

describe('Site Configuration API', () => {
  describe('POST /api/site-config', () => {
    it('should create a new site configuration', async () => {
      const configData = {
        siteName: 'Test Site',
        siteUrl: 'https://testsite.com',
        contactEmail: 'test@testsite.com',
        contactPhone: '+1234567890',
        socialMedia: {
          facebook: 'https://facebook.com/testsite',
          twitter: 'https://twitter.com/testsite'
        }
      };

      const response = await request(app)
        .post('/api/site-config')
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Site configuration saved successfully');
      expect(response.body.data.siteName).toBe(configData.siteName);
      expect(response.body.data.siteUrl).toBe(configData.siteUrl);
    });

    it('should update existing site configuration', async () => {
      // Create initial config
      const initialConfig = new SiteConfig({
        siteName: 'Initial Site',
        siteUrl: 'https://initialsite.com'
      });
      await initialConfig.save();

      // Update config
      const updatedData = {
        siteName: 'Updated Site',
        siteUrl: 'https://updatedsite.com',
        contactEmail: 'updated@testsite.com'
      };

      const response = await request(app)
        .post('/api/site-config')
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.siteName).toBe(updatedData.siteName);
      expect(response.body.data.contactEmail).toBe(updatedData.contactEmail);

      // Verify only one config exists
      const configCount = await SiteConfig.countDocuments();
      expect(configCount).toBe(1);
    });

    it('should return error for missing required fields', async () => {
      const invalidData = {
        contactEmail: 'test@testsite.com'
      };

      const response = await request(app)
        .post('/api/site-config')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/site-config', () => {
    it('should get site configuration', async () => {
      // Create config
      const config = new SiteConfig({
        siteName: 'Test Site',
        siteUrl: 'https://testsite.com'
      });
      await config.save();

      const response = await request(app)
        .get('/api/site-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.siteName).toBe('Test Site');
    });

    it('should return 404 if no configuration exists', async () => {
      const response = await request(app)
        .get('/api/site-config')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/site-config', () => {
    it('should delete site configuration', async () => {
      // Create config
      const config = new SiteConfig({
        siteName: 'Test Site',
        siteUrl: 'https://testsite.com'
      });
      await config.save();

      const response = await request(app)
        .delete('/api/site-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify config is deleted
      const configCount = await SiteConfig.countDocuments();
      expect(configCount).toBe(0);
    });
  });
});
