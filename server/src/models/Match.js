import mongoose from 'mongoose';
import { MATCH_STATUS } from '../constants/enums.js';

const matchSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Lost item reference is required'],
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Found item reference is required'],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasoning: {
      type: String,
      trim: true,
    },
    matchingAttributes: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['GEMINI', 'HEURISTIC'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MATCH_STATUS),
      default: MATCH_STATUS.SUGGESTED,
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

matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

export const Match = mongoose.model('Match', matchSchema);
