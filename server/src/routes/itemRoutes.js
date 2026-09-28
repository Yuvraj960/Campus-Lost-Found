import { Router } from 'express';
import { itemController } from '../controllers/itemController.js';
import { validate } from '../middleware/validate.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { uploadItemImages, processItemImages } from '../middleware/upload.js';
import {
  createItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
  itemQuerySchema,
} from '../validators/itemValidators.js';

export const itemRouter = Router();

itemRouter.get('/', optionalAuth, validate(itemQuerySchema, 'query'), itemController.getItems);
itemRouter.get('/:id', optionalAuth, itemController.getItemById);
itemRouter.post('/', auth, uploadItemImages, processItemImages, validate(createItemSchema, 'body'), itemController.createItem);
itemRouter.put('/:id', auth, uploadItemImages, processItemImages, validate(updateItemSchema, 'body'), itemController.updateItem);
itemRouter.patch('/:id/status', auth, validate(updateItemStatusSchema, 'body'), itemController.updateItemStatus);
itemRouter.delete('/:id', auth, itemController.deleteItem);
itemRouter.get('/:id/claims', auth, itemController.getItemClaims);
itemRouter.post('/:id/rematch', auth, itemController.rematchItem);
