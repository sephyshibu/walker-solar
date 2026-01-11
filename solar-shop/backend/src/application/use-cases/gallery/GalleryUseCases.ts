import { GalleryItem, GalleryCategory, GalleryItemProps } from '../../../domain/entities/Gallery';
import { IGalleryRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

interface CreateGalleryItemDTO {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: GalleryCategory;
  tags?: string[];
  sortOrder?: number;
}

interface UpdateGalleryItemDTO extends Partial<CreateGalleryItemDTO> {
  isActive?: boolean;
}

export class CreateGalleryItemUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(data: CreateGalleryItemDTO): Promise<GalleryItem> {
    const item = new GalleryItem({
      ...data,
      tags: data.tags || [],
      isActive: true,
      sortOrder: data.sortOrder || 0
    });

    return this.galleryRepository.create(item);
  }
}

export class GetGalleryItemByIdUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(id: string): Promise<GalleryItem> {
    const item = await this.galleryRepository.findById(id);
    if (!item) {
      throw new AppError('Gallery item not found', 404);
    }
    return item;
  }
}

export class GetAllGalleryItemsUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: { category?: GalleryCategory; isActive?: boolean }
  ): Promise<PaginatedResult<GalleryItem>> {
    return this.galleryRepository.findAll(options, filters);
  }
}

export class GetGalleryByCategoryUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(category: GalleryCategory, options: PaginationOptions): Promise<PaginatedResult<GalleryItem>> {
    return this.galleryRepository.findByCategory(category, options);
  }
}

export class UpdateGalleryItemUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(id: string, data: UpdateGalleryItemDTO): Promise<GalleryItem> {
    const item = await this.galleryRepository.findById(id);
    if (!item) {
      throw new AppError('Gallery item not found', 404);
    }

    const updatedItem = await this.galleryRepository.update(id, data);
    if (!updatedItem) {
      throw new AppError('Failed to update gallery item', 500);
    }

    return updatedItem;
  }
}

export class DeleteGalleryItemUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(id: string): Promise<void> {
    const item = await this.galleryRepository.findById(id);
    if (!item) {
      throw new AppError('Gallery item not found', 404);
    }

    await this.galleryRepository.delete(id);
  }
}

export class ToggleGalleryItemActiveUseCase {
  constructor(private galleryRepository: IGalleryRepository) {}

  async execute(id: string): Promise<GalleryItem> {
    const item = await this.galleryRepository.findById(id);
    if (!item) {
      throw new AppError('Gallery item not found', 404);
    }

    const updatedItem = await this.galleryRepository.update(id, { isActive: !item.isActive });
    if (!updatedItem) {
      throw new AppError('Failed to update gallery item', 500);
    }

    return updatedItem;
  }
}
