import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const trimmedUser = username.trim();
    let user: any = null;

    try {
      const result = await query(
        'SELECT id, username, password_hash, full_name, role FROM admin_users WHERE LOWER(username) = LOWER($1)',
        [trimmedUser]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbErr: any) {
      console.warn(`⚠️ Database query failed (${dbErr.code || dbErr.message}). Checking default offline credentials.`);
      const defaultUser = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
      const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

      if (trimmedUser.toLowerCase() === defaultUser.toLowerCase() && password === defaultPass) {
        const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
        const token = jwt.sign(
          { id: 1, username: defaultUser, role: 'admin' },
          secret,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: 'Authenticated via default administrator credentials (database offline).',
          token,
          user: {
            id: 1,
            username: defaultUser,
            fullName: 'Academy Administrator (Local Fallback)',
            role: 'admin',
          },
        });
      }
    }

    if (!user) {
      // Also check default credentials if user row was not found
      const defaultUser = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
      const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      if (trimmedUser.toLowerCase() === defaultUser.toLowerCase() && password === defaultPass) {
        const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
        const token = jwt.sign(
          { id: 1, username: defaultUser, role: 'admin' },
          secret,
          { expiresIn: '7d' }
        );
        return res.json({
          success: true,
          message: 'Authenticated via default administrator credentials.',
          token,
          user: {
            id: 1,
            username: defaultUser,
            fullName: 'Academy Administrator',
            role: 'admin',
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while signing in.',
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const result = await query(
      'SELECT id, username, full_name, role, created_at FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
