# 🔧 Troubleshooting Guide

## Frontend Not Loading (ERR_CONNECTION_REFUSED)

### Problem: localhost:5173 refused to connect

**Causes:**
1. Frontend server not running
2. Wrong port configured
3. Port already in use
4. Browser cache issue

### Solution 1: Start Frontend Server

```batch
cd client
npm run dev
```

Wait for message: `VITE v5... ready in ... ms`

Then try: http://localhost:5173

### Solution 2: Check Port Configuration

Edit `client/vite.config.ts`:

```typescript
server: {
  port: 5173,      // ← Should be 5173
  host: 'localhost',
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
},
```

### Solution 3: Clear Browser Cache

1. Press `F12` (DevTools)
2. Right-click Refresh button
3. Select "Empty cache and hard refresh"
4. Try again: http://localhost:5173

### Solution 4: Kill Port & Restart

```batch
REM Find what's using port 5173
netstat -ano | findstr :5173

REM Kill Node processes
taskkill /F /IM node.exe

REM Restart
cd client
npm run dev
```

### Solution 5: Check Node is Running

```batch
node --version
npm --version
```

Should show: v18.x or higher

---

## Backend Not Responding (API Error)

### Problem: Backend connection failed

**Causes:**
1. Backend server not running
2. Wrong port (5000)
3. MongoDB not running
4. Port already in use

### Solution 1: Start Backend Server

```batch
cd server
npm run dev
```

Wait for: `🚀 ESSMS Server running on port 5000`

### Solution 2: Check Backend Port

Edit `server/src/config/index.ts`:

```typescript
port: process.env.PORT || 5000,  // ← Should be 5000
```

### Solution 3: MongoDB Connection

Create `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/essms
JWT_SECRET=your-secret-key
PORT=5000
```

### Solution 4: Kill Port & Restart

```batch
REM Find what's using port 5000
netstat -ano | findstr :5000

REM Kill Node processes
taskkill /F /IM node.exe

REM Restart
cd server
npm run dev
```

---

## Dependencies Not Installed

### Problem: Cannot find module 'react' / 'express'

**Solution:**

```batch
REM Clear and reinstall
cd client
rmdir /s /q node_modules
del package-lock.json
npm install

cd ../server
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## MongoDB Connection Issues

### Problem: connect ECONNREFUSED 127.0.0.1:27017

**Causes:**
1. MongoDB not installed
2. MongoDB service not running
3. Wrong connection string

### Solution 1: Install MongoDB

Download from: https://www.mongodb.com/try/download/community

### Solution 2: Start MongoDB Service

**Windows:**
- Open Services (services.msc)
- Find "MongoDB Server"
- Click "Start"

**Or use command:**
```batch
mongod
```

### Solution 3: Use MongoDB Atlas (Cloud)

1. Create account: https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `server/.env`:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/essms
```

---

## Vite Dev Server Issues

### Problem: EADDRINUSE: address already in use :::5173

**Solution:**

```batch
REM Option 1: Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID [PID] /F

REM Option 2: Use different port
REM Edit client/vite.config.ts and change port to 5174
```

### Problem: Module not found errors

**Solution:**

```batch
cd client
npm install --legacy-peer-deps
npm run dev
```

---

## Build Issues

### Problem: TypeScript compilation error

**Solution:**

```batch
cd server
npm run build

cd ../client
npm run build
```

If error persists:
```batch
REM Clear dist and rebuild
rmdir /s /q dist
npm run build
```

---

## Port Already in Use

### Find and Kill Process

```batch
REM Find process on port 5173
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F

REM Find process on port 5000
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

REM Kill all Node processes
taskkill /F /IM node.exe
```

---

## Environment Variables

### Create `server/.env`

```env
# Database
MONGODB_URI=mongodb://localhost:27017/essms
DB_NAME=essms

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-this
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

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
```

---

## Common Error Messages

### "Cannot find module 'dotenv'"
```batch
cd server
npm install dotenv
```

### "Cannot find module 'express'"
```batch
cd server
npm install
```

### "MongoDB connection timeout"
- Check if MongoDB is running
- Check MONGODB_URI in .env
- Check network/firewall

### "CORS error in console"
- Backend CORS config may be wrong
- Check server/src/server.ts CORS settings
- Verify ALLOWED_ORIGINS includes frontend URL

### "401 Unauthorized"
- JWT token expired
- Wrong credentials
- Session timeout
- Try logging in again

### "Cannot GET /api/v1/health"
- Backend not running
- Wrong API URL in frontend
- Port 5000 in use by something else

---

## Quick Fixes Checklist

- [ ] Frontend running: `npm run client` in `client/` folder
- [ ] Backend running: `npm run dev` in `server/` folder
- [ ] MongoDB running or Atlas connected
- [ ] `server/.env` configured
- [ ] Browser cache cleared (F12 > hard refresh)
- [ ] Ports not in use (5000, 5173)
- [ ] Dependencies installed (npm install)
- [ ] No TypeScript errors (npm run build)

---

## Still Not Working?

### Step 1: Check All Running Processes
```batch
tasklist | findstr node
```

Should see Node processes running.

### Step 2: Check Port Binding
```batch
netstat -ano | findstr :5173
netstat -ano | findstr :5000
```

Should show LISTENING ports.

### Step 3: Restart Everything
```batch
REM Kill all Node processes
taskkill /F /IM node.exe

REM Close any open terminals
REM Restart both servers
```

### Step 4: Clear Cache & Reinstall
```batch
REM Frontend
cd client
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev

REM Backend (in another terminal)
cd server
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

---

## Contact & Support

For detailed help, see:
- START_HERE.md
- RUN_NOW.md
- README.md
- SETUP.md

**System is production-ready. Most issues are environment setup related.**
