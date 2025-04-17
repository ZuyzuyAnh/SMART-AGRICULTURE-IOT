import { Request, Response } from 'express';
import authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, address, phone } = req.body;
    console.log('Request body:', req.body); 
    
    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Đăng ký user mới
    const result = await authService.register({
      username,
      email,
      password,
      address,
      phone
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
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
        message: 'Please provide email and password'
      });
    }
    
    // Đăng nhập
    const result = await authService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Thông tin user đã được thêm vào req bởi middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Something went wrong'
    });
  }
};