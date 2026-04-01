import { Request, Response, NextFunction } from 'express';
import { menuService } from './menu.service';
import { AppError } from '../../types';

export const menuController = {
  async getMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const menus = await menuService.getMenusByCategory(categoryId);
      res.json({ menus });
    } catch (err) { next(err); }
  },

  async getMenuById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menu = await menuService.getMenuDetail(parseInt(req.params.menuId, 10));
      res.json(menu);
    } catch (err) { next(err); }
  },

  async createMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, price, description, categoryId } = req.body;
      if (!name || price == null || !categoryId) {
        throw new AppError(400, 'VALIDATION_ERROR', '필수 필드가 누락되었습니다 (name, price, categoryId)');
      }
      const parsedPrice = parseInt(price, 10);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new AppError(400, 'VALIDATION_ERROR', '가격은 0 이상의 정수여야 합니다');
      }

      const menu = await menuService.createMenu(
        { name, price: parsedPrice, description, categoryId: parseInt(categoryId, 10) },
        req.file
      );
      res.status(201).json(menu);
    } catch (err) { next(err); }
  },

  async updateMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menuId = parseInt(req.params.menuId, 10);
      const { name, price, description, categoryId } = req.body;
      const data: Record<string, unknown> = {};
      if (name !== undefined) data.name = name;
      if (price !== undefined) {
        const parsedPrice = parseInt(price, 10);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new AppError(400, 'VALIDATION_ERROR', '가격은 0 이상의 정수여야 합니다');
        }
        data.price = parsedPrice;
      }
      if (description !== undefined) data.description = description;
      if (categoryId !== undefined) data.categoryId = parseInt(categoryId, 10);

      const menu = await menuService.updateMenu(menuId, data as any, req.file);
      res.json(menu);
    } catch (err) { next(err); }
  },

  async deleteMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuService.deleteMenu(parseInt(req.params.menuId, 10));
      res.json({ message: '메뉴가 삭제되었습니다' });
    } catch (err) { next(err); }
  },

  async updateMenuOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'orders 배열이 필요합니다');
      }
      await menuService.updateDisplayOrder(
        orders.map((o: { id: number; displayOrder: number }) => ({ id: o.id, displayOrder: o.displayOrder }))
      );
      res.json({ message: '메뉴 순서가 변경되었습니다' });
    } catch (err) { next(err); }
  },

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await menuService.getCategories();
      res.json({ categories });
    } catch (err) { next(err); }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name || name.length > 50) {
        throw new AppError(400, 'VALIDATION_ERROR', '카테고리명은 1~50자여야 합니다');
      }
      const category = await menuService.createCategory({ name });
      res.status(201).json(category);
    } catch (err) { next(err); }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseInt(req.params.categoryId, 10);
      const { name } = req.body;
      if (!name || name.length > 50) {
        throw new AppError(400, 'VALIDATION_ERROR', '카테고리명은 1~50자여야 합니다');
      }
      const category = await menuService.updateCategory(categoryId, { name });
      res.json(category);
    } catch (err) { next(err); }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseInt(req.params.categoryId, 10);
      const { movedMenuCount } = await menuService.deleteCategory(categoryId);
      res.json({ message: '카테고리가 삭제되었습니다', movedMenuCount });
    } catch (err) { next(err); }
  },

  async updateCategoryOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'orders 배열이 필요합니다');
      }
      await menuService.updateCategoryOrder(
        orders.map((o: { id: number; displayOrder: number }) => ({ id: o.id, displayOrder: o.displayOrder }))
      );
      res.json({ message: '카테고리 순서가 변경되었습니다' });
    } catch (err) { next(err); }
  },
};
