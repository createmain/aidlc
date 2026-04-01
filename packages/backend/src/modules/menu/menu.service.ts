import fs from 'fs';
import path from 'path';
import { menuRepository } from './menu.repository';
import { AppError, MenuItem, Category } from '../../types';
import { env } from '../../config/env';

export const menuService = {
  async getMenusByCategory(categoryId?: number): Promise<MenuItem[]> {
    return menuRepository.findAll(categoryId);
  },

  async getMenuDetail(menuId: number): Promise<MenuItem> {
    const menu = await menuRepository.findById(menuId);
    if (!menu) throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다');
    return menu;
  },

  async createMenu(
    data: { name: string; price: number; description?: string; categoryId: number },
    imageFile?: Express.Multer.File
  ): Promise<MenuItem> {
    // 카테고리 존재 확인
    const category = await menuRepository.findCategoryById(data.categoryId);
    if (!category) throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다');

    // display_order 설정
    const maxOrder = await menuRepository.getMaxDisplayOrder(data.categoryId);
    const displayOrder = maxOrder + 100;

    // 이미지 처리
    let imagePath: string | undefined;
    if (imageFile) {
      imagePath = await this.moveImageToCategory(imageFile, category.name);
    }

    return menuRepository.create({
      category_id: data.categoryId,
      name: data.name,
      price: data.price,
      description: data.description,
      image_path: imagePath,
      display_order: displayOrder,
    });
  },

  async updateMenu(
    menuId: number,
    data: { name?: string; price?: number; description?: string; categoryId?: number },
    imageFile?: Express.Multer.File
  ): Promise<MenuItem> {
    const menu = await menuRepository.findById(menuId);
    if (!menu) throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다');

    if (data.categoryId) {
      const category = await menuRepository.findCategoryById(data.categoryId);
      if (!category) throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;

    // 이미지 교체
    if (imageFile) {
      // 기존 이미지 삭제
      if (menu.image_path) {
        this.deleteImageFile(menu.image_path);
      }
      const categoryName = data.categoryId
        ? (await menuRepository.findCategoryById(data.categoryId))!.name
        : menu.category_name || '미분류';
      updateData.image_path = await this.moveImageToCategory(imageFile, categoryName);
    }

    return menuRepository.update(menuId, updateData);
  },

  async deleteMenu(menuId: number): Promise<void> {
    const menu = await menuRepository.findById(menuId);
    if (!menu) throw new AppError(404, 'NOT_FOUND', '메뉴를 찾을 수 없습니다');

    // 이미지 파일 삭제
    if (menu.image_path) {
      this.deleteImageFile(menu.image_path);
    }

    await menuRepository.delete(menuId);
  },

  async updateDisplayOrder(menuOrders: { id: number; displayOrder: number }[]): Promise<void> {
    await menuRepository.updateOrder(menuOrders);
  },

  // Category methods
  async getCategories(): Promise<Category[]> {
    return menuRepository.findAllCategories();
  },

  async createCategory(data: { name: string }): Promise<Category> {
    // 중복 확인
    const existing = await menuRepository.findAllCategories();
    if (existing.some((c) => c.name === data.name)) {
      throw new AppError(400, 'VALIDATION_ERROR', '이미 존재하는 카테고리명입니다');
    }
    const maxOrder = await menuRepository.getMaxCategoryDisplayOrder();
    return menuRepository.createCategory({ name: data.name, display_order: maxOrder + 100 });
  },

  async updateCategory(categoryId: number, data: { name: string }): Promise<Category> {
    const category = await menuRepository.findCategoryById(categoryId);
    if (!category) throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다');

    // 중복 확인 (자기 자신 제외)
    const existing = await menuRepository.findAllCategories();
    if (existing.some((c) => c.name === data.name && c.id !== categoryId)) {
      throw new AppError(400, 'VALIDATION_ERROR', '이미 존재하는 카테고리명입니다');
    }

    return menuRepository.updateCategory(categoryId, data);
  },

  async deleteCategory(categoryId: number): Promise<{ movedMenuCount: number }> {
    const category = await menuRepository.findCategoryById(categoryId);
    if (!category) throw new AppError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다');
    if (category.is_default) {
      throw new AppError(400, 'VALIDATION_ERROR', '기본 카테고리는 삭제할 수 없습니다');
    }

    const movedMenuCount = await menuRepository.countMenusByCategory(categoryId);
    await menuRepository.deleteCategory(categoryId);
    return { movedMenuCount };
  },

  async updateCategoryOrder(categoryOrders: { id: number; displayOrder: number }[]): Promise<void> {
    await menuRepository.updateCategoryOrder(categoryOrders);
  },

  // Helper methods
  async moveImageToCategory(file: Express.Multer.File, categoryName: string): Promise<string> {
    const targetDir = path.join(env.uploadDir, 'images', categoryName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filename = path.basename(file.path);
    const targetPath = path.join(targetDir, filename);
    fs.renameSync(file.path, targetPath);
    return `uploads/images/${categoryName}/${filename}`;
  },

  deleteImageFile(imagePath: string): void {
    const fullPath = path.join(env.uploadDir, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  },
};
