import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  activityType: string;
  description?: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    entityType: {
      type: String,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true, // Cannot be modified
      index: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: false, // We use timestamp field instead
  }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ activityType: 1, timestamp: -1 });

// Prevent modification of audit logs
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    throw new Error('Audit logs cannot be modified');
  }
  next();
});

// Prevent deletion of audit logs
AuditLogSchema.pre('deleteOne', function (next: any) {
  throw new Error('Audit logs cannot be deleted');
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
