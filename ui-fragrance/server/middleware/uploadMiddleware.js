const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const imageExts = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
  const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const videoExts = ['.mp4', '.webm', '.mov', '.ogg', '.m4v'];
  const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-m4v'];

  if (file.fieldname === 'photos') {
    if (mime && mime.startsWith('image/')) return cb(null, true);
    const extValid = imageExts.includes(ext);
    if (extValid) return cb(null, true);
    return cb(new Error('Only image files are allowed in the photos field'));
  }

  if (file.fieldname === 'videos') {
    const extValid = videoExts.includes(ext);
    const mimeValid = videoMimes.includes(mime);
    if (extValid && mimeValid) return cb(null, true);
    return cb(new Error('Only video files (mp4, webm, mov, ogg, m4v) are allowed in the videos field'));
  }

  const defaultExtValid = imageExts.includes(ext);
  const defaultMimeValid = imageMimes.includes(mime);
  if (defaultExtValid && defaultMimeValid) return cb(null, true);
  return cb(new Error('Only image files are allowed'));
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

upload.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

const getCloudinaryResourceType = (file) => {
  if (file?.fieldname === 'videos' || (file?.mimetype || '').startsWith('video/')) {
    return 'video';
  }
  return 'image';
};

const uploadToCloudinary = async (file, folder = 'ui-fragrance') => {
  if (!file || !file.buffer) {
    throw new Error('Uploaded file content is missing');
  }

  const requiredKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingKeys = requiredKeys.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missingKeys.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missingKeys.join(', ')}`);
  }

  const resourceType = getCloudinaryResourceType(file);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        fetch_format: 'auto',
        quality: 'auto',
      },
      (error, uploadResult) => {
        if (error) {
          return reject(error);
        }
        resolve(uploadResult);
      }
    );

    stream.end(file.buffer);
  });

  return result?.secure_url || null;
};

const getCloudinaryPublicId = (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.includes('cloudinary.com')) {
    return null;
  }

  try {
    const pathname = new URL(mediaUrl).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
    if (!publicIdWithExt) return null;

    return decodeURIComponent(publicIdWithExt).replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

const deleteCloudinaryAsset = async (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.includes('cloudinary.com')) {
    return;
  }

  const publicId = getCloudinaryPublicId(mediaUrl);
  if (!publicId) return;

  const resourceType = mediaUrl.includes('/video/') ? 'video' : 'image';
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.deleteCloudinaryAsset = deleteCloudinaryAsset;
module.exports.getCloudinaryPublicId = getCloudinaryPublicId;
module.exports.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
