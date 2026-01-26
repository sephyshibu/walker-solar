import { Request, Response, NextFunction } from 'express';
import {
  CreateGalleryItemUseCase,
  GetGalleryItemByIdUseCase,
  GetAllGalleryItemsUseCase,
  GetGalleryByCategoryUseCase,
  UpdateGalleryItemUseCase,
  DeleteGalleryItemUseCase,
  ToggleGalleryItemActiveUseCase
} from '../../application/use-cases/gallery/GalleryUseCases';
import { MongoGalleryRepository } from '../../infrastructure/database/repositories';
import { GalleryCategory } from '../../domain/entities/Gallery';
import { deleteFromCloudinary } from '../../infrastructure/config/cloudinary';

const galleryRepository = new MongoGalleryRepository();

// Extended multer file type for Cloudinary storage
interface CloudinaryFile extends Express.Multer.File {
  path: string;      // Cloudinary URL
  filename: string;  // Cloudinary public_id
}

export class GalleryController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateGalleryItemUseCase(galleryRepository);
      
      let imageUrl = req.body.imageUrl;
      let imagePublicId: string | undefined;
      
      // Handle Cloudinary upload
      if (req.file) {
        const cloudinaryFile = req.file as CloudinaryFile;
        imageUrl = cloudinaryFile.path;
        imagePublicId = cloudinaryFile.filename;
      }

      const item = await useCase.execute({
        ...req.body,
        imageUrl,
        imagePublicId,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        sortOrder: req.body.sortOrder ? parseInt(req.body.sortOrder) : 0
      });

      res.status(201).json({
        success: true,
        message: 'Gallery item created successfully',
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetGalleryItemByIdUseCase(galleryRepository);
      const item = await useCase.execute(req.params.id);

      res.json({
        success: true,
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetAllGalleryItemsUseCase(galleryRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.category) filters.category = req.query.category as GalleryCategory;
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

      const result = await useCase.execute({ page, limit }, filters);

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(i => i.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetGalleryByCategoryUseCase(galleryRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await useCase.execute(
        req.params.category as GalleryCategory,
        { page, limit }
      );

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(i => i.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get existing item to potentially delete old image
      const getUseCase = new GetGalleryItemByIdUseCase(galleryRepository);
      const existingItem = await getUseCase.execute(req.params.id);
      
      const useCase = new UpdateGalleryItemUseCase(galleryRepository);
      
      const updateData: any = { ...req.body };
      
      // Handle Cloudinary upload
      if (req.file) {
        const cloudinaryFile = req.file as CloudinaryFile;
        
        // Delete old image if exists
        if ((existingItem as any).imagePublicId) {
          await deleteFromCloudinary((existingItem as any).imagePublicId);
        }
        
        updateData.imageUrl = cloudinaryFile.path;
        updateData.imagePublicId = cloudinaryFile.filename;
      }
      if (req.body.tags) {
        updateData.tags = JSON.parse(req.body.tags);
      }
      if (req.body.sortOrder) {
        updateData.sortOrder = parseInt(req.body.sortOrder);
      }

      const item = await useCase.execute(req.params.id, updateData);

      res.json({
        success: true,
        message: 'Gallery item updated successfully',
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get item to delete image from Cloudinary
      const getUseCase = new GetGalleryItemByIdUseCase(galleryRepository);
      const item = await getUseCase.execute(req.params.id);
      
      const useCase = new DeleteGalleryItemUseCase(galleryRepository);
      await useCase.execute(req.params.id);
      
      // Delete image from Cloudinary
      if ((item as any).imagePublicId) {
        await deleteFromCloudinary((item as any).imagePublicId);
      }

      res.json({
        success: true,
        message: 'Gallery item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await galleryRepository.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ToggleGalleryItemActiveUseCase(galleryRepository);
      const item = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: `Gallery item ${item.isActive ? 'activated' : 'deactivated'}`,
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }
}