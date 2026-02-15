import { Response } from 'express';

declare global {
  namespace Express {
    interface Response {
      sendSuccess: (data: any, statusCode?: number) => Response;
      sendError: (error: string, statusCode?: number, details?: any) => Response;
    }
  }
}

export const responseFormatter = (req: any, res: Response, next: any) => {
  res.sendSuccess = function (data: any, statusCode = 200) {
    return this.status(statusCode).json({
      success: true,
      data,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  };

  res.sendError = function (error: string, statusCode = 400, details?: any) {
    return this.status(statusCode).json({
      success: false,
      error,
      details,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

export default responseFormatter;
