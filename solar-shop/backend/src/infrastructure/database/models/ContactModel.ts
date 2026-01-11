import mongoose, { Schema, Document } from 'mongoose';
import { ContactProps, ContactStatus } from '../../../domain/entities/Contact';

export interface ContactDocument extends Omit<ContactProps, 'id'>, Document {}

const ContactSchema = new Schema<ContactDocument>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true 
  },
  phone: { type: String },
  subject: { 
    type: String, 
    required: true,
    trim: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(ContactStatus), 
    default: ContactStatus.NEW 
  },
  whatsappSent: {
    type: Boolean,
    default: false
  },
  response: { type: String },
  respondedAt: { type: Date }
}, { 
  timestamps: true,
  toJSON: {
    transform: (_: any, ret: Record<string, any>) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

ContactSchema.index({ status: 1, createdAt: -1 });

export const ContactModel = mongoose.model<ContactDocument>('Contact', ContactSchema);
