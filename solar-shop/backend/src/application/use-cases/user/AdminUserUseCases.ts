import { User, UserRole, UserStatus } from '../../../domain/entities/User';
import { IUserRepository, PaginationOptions, PaginatedResult } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';

export class GetAllUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    options: PaginationOptions,
    filters?: { role?: UserRole; status?: UserStatus }
  ): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(options, filters);
  }
}

export class GetUserByIdUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

export class BlockUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, adminId: string): Promise<User> {
    if (userId === adminId) {
      throw new AppError('You cannot block yourself', 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === UserRole.ADMIN) {
      throw new AppError('Cannot block an admin user', 400);
    }

    const updatedUser = await this.userRepository.updateStatus(userId, UserStatus.BLOCKED);
    if (!updatedUser) {
      throw new AppError('Failed to block user', 500);
    }

    return updatedUser;
  }
}

export class UnblockUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await this.userRepository.updateStatus(userId, UserStatus.ACTIVE);
    if (!updatedUser) {
      throw new AppError('Failed to unblock user', 500);
    }

    return updatedUser;
  }
}

export class GetUserStatsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<{
    total: number;
    active: number;
    blocked: number;
    admins: number;
  }> {
    const [total, active, blocked, admins] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ status: UserStatus.ACTIVE }),
      this.userRepository.count({ status: UserStatus.BLOCKED }),
      this.userRepository.count({ role: UserRole.ADMIN })
    ]);

    return { total, active, blocked, admins };
  }
}
