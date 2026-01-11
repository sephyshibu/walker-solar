import { v4 as uuidv4 } from 'uuid';

export enum GalleryCategory {
  INSTALLATIONS = 'installations',
  PRODUCTS = 'products',
  PROJECTS = 'projects',
  TEAM = 'team',
  EVENTS = 'events'
}

export interface GalleryItemProps {
  id?: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: GalleryCategory;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GalleryItem {
  private props: GalleryItemProps;

  constructor(props: GalleryItemProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      tags: props.tags || [],
      isActive: props.isActive ?? true,
      sortOrder: props.sortOrder || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  get id(): string {
    return this.props.id!;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get thumbnailUrl(): string {
    return this.props.thumbnailUrl || this.props.imageUrl;
  }

  get category(): GalleryCategory {
    return this.props.category;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Omit<GalleryItemProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }

  toJSON(): GalleryItemProps {
    return { ...this.props };
  }

  toObject(): GalleryItemProps {
    return { ...this.props };
  }
}
