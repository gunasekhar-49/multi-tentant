import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, Tenant } from '../models';
import logger from '../utils/logger';

export interface CreateUserPayload {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantId: string;
}

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export class IdentityService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    return bcryptjs.hash(password, salt);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await User.query()
        .where('email', payload.email)
        .andWhere('tenantId', payload.tenantId)
        .first();

      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await this.hashPassword(payload.password);

      const user = await User.query().insert({
        id: uuidv4(),
        tenantId: payload.tenantId,
        email: payload.email,
        password: hashedPassword,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roleId: payload.roleId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      });

      logger.info('User created', {
        userId: user.id,
        tenantId: payload.tenantId,
        email: payload.email,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, payload });
      throw error;
    }
  }

  async authenticateUser(payload: LoginPayload): Promise<{ user: User; tokens: any }> {
    try {
      const user = await User.query()
        .where('email', payload.email)
        .andWhere('tenantId', payload.tenantId)
        .withGraphFetched('role')
        .first();

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const passwordMatch = await this.verifyPassword(payload.password, user.password);

      if (!passwordMatch) {
        logger.warn('Failed login attempt', {
          email: payload.email,
          tenantId: payload.tenantId,
        });
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'active') {
        throw new Error('User is inactive');
      }

      // Update last login
      await User.query().findById(user.id).patch({
        lastLogin: new Date(),
        updatedBy: user.id,
      });

      const tokens = this.generateTokens({
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: (user.role as any)?.name || 'user',
      });

      logger.info('User authenticated', {
        userId: user.id,
        tenantId: payload.tenantId,
        email: payload.email,
      });

      return { user, tokens };
    } catch (error) {
      logger.error('Authentication failed', { error });
      throw error;
    }
  }

  generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRY,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, tenantId: payload.tenantId },
      config.REFRESH_TOKEN_SECRET,
      {
        expiresIn: config.REFRESH_TOKEN_EXPIRY,
      }
    );

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Token verification failed', { error });
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET) as any;
      const user = await User.query()
        .findById(decoded.userId)
        .withGraphFetched('role');

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: (user.role as any)?.name || 'user',
        },
        config.JWT_SECRET,
        {
          expiresIn: config.JWT_EXPIRY,
        }
      );

      return newAccessToken;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  async revokeToken(userId: string): Promise<void> {
    // In production, add token to blacklist in Redis
    logger.info('Token revoked', { userId });
  }
}

export default new IdentityService();
