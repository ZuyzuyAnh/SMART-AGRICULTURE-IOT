import User, { IUser } from "../models/user.model";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import PasswordReset from "../models/passwordReset.model";
import mongoose from "mongoose";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

class AuthService {
  // Đăng ký người dùng mới
  async register(userData: {
    username: string;
    email: string;
    password: string;
    address?: string;
    phone?: string;
  }) {
    try {
      // Kiểm tra email đã tồn tại
      const existingEmail = await User.findOne({ email: userData.email });
      if (existingEmail) {
        throw new Error("Email already exists");
      }

      // Kiểm tra username đã tồn tại
      const existingUsername = await User.findOne({
        username: userData.username,
      });
      if (existingUsername) {
        throw new Error("Username already exists");
      }

      // Tạo người dùng mới
      const user = new User(userData);
      await user.save();

      // Tạo token
      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          phone: user.phone,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  // Đăng nhập
  async login(email: string, password: string) {
    try {
      // Tìm user theo email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Kiểm tra mật khẩu
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      // Tạo token
      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          phone: user.phone,
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  // Tạo JWT token
  private generateToken(user: IUser) {
    return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  // Xác minh token
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
      };
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user._id,
        email: user.email,
        username: user.username,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async forgotPassword(email: string) {
    try {
      // Kiểm tra email có tồn tại không
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Email không tồn tại trong hệ thống");
      }

      // Tạo token ngẫu nhiên
      const token = crypto.randomBytes(32).toString("hex");

      // Thời hạn token (1 giờ)
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

      // Lưu token vào DB
      await PasswordReset.create({
        email,
        token,
        expires,
        used: false,
        created_at: new Date(),
      });

      // Trong thực tế, sẽ gửi email ở đây. Nhưng ở bài tập này, chỉ trả về token
      return {
        message: "Yêu cầu đặt lại mật khẩu đã được gửi",
        token, // Chỉ để test, thực tế không nên trả về
      };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Tìm token hợp lệ
      const passwordReset = await PasswordReset.findOne({
        token,
        used: false,
        expires: { $gt: new Date() },
      });

      if (!passwordReset) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
      }

      // Tìm user theo email
      const user = await User.findOne({ email: passwordReset.email });
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      // Cập nhật mật khẩu
      user.password = newPassword;
      await user.save();

      // Đánh dấu token đã sử dụng
      passwordReset.used = true;
      await passwordReset.save();

      return {
        message: "Mật khẩu đã được đặt lại thành công",
      };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      // Tìm user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      // Kiểm tra mật khẩu hiện tại
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new Error("Mật khẩu hiện tại không đúng");
      }

      // Cập nhật mật khẩu mới
      user.password = newPassword;
      await user.save();

      return {
        message: "Mật khẩu đã được thay đổi thành công",
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount(userId: string, password: string) {
    try {
      // Tìm user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      // Kiểm tra mật khẩu để xác thực
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error("Mật khẩu không đúng");
      }

      // Tìm và xóa tất cả seasons của user
      const seasons = await mongoose
        .model("Season")
        .find({ userId: new mongoose.Types.ObjectId(userId) });

      // Xóa các dữ liệu liên quan đến từng season
      for (const season of seasons) {
        // Tìm locations trong season
        const locations = await mongoose
          .model("Location")
          .find({ seasonId: season._id });

        for (const location of locations) {
          // Xóa plants, sensor data, alert settings, v.v.
          await mongoose
            .model("Plant")
            .deleteMany({ locationId: location._id });
          await mongoose
            .model("SensorData")
            .deleteMany({ locationId: location._id });
          await mongoose
            .model("AlertSettings")
            .deleteMany({ locationId: location._id });
          await mongoose
            .model("Notification")
            .deleteMany({ locationId: location._id });
        }

        // Xóa locations
        await mongoose.model("Location").deleteMany({ seasonId: season._id });
      }

      // Xóa seasons
      await mongoose
        .model("Season")
        .deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      // Xóa password reset tokens
      await PasswordReset.deleteMany({ email: user.email });

      // Cuối cùng xóa tài khoản
      await User.findByIdAndDelete(userId);

      return {
        message: "Tài khoản đã được xóa thành công",
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
