import { Request, Response, NextFunction } from 'express';
import { tableService } from './table.service';
import { AppError } from '../../types';

export const tableController = {
  async getTables(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tables = await tableService.getTables();
      res.json({ tables });
    } catch (err) { next(err); }
  },

  async setupTable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tableNumber, password } = req.body;
      if (!tableNumber || !password) {
        throw new AppError(400, 'VALIDATION_ERROR', '필수 필드가 누락되었습니다 (tableNumber, password)');
      }
      if (typeof tableNumber !== 'number' || tableNumber <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'tableNumber는 0보다 큰 정수여야 합니다');
      }

      const result = await tableService.setupTable(tableNumber, password);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tableId = parseInt(req.params.tableId, 10);
      const { completedAt } = await tableService.completeSession(tableId);
      res.json({
        message: '이용 완료 처리되었습니다',
        tableId,
        completedAt: completedAt.toISOString(),
      });
    } catch (err) { next(err); }
  },

  async getOrderHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tableId = parseInt(req.params.tableId, 10);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const history = await tableService.getOrderHistory(tableId, { from, to });
      res.json({ history });
    } catch (err) { next(err); }
  },

  async getTableStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tableId = parseInt(req.params.tableId, 10);
      const status = await tableService.getTableStatus(tableId);
      res.json(status);
    } catch (err) { next(err); }
  },
};
