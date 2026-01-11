import mongoose, { Schema, Document } from 'mongoose';
import { CartProps, CartItem } from '../../../domain/entities/Cart';

export interface CartDocument extends Omit<CartProps, 'id'>, Document {}

const CartItemSchema = new Schema<CartItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 }
}, { _id: false });

const CartSchema = new Schema<CartDocument>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  items: [CartItemSchema],
  totalAmount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  totalGST: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: { 
    type: Number, 
    default: 0,
    min: 0 
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

export const CartModel = mongoose.model<CartDocument>('Cart', CartSchema);
