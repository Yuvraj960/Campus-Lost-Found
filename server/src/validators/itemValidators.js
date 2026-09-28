import { z } from 'zod';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, CONTACT_PREF } from '../constants/enums.js';

export const createItemSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
    category: z.enum(Object.values(CATEGORY)),
    type: z.enum(Object.values(ITEM_TYPE)),
    location: z.string().trim().min(2, 'Location must be at least 2 characters').max(120, 'Location cannot exceed 120 characters'),
    date: z.coerce.date().refine((d) => d <= new Date(), {
      message: 'Date cannot be in the future',
    }),
    contactPreference: z.enum(Object.values(CONTACT_PREF)).default(CONTACT_PREF.IN_APP),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().optional().default(''),
        })
      )
      .max(5, 'Maximum 5 images allowed')
      .optional()
      .default([]),
  })
  .strict();

export const updateItemSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(10).max(1000).optional(),
    category: z.enum(Object.values(CATEGORY)).optional(),
    location: z.string().trim().min(2).max(120).optional(),
    date: z.coerce.date().refine((d) => d <= new Date(), {
      message: 'Date cannot be in the future',
    }).optional(),
    contactPreference: z.enum(Object.values(CONTACT_PREF)).optional(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          publicId: z.string().optional().default(''),
        })
      )
      .max(5)
      .optional(),
  })
  .strict();

export const updateItemStatusSchema = z
  .object({
    status: z.enum([ITEM_STATUS.RESOLVED, ITEM_STATUS.CLOSED]),
  })
  .strict();

export const itemQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(Object.values(ITEM_TYPE)).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional().default('ACTIVE'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  owner: z.string().optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
