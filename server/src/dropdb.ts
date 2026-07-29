import mongoose from 'mongoose';

async function dropDb() {
  await mongoose.connect('mongodb://localhost:27017/essms_dev');
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  await db.dropDatabase();
  console.log('Database dropped');
  await mongoose.disconnect();
  process.exit(0);
}
dropDb().catch(e => { console.error(e); process.exit(1); });
