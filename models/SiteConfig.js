const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  siteName: {
    type: String,
    required: true,
    trim: true
  },
  siteUrl: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  favicon: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  analytics: {
    googleAnalyticsId: String,
    facebookPixelId: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
