const SiteConfig = require('../models/SiteConfig');

// Get site configuration
exports.getSiteConfig = async (req, res) => {
  try {
    // Get the first (and should be only) site config
    const config = await SiteConfig.findOne();
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Site configuration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching site configuration',
      error: error.message
    });
  }
};

// Create or update site configuration
exports.saveSiteConfig = async (req, res) => {
  try {
    const configData = req.body;
    
    // Validate required fields
    if (!configData.siteName || !configData.siteUrl) {
      return res.status(400).json({
        success: false,
        message: 'Site name and site URL are required'
      });
    }
    
    // Check if config exists
    let config = await SiteConfig.findOne();
    
    if (config) {
      // Update existing config
      Object.assign(config, configData);
      await config.save();
    } else {
      // Create new config
      config = new SiteConfig(configData);
      await config.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Site configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error saving site config:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving site configuration',
      error: error.message
    });
  }
};

// Delete site configuration
exports.deleteSiteConfig = async (req, res) => {
  try {
    const config = await SiteConfig.findOne();
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Site configuration not found'
      });
    }
    
    await config.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Site configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting site config:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting site configuration',
      error: error.message
    });
  }
};
