# ⚡ START THE SYSTEM NOW

## Option 1: Easy Way (Recommended)

### Terminal 1 - Backend Server
```batch
run-server.bat
```

Or manually:
```batch
cd server
npm run dev
```

### Terminal 2 - Frontend Server
```batch
run-client.bat
```

Or manually:
```batch
cd client
npm run dev
```

---

## Option 2: Command Line

Open command prompt (not PowerShell) and run:

```batch
REM Terminal 1
cd server && npm run dev

REM Terminal 2 (new window)
cd client && npm run dev
```

---

## Access the System

Once both servers start:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health

---

## 🔑 Login Credentials

```
Email: admin@essms.edu.et
Password: AdminPassword123!
```

---

## 📝 What to Expect

### Backend Console Output
```
🚀 ESSMS Server running on port 5000
📚 Environment: development
```

### Frontend Console Output
```
VITE v5.4.21  ready in 2406 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## ✅ Verify Everything Works

### Check Backend
```bash
curl http://localhost:5000/api/v1/health
```

Should return:
```json
{"success":true,"message":"ESSMS API is running"}
```

### Check Frontend
Open browser: http://localhost:5173

Should show login page.

---

## 🆘 If Frontend Still Won't Load

### Step 1: Clear Browser Cache
- Open DevTools (F12)
- Right-click refresh button
- Select "Hard refresh" or "Empty cache and hard refresh"

### Step 2: Check Port
```bash
netstat -ano | findstr :5173
```

If something is using 5173, change it in `client/vite.config.ts`

### Step 3: Kill and Restart
```batch
REM Kill processes on ports
taskkill /F /IM node.exe

REM Restart both servers
run-server.bat
run-client.bat
```

---

## 📚 System Features

- ✅ 21 React Pages
- ✅ 100+ API Endpoints
- ✅ 24 Database Models
- ✅ 11 User Roles
- ✅ Complete Security
- ✅ Ethiopian Education System
- ✅ Production Ready

---

## 🎯 Default Access

**Role**: System Admin
**Email**: admin@essms.edu.et
**Password**: AdminPassword123!

All modules are accessible with admin role.

---

**Start the system now! 🚀**
