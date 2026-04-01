import { Router } from 'express';
import { menuController } from './menu.controller';
import { authenticate, requireAdmin, requireAny } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

// 메뉴
router.get('/menus', authenticate, requireAny, menuController.getMenus);
router.get('/menus/:menuId', authenticate, requireAny, menuController.getMenuById);
router.post('/menus', authenticate, requireAdmin, upload.single('image'), menuController.createMenu);
router.put('/menus/order', authenticate, requireAdmin, menuController.updateMenuOrder);
router.put('/menus/:menuId', authenticate, requireAdmin, upload.single('image'), menuController.updateMenu);
router.delete('/menus/:menuId', authenticate, requireAdmin, menuController.deleteMenu);

// 카테고리
router.get('/categories', authenticate, requireAny, menuController.getCategories);
router.post('/categories', authenticate, requireAdmin, menuController.createCategory);
router.put('/categories/order', authenticate, requireAdmin, menuController.updateCategoryOrder);
router.put('/categories/:categoryId', authenticate, requireAdmin, menuController.updateCategory);
router.delete('/categories/:categoryId', authenticate, requireAdmin, menuController.deleteCategory);

export default router;
