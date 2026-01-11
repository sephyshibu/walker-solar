import { Request, Response, NextFunction } from 'express';
import {
  GetAllUsersUseCase,
  GetUserByIdUseCase,
  BlockUserUseCase,
  UnblockUserUseCase,
  GetUserStatsUseCase
} from '../../application/use-cases/user/AdminUserUseCases';
import { MongoUserRepository } from '../../infrastructure/database/repositories';
import { UserRole, UserStatus } from '../../domain/entities/User';

const userRepository = new MongoUserRepository();

export class AdminController {
  static async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetAllUsersUseCase(userRepository);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const filters: any = {};
      if (req.query.role) filters.role = req.query.role as UserRole;
      if (req.query.status) filters.status = req.query.status as UserStatus;

      const result = await useCase.execute({ page, limit, sortBy, sortOrder }, filters);

      res.json({
        success: true,
        data: {
          ...result,
          data: result.data.map(u => u.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetUserByIdUseCase(userRepository);
      const user = await useCase.execute(req.params.id);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new BlockUserUseCase(userRepository);
      const user = await useCase.execute(req.params.id, req.user!.userId);

      res.json({
        success: true,
        message: 'User blocked successfully',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new UnblockUserUseCase(userRepository);
      const user = await useCase.execute(req.params.id);

      res.json({
        success: true,
        message: 'User unblocked successfully',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetUserStatsUseCase(userRepository);
      const stats = await useCase.execute();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
