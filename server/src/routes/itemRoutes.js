import { Router } from 'express';
import { itemController } from '../controllers/itemController.js';
import { validate } from '../middleware/validate.js';
import {
  createItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
  itemQuerySchema,
} from '../validators/itemValidators.js';

export const itemRouter = Router();

itemRouter.get('/', validate(itemQuerySchema, 'query'), itemController.getItems);
itemRouter.get('/:id', itemController.getItemById);
itemRouter.post('/', validate(createItemSchema, 'body'), itemController.createItem);
itemRouter.put('/:id', validate(updateItemSchema, 'body'), itemController.updateItem);
itemRouter.patch('/:id/status', validate(updateItemStatusSchema, 'body'), itemController.updateItemStatus);
itemRouter.delete('/:id', itemController.deleteItem);
itemRouter.get('/:id/claims', itemController.getItemClaims);
itemRouter.post('/:id/rematch', itemController.rematchItem);
