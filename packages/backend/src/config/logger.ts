import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { env } from './env';

// 로그 디렉토리 생성
if (!fs.existsSync(env.logDir)) {
  fs.mkdirSync(env.logDir, { recursive: true });
}

const targets: pino.TransportTargetOptions[] = [
  // 파일 로그 (app.log)
  {
    target: 'pino-roll',
    options: {
      file: path.join(env.logDir, 'app.log'),
      frequency: 'daily',
      limit: { count: 7 },
      mkdir: true,
    },
    level: env.logLevel,
  },
  // 에러 전용 파일 (error.log)
  {
    target: 'pino-roll',
    options: {
      file: path.join(env.logDir, 'error.log'),
      frequency: 'daily',
      limit: { count: 7 },
      mkdir: true,
    },
    level: 'error',
  },
];

// 개발 환경에서는 콘솔 출력 추가
if (env.nodeEnv === 'development') {
  targets.push({
    target: 'pino-pretty',
    options: { colorize: true },
    level: env.logLevel,
  });
}

export const logger = pino({
  level: env.logLevel,
  transport: { targets },
});
