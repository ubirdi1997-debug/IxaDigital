const express = require('express');
const router = express.Router();
const seoFieldsController = require('../controllers/seoFieldsController');

// GET all SEO fields
router.get('/', seoFieldsController.getAllSEOFields);

// GET SEO fields by page URL
router.get('/:pageUrl', seoFieldsController.getSEOFieldsByUrl);

// POST/PUT SEO fields (create or update)
router.post('/', seoFieldsController.saveSEOFields);
router.put('/', seoFieldsController.saveSEOFields);

// DELETE SEO fields
router.delete('/:id', seoFieldsController.deleteSEOFields);

module.exports = router;
