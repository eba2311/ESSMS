import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function dropDb() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essms_dev';
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  await db.dropDatabase();
  console.log('Database dropped');
  await mongoose.disconnect();
  process.exit(0);
}
dropDb().catch(e => { console.error(e); process.exit(1); });
