import { z } from 'zod';
import { USER_STATUS, ITEM_TYPE, ITEM_STATUS, CLAIM_STATUS, REPORT_STATUS } from '../constants/enums.js';

export const updateUserStatusSchema = z
  .object({
    status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]),
  })
  .strict();

export const adminUpdateItemSchema = z
  .object({
    isFlagged: z.boolean().optional(),
    isRemoved: z.boolean().optional(),
  })
  .strict();

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminItemQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(Object.values(ITEM_TYPE)).optional(),
  status: z.enum(Object.values(ITEM_STATUS)).optional(),
  isFlagged: z.coerce.boolean().optional(),
  isRemoved: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminClaimQuerySchema = z.object({
  status: z.enum(Object.values(CLAIM_STATUS)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminReportQuerySchema = z.object({
  status: z.enum(Object.values(REPORT_STATUS)).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
