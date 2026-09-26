const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Review = require('../models/Review');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { deleteCloudinaryAsset } = uploadMiddleware;

const normalizePhotoUrls = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizePhotoUrls(item));
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
      return normalizePhotoUrls(parsed);
    }
    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // If it is not JSON, treat it as a plain URL string.
  }

  return [trimmed];
};

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().populate('perfumeId', 'name').sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching reviews', error: error.message });
  }
});

router.get('/perfume/:perfumeId', async (req, res) => {
  try {
    const { perfumeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(perfumeId)) {
      return res.status(400).json({ message: 'Valid perfume ID is required' });
    }

    const reviews = await Review.find({ perfumeId }).sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching perfume reviews', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, perfumeId, rating, comment, photos } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }

    if (!perfumeId || !mongoose.Types.ObjectId.isValid(String(perfumeId))) {
      return res.status(400).json({ message: 'Valid perfume ID is required.' });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Please select a rating from 1 to 5.' });
    }

    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: 'Please write a review.' });
    }

    const normalizedPhotos = normalizePhotoUrls(photos);
    if (normalizedPhotos.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 photos allowed.' });
    }

    const review = await Review.create({
      name: String(name).trim(),
      perfumeId,
      rating: numericRating,
      comment: String(comment).trim(),
      photos: normalizedPhotos,
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while submitting review', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Promise.all((review.photos || []).map((photoUrl) => {
      if (photoUrl && typeof photoUrl === 'string' && photoUrl.includes('cloudinary.com')) {
        return deleteCloudinaryAsset(photoUrl);
      }
      return Promise.resolve();
    }));

    await review.deleteOne();
    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while deleting review', error: error.message });
  }
});

module.exports = router;
