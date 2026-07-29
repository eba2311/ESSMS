import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AssessmentMark } from './models/AssessmentMark.model';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/essms');

  // 1. Show the current schema paths
  const schema = AssessmentMark.schema;
  console.log('=== SCHEMA PATHS ===');
  const paths = ['percentage', 'letterGrade', 'gradePoint'];
  for (const p of paths) {
    const pth = schema.path(p);
    if (pth) {
      console.log(`${p}:`, JSON.stringify({ instance: (pth as any).instance, options: (pth as any).options }));
    } else {
      console.log(`${p}: NOT FOUND`);
    }
  }

  // 2. Show current document count
  const count = await AssessmentMark.countDocuments();
  console.log(`\nDocuments in collection: ${count}`);

  // 3. Try to insert a minimal document to see if validation passes
  const testDoc = {
    assessment: new mongoose.Types.ObjectId(),
    student: new mongoose.Types.ObjectId(),
    marksObtained: 8,
    percentage: 80,
    letterGrade: 'B',
    gradePoint: 3.0,
    enteredBy: new mongoose.Types.ObjectId(),
    enteredAt: new Date(),
  };

  try {
    const doc = await AssessmentMark.create(testDoc);
    console.log('\n✅ CREATE with all fields: SUCCESS');
    await AssessmentMark.deleteOne({ _id: doc._id });
  } catch (err: any) {
    console.log(`\n❌ CREATE with all fields FAILED:`, err.message);
  }

  try {
    const testDoc2 = {
      assessment: new mongoose.Types.ObjectId(),
      student: new mongoose.Types.ObjectId(),
      marksObtained: 7,
      enteredBy: new mongoose.Types.ObjectId(),
      enteredAt: new Date(),
    };
    const result2 = await AssessmentMark.create(testDoc2);
    console.log('\n✅ CREATE WITHOUT percentage/letterGrade/gradePoint: SUCCESS');
    await AssessmentMark.deleteOne({ _id: result2._id });
  } catch (err: any) {
    console.log(`\n❌ CREATE WITHOUT percentage/letterGrade/gradePoint FAILED:`, err.message);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
