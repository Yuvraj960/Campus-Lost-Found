import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one letter and one number'),
  studentId: z.string().trim().max(50).optional(),
  department: z.string().trim().max(100).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  phone: z.string().trim().max(20).optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  department: z.string().trim().max(100).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  phone: z.string().trim().max(20).optional(),
  studentId: z.string().trim().max(50).optional(),
  profileImage: z.string().url().max(500).optional(),
}).strict();
