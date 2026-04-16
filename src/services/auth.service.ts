import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: Date;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export async function register(email: string, username: string, password: string): Promise<RegisterResponse> {
  try {
    // 检查用户名是否已存在
    const existingUser = await query('SELECT * FROM tryoutfit_users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return { success: false, message: '用户名已存在' };
    }

    // 检查邮箱是否已存在
    const existingEmail = await query('SELECT * FROM tryoutfit_users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return { success: false, message: '邮箱已被注册' };
    }

    // 直接存储明文密码
    await query(
      'INSERT INTO tryoutfit_users (email, username, password) VALUES ($1, $2, $3)',
      [email, username, password]
    );

    return { success: true, message: '注册成功' };
  } catch (error) {
    console.error('注册失败:', error);
    return { success: false, message: '注册失败，请稍后重试' };
  }
}

export async function login(username: string, password: string): Promise<LoginResponse | { error: string }> {
  try {
    // 查找用户
    const result = await query('SELECT * FROM tryoutfit_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return { error: '用户名或密码错误' };
    }

    const user = result.rows[0];

    // 验证密码（明文比较）
    const passwordMatch = user.password === password;
    if (!passwordMatch) {
      return { error: '用户名或密码错误' };
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
      },
      token,
    };
  } catch (error) {
    console.error('登录失败:', error);
    return { error: '登录失败，请稍后重试' };
  }
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as User;
    return decoded;
  } catch (error) {
    return null;
  }
}
