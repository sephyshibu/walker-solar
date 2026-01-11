import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked'
}

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      role: props.role || UserRole.USER,
      status: props.status || UserStatus.ACTIVE,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    };
  }

  get id(): string {
    return this.props.id!;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get address(): UserProps['address'] {
    return this.props.address;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get profileImage(): string | undefined {
    return this.props.profileImage;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  get isBlocked(): boolean {
    return this.props.status === UserStatus.BLOCKED;
  }

  block(): void {
    this.props.status = UserStatus.BLOCKED;
    this.props.updatedAt = new Date();
  }

  unblock(): void {
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  updateProfile(data: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'phone' | 'address' | 'profileImage'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
  }

  updatePassword(hashedPassword: string): void {
    this.props.password = hashedPassword;
    this.props.updatedAt = new Date();
  }

  toJSON(): Omit<UserProps, 'password'> {
    const { password, ...rest } = this.props;
    return rest;
  }

  toObject(): UserProps {
    return { ...this.props };
  }
}
