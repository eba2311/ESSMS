# ESSMS Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env with your settings
# Required: MONGODB_URI, JWT_SECRET
```

### 3. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services panel or use mongod.exe
```

### 4. Run Development Servers

```bash
# Option 1: Run both frontend and backend together
npm run dev

# Option 2: Run separately in different terminals
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:3000
```

### 5. Verify Installation

- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000

## Project Structure Created

```
essms/
├── server/                    # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/           # Configuration (database, environment)
│   │   ├── middleware/       # Express middleware
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── server.ts         # Entry point
│   ├── uploads/              # File upload directory
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env.example
│
├── client/                    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── .kiro/specs/              # Project specifications
├── package.json              # Root package.json
└── README.md                 # Project documentation
```

## Technology Stack Configured

### Backend
- ✅ Node.js + Express.js
- ✅ TypeScript
- ✅ MongoDB + Mongoose
- ✅ JWT Authentication
- ✅ Bcrypt
- ✅ Socket.io
- ✅ Nodemailer
- ✅ Testing: Jest + Supertest

### Frontend
- ✅ React 18 + TypeScript
- ✅ Vite (fast dev server)
- ✅ React Router v6
- ✅ Redux Toolkit
- ✅ Material UI + Tailwind CSS
- ✅ Axios
- ✅ Recharts
- ✅ Testing: Vitest

### Development Tools
- ✅ ESLint
- ✅ Prettier
- ✅ Nodemon
- ✅ ts-node

## Next Steps

1. **Database Models**: Implement Mongoose schemas (Task 2)
2. **Authentication**: JWT tokens and bcrypt (Task 3)
3. **Authorization**: RBAC middleware (Task 4)
4. **Core Features**: Student, teacher, academic management
5. **Frontend**: React components and pages

## Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run build` - Build for production
- `npm test` - Run all tests

### Backend (server/)
- `npm run dev` - Development server with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Production server
- `npm test` - Run Jest tests
- `npm run lint` - Lint code

### Frontend (client/)
- `npm run dev` - Development server (Vite)
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Run Vitest tests
- `npm run lint` - Lint code

## Environment Variables

Key variables to configure in `server/.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/essms_dev
JWT_SECRET=your-secret-key-change-in-production

# Optional (with defaults)
PORT=5000
NODE_ENV=development
JWT_EXPIRES_IN=15m
BCRYPT_SALT_ROUNDS=10
SESSION_TIMEOUT_MINUTES=15
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Check connection string in .env
# Default: mongodb://localhost:27017/essms_dev
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### TypeScript Errors
```bash
# Clear build cache
cd server && rm -rf dist node_modules && npm install
cd client && rm -rf dist node_modules && npm install
```

## Documentation

- Requirements: `.kiro/specs/ethiopian-school-management-system/requirements.md`
- Design: `.kiro/specs/ethiopian-school-management-system/design.md`
- Tasks: `.kiro/specs/ethiopian-school-management-system/tasks.md`

## Support

For issues and questions:
1. Check the documentation in `.kiro/specs/`
2. Review the README.md
3. Check environment variables in `.env`
