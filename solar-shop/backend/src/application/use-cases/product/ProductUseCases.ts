import { Product, ProductStatus, ProductSpecification, ProductVideo, PriceTier } from '../../../domain/entities/Product';
import { IProductRepository, ICategoryRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

interface CreateProductDTO {
  name: string;
  description: string;
  shortDescription?: string;
  category: string; // Category ID instead of enum
  price: number;
  discountPrice?: number;
  priceTiers?: PriceTier[];
  images: string[];
  imagePublicIds?: string[];
  video?: ProductVideo;
  specifications: ProductSpecification[];
  features: string[];
  stock: number;
  sku: string;
  brand?: string;
  warranty?: string;
  isFeatured?: boolean;
}

interface UpdateProductDTO {
  name?: string;
  description?: string;
  shortDescription?: string;
  category?: string; // Category ID instead of enum
  price?: number;
  discountPrice?: number;
  priceTiers?: PriceTier[];
  images?: string[];
  imagePublicIds?: string[];
  video?: ProductVideo;
  specifications?: ProductSpecification[];
  features?: string[];
  stock?: number;
  sku?: string;
  brand?: string;
  warranty?: string;
  isFeatured?: boolean;
  status?: ProductStatus;
}

interface ProductFilters {
  category?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export class CreateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(data: CreateProductDTO): Promise<Product> {
    // Validate category exists
    const categoryExists = await this.categoryRepository.findById(data.category);
    if (!categoryExists) {
      throw new AppError('Invalid category', 400);
    }

    const existingSku = await this.productRepository.findBySku(data.sku);
    if (existingSku) {
      throw new AppError('Product with this SKU already exists', 400);
    }

    const product = new Product({
      ...data,
      isFeatured: data.isFeatured ?? false,
      status: ProductStatus.ACTIVE,
      viewCount: 0
    });

    return this.productRepository.create(product);
  }
}

export class GetProductByIdUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, incrementView: boolean = false): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (incrementView) {
      await this.productRepository.incrementViewCount(id);
    }

    return product;
  }
}

export class GetProductBySlugUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.productRepository.incrementViewCount(product.id);
    return product;
  }
}

export class GetAllProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: ProductFilters
  ): Promise<PaginatedResult<Product>> {
    return this.productRepository.findAll(options, filters);
  }
}

export class GetFeaturedProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(limit?: number): Promise<Product[]> {
    return this.productRepository.findFeatured(limit);
  }
}

export class GetProductsByCategoryUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(category: string, options: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.productRepository.findByCategory(category, options);
  }
}

export class SearchProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(query: string, options: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.productRepository.search(query, options);
  }
}

export class UpdateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(id: string, data: UpdateProductDTO): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Validate category if updating
    if (data.category) {
      const categoryExists = await this.categoryRepository.findById(data.category);
      if (!categoryExists) {
        throw new AppError('Invalid category', 400);
      }
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku);
      if (existingSku) {
        throw new AppError('Product with this SKU already exists', 400);
      }
    }

    const updatedProduct = await this.productRepository.update(id, data);
    if (!updatedProduct) {
      throw new AppError('Failed to update product', 500);
    }

    return updatedProduct;
  }
}

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.productRepository.delete(id);
  }
}

export class BlockProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updatedProduct = await this.productRepository.updateStatus(id, ProductStatus.BLOCKED);
    if (!updatedProduct) {
      throw new AppError('Failed to block product', 500);
    }

    return updatedProduct;
  }
}

export class UnblockProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const newStatus = product.stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;
    const updatedProduct = await this.productRepository.updateStatus(id, newStatus);
    if (!updatedProduct) {
      throw new AppError('Failed to unblock product', 500);
    }

    return updatedProduct;
  }
}

export class SetFeaturedProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, featured: boolean): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const updatedProduct = await this.productRepository.update(id, { isFeatured: featured });
    if (!updatedProduct) {
      throw new AppError('Failed to update product', 500);
    }

    return updatedProduct;
  }
}

export class GetProductStatsUseCase {
  constructor(
    private productRepository: IProductRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(): Promise<{
    total: number;
    active: number;
    blocked: number;
    outOfStock: number;
    byCategory: Record<string, number>;
  }> {
    const [total, active, blocked, outOfStock] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ status: ProductStatus.ACTIVE }),
      this.productRepository.count({ status: ProductStatus.BLOCKED }),
      this.productRepository.count({ status: ProductStatus.OUT_OF_STOCK })
    ]);

    // Get all categories with pagination (get up to 1000 categories)
    const categoriesResult = await this.categoryRepository.findAll(
      { page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' },
      {}
    );

    // Build category stats using the data array from PaginatedResult
    const byCategoryEntries = await Promise.all(
      categoriesResult.data.map(async (category) => {
        const count = await this.productRepository.count({ category: category.id as any });
        return [category.name, count] as [string, number];
      })
    );

    const byCategory = Object.fromEntries(byCategoryEntries);

    return { total, active, blocked, outOfStock, byCategory };
  }
}