import dotenv from 'dotenv';
import path from 'path';

// .env 파일은 프로젝트 루트(table-order/)에 위치
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://tableorder:tableorder@localhost:5432/tableorder',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '16h',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),

  // Upload
  uploadDir: path.resolve(__dirname, '../../uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
};
