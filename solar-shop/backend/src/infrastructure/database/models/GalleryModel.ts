import mongoose, { Schema, Document } from 'mongoose';
import { GalleryItemProps, GalleryCategory } from '../../../domain/entities/Gallery';

export interface GalleryDocument extends Omit<GalleryItemProps, 'id'>, Document {}

const GallerySchema = new Schema<GalleryDocument>({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { type: String },
  imageUrl: { 
    type: String, 
    required: true 
  },
  thumbnailUrl: { type: String },
  category: { 
    type: String, 
    enum: Object.values(GalleryCategory), 
    required: true 
  },
  tags: [{ type: String }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  sortOrder: { 
    type: Number, 
    default: 0 
  }
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

GallerySchema.index({ category: 1, isActive: 1 });
GallerySchema.index({ sortOrder: 1 });

export const GalleryModel = mongoose.model<GalleryDocument>('Gallery', GallerySchema);
