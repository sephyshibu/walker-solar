import { v4 as uuidv4 } from 'uuid';

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
  gstRate: number; // GST percentage
  gstAmount: number; // GST amount for this item
}

export interface CartProps {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalGST: number; // Total GST amount
  grandTotal: number; // totalAmount + totalGST
  totalItems: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Cart {
  private props: CartProps;

  constructor(props: CartProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      items: props.items || [],
      totalAmount: props.totalAmount || 0,
      totalGST: props.totalGST || 0,
      grandTotal: props.grandTotal || 0,
      totalItems: props.totalItems || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
    this.recalculateTotals();
  }

  get id(): string {
    return this.props.id!;
  }

  get userId(): string {
    return this.props.userId;
  }

  get items(): CartItem[] {
    return this.props.items;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get totalGST(): number {
    return this.props.totalGST;
  }

  get grandTotal(): number {
    return this.props.grandTotal;
  }

  get totalItems(): number {
    return this.props.totalItems;
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

  private recalculateTotals(): void {
    this.props.totalItems = this.props.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.props.totalAmount = this.props.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    this.props.totalGST = this.props.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    this.props.grandTotal = this.props.totalAmount + this.props.totalGST;
    
    // Ensure no NaN values
    if (isNaN(this.props.totalItems)) this.props.totalItems = 0;
    if (isNaN(this.props.totalAmount)) this.props.totalAmount = 0;
    if (isNaN(this.props.totalGST)) this.props.totalGST = 0;
    if (isNaN(this.props.grandTotal)) this.props.grandTotal = 0;
  }

  addItem(item: Omit<CartItem, 'subtotal' | 'gstAmount'> & { gstRate?: number }): void {
    const gstRate = item.gstRate ?? 18;
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const existingItemIndex = this.props.items.findIndex(i => i.productId === item.productId);

    if (existingItemIndex !== -1) {
      const newQuantity = this.props.items[existingItemIndex].quantity + quantity;
      const subtotal = price * newQuantity;
      this.props.items[existingItemIndex].quantity = newQuantity;
      this.props.items[existingItemIndex].price = price;
      this.props.items[existingItemIndex].subtotal = subtotal;
      this.props.items[existingItemIndex].gstRate = gstRate;
      this.props.items[existingItemIndex].gstAmount = (subtotal * gstRate) / 100;
    } else {
      const subtotal = price * quantity;
      this.props.items.push({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price,
        quantity,
        subtotal,
        gstRate,
        gstAmount: (subtotal * gstRate) / 100
      });
    }

    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const itemIndex = this.props.items.findIndex(i => i.productId === productId);

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        this.props.items.splice(itemIndex, 1);
      } else {
        const item = this.props.items[itemIndex];
        const price = item.price || 0;
        const gstRate = item.gstRate || 18;
        const subtotal = price * quantity;
        
        this.props.items[itemIndex].quantity = quantity;
        this.props.items[itemIndex].subtotal = subtotal;
        this.props.items[itemIndex].gstAmount = (subtotal * gstRate) / 100;
      }

      this.recalculateTotals();
      this.props.updatedAt = new Date();
    }
  }

  removeItem(productId: string): void {
    this.props.items = this.props.items.filter(item => item.productId !== productId);
    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }

  clear(): void {
    this.props.items = [];
    this.recalculateTotals();
    this.props.updatedAt = new Date();
  }

  getItem(productId: string): CartItem | undefined {
    return this.props.items.find(item => item.productId === productId);
  }

  hasItem(productId: string): boolean {
    return this.props.items.some(item => item.productId === productId);
  }

  toJSON(): CartProps {
    return { ...this.props };
  }

  toObject(): CartProps {
    return { ...this.props };
  }
}
