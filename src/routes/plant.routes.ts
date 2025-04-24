import { Router } from 'express';
import * as plantController from '../controllers/plant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams để có thể truy cập params từ router cha

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticate);

// Tạo cây trồng mới trong location và season
router.post('/', plantController.createPlant);

// Lấy tất cả cây trồng trong location
router.get('/', plantController.getPlantsByLocation);

// Lấy chi tiết cây trồng
router.get('/:plantId', plantController.getPlantById);

// Cập nhật cây trồng
router.put('/:plantId', plantController.updatePlant);

// Xóa cây trồng
router.delete('/:plantId', plantController.deletePlant);

// Cập nhật trạng thái cây trồng
router.patch('/:plantId/status', plantController.updatePlantStatus);

export default router;