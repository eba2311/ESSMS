import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import http from 'http';
import { config } from './config';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initSocket } from './services/socket.service';
import routes from './routes';

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({ 
    message: 'Ethiopian Secondary School Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  const PORT = config.port || 5002;

  // Connect to database FIRST (may take up to 3 min for in-memory MongoDB)
  logger.info('⏳ Connecting to database...');
  await connectDatabase();
  logger.info('✅ Database connected — system fully operational');

  // Initialise Socket.io
  initSocket(server);

  // Then start listening
  server.listen(PORT, () => {
    logger.info(`🚀 ESSMS Server running on port ${PORT}`);
    logger.info(`📚 Environment: ${config.nodeEnv}`);
  });

  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
};

startServer().catch((error) => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
