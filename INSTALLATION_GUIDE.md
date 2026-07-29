# 📦 ESSMS Installation & Setup Guide

## Complete Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

This installs all required packages for the Node.js/Express backend.

### Step 2: Install Frontend Dependencies

```bash
cd ../client
npm install
```

This installs all React and related dependencies.

### Step 3: Configure Environment

Create `.env` file in `server` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/essms
DB_NAME=essms

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_SALT_ROUNDS=10
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT_MINUTES=15

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5000
```

### Step 4: Start MongoDB

**Windows (Installed):**
- Start MongoDB service from Services panel
- Or: `mongod`

**Mac (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux (systemd):**
```bash
sudo systemctl start mongod
```

**Cloud (MongoDB Atlas):**
Update `MONGODB_URI` in `.env` with your Atlas connection string.

### Step 5: Build & Run

**Option A: Run Both Together**
```bash
npm run dev
```

**Option B: Run Separately**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

### Step 6: Verify Setup

Check backend:
```bash
curl http://localhost:5000/api/v1/health
```

Expected: `{"success":true,"message":"ESSMS API is running"}`

Check frontend:
```
http://localhost:5173
```

---

## 📍 Access Points After Setup

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health

---

## 🔑 Default Credentials

After first database initialization:

```
Email: admin@essms.edu.et
Password: AdminPassword123!
```

⚠️ **IMPORTANT:** Change these immediately in production!

---

## 🧪 Verify All Components

### Backend Verification
```bash
# In server directory
npm run build  # Build TypeScript
npm start      # Run production build
```

### Frontend Verification
```bash
# In client directory
npm run build  # Build for production
npm run preview  # Preview production build
```

---

## 📝 Project Structure After Installation

```
essms/
├── server/
│   ├── node_modules/          # Backend dependencies
│   ├── dist/                  # Compiled JavaScript
│   ├── src/
│   │   ├── models/            # Database schemas
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   └── config/            # Configuration
│   ├── .env                   # Environment variables
│   └── package.json
│
├── client/
│   ├── node_modules/          # Frontend dependencies
│   ├── dist/                  # Production build
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # State management
│   │   └── services/          # API client
│   └── package.json
│
└── package.json               # Root configuration
```

---

## ✅ System Check

After installation, verify all components:

| Component | Check | Status |
|-----------|-------|--------|
| Node.js | `node --version` | ✅ |
| npm | `npm --version` | ✅ |
| MongoDB | `mongosh` | ✅ |
| Server Dependencies | `ls server/node_modules` | ✅ |
| Client Dependencies | `ls client/node_modules` | ✅ |
| Backend Build | `cd server && npm run build` | ✅ |
| Frontend Build | `cd client && npm run build` | ✅ |
| Backend Running | `curl http://localhost:5000/api/v1/health` | ✅ |
| Frontend Running | `curl http://localhost:5173` | ✅ |

---

## 🆘 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Verify MongoDB is running
2. Check MONGODB_URI in .env
3. Ensure MongoDB service is started

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find and kill process on port 5000
npx kill-port 5000
```

### Module Not Found
```
Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Error
```bash
# Clear build cache
rm -rf dist
npm run build
```

### npm ci (Install Exact Versions)
```bash
# Use for production
npm ci
```

---

## 🚀 Quick Commands

```bash
# Install everything
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Run development
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📚 Next Steps

1. ✅ Install dependencies
2.