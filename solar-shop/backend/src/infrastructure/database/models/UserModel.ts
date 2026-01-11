import mongoose, { Schema, Document } from 'mongoose';
import { UserProps, UserRole, UserStatus } from '../../../domain/entities/User';

export interface UserDocument extends Omit<UserProps, 'id'>, Document {}

const AddressSchema = new Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true 
  },
  phone: { 
    type: String,
    trim: true 
  },
  address: AddressSchema,
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  status: { 
    type: String, 
    enum: Object.values(UserStatus), 
    default: UserStatus.ACTIVE 
  },
  profileImage: { type: String }
}, { 
  timestamps: true,
  toJSON: {
    transform: (_: any, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

UserSchema.index({ role: 1, status: 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
