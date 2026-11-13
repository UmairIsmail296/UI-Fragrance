import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

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

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;

    const total = reviews.reduce(
      (acc, review) => acc + Number(review.rating || 5),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
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
      toast.error(
        error.response?.data?.message || 'Photo upload failed. Please try again.'
      );
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

  const selectedPerfume = perfumes.find(
    (perfume) => perfume._id === form.perfumeId
  );

  return (
    <main className="reviews-page">
      <div className="container">
        <header className="reviews-hero">
          <span className="reviews-badge">Customer reviews</span>
          <h1 className="reviews-main-title">
            Your Fragrance <span>Stories</span>
          </h1>
          <p className="reviews-subtitle">
            Discover experiences shared by our customers, and tell us about
            yours.
          </p>

          <div className="rating-overview-card">
            <div className="score-box">
              <span className="score-num">
                {loading ? '—' : avgRating ?? '—'}
              </span>

              <div
                className="score-stars"
                aria-label={
                  avgRating
                    ? `Average rating: ${avgRating} out of 5`
                    : 'No average rating yet'
                }
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    aria-hidden="true"
                    className={
                      avgRating && star <= Math.round(Number(avgRating))
                        ? 'star-gold'
                        : 'star-muted'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>

              <span className="score-label">
                {loading
                  ? 'Loading reviews...'
                  : `Based on ${reviews.length} ${
                      reviews.length === 1 ? 'review' : 'reviews'
                    }`}
              </span>
            </div>

            <div className="score-divider" aria-hidden="true" />

            <button
              type="button"
              className={`lux-review-toggle-btn ${showForm ? 'active' : ''}`}
              onClick={() => setShowForm((prev) => !prev)}
              aria-expanded={showForm}
              aria-controls="review-form-container"
            >
              {showForm ? 'Close review form' : 'Write a review'}
            </button>
          </div>
        </header>

        {showForm && (
          <section
            id="review-form-container"
            className="review-form-container"
            aria-labelledby="review-form-title"
          >
            <div className="form-header">
              <span className="form-tag">Your experience</span>
              <h2 id="review-form-title" className="form-title">
                Share Your Review
              </h2>
            </div>

            <form className="lux-review-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="lux-field">
                  <label htmlFor="review-perfume">Select fragrance</label>
                  <div className="select-wrapper">
                    <select
                      id="review-perfume"
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

                <div className="lux-field">
                  <label htmlFor="review-name">Your name</label>
                  <input
                    id="review-name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                </div>

                <fieldset className="lux-field full-width rating-field">
                  <legend>Overall rating</legend>

                  <div className="interactive-stars-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${
                          star <= (hoverRating || form.rating) ? 'filled' : ''
                        }`}
                        onClick={() => handleRatingSelect(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                        aria-pressed={form.rating === star}
                      >
                        <span aria-hidden="true">★</span>
                      </button>
                    ))}

                    <span className="rating-verbal-hint">
                      {form.rating} out of 5
                    </span>
                  </div>
                </fieldset>

                <div className="lux-field full-width">
                  <label htmlFor="review-comment">Your review</label>
                  <textarea
                    id="review-comment"
                    name="comment"
                    rows="4"
                    placeholder="Share your experience with this fragrance..."
                    value={form.comment}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="lux-field full-width">
                  <label htmlFor="photo-input">
                    Add photos <span className="label-sub">(optional, max 3)</span>
                  </label>

                  <div className="photo-upload-zone">
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={
                        form.photos.length >= MAX_REVIEW_PHOTOS || uploading
                      }
                    />

                    <label
                      htmlFor="photo-input"
                      className={`upload-trigger ${
                        uploading || form.photos.length >= MAX_REVIEW_PHOTOS
                          ? 'upload-disabled'
                          : ''
                      }`}
                    >
                      <span className="upload-icon" aria-hidden="true">+</span>
                      <span>
                        {uploading
                          ? 'Uploading photos...'
                          : form.photos.length >= MAX_REVIEW_PHOTOS
                            ? 'Maximum photos added'
                            : 'Choose photos'}
                      </span>
                    </label>
                  </div>

                  {form.photos.length > 0 && (
                    <div className="preview-gallery">
                      {form.photos.map((photo, index) => (
                        <div key={`${photo}-${index}`} className="preview-card">
                          <img src={photo} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="preview-remove"
                            onClick={() => removePhoto(photo)}
                            aria-label={`Remove photo ${index + 1}`}
                            title="Remove photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="lux-submit-btn"
                  disabled={submitting || uploading}
                >
                  {submitting ? 'Submitting review...' : 'Submit review'}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="reviews-loader" role="status">
            <div className="gold-spinner" aria-hidden="true" />
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-state">
            <div className="empty-sparkle" aria-hidden="true">✧</div>
            <h2>No reviews yet</h2>
            <p>Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="reviews-cards-grid">
            {reviews.map((review) => {
              const initials = review.name
                ? review.name.substring(0, 2).toUpperCase()
                : 'UI';

              return (
                <article className="lux-review-card" key={review._id}>
                  <div className="card-top">
                    <div className="user-profile">
                      <div className="user-avatar" aria-hidden="true">
                        {initials}
                      </div>
                      <h2 className="user-name">{review.name}</h2>
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

                  <div
                    className="stars-row"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        aria-hidden="true"
                        className={
                          star <= Number(review.rating)
                            ? 'star-gold'
                            : 'star-muted'
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span className="rating-score-pill" aria-hidden="true">
                      {review.rating}/5
                    </span>
                  </div>

                  <p className="review-quote">“{review.comment}”</p>

                  {review.photos?.length > 0 && (
                    <div className="review-gallery-grid">
                      {review.photos.map((photo, index) => (
                        <a
                          key={`${review._id}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="gallery-item"
                          aria-label={`Open review photo ${index + 1} in a new tab`}
                        >
                          <img src={photo} alt={`Review photo ${index + 1}`} />
                          <div className="gallery-hover-overlay" aria-hidden="true">
                            <span>↗</span>
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

        {selectedPerfume && !showForm && (
          <div className="sticky-action-wrap">
            <button
              type="button"
              className="lux-review-toggle-btn"
              onClick={() => setShowForm(true)}
            >
              Write a review for {selectedPerfume.name}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default CustomerReviews;