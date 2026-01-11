import mongoose, { Schema, Document } from 'mongoose';
import { OrderProps, OrderStatus, ShippingAddress, CourierService, TrackingInfo } from '../../../domain/entities/Order';
import { CartItem } from '../../../domain/entities/Cart';

export interface OrderDocument extends Omit<OrderProps, 'id'>, Document {}

const CartItemSchema = new Schema<CartItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const ShippingAddressSchema = new Schema<ShippingAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
}, { _id: false });

const TrackingInfoSchema = new Schema<TrackingInfo>({
  awbNumber: { type: String, required: true },
  courierService: { 
    type: String, 
    enum: Object.values(CourierService), 
    required: true 
  },
  trackingUrl: { type: String, required: true },
  shippedAt: { type: Date }
}, { _id: false });

const OrderSchema = new Schema<OrderDocument>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  items: [CartItemSchema],
  shippingAddress: { type: ShippingAddressSchema, required: true },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  totalItems: { 
    type: Number, 
    required: true,
    min: 0 
  },
  status: { 
    type: String, 
    enum: Object.values(OrderStatus), 
    default: OrderStatus.PENDING 
  },
  notes: { type: String },
  whatsappSent: { 
    type: Boolean, 
    default: false 
  },
  tracking: { type: TrackingInfoSchema }
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

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'tracking.awbNumber': 1 });

export const OrderModel = mongoose.model<OrderDocument>('Order', OrderSchema);
