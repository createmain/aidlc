import bcrypt from 'bcryptjs';
import { systemRepository } from './system.repository';
import { logger } from '../../config/logger';

export const systemService = {
  async initializeSystem(): Promise<void> {
    const adminCount = await systemRepository.findAdminCount();
    if (adminCount > 0) {
      logger.info('System already initialized, skipping');
      return;
    }

    // 매장 설정 생성
    const settingsCount = await systemRepository.findSettingsCount();
    if (settingsCount === 0) {
      await systemRepository.createDefaultSettings('기본 매장', 'default');
      logger.info('Default settings created');
    }

    // 기본 관리자 생성
    const passwordHash = await bcrypt.hash('admin123', 10);
    await systemRepository.createDefaultAdmin('admin', passwordHash);
    logger.info('Default admin created: admin / admin123');

    // 미분류 카테고리 생성
    const defaultCatCount = await systemRepository.findDefaultCategoryCount();
    if (defaultCatCount === 0) {
      await systemRepository.createDefaultCategory();
      logger.info('Default category created');
    }

    logger.info('시스템 초기화 완료. 기본 계정: admin / admin123');
  },

  async isInitialized(): Promise<boolean> {
    const count = await systemRepository.findAdminCount();
    return count > 0;
  },
};
