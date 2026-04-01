import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

// POST /api/auth/login — 관리자 로그인
router.post('/login', authController.login);

// POST /api/auth/table-login — 테이블 태블릿 인증
router.post('/table-login', authController.tableLogin);

export default router;
