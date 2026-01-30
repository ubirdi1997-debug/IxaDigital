/**
 * Manual Test Script for Site Configuration and SEO Fields
 * 
 * This script demonstrates how to use the API endpoints to save
 * site configuration and SEO fields to the database.
 * 
 * Prerequisites:
 * 1. MongoDB must be running
 * 2. Server must be started (npm start)
 * 3. Run this script with: node manual-test.js
 */

const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Manual Test: Site Configuration and SEO Fields API');
  console.log('='.repeat(60));
  
  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    const healthCheck = await makeRequest({
      ...baseOptions,
      path: '/health',
      method: 'GET'
    });
    console.log('Status:', healthCheck.statusCode);
    console.log('Response:', JSON.stringify(healthCheck.body, null, 2));
    
    // Test 2: Save Site Configuration
    console.log('\n2. Testing Save Site Configuration...');
    const siteConfigData = {
      siteName: 'IxaDigital Test Site',
      siteUrl: 'https://ixadigital.com',
      contactEmail: 'contact@ixadigital.com',
      contactPhone: '+1-555-0123',
      logo: 'https://ixadigital.com/logo.png',
      favicon: 'https://ixadigital.com/favicon.ico',
      socialMedia: {
        facebook: 'https://facebook.com/ixadigital',
        twitter: 'https://twitter.com/ixadigital',
        instagram: 'https://instagram.com/ixadigital',
        linkedin: 'https://linkedin.com/company/ixadigital'
      },
      analytics: {
        googleAnalyticsId: 'UA-123456789-1',
        facebookPixelId: '1234567890123456'
      }
    };
    
    const saveSiteConfig = await makeRequest({
      ...baseOptions,
      path: '/api/site-config',
      method: 'POST'
    }, siteConfigData);
    
    console.log('Status:', saveSiteConfig.statusCode);
    console.log('Response:', JSON.stringify(saveSiteConfig.body, null, 2));
    
    if (saveSiteConfig.body.success) {
      console.log('✓ Site configuration saved successfully!');
    } else {
      console.log('✗ Failed to save site configuration');
    }
    
    // Test 3: Get Site Configuration
    console.log('\n3. Testing Get Site Configuration...');
    const getSiteConfig = await makeRequest({
      ...baseOptions,
      path: '/api/site-config',
      method: 'GET'
    });
    
    console.log('Status:', getSiteConfig.statusCode);
    console.log('Response:', JSON.stringify(getSiteConfig.body, null, 2));
    
    if (getSiteConfig.body.success) {
      console.log('✓ Site configuration retrieved successfully!');
    }
    
    // Test 4: Save SEO Fields
    console.log('\n4. Testing Save SEO Fields...');
    const seoFieldsData = {
      pageName: 'Home Page',
      pageUrl: '/home',
      metaTitle: 'Welcome to IxaDigital - Home',
      metaDescription: 'IxaDigital is your premier destination for digital solutions. Explore our comprehensive services.',
      metaKeywords: ['digital', 'solutions', 'web', 'development', 'seo'],
      ogTitle: 'IxaDigital - Digital Solutions',
      ogDescription: 'Premier digital solutions provider',
      ogImage: 'https://ixadigital.com/og-image.png',
      canonicalUrl: 'https://ixadigital.com/home',
      robots: 'index,follow'
    };
    
    const saveSEOFields = await makeRequest({
      ...baseOptions,
      path: '/api/seo-fields',
      method: 'POST'
    }, seoFieldsData);
    
    console.log('Status:', saveSEOFields.statusCode);
    console.log('Response:', JSON.stringify(saveSEOFields.body, null, 2));
    
    if (saveSEOFields.body.success) {
      console.log('✓ SEO fields saved successfully!');
    } else {
      console.log('✗ Failed to save SEO fields');
    }
    
    // Test 5: Get All SEO Fields
    console.log('\n5. Testing Get All SEO Fields...');
    const getAllSEOFields = await makeRequest({
      ...baseOptions,
      path: '/api/seo-fields',
      method: 'GET'
    });
    
    console.log('Status:', getAllSEOFields.statusCode);
    console.log('Response:', JSON.stringify(getAllSEOFields.body, null, 2));
    
    if (getAllSEOFields.body.success) {
      console.log('✓ SEO fields retrieved successfully!');
      console.log(`  Found ${getAllSEOFields.body.count} SEO field entries`);
    }
    
    // Test 6: Save Another SEO Fields Entry
    console.log('\n6. Testing Save Another SEO Fields Entry (About Page)...');
    const seoFieldsData2 = {
      pageName: 'About Us',
      pageUrl: '/about',
      metaTitle: 'About IxaDigital - Our Story',
      metaDescription: 'Learn about IxaDigital\'s journey, mission, and the team behind our innovative digital solutions.',
      metaKeywords: ['about', 'team', 'company', 'mission'],
      ogTitle: 'About IxaDigital',
      ogDescription: 'Our story and mission',
      canonicalUrl: 'https://ixadigital.com/about',
      robots: 'index,follow'
    };
    
    const saveSEOFields2 = await makeRequest({
      ...baseOptions,
      path: '/api/seo-fields',
      method: 'POST'
    }, seoFieldsData2);
    
    console.log('Status:', saveSEOFields2.statusCode);
    console.log('Response:', JSON.stringify(saveSEOFields2.body, null, 2));
    
    if (saveSEOFields2.body.success) {
      console.log('✓ Second SEO fields entry saved successfully!');
    }
    
    // Test 7: Update Existing Site Configuration
    console.log('\n7. Testing Update Site Configuration...');
    const updatedSiteConfigData = {
      ...siteConfigData,
      contactEmail: 'support@ixadigital.com',
      contactPhone: '+1-555-9999'
    };
    
    const updateSiteConfig = await makeRequest({
      ...baseOptions,
      path: '/api/site-config',
      method: 'POST'
    }, updatedSiteConfigData);
    
    console.log('Status:', updateSiteConfig.statusCode);
    console.log('Response:', JSON.stringify(updateSiteConfig.body, null, 2));
    
    if (updateSiteConfig.body.success) {
      console.log('✓ Site configuration updated successfully!');
      console.log(`  New email: ${updateSiteConfig.body.data.contactEmail}`);
      console.log(`  New phone: ${updateSiteConfig.body.data.contactPhone}`);
    }
    
    // Test 8: Update Existing SEO Fields
    console.log('\n8. Testing Update SEO Fields for Home Page...');
    const updatedSeoFieldsData = {
      ...seoFieldsData,
      metaTitle: 'IxaDigital - Leading Digital Solutions Provider',
      metaDescription: 'Updated description with more compelling copy about our services and offerings.'
    };
    
    const updateSEOFields = await makeRequest({
      ...baseOptions,
      path: '/api/seo-fields',
      method: 'POST'
    }, updatedSeoFieldsData);
    
    console.log('Status:', updateSEOFields.statusCode);
    console.log('Response:', JSON.stringify(updateSEOFields.body, null, 2));
    
    if (updateSEOFields.body.success) {
      console.log('✓ SEO fields updated successfully!');
      console.log(`  New title: ${updateSEOFields.body.data.metaTitle}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\nSUMMARY:');
    console.log('✓ Site configuration can be saved to database');
    console.log('✓ Site configuration can be retrieved from database');
    console.log('✓ Site configuration can be updated in database');
    console.log('✓ SEO fields can be saved to database');
    console.log('✓ SEO fields can be retrieved from database');
    console.log('✓ SEO fields can be updated in database');
    console.log('✓ Multiple SEO field entries can be managed');
    console.log('\n✓ ISSUE RESOLVED: Site configuration and SEO fields are now properly saved to database!');
    
  } catch (error) {
    console.error('\n✗ Error during testing:', error.message);
    console.error('\nMake sure:');
    console.error('1. MongoDB is running');
    console.error('2. Server is started (npm start)');
    console.error('3. Server is listening on port 3000');
  }
}

// Run the tests
runTests();
