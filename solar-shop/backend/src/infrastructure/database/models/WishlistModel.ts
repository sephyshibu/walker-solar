import mongoose, { Schema, Document } from 'mongoose';
import { WishlistProps, WishlistItem } from '../../../domain/entities/Wishlist';

export interface WishlistDocument extends Omit<WishlistProps, 'id'>, Document {}

const WishlistItemSchema = new Schema<WishlistItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const WishlistSchema = new Schema<WishlistDocument>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  items: [WishlistItemSchema]
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

export const WishlistModel = mongoose.model<WishlistDocument>('Wishlist', WishlistSchema);
