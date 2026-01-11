import { Request, Response, NextFunction } from 'express';
import { 
  RegisterUserUseCase, 
  LoginUserUseCase, 
  RefreshTokenUseCase,
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  ChangePasswordUseCase
} from '../../application/use-cases/user/AuthUseCases';
import { MongoUserRepository } from '../../infrastructure/database/repositories';

const userRepository = new MongoUserRepository();

// Interface for Cloudinary uploaded file
interface CloudinaryFile extends Express.Multer.File {
  path: string;
  filename: string;
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new RegisterUserUseCase(userRepository);
      const result = await useCase.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user.toJSON(),
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          accessTokenExpiresIn: result.tokens.accessTokenExpiresIn,
          refreshTokenExpiresIn: result.tokens.refreshTokenExpiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new LoginUserUseCase(userRepository);
      const result = await useCase.execute(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user.toJSON(),
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          accessTokenExpiresIn: result.tokens.accessTokenExpiresIn,
          refreshTokenExpiresIn: result.tokens.refreshTokenExpiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const useCase = new RefreshTokenUseCase(userRepository);
      const result = await useCase.execute(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          accessTokenExpiresIn: result.accessTokenExpiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new GetUserProfileUseCase(userRepository);
      const user = await useCase.execute(req.user!.userId);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new UpdateUserProfileUseCase(userRepository);
      
      let profileImage = req.body.profileImage;
      if (req.file) {
        const cloudinaryFile = req.file as CloudinaryFile;
        profileImage = cloudinaryFile.path; // Cloudinary URL
      }

      const user = await useCase.execute(req.user!.userId, {
        ...req.body,
        profileImage
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const useCase = new ChangePasswordUseCase(userRepository);
      await useCase.execute(req.user!.userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a more advanced implementation, you would:
      // 1. Add the refresh token to a blacklist/revoked tokens table
      // 2. Clear any server-side session data
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
