import { v4 as uuidv4 } from 'uuid';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface CategoryProps {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  imagePublicId?: string;
  status: CategoryStatus;
  sortOrder?: number;
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category {
  private props: CategoryProps;

  constructor(props: CategoryProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      slug: props.slug || this.generateSlug(props.name),
      status: props.status || CategoryStatus.ACTIVE,
      sortOrder: props.sortOrder || 0,
      productCount: props.productCount || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  }

  get id(): string {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug!;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get imagePublicId(): string | undefined {
    return this.props.imagePublicId;
  }

  get status(): CategoryStatus {
    return this.props.status;
  }

  get sortOrder(): number {
    return this.props.sortOrder || 0;
  }

  get productCount(): number {
    return this.props.productCount || 0;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isActive(): boolean {
    return this.props.status === CategoryStatus.ACTIVE;
  }

  activate(): void {
    this.props.status = CategoryStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = CategoryStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  update(data: Partial<Omit<CategoryProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, data);
    if (data.name) {
      this.props.slug = this.generateSlug(data.name);
    }
    this.props.updatedAt = new Date();
  }

  incrementProductCount(): void {
    this.props.productCount = (this.props.productCount || 0) + 1;
  }

  decrementProductCount(): void {
    this.props.productCount = Math.max(0, (this.props.productCount || 0) - 1);
  }

  toJSON(): CategoryProps {
    return { ...this.props };
  }

  toObject(): CategoryProps {
    return { ...this.props };
  }
}