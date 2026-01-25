export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  role: 'admin' | 'user';
  status: 'active' | 'blocked';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Tiered pricing based on quantity
export interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: ProductCategory;
  price: number;
  discountPrice?: number;
  gstRate?: number; // GST percentage (0, 5, 12, 18, 28)
  priceTiers?: PriceTier[];
  images: string[];
  specifications: ProductSpecification[];
  features: string[];
  stock: number;
  sku: string;
  brand?: string;
  warranty?: string;
  status: 'active' | 'blocked' | 'out_of_stock';
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// GST Rate options
export const GST_RATE_OPTIONS = [
  { value: 0, label: 'No GST (0%)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' }
];

// Helper function to get price for quantity
export const getPriceForQuantity = (product: Product, quantity: number): number => {
  if (!product.priceTiers || product.priceTiers.length === 0) {
    return product.discountPrice || product.price;
  }

  const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
  
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
        return tier.price;
      }
    }
  }

  return product.discountPrice || product.price;
};

// Helper function to calculate savings percentage
export const getSavingsPercentage = (product: Product, quantity: number): number => {
  const basePrice = product.discountPrice || product.price;
  const tierPrice = getPriceForQuantity(product, quantity);
  if (tierPrice >= basePrice) return 0;
  return Math.round(((basePrice - tierPrice) / basePrice) * 100);
};

export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

export type ProductCategory = 
  | 'solar_panels'
  | 'inverters'
  | 'batteries'
  | 'charge_controllers'
  | 'mounting_systems'
  | 'cables_connectors'
  | 'accessories';

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalGST: number;
  grandTotal: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface TrackingInfo {
  awbNumber: string;
  courierService: string;
  trackingUrl: string;
  shippedAt?: string;
}

export interface InvoiceInfo {
  url: string;
  publicId: string;
  originalName: string;
  uploadedAt: string;
}

export interface CourierService {
  value: string;
  label: string;
  trackingUrlTemplate: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  notes?: string;
  whatsappSent: boolean;
  tracking?: TrackingInfo;
  invoice?: InvoiceInfo;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface WishlistItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: GalleryCategory;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type GalleryCategory = 
  | 'installations'
  | 'products'
  | 'projects'
  | 'team'
  | 'events';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  token: string;
}
