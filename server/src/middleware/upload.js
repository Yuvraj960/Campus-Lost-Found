import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Memory storage keeps file buffers in memory for processing or Cloudinary upload
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

/**
 * Middleware that normalizes req.body.images whether sent as multipart files or JSON.
 * Before Phase 6 (Cloudinary), uploaded files generate placeholder image objects.
 */
export const processItemImages = (req, res, next) => {
  try {
    // If files were uploaded via multer
    if (req.files && req.files.length > 0) {
      const generatedImages = req.files.map((file, idx) => ({
        url: `https://picsum.photos/seed/${Date.now()}-${idx}/600/400`,
        publicId: `local-placeholder-${Date.now()}-${idx}`,
      }));

      // Combine with existing images if any
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

      req.body.images = [...existingImages, ...generatedImages].slice(0, 5);
    } else if (typeof req.body.images === 'string') {
      try {
        req.body.images = JSON.parse(req.body.images);
      } catch {
        req.body.images = [];
      }
    } else if (!req.body.images) {
      req.body.images = [];
    }

    next();
  } catch (err) {
    next(err);
  }
};
