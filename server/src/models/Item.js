import mongoose from 'mongoose';
import { CATEGORY, ITEM_TYPE, ITEM_STATUS, CONTACT_PREF } from '../constants/enums.js';

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: Object.values(CATEGORY),
      required: [true, 'Category is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ITEM_TYPE),
      required: [true, 'Type is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters'],
      maxlength: [120, 'Location cannot exceed 120 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (v) {
          return v <= new Date();
        },
        message: 'Date cannot be in the future',
      },
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: [
        (val) => val.length <= 5,
        'Cannot attach more than 5 images',
      ],
    },
    status: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.ACTIVE,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    contactPreference: {
      type: String,
      enum: Object.values(CONTACT_PREF),
      default: CONTACT_PREF.IN_APP,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes defined in docs/DATA_MODEL.md
itemSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { weights: { title: 5, description: 2, location: 3 }, name: 'ItemTextIndex' }
);
itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ category: 1, date: -1 });
itemSchema.index({ owner: 1, createdAt: -1 });

export const Item = mongoose.model('Item', itemSchema);
