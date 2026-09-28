import { claimService } from '../services/claimService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const claimController = {
  createClaim: asyncHandler(async (req, res) => {
    const data = await claimService.createClaim(req.body, req.user);
    return successResponse(res, data, 201, 'Ownership claim submitted successfully');
  }),

  getMyClaims: asyncHandler(async (req, res) => {
    const data = await claimService.getMyClaims(req.user, req.query);
    return successResponse(res, data);
  }),

  updateClaimStatus: asyncHandler(async (req, res) => {
    const data = await claimService.updateClaimStatus(req.params.id, req.body, req.user);
    return successResponse(res, data, 200, `Claim status updated to ${req.body.status}`);
  }),
};
