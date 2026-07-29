import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically increments the sequence for the given prefix and returns
 * the formatted ID, e.g. getNextSequence('S') → 'S00001'
 */
export const getNextSequence = async (prefix: string): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { key: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter!.seq).padStart(5, '0')}`;
};
