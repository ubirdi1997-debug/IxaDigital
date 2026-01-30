#!/bin/bash

################################################################################
# IXA Digital - Automated Setup Script for CloudPanel
# Description: Automates deployment of IXA Digital website on CloudPanel
# Usage: sudo ./setup.sh
# Requirements: Ubuntu 20.04/22.04, CloudPanel installed
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="ixadigital.com"
APP_DIR="/home/ixadigital/htdocs/$DOMAIN"
ADMIN_USER="admin@ixadigital.com"
ADMIN_PASS="admin123"
BACKEND_PORT=3030

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print section headers
print_header() {
    echo ""
    print_message "$BLUE" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_message "$BLUE" "  $1"
    print_message "$BLUE" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_message "$RED" "This script must be run as root (use sudo)"
   exit 1
fi

print_header "IXA Digital Automated Setup"
print_message "$GREEN" "Starting deployment for $DOMAIN..."
sleep 2

################################################################################
# 1. System Update and Prerequisites
################################################################################

print_header "Step 1: Updating System and Installing Prerequisites"

apt update
apt upgrade -y
apt install -y curl wget git build-essential software-properties-common \
  supervisor nginx openssl gnupg2

print_message "$GREEN" "✓ System updated successfully"

################################################################################
# 2. Install Node.js 18.x
################################################################################

print_header "Step 2: Installing Node.js 18.x"

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    npm install -g yarn pm2
    print_message "$GREEN" "✓ Node.js $(node -v) installed"
else
    print_message "$YELLOW" "⚠ Node.js already installed: $(node -v)"
fi

################################################################################
# 3. Create Application Directory
################################################################################

print_header "Step 3: Setting Up Application Directory"

if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    print_message "$GREEN" "✓ Created application directory: $APP_DIR"
else
    print_message "$YELLOW" "⚠ Directory already exists: $APP_DIR"
fi

cd "$APP_DIR"

################################################################################
# 4. Setup Backend (Node.js + Express + LowDB)
################################################################################

print_header "Step 4: Setting Up Backend"

# Check if backend-node directory exists
if [ ! -d "$APP_DIR/backend-node" ]; then
    print_message "$RED" "✗ Backend directory not found. Please upload your code first."
    print_message "$YELLOW" "Upload your code to: $APP_DIR"
    exit 1
fi

cd "$APP_DIR/backend-node"

# Install Node.js dependencies
print_message "$BLUE" "Installing Node.js dependencies..."
yarn install

# Set JWT secret
JWT_SECRET="65e93174cca7301b2b5af7f2f8d0e3ea84a731d00812e92746a06dd9a0231de194f4a146eb30c015113eaf87f9a59dd5c9a38451f5d3a01948f382c16efb48d4"

# Create backend .env file
print_message "$BLUE" "Creating backend environment configuration..."
cat > .env << EOF
# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=production

# Security
JWT_SECRET=$JWT_SECRET

# URLs
FRONTEND_URL=https://$DOMAIN

# Optional - Configure these in admin panel later
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EOF

chmod 600 .env
print_message "$GREEN" "✓ Backend configured successfully"

# Create required directories
mkdir -p database
mkdir -p uploads/logos
mkdir -p uploads/favicons
chmod 755 uploads
chmod 755 uploads/logos
chmod 755 uploads/favicons

################################################################################
# 5. Setup Frontend
################################################################################

print_header "Step 5: Setting Up Frontend"

cd "$APP_DIR/frontend"

# Install dependencies
print_message "$BLUE" "Installing Node.js dependencies..."
yarn install

# Create frontend .env file
print_message "$BLUE" "Creating frontend environment configuration..."
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:$BACKEND_PORT
REACT_APP_SITE_NAME=IXA Digital
EOF

# Build production
print_message "$BLUE" "Building frontend for production..."
yarn build

print_message "$GREEN" "✓ Frontend built successfully"

################################################################################
# 6. Configure PM2 for Backend
################################################################################

print_header "Step 6: Configuring PM2 for Backend"

cd "$APP_DIR/backend-node"

# Start backend with PM2
print_message "$BLUE" "Starting backend with PM2..."
pm2 delete ixadigital-backend 2>/dev/null || true
pm2 start server.js --name ixadigital-backend --watch --max-memory-restart 500M
pm2 save
pm2 startup

print_message "$GREEN" "✓ Backend started with PM2"

################################################################################
# 7. Configure Nginx
################################################################################

print_header "Step 7: Configuring Nginx"

# Create Nginx configuration
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONFIG'
# Backend API (Node.js Express on port 3030)
upstream backend_api {
    server 127.0.0.1:3030;
}

server {
    listen 80;
    listen [::]:80;
    server_name ixadigital.com www.ixadigital.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ixadigital.com www.ixadigital.com;

    # SSL Configuration (update paths after installing certificate)
    ssl_certificate /etc/letsencrypt/live/ixadigital.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ixadigital.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory for frontend build
    root /home/ixadigital/htdocs/ixadigital.com/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API routes (proxy to Express backend)
    location /api/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads from backend
    location /uploads/ {
        alias /home/ixadigital/htdocs/ixadigital.com/backend-node/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React app (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/ixadigital_access.log;
    error_log /var/log/nginx/ixadigital_error.log;
}
NGINX_CONFIG

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t && systemctl reload nginx

print_message "$GREEN" "✓ Nginx configured successfully"

################################################################################
# 8. Configure PM2 Startup
################################################################################

print_header "Step 8: Configuring PM2 Startup"

# Save PM2 process list and configure startup
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

print_message "$GREEN" "✓ PM2 startup configured"

################################################################################
# 9. SSL Certificate Setup
################################################################################

print_header "Step 9: SSL Certificate Setup"

print_message "$YELLOW" "⚠ SSL Certificate Setup Required"
print_message "$BLUE" "To install SSL certificate, run:"
echo ""
print_message "$GREEN" "  sudo apt install certbot python3-certbot-nginx"
print_message "$GREEN" "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
print_message "$YELLOW" "Make sure DNS is pointing to this server before running certbot!"

################################################################################
# 10. Create Helpful Scripts
################################################################################

print_header "Step 10: Creating Helper Scripts"

# Create restart script
cat > "$APP_DIR/restart.sh" << 'EOF'
#!/bin/bash
echo "Restarting IXA Digital services..."
pm2 restart ixadigital-backend
sudo systemctl reload nginx
echo "✓ Services restarted"
EOF

# Create logs viewer script
cat > "$APP_DIR/view-logs.sh" << 'EOF'
#!/bin/bash
echo "Viewing backend logs... (Press Ctrl+C to exit)"
pm2 logs ixadigital-backend
EOF

# Create backup script
cat > "$APP_DIR/backup.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ixadigital/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating database backup..."
tar -czf "$BACKUP_DIR/database_$TIMESTAMP.tar.gz" \
  /home/ixadigital/htdocs/ixadigital.com/backend-node/database/

echo "Creating uploads backup..."
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" \
  /home/ixadigital/htdocs/ixadigital.com/backend-node/uploads/

echo "✓ Backup completed: $BACKUP_DIR"
ls -lh $BACKUP_DIR
EOF

chmod +x "$APP_DIR"/*.sh

print_message "$GREEN" "✓ Helper scripts created:"
print_message "$BLUE" "  - $APP_DIR/restart.sh (Restart services)"
print_message "$BLUE" "  - $APP_DIR/view-logs.sh (View logs)"
print_message "$BLUE" "  - $APP_DIR/backup.sh (Backup database and files)"

################################################################################
# 11. Create Automated Backup Cron
################################################################################

print_header "Step 11: Setting Up Automated Backups"

# Add cron job for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> /var/log/ixadigital_backup.log 2>&1") | crontab -

print_message "$GREEN" "✓ Daily backups scheduled at 2:00 AM"

################################################################################
# 12. Firewall Configuration
################################################################################

print_header "Step 12: Configuring Firewall"

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8443/tcp  # CloudPanel
    ufw --force enable
    print_message "$GREEN" "✓ Firewall configured"
else
    print_message "$YELLOW" "⚠ UFW not installed, skipping firewall configuration"
fi

################################################################################
# 13. Final Checks
################################################################################

print_header "Step 13: Running Final Checks"

print_message "$BLUE" "Checking services..."

# Check PM2 Backend
if pm2 list | grep -q "ixadigital-backend.*online"; then
    print_message "$GREEN" "✓ Backend is running"
else
    print_message "$RED" "✗ Backend is not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    print_message "$GREEN" "✓ Nginx is running"
else
    print_message "$RED" "✗ Nginx is not running"
fi

################################################################################
# INSTALLATION COMPLETE
################################################################################

print_header "✅ Installation Complete!"

cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    IXA DIGITAL SETUP SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Application Directory: $APP_DIR

🔐 Admin Credentials:
   Email: $ADMIN_USER
   Password: $ADMIN_PASS
   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY in the admin panel!

💾 Database:
   Type: LowDB (JSON files)
   Location: $APP_DIR/backend-node/database/
   Files: admins.json, submissions.json, tickets.json, settings.json, content.json

🌐 URLs:
   Website: http://$DOMAIN (HTTPS after SSL setup)
   Admin Panel: http://$DOMAIN/admin/login
   API: http://$DOMAIN/api/

📝 Useful Commands:
   Restart services:    $APP_DIR/restart.sh
   View logs:           $APP_DIR/view-logs.sh (or: pm2 logs)
   Backup:              $APP_DIR/backup.sh
   Check status:        pm2 status
   PM2 monitoring:      pm2 monit

📋 Next Steps:

1. Install SSL Certificate:
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

2. Login to Admin Panel:
   https://$DOMAIN/admin/login
   
3. Configure Settings:
   - Email notifications (Gmail SMTP)
   - Google reCAPTCHA
   - SEO settings
   - Upload logo and favicon
   - Customize content

4. IMPORTANT: Change admin password immediately!

5. Test the website:
   - Homepage
   - Contact form
   - Support ticket
   - Admin panel

📚 Documentation:
   Full guide: $APP_DIR/DOCUMENTATION.md
   
🔒 Security Checklist:
   [ ] Change admin password
   [ ] Install SSL certificate
   [ ] Configure firewall
   [ ] Setup reCAPTCHA
   [ ] Enable email notifications
   [ ] Test all forms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Your IXA Digital website is ready!

For support, check: $APP_DIR/DOCUMENTATION.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

# Save summary to file
cat > "$APP_DIR/SETUP_SUMMARY.txt" << EOF
IXA Digital Setup Summary
Generated: $(date)

Admin Credentials:
Email: $ADMIN_USER
Password: $ADMIN_PASS

Database:
Type: LowDB (JSON files)
Location: $APP_DIR/backend-node/database/

Backend:
Port: $BACKEND_PORT
Process Manager: PM2

Application: $APP_DIR
Domain: $DOMAIN

Next Steps: See DOCUMENTATION.md
EOF

chmod 600 "$APP_DIR/SETUP_SUMMARY.txt"

print_message "$GREEN" "Setup summary saved to: $APP_DIR/SETUP_SUMMARY.txt"
print_message "$YELLOW" "\n⚠️  Remember to setup SSL certificate for HTTPS!"

exit 0