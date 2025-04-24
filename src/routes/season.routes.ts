import { Router } from 'express';
import * as seasonController from '../controllers/season.controller';
import { authenticate } from '../middleware/auth.middleware';
import * as plantController from '../controllers/plant.controller';

const router = Router();

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticate);

// Tạo season mới
router.post('/', seasonController.createSeason);

// Lấy tất cả seasons của user
router.get('/', seasonController.getSeasons);

// Lấy chi tiết season
router.get('/:seasonId', seasonController.getSeasonById);

// Cập nhật season
router.put('/:seasonId', seasonController.updateSeason);

// Xóa season
router.delete('/:seasonId', seasonController.deleteSeason);

// Lấy thống kê về season
router.get('/:seasonId/stats', seasonController.getSeasonStats);

// Lấy tất cả cây trồng trong season
router.get('/:seasonId/plants', plantController.getPlantsBySeason);

export default router;