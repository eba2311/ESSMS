import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  eventType: 'Academic' | 'Examination' | 'Holiday' | 'Meeting' | 'Ceremony' | 'Other';
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  targetAudience: string[];
  organizer?: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurrencePattern?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    eventType: {
      type: String,
      enum: ['Academic', 'Examination', 'Holiday', 'Meeting', 'Ceremony', 'Other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: Date,
    startTime: String,
    endTime: String,
    location: String,
    targetAudience: [String],
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: String,
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ startDate: 1, eventType: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
