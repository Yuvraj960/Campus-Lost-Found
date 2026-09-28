import mongoose from 'mongoose';
import { CLAIM_STATUS } from '../constants/enums.js';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item is required'],
      index: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    proof: {
      type: String,
      required: [true, 'Proof details are required'],
      trim: true,
      minlength: [10, 'Proof details must be at least 10 characters'],
      maxlength: [500, 'Proof details cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(CLAIM_STATUS),
      default: CLAIM_STATUS.PENDING,
      index: true,
    },
    decidedAt: {
      type: Date,
    },
    decisionNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Decision note cannot exceed 300 characters'],
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

// One pending claim per (claimant, item)
claimSchema.index(
  { item: 1, claimant: 1 },
  { unique: true, partialFilterExpression: { status: CLAIM_STATUS.PENDING } }
);

export const Claim = mongoose.model('Claim', claimSchema);
