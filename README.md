# IxaDigital - Site Configuration & SEO Management API

A Node.js/Express API server for managing site configuration and SEO fields with MongoDB database persistence.

## Problem Solved

This application addresses the issue where site configuration and SEO fields were not being saved to the database. It provides a complete RESTful API with proper database models, controllers, and validation to ensure data persistence.

## Features

- **Site Configuration Management**: Save and retrieve site-wide settings including site name, URL, contact information, social media links, and analytics IDs
- **SEO Fields Management**: Manage SEO metadata for individual pages including meta titles, descriptions, Open Graph tags, and robots directives
- **Database Persistence**: All data is properly saved to MongoDB with validation
- **RESTful API**: Clean REST endpoints for CRUD operations
- **Error Handling**: Comprehensive error handling and validation
- **Tests**: Full test coverage using Jest and Supertest

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ubirdi1997-debug/IxaDigital.git
cd IxaDigital
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/ixadigital
PORT=3000
NODE_ENV=development
```

5. Make sure MongoDB is running on your system

## Usage

### Start the server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Site Configuration

#### Get Site Configuration
```
GET /api/site-config
```

#### Save/Update Site Configuration
```
POST /api/site-config
PUT /api/site-config

Body:
{
  "siteName": "My Site",
  "siteUrl": "https://mysite.com",
  "contactEmail": "contact@mysite.com",
  "contactPhone": "+1234567890",
  "logo": "https://mysite.com/logo.png",
  "favicon": "https://mysite.com/favicon.ico",
  "socialMedia": {
    "facebook": "https://facebook.com/mysite",
    "twitter": "https://twitter.com/mysite",
    "instagram": "https://instagram.com/mysite",
    "linkedin": "https://linkedin.com/company/mysite"
  },
  "analytics": {
    "googleAnalyticsId": "UA-XXXXXXXXX-X",
    "facebookPixelId": "XXXXXXXXXXXXXXXXX"
  }
}
```

#### Delete Site Configuration
```
DELETE /api/site-config
```

### SEO Fields

#### Get All SEO Fields
```
GET /api/seo-fields
```

#### Get SEO Fields by Page URL
```
GET /api/seo-fields/:pageUrl
```

#### Save/Update SEO Fields
```
POST /api/seo-fields
PUT /api/seo-fields

Body:
{
  "pageName": "Home Page",
  "pageUrl": "/home",
  "metaTitle": "Welcome to My Site - Home",
  "metaDescription": "This is the home page of my site with great content",
  "metaKeywords": ["home", "welcome", "site"],
  "ogTitle": "Welcome to My Site",
  "ogDescription": "This is the home page",
  "ogImage": "https://mysite.com/og-image.png",
  "canonicalUrl": "https://mysite.com/home",
  "robots": "index,follow"
}
```

#### Delete SEO Fields
```
DELETE /api/seo-fields/:id
```

## Testing

Run tests:
```bash
npm test
```

This will run all tests with coverage report.

## Project Structure

```
IxaDigital/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── siteConfigController.js   # Site config business logic
│   └── seoFieldsController.js    # SEO fields business logic
├── models/
│   ├── SiteConfig.js        # Site configuration schema
│   └── SEOFields.js         # SEO fields schema
├── routes/
│   ├── siteConfig.js        # Site config routes
│   └── seoFields.js         # SEO fields routes
├── tests/
│   ├── siteConfig.test.js   # Site config tests
│   └── seoFields.test.js    # SEO fields tests
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Dependencies and scripts
├── server.js                # Main application file
└── README.md                # This file
```

## Database Schema

### SiteConfig
- `siteName` (String, required): Name of the site
- `siteUrl` (String, required): URL of the site
- `contactEmail` (String): Contact email
- `contactPhone` (String): Contact phone number
- `logo` (String): URL to logo image
- `favicon` (String): URL to favicon
- `socialMedia` (Object): Social media links
- `analytics` (Object): Analytics tracking IDs
- `timestamps`: Automatic createdAt and updatedAt fields

### SEOFields
- `pageName` (String, required): Name of the page
- `pageUrl` (String, required, unique): URL of the page
- `metaTitle` (String, required, max 60): Page meta title
- `metaDescription` (String, required, max 160): Page meta description
- `metaKeywords` (Array): Array of keywords
- `ogTitle` (String): Open Graph title
- `ogDescription` (String): Open Graph description
- `ogImage` (String): Open Graph image URL
- `canonicalUrl` (String): Canonical URL for the page
- `robots` (String): Robots meta directive
- `timestamps`: Automatic createdAt and updatedAt fields

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: MongoDB ODM
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

## License

ISC