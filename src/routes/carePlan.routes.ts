import { Router } from 'express';
import * as carePlanController from '../controllers/carePlan.controller';
import * as careTaskController from '../controllers/careTask.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Áp dụng middleware xác thực
router.use(authenticate);

// Routes cho CarePlan
router.post('/', carePlanController.createCarePlan);
router.get('/', carePlanController.getCarePlan);
router.put('/', carePlanController.updateCarePlan);
router.delete('/', carePlanController.deleteCarePlan);

// Routes cho CareTask
router.post('/tasks', careTaskController.createCareTask);
router.get('/tasks', careTaskController.getCareTasks);
router.get('/tasks/:taskId', careTaskController.getCareTask);
router.put('/tasks/:taskId', careTaskController.updateCareTask);
router.delete('/tasks/:taskId', careTaskController.deleteCareTask);

export default router;