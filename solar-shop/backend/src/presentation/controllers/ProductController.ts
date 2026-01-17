import { Request, Response, NextFunction } from 'express';
import {
  CreateProductUseCase,
  GetProductByIdUseCase,
  GetProductBySlugUseCase,
  GetAllProductsUseCase,
  GetFeaturedProductsUseCase,
  GetProductsByCategoryUseCase,
  SearchProductsUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  BlockProductUseCase,
  UnblockProductUseCase,
  SetFeaturedProductUseCase,
  GetProductStatsUseCase
} from '../../application/use-cases/product/ProductUseCases';
import { MongoProductRepository } from '../../infrastructure/database/repositories';
import { ProductCategory, ProductStatus } from '../../domain/entities/Product';
import { deleteFromCloudinary, extractPublicId } from '../../infrastructure/config/cloudinary';

const productRepository = new MongoProductRepository();

// Interface for Cloudinary uploaded file
interface CloudinaryFile extends Express.Multer.File {
  path: string; // Cloudinary URL
  filename: string; // Cloudinary public ID
}

export class ProductController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateProductUseCase(productRepository);
      
      // Handle Cloudinary uploaded images
      let images: string[] = [];
      let imagePublicIds: string[] = [];
      
      if (req.files && Array.isArray(req.files)) {
        const cloudinaryFiles = req.files as CloudinaryFile[];
        images = cloudinaryFiles.map(f => f.path); // Cloudinary URLs
        imagePublicIds = cloudinaryFiles.map(f => f.filename); // Cloudinary public IDs
      } else if (req.body.images) {
        // If images are passed as URLs (for editing)
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      }

      // Parse priceTiers if provided
      let priceTiers = [];
      if (req.body.priceTiers) {
        priceTiers = JSON.parse(req.body.priceTiers);
      }

      const product = await useCase.execute({
        ...req.body,
        images,
        imagePublicIds,
        specifications: JSON.parse(req.body.specifications || '[]'),
        features: JSON.parse(req.body.features || '[]'),
        priceTiers,
        price: parseFloat(req.body.price),
        discountPrice: req.body.discountPrice ? parseFloat(req.body.discountPrice) : undefined,
        gstRate: req.body.gstRate ? parseInt(req.body.gstRate) : 18,
        stock: parseInt(req.body.stock)
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('the loger---> ', req.params.id)
      const useCase = new GetProductByIdUseCase(productRepository);
      const product = await useCase.execute(req.params.id, true);

      res.json({
        success: true,
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetProductBySlugUseCase(productRepository);
      const product = await useCase.execute(req.params.slug);

      res.json({
        success: true,
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetAllProductsUseCase(productRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as ProductCategory;
      if (req.query.status) filters.status = req.query.status as ProductStatus;
      if (req.query.isFeatured) filters.isFeatured = req.query.isFeatured === 'true';
      if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
      if (req.query.search) filters.search = req.query.search as string;

      const result = await useCase.execute({ page, limit, sortBy, sortOrder }, filters);

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(p => p.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetFeaturedProductsUseCase(productRepository);
      const limit = parseInt(req.query.limit as string) || 8;
      const products = await useCase.execute(limit);

      res.json({
        success: true,
        data: products.map(p => p.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetProductsByCategoryUseCase(productRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;

      const result = await useCase.execute(
        req.params.category as ProductCategory,
        { page, limit }
      );

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(p => p.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new SearchProductsUseCase(productRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const query = req.query.q as string || '';

      const result = await useCase.execute(query, { page, limit });

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(p => p.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new UpdateProductUseCase(productRepository);
      
      // Get existing product to handle image deletion
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const existingProduct = await getUseCase.execute(req.params.id, false);
      
      const updateData: any = { ...req.body };
      
      // Parse existing images to keep
      let existingImages: string[] = [];
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch (e) {
          existingImages = [];
        }
      }

      // Parse images to delete
      let imagesToDelete: string[] = [];
      if (req.body.imagesToDelete) {
        try {
          imagesToDelete = JSON.parse(req.body.imagesToDelete);
        } catch (e) {
          imagesToDelete = [];
        }
      }

      // Delete images that were marked for deletion from Cloudinary
      if (imagesToDelete.length > 0) {
        const oldPublicIds = existingProduct.imagePublicIds || [];
        const oldImages = existingProduct.images || [];
        
        for (let i = 0; i < oldImages.length; i++) {
          if (imagesToDelete.includes(oldImages[i]) && oldPublicIds[i]) {
            await deleteFromCloudinary(oldPublicIds[i], 'image');
          }
        }
      }

      // Handle new Cloudinary uploaded images
      let newImages: string[] = [];
      let newImagePublicIds: string[] = [];
      
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const cloudinaryFiles = req.files as CloudinaryFile[];
        newImages = cloudinaryFiles.map(f => f.path);
        newImagePublicIds = cloudinaryFiles.map(f => f.filename);
      }

      // Combine existing images (not deleted) with new images
      const keptImagePublicIds: string[] = [];
      const oldImages = existingProduct.images || [];
      const oldPublicIds = existingProduct.imagePublicIds || [];
      
      for (let i = 0; i < oldImages.length; i++) {
        if (existingImages.includes(oldImages[i]) && oldPublicIds[i]) {
          keptImagePublicIds.push(oldPublicIds[i]);
        }
      }

      updateData.images = [...existingImages, ...newImages];
      updateData.imagePublicIds = [...keptImagePublicIds, ...newImagePublicIds];
      
      if (req.body.specifications) {
        updateData.specifications = JSON.parse(req.body.specifications);
      }
      if (req.body.features) {
        updateData.features = JSON.parse(req.body.features);
      }
      if (req.body.priceTiers) {
        updateData.priceTiers = JSON.parse(req.body.priceTiers);
      }
      if (req.body.price) {
        updateData.price = parseFloat(req.body.price);
      }
      if (req.body.discountPrice) {
        updateData.discountPrice = parseFloat(req.body.discountPrice);
      } else if (req.body.discountPrice === '') {
        updateData.discountPrice = undefined;
      }
      if (req.body.gstRate !== undefined) {
        updateData.gstRate = parseInt(req.body.gstRate);
      }
      if (req.body.stock) {
        updateData.stock = parseInt(req.body.stock);
      }
      if (req.body.isFeatured !== undefined) {
        updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
      }

      // Clean up body fields that shouldn't be passed to update
      delete updateData.existingImages;
      delete updateData.imagesToDelete;

      const product = await useCase.execute(req.params.id, updateData);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get product to delete images from Cloudinary
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const product = await getUseCase.execute(req.params.id, false);
      
      // Delete images from Cloudinary
      const imagePublicIds = product.imagePublicIds || [];
      for (const publicId of imagePublicIds) {
        await deleteFromCloudinary(publicId, 'image');
      }
      
      // Delete video from Cloudinary if exists
      if (product.video?.publicId) {
        await deleteFromCloudinary(product.video.publicId, 'video');
      }
      
      const useCase = new DeleteProductUseCase(productRepository);
      await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async block(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new BlockProductUseCase(productRepository);
      const product = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Product blocked successfully',
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async unblock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new UnblockProductUseCase(productRepository);
      const product = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Product unblocked successfully',
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async setFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new SetFeaturedProductUseCase(productRepository);
      const product = await useCase.execute(req.params.id, req.body.featured);

      res.json({
        success: true,
        message: `Product ${req.body.featured ? 'marked as' : 'removed from'} featured`,
        data: product.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetProductStatsUseCase(productRepository);
      const stats = await useCase.execute();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload product video to Cloudinary
  static async uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No video file uploaded'
        });
        return;
      }

      const cloudinaryFile = req.file as CloudinaryFile;
      
      // Get existing product
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const product = await getUseCase.execute(productId, false);
      
      // Delete old video from Cloudinary if exists
      if (product.video?.publicId) {
        await deleteFromCloudinary(product.video.publicId, 'video');
      }
      
      // Update product with new video
      const updateUseCase = new UpdateProductUseCase(productRepository);
      const updatedProduct = await updateUseCase.execute(productId, {
        video: {
          url: cloudinaryFile.path,
          publicId: cloudinaryFile.filename,
          thumbnail: cloudinaryFile.path.replace(/\.[^.]+$/, '.jpg') // Auto-generated thumbnail
        }
      });

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          video: updatedProduct.video,
          product: updatedProduct.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product video from Cloudinary
  static async deleteVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id;
      
      // Get existing product
      const getUseCase = new GetProductByIdUseCase(productRepository);
      const product = await getUseCase.execute(productId, false);
      
      if (!product.video?.publicId) {
        res.status(404).json({
          success: false,
          message: 'No video found for this product'
        });
        return;
      }
      
      // Delete video from Cloudinary
      await deleteFromCloudinary(product.video.publicId, 'video');
      
      // Update product to remove video
      const updateUseCase = new UpdateProductUseCase(productRepository);
      const updatedProduct = await updateUseCase.execute(productId, {
        video: undefined
      });

      res.json({
        success: true,
        message: 'Video deleted successfully',
        data: updatedProduct.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}
