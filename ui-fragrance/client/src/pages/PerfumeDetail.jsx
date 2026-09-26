import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api.js';
import { resolveAssetUrl } from '../utils/api.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { useCart } from '../context/CartContext.jsx';
import './PerfumeDetail.css';

const MAX_REVIEW_PHOTOS = 3;

const renderStars = (rating) => {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);
  return stars.map((star) => (
    <span key={star} className={star <= Number(rating) ? 'review-star review-star-filled' : 'review-star'}>★</span>
  ));
};

const PerfumeDetail = () => {
  const { id } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: '', comment: '', photos: [] });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewUploading, setReviewUploading] = useState(false);
  const { addToCart } = useCart();

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { data } = await api.get(`/reviews/perfume/${id}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setReviews([]);
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
        setError('Perfume not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfume();
    fetchReviews();
    window.scrollTo(0, 0);
  }, [id]);

  const photos = perfume?.photos?.length ? perfume.photos : perfume?.image ? [perfume.image] : [];
  const videos = perfume?.videos || [];

  // Unified gallery — photo thumbnails and video thumbnails live in the
  // SAME strip, and left/right arrows cycle through all of them together.
  // Clicking a video thumbnail swaps the main display area to a playable
  // <video> instead of an <img>.
  const media = [
    ...photos.map((src) => ({ type: 'photo', src })),
    ...videos.map((src) => ({ type: 'video', src })),
  ];
  const activeMedia = media[activeMediaIndex] || media[0];

  const goToPrevMedia = () => {
    setActiveMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNextMedia = () => {
    setActiveMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const incrementQuantity = () => setQuantity((q) => Math.min(10, q + 1));

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="container text-center" style={{ padding: '100px 0' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
        <Link to="/shop" className="btn-outline">Back to Shop</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(perfume, quantity);
    toast.success('Added to cart!');
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
        acceptedFiles.map(async (file) => uploadToCloudinary(file, 'ui-fragrance/reviews/photos'))
      );

      setReviewForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls.filter(Boolean)],
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Photo upload failed. Please try again.');
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

    if (!reviewForm.rating || Number(reviewForm.rating) < 1 || Number(reviewForm.rating) > 5) {
      toast.error('Please select a rating.');
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await api.post('/reviews', {
        name: reviewForm.name,
        perfumeId: id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        photos: reviewForm.photos,
      });

      setReviewForm({ name: '', rating: '', comment: '', photos: [] });
      setShowReviewForm(false);
      toast.success('Review submitted successfully.');
      await fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isOnSale = perfume.discountPrice < perfume.actualPrice;
  const isRatingSelected = reviewForm.rating !== '';

  return (
    <div className="page-fade perfume-detail">
      <div className="container">
        <Link to="/shop" className="detail-back-link">
          &larr; Back to Shop
        </Link>

        <div className="detail-grid">
          {/* LEFT: unified photo + video gallery */}
          <div className="detail-gallery">
            <div className="detail-main-media-wrap">
              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-left"
                  onClick={goToPrevMedia}
                  aria-label="Previous media"
                >
                  &#8249;
                </button>
              )}

              {activeMedia?.type === 'video' ? (
                <video
                  key={activeMediaIndex}
                  src={resolveAssetUrl(activeMedia.src)}
                  controls
                  preload="metadata"
                  className="detail-main-video"
                />
              ) : (
                <img
                  key={activeMediaIndex}
                  src={resolveAssetUrl(activeMedia?.src)}
                  alt={`${perfume.name} — media ${activeMediaIndex + 1}`}
                  className="detail-main-image"
                />
              )}

              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-arrow gallery-arrow-right"
                  onClick={goToNextMedia}
                  aria-label="Next media"
                >
                  &#8250;
                </button>
              )}
            </div>

            {media.length > 1 && (
              <div className="detail-thumbnail-strip">
                {media.map((item, index) => (
                  <button
                    type="button"
                    key={item.src + index}
                    className={`detail-thumbnail ${index === activeMediaIndex ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(index)}
                    aria-label={item.type === 'video' ? `Play video ${index + 1}` : `View photo ${index + 1}`}
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={resolveAssetUrl(item.src)} muted />
                        <span className="detail-thumbnail-play-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </>
                    ) : (
                      <img src={resolveAssetUrl(item.src)} alt={`${perfume.name} thumbnail ${index + 1}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: info panel */}
          <div className="detail-info">
            <p className="detail-brand">{perfume.brand}</p>
            <h1 className="detail-name">{perfume.name}</h1>

            <div className="detail-price-row">
              <span className="detail-actual-price">
                Rs. {Number(perfume.actualPrice).toLocaleString('en-PK')}
              </span>
              <span className="detail-discount-price">
                Rs. {Number(perfume.discountPrice).toLocaleString('en-PK')}
              </span>
              {isOnSale && <span className="detail-sale-badge">SALE</span>}
            </div>

            <span className="detail-size-badge">{perfume.size}</span>

            <p className="detail-description">{perfume.description}</p>

            <div className="detail-notes">
              <div className="note-block">
                <h4>Top Notes</h4>
                <p>{perfume.topNotes}</p>
              </div>
              <div className="note-block">
                <h4>Middle Notes</h4>
                <p>{perfume.middleNotes}</p>
              </div>
              <div className="note-block">
                <h4>Base Notes</h4>
                <p>{perfume.baseNotes}</p>
              </div>
            </div>

            <div className="detail-quantity-row">
              <label>Quantity</label>
              <div className="quantity-stepper">
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="detail-quantity-value">{quantity}</span>
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button className="btn-gold detail-order-btn" onClick={handleAddToCart}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginRight: 8, verticalAlign: '-4px' }}>
                <path d="M7 4h-2l-1 2H2v2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 8 21h12v-2H8l1.1-2h7.45a2 2 0 0 0 1.8-1.11L21.8 8H6.21l-.94-2H7V4zm-1 15a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2z" />
              </svg>
              Add to Cart
            </button>

            {justAdded && (
              <Link to="/cart" className="detail-view-cart-link">
                View Cart &rarr;
              </Link>
            )}
          </div>
        </div>

        <div className="detail-review-block">
          <div className="detail-review-header">
            <div>
              <div className="detail-review-score">
                <span className="review-stars">{renderStars(Math.round(averageRating || 0))}</span>
                <strong>{averageRating ? averageRating.toFixed(1) : '0.0'}</strong>
              </div>
              <p className="detail-review-count">
                {reviews.length} Customer Review{reviews.length === 1 ? '' : 's'}
              </p>
            </div>
            <button type="button" className="btn-outline" onClick={() => setShowReviewForm((prev) => !prev)}>
              Write a Review
            </button>
          </div>

          {showReviewForm && (
            <form className="detail-review-form" onSubmit={handleReviewSubmit}>
              <div className="review-form-grid">
                <div className="review-field">
                  <label htmlFor="review-name">Your Name</label>
                  <input id="review-name" name="name" type="text" value={reviewForm.name} onChange={handleReviewChange} placeholder="Your Name" />
                </div>

                <div className="review-field">
                  <label htmlFor="review-rating">Your Rating</label>
                  <select
                    id="review-rating"
                    name="rating"
                    value={reviewForm.rating}
                    onChange={handleReviewChange}
                    className={isRatingSelected ? 'rating-selected' : ''}
                  >
                    <option value="">Select rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>

                <div className="review-field review-field-full">
                  <label htmlFor="review-comment">Your Review</label>
                  <textarea id="review-comment" name="comment" rows="5" value={reviewForm.comment} onChange={handleReviewChange} placeholder="Tell us about your experience..." />
                </div>

                <div className="review-field review-field-full">
                  <label>Photos</label>
                  <div className="review-photo-upload-area">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleReviewPhotoUpload}
                      disabled={reviewForm.photos.length >= MAX_REVIEW_PHOTOS || reviewUploading}
                    />
                    <button type="button" className="btn-outline review-photo-button" disabled={reviewForm.photos.length >= MAX_REVIEW_PHOTOS || reviewUploading}>
                      {reviewUploading ? 'Uploading...' : '+ Add Photos'}
                    </button>
                  </div>
                  <p className="review-photo-note">Maximum 3 photos</p>

                  {reviewForm.photos.length > 0 && (
                    <div className="review-photo-preview-grid">
                      {reviewForm.photos.map((photo) => (
                        <div key={photo} className="review-photo-preview">
                          <img src={photo} alt="Review preview" />
                          <button type="button" onClick={() => removeReviewPhoto(photo)} aria-label="Remove photo">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-gold" disabled={reviewSubmitting || reviewUploading}>
                {reviewSubmitting ? 'Submitting review...' : 'Submit Review'}
              </button>
            </form>
          )}

          {reviewsLoading ? (
            <div className="spinner-wrap">
              <div className="spinner"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty-state">
              <p>No customer reviews yet for this perfume.</p>
            </div>
          ) : (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review._id}>
                  <div className="review-card-header">
                    <div>
                      <h3>{review.name}</h3>
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
        </div>
      </div>
    </div>
  );
};

export default PerfumeDetail;