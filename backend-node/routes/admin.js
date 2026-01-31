const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { databases } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'ixa-digital-jwt-secret-2026';

// Middleware to verify admin token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    await databases.admins.read();
    // Support login with email or username
    const admin = databases.admins.data.users.find(
      u => u.username === username || u.email === username
    );
    
    if (!admin) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }
    
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ username: admin.username, id: admin.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { username: admin.username, id: admin.id }
    });
  } catch (error) {
    res.status(500).json({ detail: 'Login failed' });
  }
});

// Get dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    await databases.submissions.read();
    await databases.tickets.read();
    
    const submissions = databases.submissions.data.submissions;
    const tickets = databases.tickets.data.tickets;
    
    res.json({
      success: true,
      stats: {
        submissions: {
          total: submissions.length,
          new: submissions.filter(s => s.status === 'new').length,
          read: submissions.filter(s => s.status === 'read').length,
          contacted: submissions.filter(s => s.status === 'contacted').length
        },
        tickets: {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'open').length,
          in_progress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'resolved').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch statistics' });
  }
});

// Get all submissions
router.get('/submissions', verifyToken, async (req, res) => {
  try {
    await databases.submissions.read();
    let submissions = databases.submissions.data.submissions;
    
    if (req.query.status) {
      submissions = submissions.filter(s => s.status === req.query.status);
    }
    
    // Sort by newest first
    submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch submissions' });
  }
});

// Update submission status
router.patch('/submissions/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    await databases.submissions.read();
    const submission = databases.submissions.data.submissions.find(s => s.id === req.params.id);
    
    if (!submission) {
      return res.status(404).json({ detail: 'Submission not found' });
    }
    
    submission.status = status;
    await databases.submissions.write();
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update status' });
  }
});

// Delete submission
router.delete('/submissions/:id', verifyToken, async (req, res) => {
  try {
    await databases.submissions.read();
    databases.submissions.data.submissions = databases.submissions.data.submissions.filter(
      s => s.id !== req.params.id
    );
    await databases.submissions.write();
    
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete submission' });
  }
});

// Get all tickets
router.get('/tickets', verifyToken, async (req, res) => {
  try {
    await databases.tickets.read();
    let tickets = databases.tickets.data.tickets;
    
    if (req.query.status) {
      tickets = tickets.filter(t => t.status === req.query.status);
    }
    
    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/tickets/:id', verifyToken, async (req, res) => {
  try {
    await databases.tickets.read();
    const ticket = databases.tickets.data.tickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch ticket' });
  }
});

// Reply to ticket (admin)
router.post('/tickets/:id/reply', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    await databases.tickets.read();
    const ticket = databases.tickets.data.tickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    ticket.replies.push({
      author: req.admin.username,
      message,
      is_admin: true,
      created_at: new Date().toISOString()
    });
    
    ticket.updated_at = new Date().toISOString();
    await databases.tickets.write();
    
    res.json({ success: true, message: 'Reply added successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to add reply' });
  }
});

// Update ticket status/priority
router.patch('/tickets/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    await databases.tickets.read();
    const ticket = databases.tickets.data.tickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ detail: 'Ticket not found' });
    }
    
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    ticket.updated_at = new Date().toISOString();
    
    await databases.tickets.write();
    
    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update ticket' });
  }
});

// Delete ticket
router.delete('/tickets/:id', verifyToken, async (req, res) => {
  try {
    await databases.tickets.read();
    databases.tickets.data.tickets = databases.tickets.data.tickets.filter(
      t => t.id !== req.params.id
    );
    await databases.tickets.write();
    
    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete ticket' });
  }
});

// Get settings
router.get('/settings', verifyToken, async (req, res) => {
  try {
    await databases.settings.read();
    // Map database keys to frontend expected keys
    const settings = {
      email_settings: databases.settings.data.email,
      seo_settings: databases.settings.data.seo,
      branding: databases.settings.data.branding,
      recaptcha_settings: databases.settings.data.recaptcha
    };
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const { email_settings, seo_settings, branding, recaptcha_settings } = req.body;
    
    await databases.settings.read();
    
    // Map frontend keys to database keys and update
    if (email_settings) {
      databases.settings.data.email = email_settings;
    }
    if (seo_settings) {
      databases.settings.data.seo = seo_settings;
    }
    if (branding) {
      databases.settings.data.branding = branding;
    }
    if (recaptcha_settings) {
      databases.settings.data.recaptcha = recaptcha_settings;
    }
    
    await databases.settings.write();
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ detail: 'Failed to update settings' });
  }
});

// Test email
router.post('/settings/test-email', verifyToken, async (req, res) => {
  try {
    await databases.settings.read();
    const emailSettings = databases.settings.data.email;
    
    if (!emailSettings.enabled || !emailSettings.smtp_user) {
      return res.status(400).json({ detail: 'Email not configured' });
    }
    
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: false,
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password
      }
    });
    
    await transporter.sendMail({
      from: `"${emailSettings.from_name}" <${emailSettings.from_email}>`,
      to: emailSettings.from_email,
      subject: 'IXA Digital - Test Email',
      html: '<h2>Test Email</h2><p>Your email settings are working correctly!</p>'
    });
    
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Upload logo
router.post('/upload-logo', verifyToken, require('./upload').uploadLogo);

// Upload favicon
router.post('/upload-favicon', verifyToken, require('./upload').uploadFavicon);

// Get page content (admin)
router.get('/content/:page', verifyToken, async (req, res) => {
  try {
    await databases.content.read();
    const content = databases.content.data[req.params.page];
    
    res.json({ success: true, content: content || null });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch content' });
  }
});

// Update page content
router.put('/content', verifyToken, async (req, res) => {
  try {
    const { page, hero, about, cta_section, footer, services, menu_items, process_steps, industries } = req.body;
    
    console.log('📝 Content Update Request:', {
      page,
      hasHero: !!hero,
      hasAbout: !!about,
      hasCTA: !!cta_section,
      hasFooter: !!footer
    });
    
    await databases.content.read();
    
    // Initialize page if it doesn't exist
    if (!databases.content.data[page]) {
      databases.content.data[page] = {};
      console.log(`✓ Initialized new page: ${page}`);
    }
    
    // Update all provided fields
    if (hero) {
      databases.content.data[page].hero = hero;
      console.log('✓ Updated hero:', hero);
    }
    if (about) {
      databases.content.data[page].about = about;
      console.log('✓ Updated about:', about);
    }
    if (cta_section) {
      databases.content.data[page].cta_section = cta_section;
      console.log('✓ Updated cta_section:', cta_section);
    }
    if (footer) {
      databases.content.data[page].footer = footer;
      console.log('✓ Updated footer:', footer);
    }
    if (services) {
      databases.content.data[page].services = services;
      console.log('✓ Updated services');
    }
    if (menu_items) {
      databases.content.data[page].menu_items = menu_items;
      console.log('✓ Updated menu_items');
    }
    if (process_steps) {
      databases.content.data[page].process_steps = process_steps;
      console.log('✓ Updated process_steps');
    }
    if (industries) {
      databases.content.data[page].industries = industries;
      console.log('✓ Updated industries');
    }
    
    // Write to database file
    await databases.content.write();
    console.log('✓ Content saved to database');
    
    res.json({ success: true, message: 'Content updated successfully' });
  } catch (error) {
    console.error('❌ Content update error:', error);
    res.status(500).json({ detail: 'Failed to update content: ' + error.message });
  }
});

module.exports = router;
