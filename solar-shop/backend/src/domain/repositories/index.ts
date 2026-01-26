import { User, UserStatus, UserRole } from '../entities/User';
import { Product, ProductCategory, ProductStatus } from '../entities/Product';
import { Cart } from '../entities/Cart';
import { Order, OrderStatus } from '../entities/Order';
import { Wishlist } from '../entities/Wishlist';
import { GalleryItem, GalleryCategory } from '../entities/Gallery';
import { Contact, ContactStatus } from '../entities/Contact';
import { Category, CategoryStatus } from '../entities/Category';
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// User Repository Interface
export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options: PaginationOptions, filters?: { role?: UserRole; status?: UserStatus }): Promise<PaginatedResult<User>>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: UserStatus): Promise<User | null>;
  count(filters?: { role?: UserRole; status?: UserStatus }): Promise<number>;
}

// Product Repository Interface
export interface IProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
 findAll(
  options: PaginationOptions, 
  filters?: { 
    category?: string;  // Changed from ProductCategory
    status?: ProductStatus; 
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }
): Promise<PaginatedResult<Product>>;
findByCategory(category: string, options: PaginationOptions): Promise<PaginatedResult<Product>>;

count(filters?: { category?: string; status?: ProductStatus }): Promise<number>;
  update(id: string, data: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: ProductStatus): Promise<Product | null>;
  incrementViewCount(id: string): Promise<void>;
  findFeatured(limit?: number): Promise<Product[]>;
  search(query: string, options: PaginationOptions): Promise<PaginatedResult<Product>>;
}

// Cart Repository Interface
export interface ICartRepository {
  create(cart: Cart): Promise<Cart>;
  findById(id: string): Promise<Cart | null>;
  findByUserId(userId: string): Promise<Cart | null>;
  update(id: string, cart: Cart): Promise<Cart | null>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<boolean>;
}

// Order Repository Interface
// Order Repository Interface
export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult<Order>>;
  findAll(
    options: PaginationOptions,
    filters?: { status?: OrderStatus; userId?: string; startDate?: Date; endDate?: Date }
  ): Promise<PaginatedResult<Order>>;
  update(id: string, data: Partial<Order>): Promise<Order | null>;
  removeInvoice(id: string): Promise<Order | null>;  // ADD THIS LINE
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
  count(filters?: { status?: OrderStatus; userId?: string }): Promise<number>;
}
export interface ICategoryRepository {
  create(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(
    options: PaginationOptions,
    filters?: { status?: CategoryStatus }
  ): Promise<PaginatedResult<Category>>;
  findAllActive(): Promise<Category[]>;
  update(id: string, data: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
  updateProductCount(id: string, count: number): Promise<Category | null>;
  count(filters?: { status?: CategoryStatus }): Promise<number>;
}
// Wishlist Repository Interface
export interface IWishlistRepository {
  create(wishlist: Wishlist): Promise<Wishlist>;
  findById(id: string): Promise<Wishlist | null>;
  findByUserId(userId: string): Promise<Wishlist | null>;
  update(id: string, wishlist: Wishlist): Promise<Wishlist | null>;
  delete(id: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<boolean>;
}

// Gallery Repository Interface
export interface IGalleryRepository {
  create(item: GalleryItem): Promise<GalleryItem>;
  findById(id: string): Promise<GalleryItem | null>;
  findAll(
    options: PaginationOptions,
    filters?: { category?: GalleryCategory; isActive?: boolean }
  ): Promise<PaginatedResult<GalleryItem>>;
  findByCategory(category: GalleryCategory, options: PaginationOptions): Promise<PaginatedResult<GalleryItem>>;
  update(id: string, data: Partial<GalleryItem>): Promise<GalleryItem | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: { category?: GalleryCategory; isActive?: boolean }): Promise<number>;
}

// Contact Repository Interface
export interface IContactRepository {
  create(contact: Contact): Promise<Contact>;
  findById(id: string): Promise<Contact | null>;
  findAll(
    options: PaginationOptions,
    filters?: { status?: ContactStatus }
  ): Promise<PaginatedResult<Contact>>;
  update(id: string, data: Partial<Contact>): Promise<Contact | null>;
  updateStatus(id: string, status: ContactStatus): Promise<Contact | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: { status?: ContactStatus }): Promise<number>;
}
