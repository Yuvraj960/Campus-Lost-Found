import { z } from 'zod';
import { CLAIM_STATUS } from '../constants/enums.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createClaimSchema = z
  .object({
    itemId: z.string().regex(objectIdRegex, 'Invalid item ID format'),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(500, 'Message cannot exceed 500 characters'),
    proof: z
      .string()
      .trim()
      .min(10, 'Proof details must be at least 10 characters')
      .max(500, 'Proof details cannot exceed 500 characters'),
  })
  .strict();

export const updateClaimStatusSchema = z
  .object({
    status: z.enum([CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED, CLAIM_STATUS.WITHDRAWN]),
    decisionNote: z.string().trim().max(300, 'Decision note cannot exceed 300 characters').optional(),
  })
  .strict();
