import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      details: err.details,
    });
    return;
  }

  // Multer 파일 크기 초과 에러
  if (err.message === 'File too large') {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: '파일 크기가 5MB를 초과합니다',
      details: [],
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: '서버 오류가 발생했습니다',
    details: [],
  });
}
