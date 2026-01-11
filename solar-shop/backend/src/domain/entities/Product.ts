import { v4 as uuidv4 } from 'uuid';

export enum ProductCategory {
  SOLAR_PANELS = 'solar_panels',
  INVERTERS = 'inverters',
  BATTERIES = 'batteries',
  CHARGE_CONTROLLERS = 'charge_controllers',
  MOUNTING_SYSTEMS = 'mounting_systems',
  CABLES_CONNECTORS = 'cables_connectors',
  ACCESSORIES = 'accessories'
}

export enum ProductStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  OUT_OF_STOCK = 'out_of_stock'
}

// GST Tax rates in India
export enum GSTRate {
  GST_0 = 0,
  GST_5 = 5,
  GST_12 = 12,
  GST_18 = 18,
  GST_28 = 28
}

export const GST_RATE_OPTIONS = [
  { value: GSTRate.GST_0, label: 'No GST (0%)' },
  { value: GSTRate.GST_5, label: 'GST 5%' },
  { value: GSTRate.GST_12, label: 'GST 12%' },
  { value: GSTRate.GST_18, label: 'GST 18%' },
  { value: GSTRate.GST_28, label: 'GST 28%' }
];

export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

export interface ProductVideo {
  url: string;
  publicId: string;
  thumbnail?: string;
}

// Tiered pricing based on quantity
export interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null; // null means unlimited
  price: number;
}

export interface ProductProps {
  id?: string;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  category: ProductCategory;
  price: number;
  discountPrice?: number;
  gstRate?: number; // GST percentage (0, 5, 12, 18, 28)
  priceTiers?: PriceTier[]; // Quantity-based pricing tiers
  images: string[];
  imagePublicIds?: string[]; // Cloudinary public IDs for deletion
  video?: ProductVideo;
  specifications: ProductSpecification[];
  features: string[];
  stock: number;
  sku: string;
  brand?: string;
  warranty?: string;
  status: ProductStatus;
  isFeatured: boolean;
  viewCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  private props: ProductProps;

  constructor(props: ProductProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      slug: props.slug || this.generateSlug(props.name),
      status: props.status || ProductStatus.ACTIVE,
      isFeatured: props.isFeatured || false,
      viewCount: props.viewCount || 0,
      imagePublicIds: props.imagePublicIds || [],
      priceTiers: props.priceTiers || [],
      gstRate: props.gstRate ?? 18, // Default to 18% GST
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  get id(): string {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug!;
  }

  get description(): string {
    return this.props.description;
  }

  get shortDescription(): string | undefined {
    return this.props.shortDescription;
  }

  get category(): ProductCategory {
    return this.props.category;
  }

  get price(): number {
    return this.props.price;
  }

  get discountPrice(): number | undefined {
    return this.props.discountPrice;
  }

  get gstRate(): number {
    return this.props.gstRate ?? 18;
  }

  get priceTiers(): PriceTier[] {
    return this.props.priceTiers || [];
  }

  get effectivePrice(): number {
    return this.props.discountPrice || this.props.price;
  }

  // Calculate GST amount for a given price
  calculateGSTAmount(basePrice: number): number {
    return (basePrice * this.gstRate) / 100;
  }

  // Get price including GST
  getPriceWithGST(basePrice: number): number {
    return basePrice + this.calculateGSTAmount(basePrice);
  }

  // Get price based on quantity (tiered pricing)
  getPriceForQuantity(quantity: number): number {
    if (!this.props.priceTiers || this.props.priceTiers.length === 0) {
      return this.effectivePrice;
    }

    // Sort tiers by minQuantity descending to find the best matching tier
    const sortedTiers = [...this.props.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity) {
        if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
          return tier.price;
        }
      }
    }

    return this.effectivePrice;
  }

  // Calculate total price for a quantity
  calculateTotalPrice(quantity: number): number {
    return this.getPriceForQuantity(quantity) * quantity;
  }

  // Get savings percentage for a quantity
  getSavingsPercentage(quantity: number): number {
    const basePrice = this.effectivePrice;
    const tierPrice = this.getPriceForQuantity(quantity);
    if (tierPrice >= basePrice) return 0;
    return Math.round(((basePrice - tierPrice) / basePrice) * 100);
  }

  get discountPercentage(): number {
    if (!this.props.discountPrice) return 0;
    return Math.round(((this.props.price - this.props.discountPrice) / this.props.price) * 100);
  }

  get images(): string[] {
    return this.props.images;
  }

  get imagePublicIds(): string[] {
    return this.props.imagePublicIds || [];
  }

  get primaryImage(): string {
    return this.props.images[0] || '';
  }

  get video(): ProductVideo | undefined {
    return this.props.video;
  }

  get specifications(): ProductSpecification[] {
    return this.props.specifications;
  }

  get features(): string[] {
    return this.props.features;
  }

  get stock(): number {
    return this.props.stock;
  }

  get sku(): string {
    return this.props.sku;
  }

  get brand(): string | undefined {
    return this.props.brand;
  }

  get warranty(): string | undefined {
    return this.props.warranty;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get viewCount(): number {
    return this.props.viewCount;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isAvailable(): boolean {
    return this.props.status === ProductStatus.ACTIVE && this.props.stock > 0;
  }

  get isBlocked(): boolean {
    return this.props.status === ProductStatus.BLOCKED;
  }

  incrementViewCount(): void {
    this.props.viewCount++;
    this.props.updatedAt = new Date();
  }

  updateStock(quantity: number): void {
    this.props.stock = quantity;
    if (this.props.stock <= 0) {
      this.props.status = ProductStatus.OUT_OF_STOCK;
    } else if (this.props.status === ProductStatus.OUT_OF_STOCK) {
      this.props.status = ProductStatus.ACTIVE;
    }
    this.props.updatedAt = new Date();
  }

  reduceStock(quantity: number): void {
    this.props.stock = Math.max(0, this.props.stock - quantity);
    if (this.props.stock <= 0) {
      this.props.status = ProductStatus.OUT_OF_STOCK;
    }
    this.props.updatedAt = new Date();
  }

  block(): void {
    this.props.status = ProductStatus.BLOCKED;
    this.props.updatedAt = new Date();
  }

  unblock(): void {
    this.props.status = this.props.stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;
    this.props.updatedAt = new Date();
  }

  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.props.updatedAt = new Date();
  }

  setVideo(video: ProductVideo): void {
    this.props.video = video;
    this.props.updatedAt = new Date();
  }

  removeVideo(): void {
    this.props.video = undefined;
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data);
    if (data.name) {
      this.props.slug = this.generateSlug(data.name);
    }
    this.props.updatedAt = new Date();
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }

  toObject(): ProductProps {
    return { ...this.props };
  }
}
