import { v4 as uuidv4 } from 'uuid';

export interface WishlistItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: Date;
}

export interface WishlistProps {
  id?: string;
  userId: string;
  items: WishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wishlist {
  private props: WishlistProps;

  constructor(props: WishlistProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      items: props.items || [],
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  get id(): string {
    return this.props.id!;
  }

  get userId(): string {
    return this.props.userId;
  }

  get items(): WishlistItem[] {
    return this.props.items;
  }

  get itemCount(): number {
    return this.props.items.length;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  addItem(item: Omit<WishlistItem, 'addedAt'>): void {
    if (!this.hasItem(item.productId)) {
      this.props.items.push({
        ...item,
        addedAt: new Date()
      });
      this.props.updatedAt = new Date();
    }
  }

  removeItem(productId: string): void {
    this.props.items = this.props.items.filter(item => item.productId !== productId);
    this.props.updatedAt = new Date();
  }

  hasItem(productId: string): boolean {
    return this.props.items.some(item => item.productId === productId);
  }

  clear(): void {
    this.props.items = [];
    this.props.updatedAt = new Date();
  }

  toJSON(): WishlistProps {
    return { ...this.props };
  }

  toObject(): WishlistProps {
    return { ...this.props };
  }
}
