import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, TokenPayload, AppError } from '../types';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'AUTH_ERROR', '인증 토큰이 필요합니다'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError(401, 'AUTH_ERROR', '유효하지 않거나 만료된 토큰입니다'));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'FORBIDDEN', '관리자 권한이 필요합니다'));
  }
  next();
}

export function requireTable(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'table') {
    return next(new AppError(403, 'FORBIDDEN', '테이블 인증이 필요합니다'));
  }
  next();
}

export function requireAny(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'AUTH_ERROR', '인증이 필요합니다'));
  }
  next();
}
