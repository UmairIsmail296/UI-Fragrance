const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `perfume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const imageExts = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
  const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const videoExts = ['.mp4', '.webm', '.mov', '.ogg', '.m4v'];
  const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-m4v'];

  if (file.fieldname === 'photos') {
    // Accept any image MIME type (image/*) to allow all image formats from clients.
    if (mime && mime.startsWith('image/')) return cb(null, true);
    // Fallback: allow by extension if MIME is missing or non-standard.
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

  // Default: allow common image types
  const defaultExtValid = imageExts.includes(ext);
  const defaultMimeValid = imageMimes.includes(mime);
  if (defaultExtValid && defaultMimeValid) return cb(null, true);
  return cb(new Error('Only image files are allowed'));
};

// Allow larger uploads (photos + videos). Keep a sensible maximum so server
// isn't overwhelmed — 50MB should cover typical video uploads while still
// protecting the server.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// Expose the configured maximum (useful for returning friendlier errors)
upload.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;

module.exports = upload;
