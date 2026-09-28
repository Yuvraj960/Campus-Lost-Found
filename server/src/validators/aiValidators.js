import { z } from 'zod';

export const assistSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(3, 'Description must be at least 3 characters')
      .max(600, 'Description cannot exceed 600 characters'),
  })
  .strict();
