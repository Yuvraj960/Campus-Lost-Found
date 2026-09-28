import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { imageService } from '../services/imageService.js';

// Memory storage keeps file buffers in memory for processing or Cloudinary streaming
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 'VALIDATION_ERROR'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // max 5 files
  },
  fileFilter,
});

export const uploadItemImages = upload.array('images', 5);
export const uploadProfileImage = upload.single('profileImage');

/**
 * Middleware that processes item images uploaded via multer or sent as JSON.
 * Uploads buffers via imageService to Cloudinary (or dev fallback).
 */
export const processItemImages = async (req, res, next) => {
  try {
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await imageService.uploadMany(req.files, 'campus-lost-found/items');
    }

    // Parse existing images if passed in body
    let existingImages = [];
    if (req.body.images) {
      if (typeof req.body.images === 'string') {
        try {
          existingImages = JSON.parse(req.body.images);
        } catch {
          existingImages = [];
        }
      } else if (Array.isArray(req.body.images)) {
        existingImages = req.body.images;
      }
    }

    req.body.images = [...existingImages, ...uploadedImages].slice(0, 5);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware that processes profile image uploaded via multer.
 */
export const processProfileImage = async (req, res, next) => {
  try {
    if (req.file) {
      const uploaded = await imageService.uploadOne(req.file, 'campus-lost-found/profiles');
      req.body.profileImage = uploaded;
    } else if (typeof req.body.profileImage === 'string') {
      try {
        req.body.profileImage = JSON.parse(req.body.profileImage);
      } catch {
        // String URL or plain value
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
