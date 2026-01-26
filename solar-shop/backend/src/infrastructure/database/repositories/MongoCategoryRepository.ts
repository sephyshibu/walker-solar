import { Category, CategoryStatus, CategoryProps } from '../../../domain/entities/Category';
import { ICategoryRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { CategoryModel, CategoryDocument } from '../models/CategoryModel';

export class MongoCategoryRepository implements ICategoryRepository {
  private documentToEntity(doc: CategoryDocument): Category {
    return new Category({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      image: doc.image,
      imagePublicId: doc.imagePublicId,
      status: doc.status as CategoryStatus,
      sortOrder: doc.sortOrder,
      productCount: doc.productCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(category: Category): Promise<Category> {
    const doc = await CategoryModel.create(category.toObject());
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<Category | null> {
    const doc = await CategoryModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({ slug });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    const doc = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findAll(
    options: PaginationOptions,
    filters?: { status?: CategoryStatus }
  ): Promise<PaginatedResult<Category>> {
    const query: any = {};
    
    if (filters?.status) query.status = filters.status;

    const total = await CategoryModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await CategoryModel.find(query)
      .sort({ [options.sortBy || 'sortOrder']: options.sortOrder === 'desc' ? -1 : 1 })
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

  async findAllActive(): Promise<Category[]> {
    const docs = await CategoryModel.find({ status: CategoryStatus.ACTIVE })
      .sort({ sortOrder: 1, name: 1 });
    return docs.map(doc => this.documentToEntity(doc));
  }

  async update(id: string, data: Partial<CategoryProps>): Promise<Category | null> {
    const doc = await CategoryModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await CategoryModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateProductCount(id: string, count: number): Promise<Category | null> {
    const doc = await CategoryModel.findByIdAndUpdate(
      id,
      { $set: { productCount: count } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async count(filters?: { status?: CategoryStatus }): Promise<number> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    return CategoryModel.countDocuments(query);
  }
}