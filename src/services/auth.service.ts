import User, { IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

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
        throw new Error('Email already exists');
      }
      
      // Kiểm tra username đã tồn tại
      const existingUsername = await User.findOne({ username: userData.username });
      if (existingUsername) {
        throw new Error('Username already exists');
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
          phone: user.phone
        },
        token
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
        throw new Error('Invalid credentials');
      }
      
      // Kiểm tra mật khẩu
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Tạo token
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          address: user.address,
          phone: user.phone
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Tạo JWT token
  private generateToken(user: IUser) {
    return jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }
  
  // Xác minh token
  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const user = await User.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        id: user._id,
        email: user.email,
        username: user.username
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();