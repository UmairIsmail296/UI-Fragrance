import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { resolveAssetUrl } from '../utils/api.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { useCart } from '../context/CartContext.jsx';
import './PerfumeDetail.css';

const MAX_REVIEW_PHOTOS = 3;

const renderStars = (rating) =>
  [1, 2, 3, 4, 5].map((star) => (
    <span
      key={star}
      aria-hidden="true"
      className={
        star <= Number(rating) ? 'lux-star-filled' : 'lux-star-empty'
      }
    >
      ★
    </span>
  ));

const PerfumeDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [error, setError] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    comment: '',
    photos: [],
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewUploading, setReviewUploading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(false);
      const { data } = await api.get(`/reviews/perfume/${id}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setReviews([]);
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPerfume = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/perfumes/${id}`);
        setPerfume(data);
        setActiveMediaIndex(0);
        setQuantity(1);
        setJustAdded(false);
      } catch (err) {
        setError('Perfume details not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfume();
    fetchReviews();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const photos = perfume?.photos?.length
    ? perfume.photos
    : perfume?.image
      ? [perfume.image]
      : [];

  const videos = perfume?.videos || [];

  const media = [
    ...photos.map((src) => ({ type: 'photo', src })),
    ...videos.map((src) => ({ type: 'video', src })),
  ];

  const activeMedia = media[activeMediaIndex] || media[0];

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const handleAddToCart = () => {
    addToCart(perfume, quantity);
    toast.success(`${perfume.name} added to your cart!`);
    setJustAdded(true);
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewPhotoUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selectedFiles.length) return;

    const remainingSlots = MAX_REVIEW_PHOTOS - reviewForm.photos.length;

    if (remainingSlots <= 0) {
      toast.error('Maximum 3 photos allowed.');
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, remainingSlots);

    try {
      setReviewUploading(true);
      const uploadedUrls = await Promise.all(
        acceptedFiles.map((file) => uploadToCloudinary(file))
      );

      setReviewForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls.filter(Boolean)],
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed.');
    } finally {
      setReviewUploading(false);
    }
  };

  const removeReviewPhoto = (url) => {
    setReviewForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo !== url),
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewForm.name.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please write your review comment.');
      return;
    }

    try {
      setReviewSubmitting(true);

      await api.post('/reviews', {
        name: reviewForm.name.trim(),
        perfumeId: id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        photos: reviewForm.photos,
      });

      setReviewForm({ name: '', rating: 5, comment: '', photos: [] });
      setShowReviewForm(false);
      toast.success('Thank you! Your review has been published.');
      await fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="lux-detail-page">
        <div className="detail-loading-wrapper" role="status">
          <div className="detail-gold-spinner" aria-hidden="true" />
          <p>Loading fragrance...</p>
        </div>
      </main>
    );
  }

  if (error || !perfume) {
    return (
      <main className="lux-detail-page">
        <div className="container detail-error-container">
          <p className="detail-error-message">
            {error || 'Perfume details not found.'}
          </p>
          <Link to="/shop" className="btn-back-to-vault">
            Return to shop
          </Link>
        </div>
      </main>
    );
  }

  const isOnSale = perfume.discountPrice < perfume.actualPrice;

  return (
    <main className="lux-detail-page">
      <div className="container">
        <div className="detail-nav-header">
          <Link to="/shop" className="detail-back-arrow-link">
            <span aria-hidden="true">←</span> Back to collection
          </Link>
        </div>

        <div className="detail-grid">
          <div className="detail-gallery-col">
            <div className="detail-media-canvas">
              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-left"
                  onClick={() =>
                    setActiveMediaIndex((prev) =>
                      prev === 0 ? media.length - 1 : prev - 1
                    )
                  }
                  aria-label="Previous media"
                >
                  ‹
                </button>
              )}

              {activeMedia?.type === 'video' ? (
                <video
                  key={activeMediaIndex}
                  src={resolveAssetUrl(activeMedia.src)}
                  controls
                  autoPlay
                  muted
                  preload="metadata"
                  className="canvas-main-video"
                />
              ) : activeMedia ? (
                <img
                  key={activeMediaIndex}
                  src={resolveAssetUrl(activeMedia.src)}
                  alt={perfume.name}
                  className="canvas-main-image"
                />
              ) : (
                <div className="detail-media-placeholder">
                  Image unavailable
                </div>
              )}

              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-right"
                  onClick={() =>
                    setActiveMediaIndex((prev) =>
                      prev === media.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="Next media"
                >
                  ›
                </button>
              )}
            </div>

            {media.length > 1 && (
              <div className="detail-thumbnails-row" aria-label="Product media">
                {media.map((item, index) => (
                  <button
                    type="button"
                    key={`${item.src}-${index}`}
                    className={`strip-thumb-btn ${
                      index === activeMediaIndex ? 'active' : ''
                    }`}
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={`Show ${item.type} ${index + 1}`}
                    aria-pressed={index === activeMediaIndex}
                  >
                    {item.type === 'video' ? (
                      <div className="thumb-video-container">
                        <video src={resolveAssetUrl(item.src)} muted />
                        <span className="video-thumb-overlay" aria-hidden="true">
                          ▶
                        </span>
                      </div>
                    ) : (
                      <img src={resolveAssetUrl(item.src)} alt="" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detail-specification-col">
            {perfume.brand && (
              <span className="spec-brand-tag">{perfume.brand}</span>
            )}
            <h1 className="spec-perfume-title">{perfume.name}</h1>

            <div className="spec-rating-badge-summary">
              <div
                className="badge-stars"
                aria-label={
                  averageRating !== null
                    ? `${averageRating.toFixed(1)} out of 5 stars`
                    : 'No ratings yet'
                }
              >
                {renderStars(Math.round(averageRating || 0))}
              </div>
              <span className="badge-text">
                {reviewsLoading
                  ? 'Loading reviews...'
                  : reviewsError
                    ? 'Reviews unavailable'
                    : averageRating !== null
                      ? `${averageRating.toFixed(1)} (${reviews.length} ${
                          reviews.length === 1 ? 'review' : 'reviews'
                        })`
                      : 'No reviews yet'}
              </span>
            </div>

            <div className="spec-price-card">
              <div className="price-pricing-cluster">
                {isOnSale && (
                  <span className="price-original">
                    Rs. {Number(perfume.actualPrice).toLocaleString('en-PK')}
                  </span>
                )}
                <span className="price-sale-tag">
                  Rs. {Number(perfume.discountPrice).toLocaleString('en-PK')}
                </span>
              </div>

              <div className="price-badge-row">
                {isOnSale && (
                  <span className="spec-sale-pill">Special discount</span>
                )}
                {perfume.size && (
                  <span className="spec-size-pill">{perfume.size}</span>
                )}
              </div>
            </div>

            <p className="spec-narrative-description">{perfume.description}</p>

            <div className="olfactory-notes-matrix">
              <div className="olfactory-card">
                <h2>Top notes</h2>
                <p>{perfume.topNotes}</p>
              </div>
              <div className="olfactory-card">
                <h2>Middle notes</h2>
                <p>{perfume.middleNotes}</p>
              </div>
              <div className="olfactory-card">
                <h2>Base notes</h2>
                <p>{perfume.baseNotes}</p>
              </div>
            </div>

            <div className="spec-quantity-wrapper">
              <span className="quantity-section-label">Quantity</span>
              <div
                className="lux-quantity-stepper"
                role="group"
                aria-label="Select quantity"
              >
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="step-val">{quantity}</span>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="spec-cta-block">
              <button
                type="button"
                className="lux-add-to-cart-btn"
                onClick={handleAddToCart}
              >
                Add to cart <span aria-hidden="true">+</span>
              </button>

              {justAdded && (
                <Link to="/cart" className="lux-cart-redirect-link">
                  View your bag <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <section
          className="detail-reviews-wrapper"
          aria-labelledby="detail-reviews-heading"
        >
          <div className="reviews-section-header">
            <div>
              <span className="sub-tag">Customer experiences</span>
              <h2 id="detail-reviews-heading" className="section-title-reviews">
                Customer Reviews
              </h2>
              <p className="reviews-summary-subtitle">
                {reviewsLoading
                  ? 'Loading reviews...'
                  : reviewsError
                    ? 'Reviews are currently unavailable.'
                    : averageRating !== null
                      ? `${averageRating.toFixed(1)} out of 5 · ${reviews.length} ${
                          reviews.length === 1 ? 'review' : 'reviews'
                        }`
                      : 'Be the first to review this fragrance.'}
              </p>
            </div>

            <button
              type="button"
              className={`write-story-toggle-btn ${
                showReviewForm ? 'active' : ''
              }`}
              onClick={() => setShowReviewForm((prev) => !prev)}
              aria-expanded={showReviewForm}
              aria-controls="detail-review-form"
            >
              {showReviewForm ? 'Close review form' : 'Write a review'}
            </button>
          </div>

          {showReviewForm && (
            <div id="detail-review-form" className="scent-story-form-card">
              <div className="story-form-head">
                <h3>Share Your Experience</h3>
                <p>Tell us what you think about this fragrance.</p>
              </div>

              <form onSubmit={handleReviewSubmit}>
                <div className="story-form-grid">
                  <div className="story-input-field">
                    <label htmlFor="detail-review-name">Your name</label>
                    <input
                      id="detail-review-name"
                      name="name"
                      type="text"
                      value={reviewForm.name}
                      onChange={handleReviewChange}
                      placeholder="Your name"
                    />
                  </div>

                  <fieldset className="story-input-field full-row story-rating-field">
                    <legend>Your rating</legend>
                    <div className="story-interactive-star-picker">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className={`story-star-btn ${
                            star <= (hoverRating || reviewForm.rating)
                              ? 'filled'
                              : ''
                          }`}
                          onClick={() =>
                            setReviewForm((prev) => ({ ...prev, rating: star }))
                          }
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                          aria-pressed={reviewForm.rating === star}
                        >
                          <span aria-hidden="true">★</span>
                        </button>
                      ))}
                      <span className="story-rating-guide">
                        {reviewForm.rating} out of 5
                      </span>
                    </div>
                  </fieldset>

                  <div className="story-input-field full-row">
                    <label htmlFor="detail-review-comment">Your review</label>
                    <textarea
                      id="detail-review-comment"
                      name="comment"
                      rows="4"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      placeholder="Share your experience..."
                    />
                  </div>

                  <div className="story-input-field full-row">
                    <label htmlFor="detail-review-file">
                      Add photos <span className="label-count-sub">(optional, max 3)</span>
                    </label>

                    <div className="story-photo-dropzone">
                      <input
                        id="detail-review-file"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewPhotoUpload}
                        disabled={
                          reviewForm.photos.length >= MAX_REVIEW_PHOTOS ||
                          reviewUploading
                        }
                      />
                      <label
                        htmlFor="detail-review-file"
                        className="dropzone-trigger"
                      >
                        {reviewUploading
                          ? 'Uploading photos...'
                          : reviewForm.photos.length >= MAX_REVIEW_PHOTOS
                            ? 'Maximum photos added'
                            : '+ Choose photos'}
                      </label>
                    </div>

                    {reviewForm.photos.length > 0 && (
                      <div className="story-preview-gallery">
                        {reviewForm.photos.map((photo, index) => (
                          <div
                            key={`${photo}-${index}`}
                            className="story-preview-cell"
                          >
                            <img src={photo} alt={`Preview ${index + 1}`} />
                            <button
                              type="button"
                              className="story-remove-img"
                              onClick={() => removeReviewPhoto(photo)}
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="story-form-footer">
                  <button
                    type="submit"
                    className="story-submit-action-btn"
                    disabled={reviewSubmitting || reviewUploading}
                  >
                    {reviewSubmitting ? 'Submitting review...' : 'Submit review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {reviewsLoading ? (
            <div className="reviews-feed-loader" role="status">
              <div className="reviews-spinner-ring" aria-hidden="true" />
              <p>Loading reviews...</p>
            </div>
          ) : reviewsError ? (
            <div className="reviews-feed-empty" role="alert">
              <p>Reviews could not be loaded. Please try again later.</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-feed-empty">
              <p>No reviews yet. Be the first to share your experience.</p>
            </div>
          ) : (
            <div className="reviews-feed-cards-grid">
              {reviews.map((review) => {
                const initials = review.name
                  ? review.name.substring(0, 2).toUpperCase()
                  : 'UI';

                return (
                  <article className="luxury-feed-review-card" key={review._id}>
                    <div className="review-card-head">
                      <div className="client-identity">
                        <div className="client-initials-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <h3 className="client-profile-name">{review.name}</h3>
                      </div>

                      <span className="client-review-date-label">
                        {new Date(review.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div
                      className="review-card-stars-row"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      <div className="stars-cluster-gold">
                        {renderStars(review.rating)}
                      </div>
                      <span className="numeric-rating-text-label" aria-hidden="true">
                        {review.rating}/5
                      </span>
                    </div>

                    <p className="client-testimonial-narrative">
                      “{review.comment}”
                    </p>

                    {review.photos?.length > 0 && (
                      <div className="client-testimonial-photos-gallery">
                        {review.photos.map((photo, index) => (
                          <a
                            key={`${review._id}-${index}`}
                            href={photo}
                            target="_blank"
                            rel="noreferrer"
                            className="feed-gallery-cell"
                            aria-label={`Open review photo ${index + 1} in a new tab`}
                          >
                            <img src={photo} alt={`Review photo ${index + 1}`} />
                            <span className="cell-expand-glass" aria-hidden="true">
                              ↗
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PerfumeDetail;