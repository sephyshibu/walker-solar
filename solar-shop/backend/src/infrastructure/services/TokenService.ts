import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/User';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// In seconds for frontend
const ACCESS_TOKEN_EXPIRY_SEC = 15 * 60;  // 15 minutes
const REFRESH_TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60;  // 7 days

export class TokenService {
  private static getAccessSecret(): string {
    return process.env.JWT_SECRET || 'your-access-secret-key';
  }

  private static getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh' || 'your-refresh-secret-key';
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(userId: string, role: UserRole): TokenPair {
    const accessToken = jwt.sign(
      { userId, role, type: 'access' } as TokenPayload,
      this.getAccessSecret(),
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' } as TokenPayload,
      this.getRefreshSecret(),
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY_SEC,
      refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRY_SEC
    };
  }

  /**
   * Generate only access token (for refresh)
   */
  static generateAccessToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role, type: 'access' } as TokenPayload,
      this.getAccessSecret(),
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.getAccessSecret()) as TokenPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshSecret()) as TokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
}
