import { User, UserRole, UserStatus, UserProps } from '../../../domain/entities/User';
import { IUserRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { UserModel, UserDocument } from '../models/UserModel';

export class MongoUserRepository implements IUserRepository {
  private documentToEntity(doc: UserDocument): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phone: doc.phone,
      address: doc.address,
      role: doc.role as UserRole,
      status: doc.status as UserStatus,
      profileImage: doc.profileImage,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async create(user: User): Promise<User> {
    const doc = await UserModel.create({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage
    });
    return this.documentToEntity(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? this.documentToEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? this.documentToEntity(doc) : null;
  }

  async findAll(
    options: PaginationOptions, 
    filters?: { role?: UserRole; status?: UserStatus }
  ): Promise<PaginatedResult<User>> {
    const query: any = {};
    if (filters?.role) query.role = filters.role;
    if (filters?.status) query.status = filters.status;

    const total = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(total / options.limit);

    const docs = await UserModel.find(query)
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

  async update(id: string, data: Partial<UserProps>): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return doc ? this.documentToEntity(doc) : null;
  }

  async count(filters?: { role?: UserRole; status?: UserStatus }): Promise<number> {
    const query: any = {};
    if (filters?.role) query.role = filters.role;
    if (filters?.status) query.status = filters.status;
    return UserModel.countDocuments(query);
  }
}
