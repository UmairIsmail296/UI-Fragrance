import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import './CustomerReviews.css';

const MAX_REVIEW_PHOTOS = 3;

const emptyForm = {
  perfumeId: '',
  name: '',
  rating: '',
  comment: '',
  photos: [],
};

const renderStars = (rating) => {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  return stars.map((star) => (
    <span key={star} className={star <= Number(rating) ? 'review-star review-star-filled' : 'review-star'}>
      ★
    </span>
  ));
};

const CustomerReviews = () => {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const fetchAllReviews = async () => {
    try {
      const { data } = await api.get('/reviews');
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load reviews');
    }
  };

  const fetchPerfumes = async () => {
    try {
      const { data } = await api.get('/perfumes');
      setPerfumes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load perfume list');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPerfumes(), fetchAllReviews()]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    const selectedPerfumeId = queryParams.get('perfumeId');
    if (selectedPerfumeId) {
      setForm((prev) => ({ ...prev, perfumeId: selectedPerfumeId }));
      setShowForm(true);
    }
  }, [queryParams]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selectedFiles.length) return;

    const remainingSlots = MAX_REVIEW_PHOTOS - form.photos.length;
    if (remainingSlots <= 0) {
      toast.error('Maximum 3 photos allowed.');
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, remainingSlots);

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(
        acceptedFiles.map(async (file) => uploadToCloudinary(file, 'ui-fragrance/reviews/photos'))
      );

      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls.filter(Boolean)],
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoUrl) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((url) => url !== photoUrl),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.perfumeId) {
      toast.error('Please select a perfume.');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    if (!form.rating || Number(form.rating) < 1 || Number(form.rating) > 5) {
      toast.error('Please select a rating.');
      return;
    }

    if (!form.comment.trim()) {
      toast.error('Please write a review.');
      return;
    }

    if (form.photos.length > MAX_REVIEW_PHOTOS) {
      toast.error('Maximum 3 photos allowed.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        name: form.name,
        perfumeId: form.perfumeId,
        rating: Number(form.rating),
        comment: form.comment,
        photos: form.photos,
      });

      toast.success('Review submitted successfully.');
      setForm(emptyForm);
      setShowForm(false);
      await fetchAllReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPerfume = perfumes.find((perfume) => perfume._id === form.perfumeId);

  return (
    <div className="page-fade reviews-page">
      <div className="container">
        <div className="reviews-header">
          <p className="reviews-eyebrow">Fragrance Stories</p>
          <h1 className="section-title">Customer <span>Reviews</span></h1>
          <p className="section-subtitle">Share your experience with our fragrances.</p>
          <button type="button" className="btn-gold" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Close Form' : 'Write a Review'}
          </button>
        </div>

        {showForm && (
          <form className="review-form" onSubmit={handleSubmit}>
            <div className="review-form-grid">
              <div className="review-field">
                <label htmlFor="perfumeId">Perfume</label>
                <select id="perfumeId" name="perfumeId" value={form.perfumeId} onChange={handleInputChange}>
                  <option value="">Select a perfume</option>
                  {perfumes.map((perfume) => (
                    <option key={perfume._id} value={perfume._id}>
                      {perfume.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="review-field">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="review-field">
                <label htmlFor="rating">Your Rating</label>
                <select id="rating" name="rating" value={form.rating} onChange={handleInputChange}>
                  <option value="">Select rating</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div className="review-field review-field-full">
                <label htmlFor="comment">Your Review</label>
                <textarea
                  id="comment"
                  name="comment"
                  rows="5"
                  placeholder="Tell us about your experience..."
                  value={form.comment}
                  onChange={handleInputChange}
                />
              </div>

              <div className="review-field review-field-full">
                <label>Photos</label>
                <div className="review-photo-upload-area">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={form.photos.length >= MAX_REVIEW_PHOTOS || uploading}
                  />
                  <button type="button" className="btn-outline review-photo-button" disabled={form.photos.length >= MAX_REVIEW_PHOTOS || uploading}>
                    {uploading ? 'Uploading...' : '+ Add Photos'}
                  </button>
                </div>

                <p className="review-photo-note">Maximum 3 photos</p>

                {form.photos.length > 0 && (
                  <div className="review-photo-preview-grid">
                    {form.photos.map((photo) => (
                      <div key={photo} className="review-photo-preview">
                        <img src={photo} alt="Selected review preview" />
                        <button type="button" onClick={() => removePhoto(photo)} aria-label="Remove photo">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-gold" disabled={submitting || uploading}>
              {submitting ? 'Submitting review...' : 'Submit Review'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-state">
            <p>No reviews yet. Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review._id}>
                <div className="review-card-header">
                  <div>
                    <h3>{review.name}</h3>
                    {review.perfumeId?.name && (
                      <p className="review-product-name">For {review.perfumeId.name}</p>
                    )}
                  </div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="review-rating-row">
                  <div className="review-stars">{renderStars(review.rating)}</div>
                  <span className="review-rating-number">{review.rating}.0</span>
                </div>

                <p className="review-comment">{review.comment}</p>

                {review.photos?.length > 0 && (
                  <div className={`review-photo-grid review-photo-grid-${Math.min(review.photos.length, 3)}`}>
                    {review.photos.map((photo, index) => (
                      <a key={`${review._id}-${index}`} href={photo} target="_blank" rel="noreferrer" className="review-photo-link">
                        <img src={photo} alt={`${review.name} review photo ${index + 1}`} />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {selectedPerfume && !showForm && (
          <div className="review-link-row">
            <Link to={`/reviews?perfumeId=${selectedPerfume._id}`} className="btn-outline">Write a Review</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;
