const express = require('express');
const router = express.Router();
const siteConfigController = require('../controllers/siteConfigController');

// GET site configuration
router.get('/', siteConfigController.getSiteConfig);

// POST/PUT site configuration (create or update)
router.post('/', siteConfigController.saveSiteConfig);
router.put('/', siteConfigController.saveSiteConfig);

// DELETE site configuration
router.delete('/', siteConfigController.deleteSiteConfig);

module.exports = router;
