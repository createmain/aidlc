import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../types';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeIdentifier, username, password } = req.body;
      if (!storeIdentifier || !username || !password) {
        throw new AppError(400, 'VALIDATION_ERROR', '필수 필드가 누락되었습니다', [
          ...(!storeIdentifier ? ['storeIdentifier 필수'] : []),
          ...(!username ? ['username 필수'] : []),
          ...(!password ? ['password 필수'] : []),
        ]);
      }
      if (username.length > 50) {
        throw new AppError(400, 'VALIDATION_ERROR', 'username은 50자 이하여야 합니다');
      }

      const result = await authService.authenticateAdmin(storeIdentifier, username, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async tableLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { storeIdentifier, tableNumber, password } = req.body;
      if (!storeIdentifier || tableNumber == null || !password) {
        throw new AppError(400, 'VALIDATION_ERROR', '필수 필드가 누락되었습니다');
      }
      if (typeof tableNumber !== 'number' || tableNumber <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'tableNumber는 0보다 큰 정수여야 합니다');
      }

      const result = await authService.authenticateTable(storeIdentifier, tableNumber, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
