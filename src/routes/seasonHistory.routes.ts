// src/routes/seasonHistory.routes.ts
import { Router } from 'express';
import * as seasonHistoryController from '../controllers/seasonHistory.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticate);

// Lưu trữ mùa vụ
router.post('/archive/:seasonId', seasonHistoryController.archiveSeason);

// Lấy báo cáo mùa vụ
router.get('/report/:seasonId', seasonHistoryController.getSeasonReport);

// Lấy danh sách lịch sử mùa vụ
router.get('/', seasonHistoryController.getSeasonHistories);

// Lấy chi tiết lịch sử mùa vụ
router.get('/:historyId', seasonHistoryController.getSeasonHistoryDetail);

// Cập nhật lịch sử mùa vụ
router.put('/:historyId', seasonHistoryController.updateSeasonHistory);

export default router;