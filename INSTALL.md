# Installation Guide

## 1. Install Dependencies

```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

## 2. Configure Environment

Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/essms
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
```

## 3. Start MongoDB

Windows: Start mongod service
Mac: `brew services start mongodb-community`
Linux: `sudo systemctl start mongod`

## 4. Run System

```bash
npm run dev
```

Or separately:
- Terminal 1: `npm run server` (Backend on :5000)
- Terminal 2: `npm run client` (Frontend on :5173)

## 5. Verify

- Backend: http://localhost:5000/api/v1/health
- Frontend: http://localhost:5173

## Login

Email: admin@essms.edu.et
Password: AdminPassword123!
