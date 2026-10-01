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
  rating: 5,
  comment: '',
  photos: [],
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
  const [hoverRating, setHoverRating] = useState(0);

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

  // Average Rating Calculation
  const avgRating = useMemo(() => {
    if (!reviews.length) return '5.0';
    const total = reviews.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (rate) => {
    setForm((prev) => ({ ...prev, rating: rate }));
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
        acceptedFiles.map((file) => uploadToCloudinary(file))
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

    if (!form.comment.trim()) {
      toast.error('Please write a review.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        name: form.name.trim(),
        perfumeId: form.perfumeId,
        rating: Number(form.rating),
        comment: form.comment.trim(),
        photos: form.photos,
      });

      toast.success('Thank you! Your review has been published.');
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
    <div className="reviews-page">
      <div className="reviews-ambient-glow"></div>
      
      <div className="container">
        {/* --- LUXURY HEADER --- */}
        <div className="reviews-hero text-center">
          <span className="reviews-badge">Artisanal Testimonials</span>
          <h1 className="reviews-main-title">
            The Scent <span>Stories</span>
          </h1>
          <p className="reviews-subtitle">
            Unfiltered experiences and intimate impressions shared by our distinguished clientele.
          </p>

          {/* Rating Summary Card */}
          <div className="rating-overview-card">
            <div className="score-box">
              <span className="score-num">{avgRating}</span>
              <div className="score-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(avgRating) ? 'star-gold' : 'star-muted'}>★</span>
                ))}
              </div>
              <span className="score-label">Based on {reviews.length} Verified Reviews</span>
            </div>

            <div className="score-divider"></div>

            <div className="score-action">
              <button
                type="button"
                className={`lux-review-toggle-btn ${showForm ? 'active' : ''}`}
                onClick={() => setShowForm((prev) => !prev)}
              >
                {showForm ? '✕ Close Review Form' : '✦ Write a Fragrance Story'}
              </button>
            </div>
          </div>
        </div>

        {/* --- LUXURY REVIEW FORM --- */}
        {showForm && (
          <div className="review-form-container">
            <div className="form-header">
              <span className="form-tag">Your Experience</span>
              <h3 className="form-title">Leave Your Impression</h3>
            </div>

            <form className="lux-review-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Perfume Selection */}
                <div className="lux-field">
                  <label htmlFor="perfumeId">Select Fragrance</label>
                  <div className="select-wrapper">
                    <select
                      id="perfumeId"
                      name="perfumeId"
                      value={form.perfumeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Choose a perfume...</option>
                      {perfumes.map((perfume) => (
                        <option key={perfume._id} value={perfume._id}>
                          {perfume.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Customer Name */}
                <div className="lux-field">
                  <label htmlFor="name">Your Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Hammad Khan"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Interactive Star Rating Selector */}
                <div className="lux-field full-width">
                  <label>Overall Experience & Rating</label>
                  <div className="interactive-stars-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${star <= (hoverRating || form.rating) ? 'filled' : ''}`}
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-verbal-hint">
                      {form.rating === 5 && 'Exceptional / Masterpiece'}
                      {form.rating === 4 && 'Very Good / High Quality'}
                      {form.rating === 3 && 'Good / Pleasing'}
                      {form.rating === 2 && 'Fair / Moderate'}
                      {form.rating === 1 && 'Needs Improvement'}
                    </span>
                  </div>
                </div>

                {/* Review Textarea */}
                <div className="lux-field full-width">
                  <label htmlFor="comment">Your Review / Impression</label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                    placeholder="Describe the longevity, sillage, notes, and the compliments you received..."
                    value={form.comment}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Photo Upload Dropzone */}
                <div className="lux-field full-width">
                  <label>Attach Photographs <span className="label-sub">(Max 3 Photos)</span></label>
                  
                  <div className="photo-upload-zone">
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={form.photos.length >= MAX_REVIEW_PHOTOS || uploading}
                    />
                    <label htmlFor="photo-input" className={`upload-trigger ${uploading ? 'uploading' : ''}`}>
                      <span className="upload-icon">✦</span>
                      <span>{uploading ? 'Uploading to Vault...' : '+ Add Photos from Camera or Library'}</span>
                    </label>
                  </div>

                  {/* Photo Previews */}
                  {form.photos.length > 0 && (
                    <div className="preview-gallery">
                      {form.photos.map((photo, i) => (
                        <div key={i} className="preview-card">
                          <img src={photo} alt="Preview" />
                          <button
                            type="button"
                            className="preview-remove"
                            onClick={() => removePhoto(photo)}
                            title="Remove Photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="lux-submit-btn"
                  disabled={submitting || uploading}
                >
                  {submitting ? 'Publishing Story...' : 'Publish Fragrance Story'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- REVIEWS LISTING --- */}
        {loading ? (
          <div className="reviews-loader">
            <div className="gold-spinner"></div>
            <p>Gathering fragrance stories...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-state">
            <div className="empty-sparkle">✧</div>
            <h3>No Stories Yet</h3>
            <p>Be the very first connoisseur to share an impression with our community.</p>
          </div>
        ) : (
          <div className="reviews-cards-grid">
            {reviews.map((review) => {
              const initials = review.name ? review.name.substring(0, 2).toUpperCase() : 'UI';
              return (
                <article className="lux-review-card" key={review._id}>
                  <div className="card-top">
                    <div className="user-profile">
                      <div className="user-avatar">{initials}</div>
                      <div>
                        <h4 className="user-name">{review.name}</h4>
                        <span className="verified-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Verified Client
                        </span>
                      </div>
                    </div>

                    <span className="review-time">
                      {new Date(review.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {review.perfumeId?.name && (
                    <div className="fragrance-tag">
                      <span>Fragrance:</span> {review.perfumeId.name}
                    </div>
                  )}

                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Number(review.rating) ? 'star-gold' : 'star-muted'}>
                        ★
                      </span>
                    ))}
                    <span className="rating-score-pill">{review.rating}.0</span>
                  </div>

                  <p className="review-quote">“{review.comment}”</p>

                  {/* Photo Thumbnails Gallery */}
                  {review.photos?.length > 0 && (
                    <div className="review-gallery-grid">
                      {review.photos.map((photo, index) => (
                        <a
                          key={`${review._id}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="gallery-item"
                        >
                          <img src={photo} alt={`Client photo ${index + 1}`} />
                          <div className="gallery-hover-overlay">
                            <span>⤢</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Floating Quick Action if user navigated with Perfume Query */}
        {selectedPerfume && !showForm && (
          <div className="sticky-action-wrap">
            <button
              type="button"
              className="lux-review-toggle-btn"
              onClick={() => setShowForm(true)}
            >
              Write a Review for {selectedPerfume.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;