import { Product, ProductStatus, ProductProps } from '../../../domain/entities/Product';
import { IProductRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { ProductModel, ProductDocument } from '../models/ProductModel';

export class MongoProductRepository implements IProductRepository {
  private documentToEntity(doc: ProductDocument): Product {
    return new Product({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      shortDescription: doc.shortDescription,
      category: doc.category.toString(),
      price: doc.price,
      discountPrice: doc.discountPrice,
    priceTiers: doc.priceTiers || [],  // ✅ Now included!
    images: doc.images,
    imagePublicIds: doc.imagePublicIds || [],
    video: doc.video,
   
      specifications: doc.specifications,
      features: doc.features,
      stock: doc.stock,
      sku: doc.sku,
      brand: doc.brand,
      warranty: doc.warranty,
      status: doc.status as ProductStatus,
      isFeatured: doc.isFeatured,
      viewCount: doc.viewCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(product: Product): Promise<Product> {
    const doc = await ProductModel.create(product.toObject());
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ slug });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ sku: sku.toUpperCase() });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findAll(
    options: PaginationOptions,
    filters?: {
      category?: string;

      status?: ProductStatus;
      isFeatured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
    }
  ): Promise<PaginatedResult<Product>> {
    const query: any = {};
    
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    if (filters?.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    const total = await ProductModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await ProductModel.find(query)
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

  async update(id: string, data: Partial<ProductProps>): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async incrementViewCount(id: string): Promise<void> {
    await ProductModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  }

  async findFeatured(limit: number = 8): Promise<Product[]> {
    const docs = await ProductModel.find({ 
      isFeatured: true, 
      status: ProductStatus.ACTIVE 
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    return docs.map(doc => this.documentToEntity(doc));
  }

  async findByCategory(category: string, options: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll(options, { category, status: ProductStatus.ACTIVE });
  }

  async count(filters?: { category?: string; status?: ProductStatus }): Promise<number> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.status) query.status = filters.status;
    return ProductModel.countDocuments(query);
  }

  async search(query: string, options: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll(options, { search: query, status: ProductStatus.ACTIVE });
  }
}
