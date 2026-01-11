import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../shared/errors/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
    return;
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message
      }))
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
};
