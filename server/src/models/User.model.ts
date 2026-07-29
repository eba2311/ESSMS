import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  forcePasswordChange: boolean;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `USR${Date.now()}${Math.floor(Math.random() * 1000)}`
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      default: function() {
        // @ts-ignore
        const first = this.firstName ? this.firstName.toLowerCase() : 'user';
        // @ts-ignore
        const last = this.lastName ? this.lastName.toLowerCase() : '';
        return `${first}.${last}${Math.floor(Math.random() * 1000)}`;
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't return MFA secret by default
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    forcePasswordChange: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const User = mongoose.model<IUser>('User', UserSchema);
