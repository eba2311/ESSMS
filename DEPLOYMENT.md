# Ethiopian Secondary School Management System - Deployment Guide

## 🚀 Production Deployment Guide

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB 5.0+ (Local or Atlas)
- Git
- Domain name and SSL certificate (recommended)
- Server with minimum 2GB RAM, 20GB storage

### Environment Setup

#### 1. MongoDB Setup

**Option A: MongoDB Atlas (Recommended)**
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Whitelist your server's IP address

**Option B: Local MongoDB**
```bash
# Ubuntu/Debian
sudo apt
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

### Step 2: Database Setup

#### Option A: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create new cluster
3. Configure network access (add your server IP)
4. Create database user
5. Get connection string

#### Option B: Self-hosted MongoDB
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use essms
db.createUser({
  user: "essms_user",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "essms" }]
})
```

### Step 3: Application Deployment

```bash
# Clone repository
git clone <your-repository-url>
cd ethiopian-school-management-system

# Install dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Build client
cd client
npm run build
cd ..

# Create production environment file
cd server
cp .env.example .env
```

### Step 4: Environment Configuration

Edit `server/.env` with production values:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
API_BASE_URL=https://yourdomain.com/api

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/essms
DB_NAME=essms

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-256-bits
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-256-bits
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Password Security
BCRYPT_SALT_ROUNDS=12

# Session Management
SESSION_SECRET=your-super-secure-session-secret
SESSION_TIMEOUT_MINUTES=15

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Settings
DEFAULT_ADMIN_EMAIL=admin@yourschool.edu.et
DEFAULT_ADMIN_PASSWORD=SecureAdminPassword123!
SCHOOL_NAME=Your School Name
```

### Step 5: Database Initialization

Create initialization script `server/scripts/init-db.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { User } = require('../src/models');

async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create default admin user
    const adminExists = await User.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 12);
      
      await User.create({
        userId: 'ADMIN001',
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'System Admin',
        isActive: true,
        emailVerified: true,
      });
      
      console.log('Default admin user created');
    }
    
    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
```

Run initialization:
```bash
cd server
node scripts/init-db.js
```

### Step 6: PM2 Process Management

Create PM2 ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'essms-api',
      script: './server/dist/server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

Build and start:
```bash
# Build TypeScript
cd server && npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 7: Nginx Reverse Proxy

Create Nginx configuration `/etc/nginx/sites-available/essms`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (React build)
    location / {
        root /var/www/essms/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Increase body size for file uploads
        client_max_body_size 10M;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/essms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run
```

### Step 9: Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS

# Optional: Allow MongoDB port only from localhost
sudo ufw allow from 127.0.0.1 to any port 27017
```

### Step 10: Monitoring and Logging

#### Log Rotation
Create `/etc/logrotate.d/essms`:

```
/var/www/essms/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload essms-api
    endscript
}
```

#### Basic Monitoring Script
Create monitoring script `scripts/health-check.sh`:

```bash
#!/bin/bash

# Health check script
API_URL="https://yourdomain.com/api/health"
LOG_FILE="/var/log/essms-health.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response = "200" ]; then
    echo "$(date): API is healthy" >> $LOG_FILE
else
    echo "$(date): API is down (Status: $response)" >> $LOG_FILE
    # Restart application
    pm2 restart essms-api
    # Send notification (optional)
    # mail -s "ESSMS API Down" admin@yourschool.edu.et < /dev/null
fi
```

Add to crontab:
```bash
# Check every 5 minutes
*/5 * * * * /var/www/essms/scripts/health-check.sh
```

### Step 11: Backup Strategy

Create backup script `scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/essms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="essms"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mongodump --db $DB_NAME --out $BACKUP_DIR/db_$DATE

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/essms --exclude=node_modules --exclude=logs

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "db_*" -mtime +7 -exec rm -rf {} \;
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -exec rm -f {} \;

echo "Backup completed: $DATE"
```

Schedule daily backups:
```bash
# Daily backup at 2 AM
0 2 * * * /var/www/essms/scripts/backup.sh
```

## 🔒 Security Checklist

### Pre-deployment Security
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (256+ bit)
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Enable security headers in Nginx
- [ ] Configure rate limiting
- [ ] Set up log monitoring

### Post-deployment Security
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Audit user permissions
- [ ] Regular backups
- [ ] SSL certificate renewal
- [ ] Database security audit
- [ ] API endpoint testing

## 📈 Performance Optimization

### Database Optimization
- [ ] Create proper indexes
- [ ] Monitor query performance
- [ ] Set up connection pooling
- [ ] Configure database caching

### Application Optimization
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure Redis caching (optional)
- [ ] Monitor memory usage

## 🚨 Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
pm2 logs essms-api

# Check process status
pm2 status

# Restart application
pm2 restart essms-api
```

**2. Database connection issues**
```bash
# Test MongoDB connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/essms"

# Check network connectivity
telnet your-mongo-host 27017
```

**3. High memory usage**
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart essms-api
```

**4. SSL certificate issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly:** Check logs and system health
2. **Monthly:** Update dependencies and security patches
3. **Quarterly:** Performance review and optimization
4. **Annually:** Full security audit and backup restore testing

### Emergency Contacts
- System Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Security Team: [Contact Info]

---

**Deployment completed successfully! 🎉**

The Ethiopian Secondary School Management System is now ready for production use with:
- Secure authentication and authorization
- Complete academic management features
- Robust monitoring and backup systems
- Production-grade security configurations