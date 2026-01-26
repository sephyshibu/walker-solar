import { Request, Response, NextFunction } from 'express';
import {
  CreateCategoryUseCase,
  GetCategoryByIdUseCase,
  GetCategoryBySlugUseCase,
  GetAllCategoriesUseCase,
  GetActiveCategoriesUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  ToggleCategoryStatusUseCase,
  GetCategoryStatsUseCase
} from '../../application/use-cases/category/CategoryUseCases';
import { MongoCategoryRepository } from '../../infrastructure/database/repositories/MongoCategoryRepository';
import { MongoProductRepository } from '../../infrastructure/database/repositories/MongoProductRepository';
import { CategoryStatus } from '../../domain/entities/Category';
import { deleteFromCloudinary } from '../../infrastructure/config/cloudinary';

const categoryRepository = new MongoCategoryRepository();
const productRepository = new MongoProductRepository();

// Extended multer file type for Cloudinary storage
interface CloudinaryFile extends Express.Multer.File {
  path: string;      // Cloudinary URL
  filename: string;  // Cloudinary public_id
}

export class CategoryController {
  // Create a new category
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, sortOrder } = req.body;
      let image: string | undefined;
      let imagePublicId: string | undefined;

      // Handle image upload (multer-cloudinary already uploaded it)
      if (req.file) {
        const cloudinaryFile = req.file as CloudinaryFile;
        image = cloudinaryFile.path;
        imagePublicId = cloudinaryFile.filename;
      }

      const useCase = new CreateCategoryUseCase(categoryRepository);
      const category = await useCase.execute({
        name,
        description,
        image,
        imagePublicId,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const useCase = new GetCategoryByIdUseCase(categoryRepository);
      const category = await useCase.execute(id);

      res.json({
        success: true,
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get category by slug
  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const useCase = new GetCategoryBySlugUseCase(categoryRepository);
      const category = await useCase.execute(slug);

      res.json({
        success: true,
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all categories (admin - paginated)
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
        status
      } = req.query;

      const useCase = new GetAllCategoriesUseCase(categoryRepository);
      const result = await useCase.execute(
        {
          page: Number(page),
          limit: Number(limit),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        },
        {
          status: status as CategoryStatus | undefined
        }
      );

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(cat => cat.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active categories (public - for dropdowns)
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetActiveCategoriesUseCase(categoryRepository);
      const categories = await useCase.execute();

      res.json({
        success: true,
        data: categories.map(cat => cat.toJSON())
      });
    } catch (error) {
      next(error);
    }
  }

  // Update category
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, sortOrder, status } = req.body;
      
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
      if (status) updateData.status = status;

      // Handle image upload
      if (req.file) {
        // Get existing category to delete old image
        const getCategoryUseCase = new GetCategoryByIdUseCase(categoryRepository);
        const existingCategory = await getCategoryUseCase.execute(id);
        
        // Delete old image if exists
        if (existingCategory.imagePublicId) {
          await deleteFromCloudinary(existingCategory.imagePublicId);
        }

        // Image already uploaded by multer-cloudinary
        const cloudinaryFile = req.file as CloudinaryFile;
        updateData.image = cloudinaryFile.path;
        updateData.imagePublicId = cloudinaryFile.filename;
      }

      const useCase = new UpdateCategoryUseCase(categoryRepository);
      const category = await useCase.execute(id, updateData);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete category
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Get category to delete image
      const getCategoryUseCase = new GetCategoryByIdUseCase(categoryRepository);
      const category = await getCategoryUseCase.execute(id);

      const useCase = new DeleteCategoryUseCase(categoryRepository, productRepository);
      await useCase.execute(id);

      // Delete image from Cloudinary
      if (category.imagePublicId) {
        await deleteFromCloudinary(category.imagePublicId);
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle category status (active/inactive)
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const useCase = new ToggleCategoryStatusUseCase(categoryRepository);
      const category = await useCase.execute(id);

      res.json({
        success: true,
        message: `Category ${category.status === CategoryStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`,
        data: category.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get category stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetCategoryStatsUseCase(categoryRepository);
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

export const categoryController = new CategoryController();