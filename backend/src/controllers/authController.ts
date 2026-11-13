import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
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

        res.cookie('nsa_token', token, getCookieOptions());

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

    // Set secure httpOnly cookie
    res.cookie('nsa_token', token, getCookieOptions());

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

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('nsa_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  });
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const updateCredentials = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const { currentPassword, newUsername, newPassword } = req.body;

    const userResult = await query(
      'SELECT id, username, password_hash, full_name, role FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    let updatedUsername = user.username;
    let updatedPasswordHash = user.password_hash;

    // Check if new username is requested and not already taken by another user
    if (newUsername && newUsername.trim() !== '') {
      const cleanUser = newUsername.trim();
      const existingUserCheck = await query(
        'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1) AND id != $2',
        [cleanUser, user.id]
      );
      if (existingUserCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Username '${cleanUser}' is already taken by another account.`,
        });
      }
      updatedUsername = cleanUser;
    }

    // Hash new password if provided
    if (newPassword && newPassword.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatedPasswordHash = await bcrypt.hash(newPassword, salt);
    }

    // Update in database
    await query(
      'UPDATE admin_users SET username = $1, password_hash = $2 WHERE id = $3',
      [updatedUsername, updatedPasswordHash, user.id]
    );

    // Issue updated token
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    const newToken = jwt.sign(
      {
        id: user.id,
        username: updatedUsername,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.cookie('nsa_token', newToken, getCookieOptions());

    return res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      token: newToken,
      user: {
        id: user.id,
        username: updatedUsername,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Update credentials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin credentials.',
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
