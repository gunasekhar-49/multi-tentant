import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  requestId: string;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid request syntax';
  } else {
    logger.error('Unexpected error', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
    });
  }

  const response: ErrorResponse = {
    error: 'error',
    message,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ErrorResponse = {
    error: 'not_found',
    message: `Route not found: ${req.method} ${req.path}`,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};

export default errorHandler;
