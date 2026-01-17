import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories';
import { AppError } from '../../../shared/errors/AppError';
import { TokenService, TokenPair } from '../../../infrastructure/services/TokenService';

interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: TokenPair;
}

interface RefreshResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: RegisterDTO): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    if(!data.phone){
      throw new Error(' the phone number is missng')
    }
    else{
      if(data.phone.length!==10){
        throw new Error('the invalid phone number , phone number length must be length equal to 10')
      }
    }

    const user = new User({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    });

    const createdUser = await this.userRepository.create(user);

    // Generate token pair
    const tokens = TokenService.generateTokenPair(createdUser.id, createdUser.role);

    return {
      user: createdUser,
      tokens
    };
  }
}

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: LoginDTO): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been blocked. Please contact support.', 403);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token pair
    const tokens = TokenService.generateTokenPair(user.id, user.role);

    return {
      user,
      tokens
    };
  }
}

export class RefreshTokenUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string): Promise<RefreshResponse> {
    try {
      // Verify refresh token
      const decoded = TokenService.verifyRefreshToken(refreshToken);

      // Check if user still exists and is not blocked
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 401);
      }

      if (user.isBlocked) {
        throw new AppError('Your account has been blocked', 403);
      }

      // Generate new access token
      const accessToken = TokenService.generateAccessToken(user.id, user.role);

      return {
        accessToken,
        accessTokenExpiresIn: 15 * 60 // 15 minutes in seconds
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expired. Please login again.', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }
}

export class GetUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

export class UpdateUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    profileImage?: string;
  }): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await this.userRepository.update(userId, data);
    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }

    return updatedUser;
  }
}

export class ChangePasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
