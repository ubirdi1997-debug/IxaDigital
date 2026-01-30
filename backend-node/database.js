const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

// Database file paths
const DB_DIR = path.join(__dirname, 'database');
const dbFiles = {
  admins: path.join(DB_DIR, 'admins.json'),
  submissions: path.join(DB_DIR, 'submissions.json'),
  tickets: path.join(DB_DIR, 'tickets.json'),
  settings: path.join(DB_DIR, 'settings.json'),
  content: path.join(DB_DIR, 'content.json')
};

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize databases
const databases = {};

// Helper to initialize database with default data
async function initDB(name, defaultData) {
  const adapter = new JSONFile(dbFiles[name]);
  const db = new Low(adapter, defaultData);
  await db.read();
  db.data ||= defaultData;
  await db.write();
  return db;
}

// Initialize all databases
async function initAllDatabases() {
  try {
    // Admins database
    databases.admins = await initDB('admins', { users: [] });
    
    // Submissions database
    databases.submissions = await initDB('submissions', { submissions: [] });
    
    // Tickets database
    databases.tickets = await initDB('tickets', { tickets: [], counter: 0 });
    
    // Settings database
    databases.settings = await initDB('settings', {
      email: {
        enabled: false,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        from_email: '',
        from_name: 'IXA Digital',
        notification_recipients: []
      },
      seo: {
        site_title: 'IXA Digital - Results-Driven SEO, Marketing & Development',
        site_description: 'Leading digital agency offering SEO, digital marketing, web development, and app development services.',
        keywords: 'SEO services, digital marketing, web development, app development, digital agency',
        google_analytics_id: '',
        google_site_verification: '',
        og_image: '',
        twitter_handle: ''
      },
      branding: {
        logo_url: 'https://customer-assets.emergentagent.com/job_a08c0b50-0e68-4792-b6a6-4a15ac002d5c/artifacts/3mcpq5px_Logo.jpeg',
        favicon_url: '',
        company_name: 'IXA Digital'
      },
      recaptcha: {
        enabled: false,
        site_key: '',
        secret_key: ''
      }
    });
    
    // Content database
    databases.content = await initDB('content', {
      homepage: {
        hero: {
          headline: 'Results-Driven SEO, Marketing & Development Solutions',
          subheadline: 'Helping brands grow through SEO, digital marketing, web & app development',
          cta_primary: 'Get a Free Consultation',
          cta_secondary: 'View Our Services',
          stats: [
            { value: '500+', label: 'Projects Delivered' },
            { value: '98%', label: 'Client Satisfaction' },
            { value: '5+', label: 'Years Experience' }
          ]
        },
        about: {
          title: 'About IXA Digital',
          subtitle: 'Your long-term digital growth partner',
          headline: 'Driving Measurable Growth Through Digital Excellence',
          paragraphs: [
            'At IXA Digital, we don\'t just deliver projects—we deliver results.',
            'From startups to enterprises, we partner with businesses to create impactful digital solutions.',
            'Whether you need to dominate search rankings or develop cutting-edge applications—we\'re your growth partner for the long haul.'
          ]
        },
        cta_section: {
          headline: 'Let\'s Build Your Digital Growth Engine',
          description: 'Ready to scale your business with data-driven strategies and cutting-edge solutions?',
          button_text: 'Start Your Project'
        },
        footer: {
          company_description: 'Results-driven digital growth partner delivering SEO, marketing, web & app development solutions.',
          social_links: {
            facebook: '#',
            twitter: '#',
            linkedin: '#',
            instagram: '#'
          }
        }
      }
    });

    console.log('✓ All databases initialized');
    
    // Create or update default admin using env (fallbacks are safe defaults)
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ixadigital.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const existingAdmin = databases.admins.data.users.find(
      (u) => u.email === adminEmail || u.username === adminEmail
    );

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      databases.admins.data.users.push({
        id: generateId(),
        email: adminEmail,
        username: adminEmail,
        password: hashedPassword,
        created_at: new Date().toISOString()
      });
      await databases.admins.write();
      console.log(`✓ Default admin user created (${adminEmail} / provided password)`);
    } else if (process.env.ADMIN_PASSWORD) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.updated_at = new Date().toISOString();
      await databases.admins.write();
      console.log(`✓ Admin password updated for ${adminEmail}`);
    }
    
    return databases;
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    throw error;
  }
}

// Helper functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateTicketNumber(counter) {
  return `TKT-${String(counter + 1).padStart(6, '0')}`;
}

// Export
module.exports = {
  initAllDatabases,
  databases,
  generateId,
  generateTicketNumber
};
