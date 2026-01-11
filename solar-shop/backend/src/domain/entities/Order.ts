import { v4 as uuidv4 } from 'uuid';
import { CartItem } from './Cart';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Supported courier services with tracking URLs
export enum CourierService {
  DELHIVERY = 'delhivery',
  BLUEDART = 'bluedart',
  DTDC = 'dtdc',
  ECOM_EXPRESS = 'ecom_express',
  XPRESSBEES = 'xpressbees',
  SHADOWFAX = 'shadowfax',
  INDIA_POST = 'india_post',
  PROFESSIONAL_COURIER = 'professional_courier',
  FEDEX = 'fedex',
  DHL = 'dhl',
  OTHER = 'other'
}

// Tracking URL templates for each courier
export const COURIER_TRACKING_URLS: Record<CourierService, string> = {
  [CourierService.DELHIVERY]: 'https://www.delhivery.com/track/package/{awb}',
  [CourierService.BLUEDART]: 'https://www.bluedart.com/tracking/{awb}',
  [CourierService.DTDC]: 'https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno={awb}',
  [CourierService.ECOM_EXPRESS]: 'https://ecomexpress.in/tracking/?awb_field={awb}',
  [CourierService.XPRESSBEES]: 'https://www.xpressbees.com/track?awb={awb}',
  [CourierService.SHADOWFAX]: 'https://tracker.shadowfax.in/#/track/{awb}',
  [CourierService.INDIA_POST]: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consession={awb}',
  [CourierService.PROFESSIONAL_COURIER]: 'https://www.tpcindia.com/track.aspx?id={awb}',
  [CourierService.FEDEX]: 'https://www.fedex.com/fedextrack/?trknbr={awb}',
  [CourierService.DHL]: 'https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id={awb}',
  [CourierService.OTHER]: ''
};

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
  courierService: CourierService;
  trackingUrl: string;
  shippedAt?: Date;
}

export interface OrderProps {
  id?: string;
  orderNumber?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  private props: OrderProps;

  constructor(props: OrderProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      orderNumber: props.orderNumber || this.generateOrderNumber(),
      status: props.status || OrderStatus.PENDING,
      whatsappSent: props.whatsappSent || false,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SOL-${timestamp}-${random}`;
  }

  // Generate tracking URL from AWB and courier service
  static generateTrackingUrl(awbNumber: string, courierService: CourierService): string {
    const template = COURIER_TRACKING_URLS[courierService];
    if (!template) return '';
    return template.replace('{awb}', awbNumber);
  }

  get id(): string {
    return this.props.id!;
  }

  get orderNumber(): string {
    return this.props.orderNumber!;
  }

  get userId(): string {
    return this.props.userId;
  }

  get userEmail(): string {
    return this.props.userEmail;
  }

  get userName(): string {
    return this.props.userName;
  }

  get items(): CartItem[] {
    return this.props.items;
  }

  get shippingAddress(): ShippingAddress {
    return this.props.shippingAddress;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get totalItems(): number {
    return this.props.totalItems;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get whatsappSent(): boolean {
    return this.props.whatsappSent;
  }

  get tracking(): TrackingInfo | undefined {
    return this.props.tracking;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  get isCancelled(): boolean {
    return this.props.status === OrderStatus.CANCELLED;
  }

  get isShipped(): boolean {
    return this.props.status === OrderStatus.SHIPPED || this.props.status === OrderStatus.DELIVERED;
  }

  updateStatus(status: OrderStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  markWhatsappSent(): void {
    this.props.whatsappSent = true;
    this.props.updatedAt = new Date();
  }

  setTracking(awbNumber: string, courierService: CourierService): void {
    const trackingUrl = Order.generateTrackingUrl(awbNumber, courierService);
    this.props.tracking = {
      awbNumber,
      courierService,
      trackingUrl,
      shippedAt: new Date()
    };
    this.props.status = OrderStatus.SHIPPED;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = OrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  generateWhatsAppMessage(): string {
    const itemsList = this.props.items
      .map((item, index) => 
        `${index + 1}. ${item.productName}\n   Qty: ${item.quantity} × ₹${item.price.toLocaleString()} = ₹${item.subtotal.toLocaleString()}`
      )
      .join('\n\n');

    const address = this.props.shippingAddress;
    const addressText = `${address.fullName}\n${address.phone}\n${address.street}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;

    return `🌞 *NEW SOLAR ORDER*\n\n` +
      `📋 *Order Number:* ${this.props.orderNumber}\n` +
      `📅 *Date:* ${this.props.createdAt!.toLocaleDateString()}\n\n` +
      `👤 *Customer:*\n${this.props.userName}\n${this.props.userEmail}\n\n` +
      `📦 *Order Items:*\n${itemsList}\n\n` +
      `💰 *Total Amount:* ₹${this.props.totalAmount.toLocaleString()}\n` +
      `📦 *Total Items:* ${this.props.totalItems}\n\n` +
      `🏠 *Shipping Address:*\n${addressText}\n\n` +
      `${this.props.notes ? `📝 *Notes:* ${this.props.notes}\n\n` : ''}` +
      `Please confirm the order and contact the customer.`;
  }

  generateWhatsAppURL(phoneNumber: string): string {
    const message = encodeURIComponent(this.generateWhatsAppMessage());
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }

  toObject(): OrderProps {
    return { ...this.props };
  }
}
