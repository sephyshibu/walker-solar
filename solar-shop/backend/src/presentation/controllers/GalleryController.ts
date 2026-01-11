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

const galleryRepository = new MongoGalleryRepository();

export class GalleryController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateGalleryItemUseCase(galleryRepository);
      
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        imageUrl = `/uploads/gallery/${req.file.filename}`;
      }

      const item = await useCase.execute({
        ...req.body,
        imageUrl,
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
      const useCase = new UpdateGalleryItemUseCase(galleryRepository);
      
      const updateData: any = { ...req.body };
      
      if (req.file) {
        updateData.imageUrl = `/uploads/gallery/${req.file.filename}`;
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
      const useCase = new DeleteGalleryItemUseCase(galleryRepository);
      await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'Gallery item deleted successfully'
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
