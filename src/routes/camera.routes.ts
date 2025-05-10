import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as cameraController from "../controllers/camera.controller";

const cameraRouter = Router();

// Thiết lập xác thực cho tất cả các routes
cameraRouter.use(authenticate);

// Các API endpoints cho camera
cameraRouter.post("/upload", cameraController.uploadImage);
cameraRouter.get("/gallery", cameraController.getGallery);
cameraRouter.get("/latest", cameraController.getLatestImage);
cameraRouter.get("/device/:deviceId", cameraController.getDeviceImages);

export default cameraRouter;
