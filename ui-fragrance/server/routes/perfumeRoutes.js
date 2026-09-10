const express = require('express');
const router = express.Router();
const Perfume = require('../models/Perfume');
const upload = require('../middleware/uploadMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const uploadPerfumeMedia = upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
]);

const deleteUploadedFile = (relativePath) => {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  const fullPath = path.join(__dirname, '..', relativePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error deleting file:', relativePath, err.message);
    }
  });
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

// Per-field size limits (individual files)
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB per photo
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB per video

const cleanupUploadedFiles = (photoFiles = [], videoFiles = []) => {
  (photoFiles || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
  (videoFiles || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
};

const validatePerFieldSizes = (req, res) => {
  const photoFiles = req.files?.photos || [];
  const videoFiles = req.files?.videos || [];

  const oversized = [...photoFiles, ...videoFiles].find((f) => {
    if (f.fieldname === 'photos') return f.size > PHOTO_MAX_BYTES;
    if (f.fieldname === 'videos') return f.size > VIDEO_MAX_BYTES;
    return false;
  });

  if (oversized) {
    cleanupUploadedFiles(photoFiles, videoFiles);
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

// @route   POST /api/perfumes
// @desc    Add a new perfume with 1-5 photos and 0-2 videos
// @access  Private (Admin)
router.post('/', protectAdmin, uploadPerfumeMedia, async (req, res) => {
  try {
    const {
      name,
      brand,
      actualPrice, // FIXED: replaces `price`
      discountPrice, // FIXED: replaces `price`
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
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

    // Enforce per-field file size limits and cleanup any uploaded files
    if (!validatePerFieldSizes(req, res)) return;

    if (photoFiles.length < 1) {
      return res.status(400).json({ message: 'At least 1 photo is required' });
    }

    const photos = photoFiles.map((f) => `/uploads/${f.filename}`);
    const videos = videoFiles.map((f) => `/uploads/${f.filename}`);

    const perfume = await Perfume.create({
      name,
      brand,
      actualPrice: parsedActualPrice, // FIXED
      discountPrice: parsedDiscountPrice, // FIXED
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
      photos,
      videos,
    });

    res.status(201).json(perfume);
  } catch (error) {
    (req.files?.photos || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
    (req.files?.videos || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
    res.status(500).json({ message: 'Server error while creating perfume', error: error.message });
  }
});

// @route   PUT /api/perfumes/:id
// @desc    Update a perfume — add new photos/videos (up to the limits) and/or
//          remove specific existing ones by path.
// @access  Private (Admin)
router.put('/:id', protectAdmin, uploadPerfumeMedia, async (req, res) => {
  try {
    const perfume = await Perfume.findById(req.params.id);
    if (!perfume) {
      return res.status(404).json({ message: 'Perfume not found' });
    }

    const {
      name,
      brand,
      actualPrice, // FIXED: replaces `price`
      discountPrice, // FIXED: replaces `price`
      size,
      description,
      topNotes,
      middleNotes,
      baseNotes,
      removedPhotos,
      removedVideos,
    } = req.body;

    perfume.name = name || perfume.name;
    perfume.brand = brand || perfume.brand;
    // FIXED: replaced single price string with two numeric fields
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

    // Enforce per-field file size limits and cleanup any uploaded files
    if (!validatePerFieldSizes(req, res)) return;
    const newPhotoPaths = newPhotoFiles.map((f) => `/uploads/${f.filename}`);
    const newVideoPaths = newVideoFiles.map((f) => `/uploads/${f.filename}`);

    const finalPhotos = [...remainingPhotos, ...newPhotoPaths];
    const finalVideos = [...remainingVideos, ...newVideoPaths];

    if (finalPhotos.length < 1 || finalPhotos.length > 5) {
      newPhotoPaths.forEach(deleteUploadedFile);
      newVideoPaths.forEach(deleteUploadedFile);
      return res.status(400).json({ message: 'A perfume must have between 1 and 5 photos' });
    }
    if (finalVideos.length > 2) {
      newPhotoPaths.forEach(deleteUploadedFile);
      newVideoPaths.forEach(deleteUploadedFile);
      return res.status(400).json({ message: 'A perfume can have at most 2 videos' });
    }

    toRemovePhotos.forEach(deleteUploadedFile);
    toRemoveVideos.forEach(deleteUploadedFile);

    perfume.photos = finalPhotos;
    perfume.videos = finalVideos;

    const updatedPerfume = await perfume.save();
    res.status(200).json(updatedPerfume);
  } catch (error) {
    (req.files?.photos || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
    (req.files?.videos || []).forEach((f) => deleteUploadedFile(`/uploads/${f.filename}`));
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

    (perfume.photos || []).forEach(deleteUploadedFile);
    (perfume.videos || []).forEach(deleteUploadedFile);

    await perfume.deleteOne();
    res.status(200).json({ message: 'Perfume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting perfume', error: error.message });
  }
});

module.exports = router;