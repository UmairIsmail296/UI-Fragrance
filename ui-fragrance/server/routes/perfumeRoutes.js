const express = require('express');
const router = express.Router();
const Perfume = require('../models/Perfume');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

const upload = uploadMiddleware;
const { uploadToCloudinary, deleteCloudinaryAsset } = uploadMiddleware;

const uploadPerfumeMedia = upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
]);

const deleteMediaUrl = async (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string') return;

  if (mediaUrl.startsWith('/uploads/')) {
    return;
  }

  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    await deleteCloudinaryAsset(mediaUrl);
  }
};

const cleanupCloudinaryUrls = async (mediaUrls = []) => {
  await Promise.all((mediaUrls || []).map((url) => deleteMediaUrl(url)));
};

const parseJsonArrayField = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeMediaUrlList = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeMediaUrlList(item));
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return normalizeMediaUrlList(parsed);
    }
    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // Ignore invalid JSON; the raw string itself is the URL.
  }

  return [trimmed];
};

// Per-field size limits (individual files)
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB per photo
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB per video

const validatePerFieldSizes = (req, res) => {
  const photoFiles = req.files?.photos || [];
  const videoFiles = req.files?.videos || [];

  const oversized = [...photoFiles, ...videoFiles].find((f) => {
    if (f.fieldname === 'photos') return f.size > PHOTO_MAX_BYTES;
    if (f.fieldname === 'videos') return f.size > VIDEO_MAX_BYTES;
    return false;
  });

  if (oversized) {
    const limitMb = oversized.fieldname === 'photos' ? PHOTO_MAX_BYTES / (1024 * 1024) : VIDEO_MAX_BYTES / (1024 * 1024);
    res.status(413).json({ message: `Uploaded file '${oversized.originalname}' in field '${oversized.fieldname}' is too large. Maximum per-file size is ${limitMb} MB.` });
    return false;
  }
  return true;
};

// @route   GET /api/perfumes
// @desc    Get all perfumes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const perfumes = await Perfume.find().sort({ createdAt: -1 });
    res.status(200).json(perfumes);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching perfumes', error: error.message });
  }
});

// @route   GET /api/perfumes/:id
// @desc    Get single perfume details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const perfume = await Perfume.findById(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }
    res.status(200).json(perfume);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching perfume', error: error.message });
  }
});

router.post('/upload', protectAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const targetFolder = (req.body?.folder && String(req.body.folder).trim()) || 'ui-fragrance/perfumes/photos';
    const uploadedUrl = await uploadToCloudinary(req.file, targetFolder);

    if (!uploadedUrl) {
      return res.status(500).json({ message: 'Cloudinary upload failed' });
    }

    return res.status(200).json({ url: uploadedUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while uploading media to Cloudinary', error: error.message });
  }
});

// @route   POST /api/perfumes
// @desc    Add a new perfume with 1-5 photos and 0-2 videos
// @access  Private (Admin)
router.post('/', protectAdmin, uploadPerfumeMedia, async (req, res) => {
  let uploadedPhotoUrls = [];
  let uploadedVideoUrls = [];

  try {
    const {
      name,
      brand,
      actualPrice,
      discountPrice,
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
      photos,
      videos,
    } = req.body;

    if (!name || !brand || !actualPrice || !discountPrice || !size || !description || !topNotes || !middleNotes || !baseNotes) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const parsedActualPrice = Number(actualPrice);
    const parsedDiscountPrice = Number(discountPrice);
    if (Number.isNaN(parsedActualPrice) || Number.isNaN(parsedDiscountPrice) || parsedActualPrice <= 0 || parsedDiscountPrice <= 0) {
      return res.status(400).json({ message: 'Prices must be valid positive numbers' });
    }

    const photoFiles = req.files?.photos || [];
    const videoFiles = req.files?.videos || [];
    const directPhotoUrls = normalizeMediaUrlList(photos);
    const directVideoUrls = normalizeMediaUrlList(videos);

    if ((photoFiles.length || videoFiles.length) && !validatePerFieldSizes(req, res)) return;

    if (directPhotoUrls.length > 0) {
      uploadedPhotoUrls = directPhotoUrls;
    } else {
      if (photoFiles.length < 1) {
        return res.status(400).json({ message: 'At least 1 photo is required' });
      }
      uploadedPhotoUrls = await Promise.all(photoFiles.map((file) => uploadToCloudinary(file, 'ui-fragrance/perfumes/photos')));
    }

    if (directVideoUrls.length > 0) {
      uploadedVideoUrls = directVideoUrls;
    } else {
      uploadedVideoUrls = await Promise.all(videoFiles.map((file) => uploadToCloudinary(file, 'ui-fragrance/perfumes/videos')));
    }

    const perfume = await Perfume.create({
      name,
      brand,
      actualPrice: parsedActualPrice,
      discountPrice: parsedDiscountPrice,
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
      photos: uploadedPhotoUrls,
      videos: uploadedVideoUrls,
    });

    res.status(201).json(perfume);
  } catch (error) {
    await cleanupCloudinaryUrls([...uploadedPhotoUrls, ...uploadedVideoUrls]);
    res.status(500).json({ message: 'Server error while creating perfume', error: error.message });
  }
});

// @route   PUT /api/perfumes/:id
// @desc    Update a perfume — add new photos/videos (up to the limits) and/or
//          remove specific existing ones by path.
// @access  Private (Admin)
router.put('/:id', protectAdmin, uploadPerfumeMedia, async (req, res) => {
  let uploadedNewPhotoUrls = [];
  let uploadedNewVideoUrls = [];

  try {
    const perfume = await Perfume.findById(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }

    const {
      name,
      brand,
      actualPrice,
      discountPrice,
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
      removedPhotos,
      removedVideos,
      photos,
      videos,
    } = req.body;

    perfume.name = name || perfume.name;
    perfume.brand = brand || perfume.brand;
    if (actualPrice !== undefined && actualPrice !== '') {
      const parsedActualPrice = Number(actualPrice);
      if (!Number.isNaN(parsedActualPrice) && parsedActualPrice > 0) {
        perfume.actualPrice = parsedActualPrice;
      }
    }
    if (discountPrice !== undefined && discountPrice !== '') {
      const parsedDiscountPrice = Number(discountPrice);
      if (!Number.isNaN(parsedDiscountPrice) && parsedDiscountPrice > 0) {
        perfume.discountPrice = parsedDiscountPrice;
      }
    }
    perfume.size = size || perfume.size;
    perfume.description = description || perfume.description;
    perfume.topNotes = topNotes || perfume.topNotes;
    perfume.middleNotes = middleNotes || perfume.middleNotes;
    perfume.baseNotes = baseNotes || perfume.baseNotes;

    const toRemovePhotos = parseJsonArrayField(removedPhotos);
    const toRemoveVideos = parseJsonArrayField(removedVideos);

    const remainingPhotos = perfume.photos.filter((p) => !toRemovePhotos.includes(p));
    const remainingVideos = perfume.videos.filter((v) => !toRemoveVideos.includes(v));

    const newPhotoFiles = req.files?.photos || [];
    const newVideoFiles = req.files?.videos || [];
    const directPhotoUrls = normalizeMediaUrlList(photos);
    const directVideoUrls = normalizeMediaUrlList(videos);

    if ((newPhotoFiles.length || newVideoFiles.length) && !validatePerFieldSizes(req, res)) return;

    if (newPhotoFiles.length > 0) {
      uploadedNewPhotoUrls = await Promise.all(newPhotoFiles.map((file) => uploadToCloudinary(file, 'ui-fragrance/perfumes/photos')));
    }

    if (newVideoFiles.length > 0) {
      uploadedNewVideoUrls = await Promise.all(newVideoFiles.map((file) => uploadToCloudinary(file, 'ui-fragrance/perfumes/videos')));
    }

    const finalPhotos = directPhotoUrls.length > 0 ? directPhotoUrls : [...remainingPhotos, ...uploadedNewPhotoUrls];
    const finalVideos = directVideoUrls.length > 0 ? directVideoUrls : [...remainingVideos, ...uploadedNewVideoUrls];

    if (finalPhotos.length < 1 || finalPhotos.length > 5) {
      await cleanupCloudinaryUrls([...uploadedNewPhotoUrls, ...uploadedNewVideoUrls]);
      return res.status(400).json({ message: 'A perfume must have between 1 and 5 photos' });
    }
    if (finalVideos.length > 2) {
      await cleanupCloudinaryUrls([...uploadedNewPhotoUrls, ...uploadedNewVideoUrls]);
      return res.status(400).json({ message: 'A perfume can have at most 2 videos' });
    }

    await Promise.all(toRemovePhotos.map((pathValue) => deleteMediaUrl(pathValue)));
    await Promise.all(toRemoveVideos.map((pathValue) => deleteMediaUrl(pathValue)));

    perfume.photos = finalPhotos;
    perfume.videos = finalVideos;

    const updatedPerfume = await perfume.save();
    res.status(200).json(updatedPerfume);
  } catch (error) {
    await cleanupCloudinaryUrls([...uploadedNewPhotoUrls, ...uploadedNewVideoUrls]);
    res.status(500).json({ message: 'Server error while updating perfume', error: error.message });
  }
});

// @route   DELETE /api/perfumes/:id
// @desc    Delete a perfume and all its associated photo/video files
// @access  Private (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const perfume = await Perfume.findById(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }

    await Promise.all((perfume.photos || []).map((photoUrl) => deleteMediaUrl(photoUrl)));
    await Promise.all((perfume.videos || []).map((videoUrl) => deleteMediaUrl(videoUrl)));

    await perfume.deleteOne();
    res.status(200).json({ message: 'Perfume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting perfume', error: error.message });
  }
});

module.exports = router;