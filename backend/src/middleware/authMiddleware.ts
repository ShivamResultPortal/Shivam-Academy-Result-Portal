import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authenticateAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Check for token in secure httpOnly cookie
  let token = req.cookies?.nsa_token;

  // 2. Fallback to Authorization: Bearer <token> header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
  }
};
