import { Category, CategoryStatus, CategoryProps } from '../../../domain/entities/Category';
import { ICategoryRepository, IProductRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

interface CreateCategoryDTO {
  name: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  sortOrder?: number;
}

export class CreateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(data: CreateCategoryDTO): Promise<Category> {
    // Check if category with same name exists
    const existingCategory = await this.categoryRepository.findByName(data.name);
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }

    const category = new Category({
      name: data.name,
      description: data.description,
      image: data.image,
      imagePublicId: data.imagePublicId,
      sortOrder: data.sortOrder || 0,
      status: CategoryStatus.ACTIVE,
      productCount: 0
    });

    return this.categoryRepository.create(category);
  }
}

export class GetCategoryByIdUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }
}

export class GetCategoryBySlugUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }
}

export class GetAllCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: { status?: CategoryStatus }
  ): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.findAll(options, filters);
  }
}

export class GetActiveCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAllActive();
  }
}

interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  sortOrder?: number;
  status?: CategoryStatus;
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string, data: UpdateCategoryDTO): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== category.name) {
      const existingCategory = await this.categoryRepository.findByName(data.name);
      if (existingCategory && existingCategory.id !== id) {
        throw new AppError('Category with this name already exists', 400);
      }
    }

    // Generate new slug if name is updated
    const updateData: Partial<CategoryProps> = { ...data };
    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
    }

    const updatedCategory = await this.categoryRepository.update(id, updateData);
    if (!updatedCategory) {
      throw new AppError('Failed to update category', 500);
    }

    return updatedCategory;
  }
}

export class DeleteCategoryUseCase {
  constructor(
    private categoryRepository: ICategoryRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if any products are using this category
    const productCount = await this.productRepository.count({ category: category.slug as any });
    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category. ${productCount} product(s) are using this category. Please reassign them first.`,
        400
      );
    }

    const deleted = await this.categoryRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete category', 500);
    }
  }
}

export class ToggleCategoryStatusUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const newStatus = category.status === CategoryStatus.ACTIVE 
      ? CategoryStatus.INACTIVE 
      : CategoryStatus.ACTIVE;

    const updatedCategory = await this.categoryRepository.update(id, { status: newStatus });
    if (!updatedCategory) {
      throw new AppError('Failed to update category status', 500);
    }

    return updatedCategory;
  }
}

export class GetCategoryStatsUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(): Promise<{ total: number; active: number; inactive: number }> {
    const total = await this.categoryRepository.count();
    const active = await this.categoryRepository.count({ status: CategoryStatus.ACTIVE });
    const inactive = await this.categoryRepository.count({ status: CategoryStatus.INACTIVE });

    return { total, active, inactive };
  }
}

export class UpdateCategoryProductCountUseCase {
  constructor(
    private categoryRepository: ICategoryRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(categorySlug: string): Promise<Category | null> {
    const category = await this.categoryRepository.findBySlug(categorySlug);
    if (!category) {
      return null;
    }

    const productCount = await this.productRepository.count({ category: categorySlug as any });
    return this.categoryRepository.updateProductCount(category.id, productCount);
  }
}