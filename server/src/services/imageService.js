import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

export const imageService = {
  /**
   * Upload a single image file buffer to Cloudinary (or return dev placeholder).
   * @param {object} file - Express multer file object
   * @param {string} folder - Target Cloudinary folder
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  uploadOne: async (file, folder = 'campus-lost-found/items') => {
    if (!isCloudinaryConfigured) {
      const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return {
        url: `https://picsum.photos/seed/${fallbackId}/600/400`,
        publicId: fallbackId,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  },

  /**
   * Upload multiple image file buffers with rollback cleanup on error.
   * @param {Array<object>} files - Array of multer file objects
   * @param {string} folder - Target Cloudinary folder
   * @returns {Promise<Array<{ url: string, publicId: string }>>}
   */
  uploadMany: async (files, folder = 'campus-lost-found/items') => {
    if (!files || files.length === 0) return [];

    const uploaded = [];
    try {
      for (const file of files) {
        const result = await imageService.uploadOne(file, folder);
        uploaded.push(result);
      }
      return uploaded;
    } catch (err) {
      // Rollback already uploaded images from this batch
      if (uploaded.length > 0 && isCloudinaryConfigured) {
        await Promise.all(
          uploaded.map((img) => imageService.delete(img.publicId))
        );
      }
      throw err;
    }
  },

  /**
   * Delete an asset from Cloudinary by its publicId.
   * @param {string} publicId
   */
  delete: async (publicId) => {
    if (
      !publicId ||
      publicId.startsWith('fallback-') ||
      publicId.startsWith('local-placeholder-') ||
      publicId.startsWith('mock/')
    ) {
      return { result: 'ok' };
    }

    if (!isCloudinaryConfigured) {
      logger.info(`Dev fallback: skipped Cloudinary asset deletion for ${publicId}`);
      return { result: 'ok' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (err) {
      logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
      return null;
    }
  },

  /**
   * Delete multiple assets from Cloudinary.
   * @param {Array<string>} publicIds
   */
  deleteMany: async (publicIds) => {
    if (!publicIds || publicIds.length === 0) return;
    await Promise.all(publicIds.map((id) => imageService.delete(id)));
  },
};
