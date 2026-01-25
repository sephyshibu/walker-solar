import { Order, OrderStatus, ShippingAddress, CourierService, COURIER_TRACKING_URLS } from '../../../domain/entities/Order';
import { ProductStatus } from '../../../domain/entities/Product';
import { IOrderRepository, ICartRepository, IProductRepository, IUserRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

interface CreateOrderDTO {
  userId: string;
  shippingAddress: ShippingAddress;
  notes?: string;
}

export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(data: CreateOrderDTO): Promise<{ order: Order; whatsappUrl: string }> {
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const cart = await this.cartRepository.findByUserId(data.userId);
    if (!cart || cart.isEmpty) {
      throw new AppError('Cart is empty', 400);
    }

    // Verify stock availability for all items
    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productName} is no longer available`, 400);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.productName}`, 400);
      }
    }

    // Create order
    const order = new Order({
      userId: data.userId,
      userEmail: user.email,
      userName: user.fullName,
      items: cart.items,
      shippingAddress: data.shippingAddress,
      totalAmount: cart.totalAmount,
      totalItems: cart.totalItems,
      status: OrderStatus.PENDING,
      notes: data.notes,
      whatsappSent: false
    });

    const createdOrder = await this.orderRepository.create(order);

    // Reduce stock for all items
    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        product.reduceStock(item.quantity);
        await this.productRepository.update(item.productId, { stock: product.stock, status: product.status });
      }
    }

    // Clear the cart
    cart.clear();
    await this.cartRepository.update(cart.id, cart);

    // Generate WhatsApp URL
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
    const whatsappUrl = createdOrder.generateWhatsAppURL(whatsappNumber);

    return { order: createdOrder, whatsappUrl };
  }
}

export class GetOrderByIdUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // If userId is provided, verify ownership
    if (userId && order.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    return order;
  }
}

export class GetOrderByNumberUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }
}

export class GetUserOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(userId: string, options: PaginationOptions): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findByUserId(userId, options);
  }
}

export class GetAllOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: { status?: OrderStatus; userId?: string; startDate?: Date; endDate?: Date }
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findAll(options, filters);
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  // Define the order status flow (index represents priority/order)
  private static readonly STATUS_ORDER: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED
  ];

  private getStatusIndex(status: OrderStatus): number {
    return UpdateOrderStatusUseCase.STATUS_ORDER.indexOf(status);
  }

  private canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // Cancelled is a special case - can only go to cancelled, never come back
    if (currentStatus === OrderStatus.CANCELLED) {
      return false; // Cannot change from cancelled
    }

    // Can always cancel (except from cancelled itself, handled above)
    if (newStatus === OrderStatus.CANCELLED) {
      return true;
    }

    const currentIndex = this.getStatusIndex(currentStatus);
    const newIndex = this.getStatusIndex(newStatus);

    // Only allow forward transitions (new status must be higher than current)
    return newIndex > currentIndex;
  }

  async execute(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.isCancelled) {
      throw new AppError('Cannot update a cancelled order', 400);
    }

    // Validate status transition
    if (!this.canTransitionTo(order.status, status)) {
      const currentStatusName = order.status.charAt(0).toUpperCase() + order.status.slice(1);
      const newStatusName = status.charAt(0).toUpperCase() + status.slice(1);
      throw new AppError(
        `Cannot change status from "${currentStatusName}" to "${newStatusName}". Only forward status changes are allowed.`,
        400
      );
    }

    const updatedOrder = await this.orderRepository.updateStatus(orderId, status);
    if (!updatedOrder) {
      throw new AppError('Failed to update order', 500);
    }

    return updatedOrder;
  }
}

export class CancelOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(orderId: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // If userId provided, verify ownership
    if (userId && order.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (order.isCancelled) {
      throw new AppError('Order is already cancelled', 400);
    }

    // Only allow cancellation of pending orders for users
    if (userId && order.status !== OrderStatus.PENDING) {
      throw new AppError('Can only cancel pending orders', 400);
    }

    // Restore stock
    for (const item of order.items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        await this.productRepository.update(item.productId, { 
          stock: newStock,
          status: newStock > 0 ? ProductStatus.ACTIVE : product.status 
        });
      }
    }

    const cancelledOrder = await this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);
    if (!cancelledOrder) {
      throw new AppError('Failed to cancel order', 500);
    }

    return cancelledOrder;
  }
}

export class MarkWhatsAppSentUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updatedOrder = await this.orderRepository.update(orderId, { whatsappSent: true });
    if (!updatedOrder) {
      throw new AppError('Failed to update order', 500);
    }

    return updatedOrder;
  }
}

export class AddTrackingUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, awbNumber: string, courierService: CourierService): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.isCancelled) {
      throw new AppError('Cannot add tracking to a cancelled order', 400);
    }

    // Generate tracking URL
    const trackingUrl = Order.generateTrackingUrl(awbNumber, courierService);

    const updatedOrder = await this.orderRepository.update(orderId, {
      tracking: {
        awbNumber,
        courierService,
        trackingUrl,
        shippedAt: new Date()
      },
      status: OrderStatus.SHIPPED
    });

    if (!updatedOrder) {
      throw new AppError('Failed to add tracking', 500);
    }

    return updatedOrder;
  }
}

export class GetCourierServicesUseCase {
  execute(): { value: string; label: string; trackingUrlTemplate: string }[] {
    return [
      { value: CourierService.DELHIVERY, label: 'Delhivery', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.DELHIVERY] },
      { value: CourierService.BLUEDART, label: 'Blue Dart', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.BLUEDART] },
      { value: CourierService.DTDC, label: 'DTDC', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.DTDC] },
      { value: CourierService.ECOM_EXPRESS, label: 'Ecom Express', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.ECOM_EXPRESS] },
      { value: CourierService.XPRESSBEES, label: 'XpressBees', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.XPRESSBEES] },
      { value: CourierService.SHADOWFAX, label: 'Shadowfax', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.SHADOWFAX] },
      { value: CourierService.INDIA_POST, label: 'India Post', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.INDIA_POST] },
      { value: CourierService.PROFESSIONAL_COURIER, label: 'Professional Courier', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.PROFESSIONAL_COURIER] },
      { value: CourierService.FEDEX, label: 'FedEx', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.FEDEX] },
      { value: CourierService.DHL, label: 'DHL', trackingUrlTemplate: COURIER_TRACKING_URLS[CourierService.DHL] },
      { value: CourierService.OTHER, label: 'Other', trackingUrlTemplate: '' }
    ];
  }
}

export class UploadInvoiceUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, invoiceUrl: string, publicId: string, originalName: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updatedOrder = await this.orderRepository.update(orderId, {
      invoice: {
        url: invoiceUrl,
        publicId: publicId,
        originalName: originalName,
        uploadedAt: new Date()
      }
    });

    if (!updatedOrder) {
      throw new AppError('Failed to upload invoice', 500);
    }

    return updatedOrder;
  }
}

export class DeleteInvoiceUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string): Promise<{ order: Order; publicId: string }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.invoice) {
      throw new AppError('No invoice found for this order', 404);
    }

    const publicId = order.invoice.publicId;

    // Use removeInvoice method which uses $unset to properly remove the field
    const updatedOrder = await this.orderRepository.removeInvoice(orderId);

    if (!updatedOrder) {
      throw new AppError('Failed to delete invoice', 500);
    }

    return { order: updatedOrder, publicId };
  }
}

export class GetOrderStatsUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    const [total, pending, confirmed, processing, shipped, delivered, cancelled] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ status: OrderStatus.PENDING }),
      this.orderRepository.count({ status: OrderStatus.CONFIRMED }),
      this.orderRepository.count({ status: OrderStatus.PROCESSING }),
      this.orderRepository.count({ status: OrderStatus.SHIPPED }),
      this.orderRepository.count({ status: OrderStatus.DELIVERED }),
      this.orderRepository.count({ status: OrderStatus.CANCELLED })
    ]);

    return { total, pending, confirmed, processing, shipped, delivered, cancelled };
  }
}
