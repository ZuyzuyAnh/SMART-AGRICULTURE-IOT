import { Request, Response } from "express";
import authService from "../services/auth.service";
import User from "../models/user.model";
import fs from "fs";
import path from "path";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, address, phone } = req.body;
    console.log("Request body:", req.body);

    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email and password",
      });
    }

    // Đăng ký user mới
    const result = await authService.register({
      username,
      email,
      password,
      address,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Đăng nhập
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Thông tin user đã được thêm vào req bởi middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp email",
      });
    }

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { token: result.token }, // Chỉ để test
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xử lý yêu cầu",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp token và mật khẩu mới",
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi đặt lại mật khẩu",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới",
      });
    }

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi thay đổi mật khẩu",
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu để xác nhận xóa tài khoản",
      });
    }

    const result = await authService.deleteAccount(userId, password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xóa tài khoản",
    });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Kiểm tra xem file có được upload không
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file được upload",
      });
    }

    // Lấy đường dẫn file
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Lấy thông tin user hiện tại để kiểm tra avatar cũ
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu đã có avatar cũ, xóa file cũ
    if (user.avatar && user.avatar !== "" && !user.avatar.includes("default")) {
      try {
        const oldAvatarPath = path.join(
          __dirname,
          "../../",
          user.avatar.substring(1)
        );
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (error) {
        console.error("Lỗi khi xóa avatar cũ:", error);
      }
    }

    // Cập nhật avatar trong user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Upload avatar thành công",
      data: {
        avatar: avatarPath,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi upload avatar",
    });
  }
};

export const removeAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Lấy thông tin user hiện tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Nếu có avatar, xóa file
    if (user.avatar && user.avatar !== "" && !user.avatar.includes("default")) {
      try {
        const avatarPath = path.join(
          __dirname,
          "../../",
          user.avatar.substring(1)
        );
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      } catch (error) {
        console.error("Lỗi khi xóa file avatar:", error);
      }
    }

    // Cập nhật user để xóa avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: "" },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Đã xóa avatar",
      data: {
        avatar: "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi xóa avatar",
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Lấy thông tin từ request body
    const { username, email, address, phone, removeAvatar, defaultAvatar } =
      req.body;

    // Tạo object chứa các trường cần update
    const updateData: {
      username?: string;
      email?: string;
      address?: string;
      phone?: string;
      avatar?: string;
    } = {};

    // Cập nhật các trường thông tin cơ bản
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    // Lấy thông tin user hiện tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Xử lý avatar dựa trên yêu cầu
    // Trường hợp 1: Người dùng muốn xóa avatar
    if (removeAvatar === "true" || removeAvatar === true) {
      // Xóa file avatar cũ nếu có và không phải ảnh mặc định
      if (
        user.avatar &&
        user.avatar !== "" &&
        !user.avatar.includes("default") &&
        !user.avatar.startsWith("/defaults/")
      ) {
        try {
          const avatarPath = path.join(
            __dirname,
            "../../",
            user.avatar.substring(1)
          );
          if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
          }
        } catch (error) {
          console.error("Lỗi khi xóa file avatar:", error);
        }
      }
      // Đặt avatar về chuỗi rỗng
      updateData.avatar = "";
    }
    // Trường hợp 2: Người dùng chọn ảnh đại diện mặc định từ FE
    else if (defaultAvatar) {
      // Kiểm tra nếu avatar hiện tại là uploaded file (không phải mặc định), xóa file cũ
      if (
        user.avatar &&
        user.avatar !== "" &&
        !user.avatar.includes("default") &&
        !user.avatar.startsWith("/defaults/")
      ) {
        try {
          const oldAvatarPath = path.join(
            __dirname,
            "../../",
            user.avatar.substring(1)
          );
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.error("Lỗi khi xóa avatar cũ:", error);
        }
      }

      // Lưu mã ảnh mặc định vào DB
      // Lưu ý: Ảnh mặc định có thể được định dạng như "default_avatar_1", "male_avatar", "female_avatar", etc.
      updateData.avatar = `/defaults/${defaultAvatar}`;
    }
    // Trường hợp 3: Người dùng muốn upload avatar mới
    else if (req.file) {
      // Lấy đường dẫn file mới
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Nếu đã có avatar cũ và không phải ảnh mặc định, xóa file cũ
      if (
        user.avatar &&
        user.avatar !== "" &&
        !user.avatar.includes("default") &&
        !user.avatar.startsWith("/defaults/")
      ) {
        try {
          const oldAvatarPath = path.join(
            __dirname,
            "../../",
            user.avatar.substring(1)
          );
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (error) {
          console.error("Lỗi khi xóa avatar cũ:", error);
        }
      }

      // Thêm avatar vào dữ liệu cập nhật
      updateData.avatar = avatarPath;
    }

    // Nếu không có dữ liệu gì để cập nhật
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thông tin để cập nhật",
      });
    }

    // Gọi service để cập nhật
    const result = await authService.updateProfile(userId, updateData);

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi cập nhật thông tin",
    });
  }
};
