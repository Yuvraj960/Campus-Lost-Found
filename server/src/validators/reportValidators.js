import { z } from 'zod';
import { REPORT_REASON, REPORT_STATUS } from '../constants/enums.js';

export const createReportSchema = z
  .object({
    itemId: z.string().min(1, 'Item ID is required'),
    reason: z.enum(Object.values(REPORT_REASON)),
    details: z.string().trim().max(500, 'Details cannot exceed 500 characters').optional(),
  })
  .strict();

export const updateReportSchema = z
  .object({
    status: z.enum(Object.values(REPORT_STATUS)),
    resolutionNote: z.string().trim().max(500, 'Resolution note cannot exceed 500 characters').optional(),
  })
  .strict();
