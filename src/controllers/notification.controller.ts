import { Request, Response } from "express";
import Notification from "../models/notification.model";
import User from "../models/user.model";
import {
  getUnreadNotifications,
  markNotificationAsRead,
} from "../services/alert.service";

// Tạo thông báo mới (chỉ admin)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, content, type, priority, recipients, data } = req.body;

    // Kiểm tra quyền admin
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền tạo thông báo",
      });
    }

    // Tạo thông báo mới
    const notification = new Notification({
      title,
      content,
      type,
      priority,
      recipients,
      data,
      createdBy: userId,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Tạo thông báo thành công",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi tạo thông báo",
    });
  }
};

// Lấy tất cả thông báo
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, isRead, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Xây dựng query
    const query: any = {};

    // Lọc theo loại thông báo
    if (type) {
      query.type = type;
    }

    // Lọc theo trạng thái đã đọc
    if (isRead !== undefined) {
      query.read = isRead === "true";
    }

    // Lọc theo người nhận
    query.$or = [{ recipients: "all" }, { recipients: userId }];

    // Lấy thông báo từ cơ sở dữ liệu
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate("locationId", "name")
      .populate("createdBy", "name email");

    // Đếm tổng số thông báo
    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi lấy thông báo",
    });
  }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const count = await Notification.countDocuments({
      $or: [{ recipients: "all" }, { recipients: userId }],
      read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi đếm thông báo",
    });
  }
};

// Lấy thông báo chưa đọc
export const getUnread = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Lấy từ middleware auth

    const notifications = await getUnreadNotifications(userId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Lỗi khi lấy thông báo chưa đọc",
    });
  }
};

// Đánh dấu thông báo đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Kiểm tra quyền truy cập thông báo
    const notification = await Notification.findOne({
      _id: id,
      $or: [{ recipients: "all" }, { recipients: userId }],
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    notification.read = true;
    notification.read_at = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Lỗi khi đánh dấu thông báo đã đọc",
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await Notification.updateMany(
      {
        $or: [{ recipients: "all" }, { recipients: userId }],
        read: false,
      },
      {
        read: true,
        read_at: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Lỗi khi đánh dấu tất cả thông báo đã đọc",
    });
  }
};

// Xóa thông báo
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Kiểm tra quyền xóa (chỉ admin hoặc người tạo)
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    const user = await User.findById(userId);
    if (
      !user ||
      (user.role !== "admin" && notification.createdBy.toString() !== userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xóa thông báo này",
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Xóa thông báo thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xóa thông báo",
    });
  }
};
