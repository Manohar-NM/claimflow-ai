import mongoose, { Document as MongooseDoc, Schema } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IUser extends MongooseDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organization: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['HOSPITAL_STAFF', 'TPA_MANAGER'],
      required: true,
      index: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

