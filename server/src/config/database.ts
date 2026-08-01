import mongoose from 'mongoose';
import crypto from 'crypto';
import { User, Settings, AcademicTerm } from '../models';
import { config } from './index';
import { logger } from '../utils/logger';
import { runFullSeed } from '../seed';

function makeHash(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function autoSeed() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    const sectionCount = await mongoose.connection.db!.collection('sections').countDocuments();
    if (sectionCount >= 10) {
      logger.info('✅ Database already has full data — skipping seed.');
      return;
    }
    logger.info('📦 Users exist but data is incomplete — running full seed...');
  } else {
    logger.info('🌱 No data found — running full comprehensive seed...');
  }

  try {
    await runFullSeed((msg) => logger.info(`  ${msg}`));
    logger.info('✅ Full seed completed successfully');
  } catch (err: any) {
    logger.error('❌ Full seed failed:', err.message || err);
  }
}

async function ensureAdminPassword() {
  const hash = await makeHash('Admin123!');
  const result = await User.updateOne(
    { email: 'admin@school.edu.et' },
    {
      $set: {
        passwordHash: hash,
        isActive: true,
        forcePasswordChange: false,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    }
  );
  if (result.matchedCount > 0) {
    logger.info('🔑 Admin password ensured: admin@school.edu.et / Admin123!');
  }
}

export const connectDatabase = async (): Promise<void> => {
  let usingFallback = false;
  try {
    const uri = config.nodeEnv === 'test' ? config.mongodbUriTest : config.mongodbUri;
    const connectOptions: mongoose.ConnectOptions = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(uri, connectOptions);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.warn('⚠️ Local MongoDB not available, starting in-memory MongoDB...');
    usingFallback = true;
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      logger.info('⏳ Starting in-memory MongoDB (this may take up to 2 minutes on first run)...');
      const mongod = await MongoMemoryServer.create({
        instance: { startupTimeout: 180000 },
        binary: { downloadTimeout: 180000 },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      logger.info(`✅ In-memory MongoDB started at ${uri}`);
    } catch (memError) {
      logger.error('❌ Failed to start in-memory MongoDB:', memError);
      throw memError;
    }
  }

  await autoSeed();
  await ensureAdminPassword();

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  if (usingFallback) {
    logger.info('⚡ Using in-memory MongoDB — data will be lost on restart.');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};
