// src/routes/notification.routes.ts
import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/auth.middleware";

const router = Router();

// Tạo thông báo mới (chỉ admin)
router.post(
  "/",
  authenticate,
  isAdmin,
  notificationController.createNotification
);

// Lấy tất cả thông báo
router.get("/", authenticate, notificationController.getNotifications);

// Lấy số lượng thông báo chưa đọc
router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

// Đánh dấu thông báo đã đọc
router.patch("/:id/read", authenticate, notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch("/read-all", authenticate, notificationController.markAllAsRead);

// Xóa thông báo
router.delete("/:id", authenticate, notificationController.deleteNotification);

export default router;
