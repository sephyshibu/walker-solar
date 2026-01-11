import { GalleryItem, GalleryCategory, GalleryItemProps } from '../../../domain/entities/Gallery';
import { IGalleryRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { GalleryModel, GalleryDocument } from '../models/GalleryModel';

export class MongoGalleryRepository implements IGalleryRepository {
  private documentToEntity(doc: GalleryDocument): GalleryItem {
    return new GalleryItem({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      imageUrl: doc.imageUrl,
      thumbnailUrl: doc.thumbnailUrl,
      category: doc.category as GalleryCategory,
      tags: doc.tags,
      isActive: doc.isActive,
      sortOrder: doc.sortOrder,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(item: GalleryItem): Promise<GalleryItem> {
    const doc = await GalleryModel.create(item.toObject());
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<GalleryItem | null> {
    const doc = await GalleryModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findAll(
    options: PaginationOptions,
    filters?: { category?: GalleryCategory; isActive?: boolean }
  ): Promise<PaginatedResult<GalleryItem>> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    const total = await GalleryModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await GalleryModel.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
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

  async findByCategory(category: GalleryCategory, options: PaginationOptions): Promise<PaginatedResult<GalleryItem>> {
    return this.findAll(options, { category, isActive: true });
  }

  async update(id: string, data: Partial<GalleryItemProps>): Promise<GalleryItem | null> {
    const doc = await GalleryModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await GalleryModel.findByIdAndDelete(id);
    return !!result;
  }

  async count(filters?: { category?: GalleryCategory; isActive?: boolean }): Promise<number> {
    const query: any = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    return GalleryModel.countDocuments(query);
  }
}
