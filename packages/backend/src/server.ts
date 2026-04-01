import app from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './config/database';
import { systemService } from './modules/system/system.service';
import { logger } from './config/logger';

async function start(): Promise<void> {
  try {
    // DB 연결 확인
    await checkDatabaseConnection();

    // 시스템 초기화
    await systemService.initializeSystem();

    // 서버 시작
    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
