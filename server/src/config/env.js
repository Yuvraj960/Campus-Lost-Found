import dotenv from 'dotenv';
import { z } from 'zod';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z
    .string()
    .default(() => process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-lost-found'),
  JWT_SECRET: z.string().default('change-me-to-a-long-random-string'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .transform((url) => url.trim().replace(/\/+$/, '')),
  ALLOWED_EMAIL_DOMAIN: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  MATCH_THRESHOLD: z.coerce.number().default(75),
  FALLBACK_MATCH_THRESHOLD: z.coerce.number().default(60),
  ADMIN_EMAIL: z.string().email().default('admin@campus.test'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
  RATE_LIMIT_ENABLED: z
    .preprocess((val) => {
      if (val === undefined || val === '') return false;
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return Boolean(val);
    }, z.boolean())
    .default(false),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Direct console error here before logger is initialized to show validation issues
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
