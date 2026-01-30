const mongoose = require('mongoose');

const seoFieldsSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
    trim: true
  },
  pageUrl: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  metaTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  metaKeywords: {
    type: [String],
    default: []
  },
  ogTitle: {
    type: String,
    trim: true
  },
  ogDescription: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String,
    trim: true
  },
  canonicalUrl: {
    type: String,
    trim: true
  },
  robots: {
    type: String,
    enum: ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'],
    default: 'index,follow'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SEOFields', seoFieldsSchema);
