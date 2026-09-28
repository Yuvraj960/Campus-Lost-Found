import { itemService } from '../services/itemService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const itemController = {
  getItems: asyncHandler(async (req, res) => {
    const data = await itemService.getItems(req.query, req.user);
    return successResponse(res, data);
  }),

  getItemById: asyncHandler(async (req, res) => {
    const data = await itemService.getItemById(req.params.id, req.user);
    return successResponse(res, data);
  }),

  createItem: asyncHandler(async (req, res) => {
    const data = await itemService.createItem(req.body, req.user);
    return successResponse(res, data, 201, 'Item created successfully');
  }),

  updateItem: asyncHandler(async (req, res) => {
    const data = await itemService.updateItem(req.params.id, req.body, req.user);
    return successResponse(res, data, 200, 'Item updated successfully');
  }),

  updateItemStatus: asyncHandler(async (req, res) => {
    const data = await itemService.updateItemStatus(req.params.id, req.body.status, req.user);
    return successResponse(res, data, 200, `Item status updated to ${req.body.status}`);
  }),

  deleteItem: asyncHandler(async (req, res) => {
    const data = await itemService.deleteItem(req.params.id, req.user);
    return successResponse(res, data, 200, 'Item deleted successfully');
  }),

  getItemClaims: asyncHandler(async (req, res) => {
    const data = await itemService.getItemClaims(req.params.id, req.user);
    return successResponse(res, data);
  }),

  rematchItem: asyncHandler(async (req, res) => {
    // Stub until Phase 7
    return successResponse(res, { created: 0 }, 200, 'Matching triggered');
  }),
};
