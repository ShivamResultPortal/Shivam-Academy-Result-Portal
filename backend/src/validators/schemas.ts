import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Schema: Admin Login
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username or email must be at least 3 characters')
    .max(100, 'Username or email cannot exceed 100 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

// Schema: Create New Admin User
export const createAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(150, 'Email cannot exceed 150 characters')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional()
    .default('Administrator'),
  role: z
    .enum(['admin', 'superadmin', 'evaluator'])
    .optional()
    .default('admin'),
});

// Schema: Update Admin Credentials
export const updateCredentialsSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newUsername: z
      .string()
      .trim()
      .min(3, 'New username must be at least 3 characters')
      .max(100, 'New username cannot exceed 100 characters')
      .optional(),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(100, 'New password cannot exceed 100 characters')
      .optional(),
  })
  .refine(
    (data) => !!(data.newUsername || data.newPassword),
    {
      message: 'You must provide at least a new username or a new password.',
      path: ['newPassword'],
    }
  );

// Schema: Forgot Password Request
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, 'Email or username must be at least 3 characters')
    .max(150, 'Email cannot exceed 150 characters'),
});

// Schema: Reset Password
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(10, 'Invalid reset token format'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password cannot exceed 100 characters'),
});

// Schema: Create Student Result
export const createResultSchema = z.object({
  id: z.string().optional(),
  rollNo: z
    .string()
    .trim()
    .min(1, 'Roll number cannot be empty')
    .max(50, 'Roll number cannot exceed 50 characters'),
  studentName: z
    .string()
    .trim()
    .min(2, 'Student name must be at least 2 characters')
    .max(150, 'Student name cannot exceed 150 characters'),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject cannot be empty')
    .max(100, 'Subject cannot exceed 100 characters')
    .default('Mathematics'),
  marksObtained: z
    .number()
    .min(0, 'Marks obtained cannot be negative'),
  totalMarks: z
    .number()
    .positive('Total marks must be greater than 0')
    .default(100),
  passingMarks: z
    .number()
    .min(0, 'Passing marks cannot be negative')
    .default(40),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().default(''),
}).refine((data) => data.marksObtained <= data.totalMarks, {
  message: 'Marks obtained cannot exceed total marks',
  path: ['marksObtained'],
});

// Schema: Update Student Result
export const updateResultSchema = z.object({
  rollNo: z.string().trim().min(1).max(50).optional(),
  studentName: z.string().trim().min(2).max(150).optional(),
  subject: z.string().trim().min(1).max(100).optional(),
  marksObtained: z.number().min(0).optional(),
  totalMarks: z.number().positive().optional(),
  passingMarks: z.number().min(0).optional(),
  remarks: z.string().max(500).optional(),
});

// Express middleware factory for Zod validation
export const validateBody = (schema: z.ZodType<any, any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error && error.issues && Array.isArray(error.issues)) {
        const errorMessages = error.issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : '',
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: errorMessages[0]?.message || 'Validation error',
          errors: errorMessages,
        });
      }
      return res.status(400).json({
        success: false,
        message: error?.message || 'Invalid request payload',
      });
    }
  };
};
