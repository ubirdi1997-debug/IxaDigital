const SEOFields = require('../models/SEOFields');

// Get all SEO fields
exports.getAllSEOFields = async (req, res) => {
  try {
    const seoFields = await SEOFields.find();
    
    res.status(200).json({
      success: true,
      count: seoFields.length,
      data: seoFields
    });
  } catch (error) {
    console.error('Error fetching SEO fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SEO fields',
      error: error.message
    });
  }
};

// Get SEO fields by page URL
exports.getSEOFieldsByUrl = async (req, res) => {
  try {
    const { pageUrl } = req.params;
    
    const seoFields = await SEOFields.findOne({ pageUrl });
    
    if (!seoFields) {
      return res.status(404).json({
        success: false,
        message: 'SEO fields not found for this page'
      });
    }
    
    res.status(200).json({
      success: true,
      data: seoFields
    });
  } catch (error) {
    console.error('Error fetching SEO fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SEO fields',
      error: error.message
    });
  }
};

// Create or update SEO fields
exports.saveSEOFields = async (req, res) => {
  try {
    const seoData = req.body;
    
    // Validate required fields
    if (!seoData.pageName || !seoData.pageUrl || !seoData.metaTitle || !seoData.metaDescription) {
      return res.status(400).json({
        success: false,
        message: 'Page name, page URL, meta title, and meta description are required'
      });
    }
    
    // Check if SEO fields exist for this page URL
    let seoFields = await SEOFields.findOne({ pageUrl: seoData.pageUrl });
    
    if (seoFields) {
      // Update existing SEO fields
      Object.assign(seoFields, seoData);
      await seoFields.save();
    } else {
      // Create new SEO fields
      seoFields = new SEOFields(seoData);
      await seoFields.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'SEO fields saved successfully',
      data: seoFields
    });
  } catch (error) {
    console.error('Error saving SEO fields:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'SEO fields already exist for this page URL'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error saving SEO fields',
      error: error.message
    });
  }
};

// Delete SEO fields
exports.deleteSEOFields = async (req, res) => {
  try {
    const { id } = req.params;
    
    const seoFields = await SEOFields.findById(id);
    
    if (!seoFields) {
      return res.status(404).json({
        success: false,
        message: 'SEO fields not found'
      });
    }
    
    await seoFields.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'SEO fields deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SEO fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting SEO fields',
      error: error.message
    });
  }
};
