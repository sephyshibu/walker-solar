import mongoose, { Schema, Document } from 'mongoose';
import { ProductProps, ProductCategory, ProductStatus, ProductSpecification, ProductVideo, PriceTier, GSTRate } from '../../../domain/entities/Product';

export interface ProductDocument extends Omit<ProductProps, 'id'>, Document {}

const SpecificationSchema = new Schema<ProductSpecification>({
  key: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String }
}, { _id: false });

const VideoSchema = new Schema<ProductVideo>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  thumbnail: { type: String }
}, { _id: false });

const PriceTierSchema = new Schema<PriceTier>({
  minQuantity: { type: Number, required: true, min: 1 },
  maxQuantity: { type: Number, default: null },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const ProductSchema = new Schema<ProductDocument>({
  name: { 
    type: String, 
    required: true,
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
    required: true 
  },
  shortDescription: { type: String },
  category: { 
    type: String, 
    enum: Object.values(ProductCategory), 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  discountPrice: { 
    type: Number,
    min: 0 
  },
  gstRate: {
    type: Number,
    enum: [0, 5, 12, 18, 28],
    default: 18
  },
  priceTiers: [PriceTierSchema], // Quantity-based pricing tiers
  images: [{ type: String }],
  imagePublicIds: [{ type: String }], // Cloudinary public IDs
  video: VideoSchema, // Product video
  specifications: [SpecificationSchema],
  features: [{ type: String }],
  stock: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0 
  },
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true 
  },
  brand: { type: String },
  warranty: { type: String },
  status: { 
    type: String, 
    enum: Object.values(ProductStatus), 
    default: ProductStatus.ACTIVE 
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  viewCount: { 
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

ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
