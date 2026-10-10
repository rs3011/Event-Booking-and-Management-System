const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const AppError = require('../utils/AppError');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  );
};

const getCloudinaryClient = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    return cloudinary;
  }
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
  }
  return null;
};

/**
 * Upload a single event image.
 * Uses Cloudinary when configured; falls back to local uploads/ in development.
 * POST /api/upload/image
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    // Cloudinary storage for production
    if (isCloudinaryConfigured()) {
      const client = getCloudinaryClient();
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = client.uploader.upload_stream(
          { folder: 'campus_events', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      const result = await uploadPromise;
      return res.status(201).json({
        success: true,
        data: { url: result.secure_url },
      });
    }

    // Local file fallback for development / offline environments
    const ext = MIME_TO_EXT[req.file.mimetype] || 'jpg';
    const filename = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, req.file.buffer);

    res.status(201).json({
      success: true,
      data: { url: `/uploads/${filename}` },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an uploaded image by filename.
 * Applies path traversal protection for local files.
 * DELETE /api/upload/:filename
 */
const deleteImage = async (req, res, next) => {
  try {
    const rawFilename = req.params.filename;

    if (isCloudinaryConfigured() && rawFilename.startsWith('campus_events/')) {
      const client = getCloudinaryClient();
      await client.uploader.destroy(rawFilename);
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    }

    const safeName = path.basename(rawFilename);
    const filePath = path.resolve(UPLOADS_DIR, safeName);

    if (!filePath.startsWith(UPLOADS_DIR)) {
      throw new AppError('Invalid filename', 400);
    }

    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
    } catch {
      // If file was already deleted or not found, return 404
      throw new AppError('File not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage, deleteImage };
