import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';
import { config } from '../config';

const redisClient = redis.createClient({
  url: config.REDIS_URL,
});

redisClient.connect().catch(console.error);

export const globalRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient as any,
    prefix: 'rl:global:',
  }),
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Skip health checks
});

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient as any,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body.email || req.ip,
});

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient as any,
    prefix: 'rl:api:',
  }),
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS * 2, // Double limit for authenticated API users
  keyGenerator: (req) => req.user?.userId || req.ip,
});

export default globalRateLimiter;
