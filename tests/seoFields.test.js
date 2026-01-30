const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const SEOFields = require('../models/SEOFields');

// Use test database
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/ixadigital_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await SEOFields.deleteMany({});
});

describe('SEO Fields API', () => {
  describe('POST /api/seo-fields', () => {
    it('should create new SEO fields', async () => {
      const seoData = {
        pageName: 'Home Page',
        pageUrl: '/home',
        metaTitle: 'Home - Test Site',
        metaDescription: 'Welcome to our test site home page',
        metaKeywords: ['home', 'test', 'welcome'],
        ogTitle: 'Home - Test Site',
        ogDescription: 'Welcome to our test site',
        robots: 'index,follow'
      };

      const response = await request(app)
        .post('/api/seo-fields')
        .send(seoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SEO fields saved successfully');
      expect(response.body.data.pageName).toBe(seoData.pageName);
      expect(response.body.data.metaTitle).toBe(seoData.metaTitle);
    });

    it('should update existing SEO fields for same page URL', async () => {
      // Create initial SEO fields
      const initialSEO = new SEOFields({
        pageName: 'Initial Home',
        pageUrl: '/home',
        metaTitle: 'Initial Title',
        metaDescription: 'Initial description'
      });
      await initialSEO.save();

      // Update SEO fields
      const updatedData = {
        pageName: 'Updated Home',
        pageUrl: '/home',
        metaTitle: 'Updated Title',
        metaDescription: 'Updated description'
      };

      const response = await request(app)
        .post('/api/seo-fields')
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metaTitle).toBe(updatedData.metaTitle);

      // Verify only one SEO field exists for this URL
      const seoCount = await SEOFields.countDocuments({ pageUrl: '/home' });
      expect(seoCount).toBe(1);
    });

    it('should return error for missing required fields', async () => {
      const invalidData = {
        pageName: 'Test Page'
      };

      const response = await request(app)
        .post('/api/seo-fields')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/seo-fields', () => {
    it('should get all SEO fields', async () => {
      // Create multiple SEO fields
      const seo1 = new SEOFields({
        pageName: 'Home',
        pageUrl: '/home',
        metaTitle: 'Home Title',
        metaDescription: 'Home description'
      });
      const seo2 = new SEOFields({
        pageName: 'About',
        pageUrl: '/about',
        metaTitle: 'About Title',
        metaDescription: 'About description'
      });
      await seo1.save();
      await seo2.save();

      const response = await request(app)
        .get('/api/seo-fields')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/seo-fields/:pageUrl', () => {
    it('should get SEO fields by page URL', async () => {
      // Create SEO field
      const seo = new SEOFields({
        pageName: 'Home',
        pageUrl: '/home',
        metaTitle: 'Home Title',
        metaDescription: 'Home description'
      });
      await seo.save();

      const response = await request(app)
        .get('/api/seo-fields/%2Fhome') // URL encoded /home
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pageName).toBe('Home');
    });

    it('should return 404 for non-existent page URL', async () => {
      const response = await request(app)
        .get('/api/seo-fields/%2Fnonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/seo-fields/:id', () => {
    it('should delete SEO fields', async () => {
      // Create SEO field
      const seo = new SEOFields({
        pageName: 'Home',
        pageUrl: '/home',
        metaTitle: 'Home Title',
        metaDescription: 'Home description'
      });
      await seo.save();

      const response = await request(app)
        .delete(`/api/seo-fields/${seo._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify SEO field is deleted
      const seoCount = await SEOFields.countDocuments();
      expect(seoCount).toBe(0);
    });
  });
});
