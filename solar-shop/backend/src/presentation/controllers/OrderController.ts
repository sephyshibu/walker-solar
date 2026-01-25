import { Request, Response, NextFunction } from 'express';
import {
  CreateOrderUseCase,
  GetOrderByIdUseCase,
  GetOrderByNumberUseCase,
  GetUserOrdersUseCase,
  GetAllOrdersUseCase,
  UpdateOrderStatusUseCase,
  CancelOrderUseCase,
  MarkWhatsAppSentUseCase,
  GetOrderStatsUseCase,
  AddTrackingUseCase,
  GetCourierServicesUseCase,
  UploadInvoiceUseCase,
  DeleteInvoiceUseCase
} from '../../application/use-cases/order/OrderUseCases';
import { 
  MongoOrderRepository, 
  MongoCartRepository, 
  MongoProductRepository,
  MongoUserRepository 
} from '../../infrastructure/database/repositories';
import { OrderStatus, CourierService } from '../../domain/entities/Order';
import { deleteFromCloudinary } from '../../infrastructure/config/cloudinary';

const orderRepository = new MongoOrderRepository();
const cartRepository = new MongoCartRepository();
const productRepository = new MongoProductRepository();
const userRepository = new MongoUserRepository();

// Interface for Cloudinary uploaded file
interface CloudinaryFile extends Express.Multer.File {
  path: string; // Cloudinary URL
  filename: string; // Cloudinary public ID
}

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateOrderUseCase(
        orderRepository, 
        cartRepository, 
        productRepository,
        userRepository
      );
      
      const result = await useCase.execute({
        userId: req.user!.userId,
        shippingAddress: req.body.shippingAddress,
        notes: req.body.notes
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
          order: result.order.toJSON(),
          whatsappUrl: result.whatsappUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetOrderByIdUseCase(orderRepository);
      const order = await useCase.execute(req.params.id, req.user?.userId);

      res.json({
        success: true,
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetOrderByNumberUseCase(orderRepository);
      const order = await useCase.execute(req.params.orderNumber);

      res.json({
        success: true,
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetUserOrdersUseCase(orderRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await useCase.execute(req.user!.userId, { page, limit });

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(o => o.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetAllOrdersUseCase(orderRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as OrderStatus;
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await useCase.execute({ page, limit, sortBy, sortOrder }, filters);

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(o => o.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new UpdateOrderStatusUseCase(orderRepository);
      const order = await useCase.execute(req.params.id, req.body.status);

      res.json({
        success: true,
        message: 'Order status updated',
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CancelOrderUseCase(orderRepository, productRepository);
      const order = await useCase.execute(req.params.id, req.user?.userId);

      res.json({
        success: true,
        message: 'Order cancelled',
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async markWhatsAppSent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new MarkWhatsAppSentUseCase(orderRepository);
      const order = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'WhatsApp status updated',
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async addTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { awbNumber, courierService } = req.body;
      
      if (!awbNumber || !courierService) {
        res.status(400).json({
          success: false,
          message: 'AWB number and courier service are required'
        });
        return;
      }

      const useCase = new AddTrackingUseCase(orderRepository);
      const order = await useCase.execute(req.params.id, awbNumber, courierService as CourierService);

      res.json({
        success: true,
        message: 'Tracking information added successfully',
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

 static async uploadInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No invoice file uploaded'
      });
      return;
    }

    const cloudinaryFile = req.file as CloudinaryFile;
    
    // Debug logging
    console.log('Upload invoice - File object:', JSON.stringify(req.file, null, 2));
    
    const originalName = req.file.originalname || 'invoice.pdf';
    // Cloudinary multer storage puts the URL in 'path' and public_id in 'filename'
    const invoiceUrl = cloudinaryFile.path;
    const publicId = cloudinaryFile.filename;
    
    console.log('Invoice URL:', invoiceUrl);
    console.log('Public ID:', publicId);
    console.log('Original Name:', originalName);
    
    const useCase = new UploadInvoiceUseCase(orderRepository);
    const order = await useCase.execute(req.params.id, invoiceUrl, publicId, originalName);

    res.json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: order.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

  static async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new DeleteInvoiceUseCase(orderRepository);
      const { order, publicId } = await useCase.execute(req.params.id);

      // Delete from Cloudinary
      // Check if it's a PDF (raw) or image
      const isPdf = publicId.includes('.pdf') || order.invoice?.url.includes('.pdf');
      await deleteFromCloudinary(publicId, isPdf ? 'raw' as any : 'image');

      res.json({
        success: true,
        message: 'Invoice deleted successfully',
        data: order.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourierServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetCourierServicesUseCase();
      const services = useCase.execute();

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetOrderStatsUseCase(orderRepository);
      const stats = await useCase.execute();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
