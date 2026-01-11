import { Order, OrderStatus, OrderProps, CourierService } from '../../../domain/entities/Order';
import { IOrderRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { OrderModel, OrderDocument } from '../models/OrderModel';

export class MongoOrderRepository implements IOrderRepository {
  private documentToEntity(doc: OrderDocument): Order {
    return new Order({
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      userId: doc.userId,
      userEmail: doc.userEmail,
      userName: doc.userName,
      items: doc.items,
      shippingAddress: doc.shippingAddress,
      totalAmount: doc.totalAmount,
      totalItems: doc.totalItems,
      status: doc.status as OrderStatus,
      notes: doc.notes,
      whatsappSent: doc.whatsappSent,
      tracking: doc.tracking ? {
        awbNumber: doc.tracking.awbNumber,
        courierService: doc.tracking.courierService as CourierService,
        trackingUrl: doc.tracking.trackingUrl,
        shippedAt: doc.tracking.shippedAt
      } : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(order: Order): Promise<Order> {
    const doc = await OrderModel.create(order.toObject());
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const doc = await OrderModel.findOne({ orderNumber });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult<Order>> {
    const query = { userId };
    const total = await OrderModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    return {
      data: docs.map(doc => this.documentToEntity(doc)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };
  }

  async findAll(
    options: PaginationOptions,
    filters?: { status?: OrderStatus; userId?: string; startDate?: Date; endDate?: Date }
  ): Promise<PaginatedResult<Order>> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const total = await OrderModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await OrderModel.find(query)
      .sort({ [options.sortBy || 'createdAt']: options.sortOrder === 'asc' ? 1 : -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    return {
      data: docs.map(doc => this.documentToEntity(doc)),
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };
  }

  async update(id: string, data: Partial<OrderProps>): Promise<Order | null> {
    const doc = await OrderModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const doc = await OrderModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async count(filters?: { status?: OrderStatus; userId?: string }): Promise<number> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.userId) query.userId = filters.userId;
    return OrderModel.countDocuments(query);
  }
}
