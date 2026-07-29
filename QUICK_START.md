# 🚀 ESSMS Quick Start Guide

## Ethiopian Secondary School Management System - Production Ready

---

## ⚡ 30-Second Startup

### Windows
```batch
start-dev.bat
```

### Mac/Linux
```bash
npm run dev
```

### Manual Setup
```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd client && npm install && npm run dev
```

---

## 📍 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health

---

## 🔑 Credentials

**Default Admin:**
```
Email: admin@essms.edu.et
Password: AdminPassword123!
```

⚠️ Change these in production!

---

## ⚙️ Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **MongoDB** - Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📋 Configuration

Edit `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/essms
JWT_SECRET=your-secret-key-here
PORT=5000
```

---

## ✅ System Status

**Status:** 🎉 100% PRODUCTION READY

### Backend (Node.js + Express)
- ✅ 24 Database Models
- ✅ 100+ RESTful API Endpoints
- ✅ 11-Role RBAC System
- ✅ Complete Audit Logging
- ✅ JWT + MFA Authentication

### Frontend (React + TypeScript)
- ✅ 21+ Pages
- ✅ Material UI + Tailwind CSS
- ✅ Responsive Design
- ✅ Real-time Notifications
- ✅ Protected Routes

### Features
- ✅ Student Lifecycle Management
- ✅ Assessment & Grading
- ✅ Attendance Tracking
- ✅ Finance Management
- ✅ Library System
- ✅ Communication Hub
- ✅ Multi-level Rankings
- ✅ Teacher Management
- ✅ Reports & Analytics

---

## 📚 Documentation

- `SETUP.md` - Detailed setup instructions
- `DEPLOYMENT.md` - Production deployment guide
- `FINAL_ACHIEVEMENT.md` - Complete system overview
- `README.md` - Full project documentation

---

## 🧪 Verify Setup

```bash
# Check backend
curl http://localhost:5000/api/v1/health

# Check frontend
curl http://localhost:5173
```

---

## 🆘 Troubleshooting

**Port Already in Use?**
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

**MongoDB Connection Failed?**
1. Verify MongoDB is running
2. Check MONGODB_URI in server/.env
3. Ensure network access if using Atlas

**npm install fails?**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

For detailed help, see the complete documentation files included in the project.

**Happy Learning! 🎓**
