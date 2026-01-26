import mongoose, { Schema, Document } from 'mongoose';
import { CategoryStatus } from '../../../domain/entities/Category';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  status: string;
  sortOrder: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true
    },
    description: { 
      type: String,
      trim: true
    },
    image: { 
      type: String 
    },
    imagePublicId: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE 
    },
    sortOrder: { 
      type: Number, 
      default: 0 
    },
    productCount: { 
      type: Number, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ sortOrder: 1 });

export const CategoryModel = mongoose.model<CategoryDocument>('Category', CategorySchema);