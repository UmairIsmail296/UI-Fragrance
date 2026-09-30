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
    <span key={star} className={star <= Number(rating) ? 'lux-star-filled' : 'lux-star-empty'}>★</span>
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
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '', photos: [] });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewUploading, setReviewUploading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
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
        setError('Perfume details not found.');
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
      <div className="detail-loading-wrapper">
        <div className="detail-gold-spinner"></div>
        <p>Revealing Olfactory Masterpiece...</p>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="container text-center detail-error-container">
        <p className="detail-error-message">{error}</p>
        <Link to="/shop" className="btn-back-to-vault">Return To Vault</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(perfume, quantity);
    toast.success(`${perfume.name} added to your selection!`);
    setJustAdded(true);
  };

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (rate) => {
    setReviewForm((prev) => ({ ...prev, rating: rate }));
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
      toast.error(error.response?.data?.message || 'Photo upload failed.');
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
      toast.success('Thank you! Your impression has been published.');
      await fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isOnSale = perfume.discountPrice < perfume.actualPrice;

  return (
    <div className="lux-detail-page">
      <div className="detail-ambient-glow"></div>
      
      <div className="container">
        {/* Breadcrumbs */}
        <div className="detail-nav-header">
          <Link to="/shop" className="detail-back-arrow-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Collection</span>
          </Link>
        </div>

        {/* Core Product Layout */}
        <div className="detail-grid">
          
          {/* LEFT: Premium Editorial Media Gallery */}
          <div className="detail-gallery-col">
            <div className="detail-media-canvas">
              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-left"
                  onClick={goToPrevMedia}
                  aria-label="Previous Media"
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
              ) : (
                <img
                  key={activeMediaIndex}
                  src={resolveAssetUrl(activeMedia?.src)}
                  alt={`${perfume.name}`}
                  className="canvas-main-image"
                />
              )}

              {media.length > 1 && (
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-right"
                  onClick={goToNextMedia}
                  aria-label="Next Media"
                >
                  ›
                </button>
              )}
            </div>

            {/* Thumbnail Navigation Strip */}
            {media.length > 1 && (
              <div className="detail-thumbnails-row">
                {media.map((item, index) => (
                  <button
                    type="button"
                    key={item.src + index}
                    className={`strip-thumb-btn ${index === activeMediaIndex ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(index)}
                  >
                    {item.type === 'video' ? (
                      <div className="thumb-video-container">
                        <video src={resolveAssetUrl(item.src)} muted />
                        <span className="video-thumb-overlay">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </div>
                    ) : (
                      <img src={resolveAssetUrl(item.src)} alt="thumbnail" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: High-End Information Column */}
          <div className="detail-specification-col">
            <span className="spec-brand-tag">{perfume.brand}</span>
            <h1 className="spec-perfume-title">{perfume.name}</h1>

            {/* Rating Stars Summary Link */}
            <div className="spec-rating-badge-summary">
              <div className="badge-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= Math.round(averageRating || 0) ? 'gold-s' : 'muted-s'}>★</span>
                ))}
              </div>
              <span className="badge-text">
                {averageRating ? averageRating.toFixed(1) : '0.0'} ({reviews.length} Customer Reviews)
              </span>
            </div>

            {/* Price Module */}
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
                {isOnSale && <span className="spec-sale-pill">Special Discount</span>}
                <span className="spec-size-pill">{perfume.size}</span>
              </div>
            </div>

            {/* Narrative Description */}
            <p className="spec-narrative-description">{perfume.description}</p>

            {/* Olfactory Notes Matrix */}
            <div className="olfactory-notes-matrix">
              <div className="olfactory-card">
                <span className="olfactory-icon">◈</span>
                <h5>Top Notes</h5>
                <p>{perfume.topNotes}</p>
              </div>
              <div className="olfactory-card">
                <span className="olfactory-icon">✦</span>
                <h5>Middle Notes</h5>
                <p>{perfume.middleNotes}</p>
              </div>
              <div className="olfactory-card">
                <span className="olfactory-icon">✧</span>
                <h5>Base Notes</h5>
                <p>{perfume.baseNotes}</p>
              </div>
            </div>

            {/* Quantity Selector Section */}
            <div className="spec-quantity-wrapper">
              <span className="quantity-section-label">Quantity</span>
              <div className="lux-quantity-stepper">
                <button
                  type="button"
                  className="step-btn"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  &minus;
                </button>
                <span className="step-val">{quantity}</span>
                <button
                  type="button"
                  className="step-btn"
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add To Cart Core Action */}
            <div className="spec-cta-block">
              <button className="lux-add-to-cart-btn" onClick={handleAddToCart}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
                </svg>
                <span>Reserve Scent</span>
              </button>

              {justAdded && (
                <Link to="/cart" className="lux-cart-redirect-link">
                  View Selected Bag &rarr;
                </Link>
              )}
            </div>
          </div>

        </div>

        {/* --- LUXURY REVIEWS FEED SECTION --- */}
        <div className="detail-reviews-wrapper">
          <div className="reviews-section-header">
            <div>
              <span className="sub-tag">Client Impressions</span>
              <h3 className="section-title-reviews">Connoisseur Feedback</h3>
              <p className="reviews-summary-subtitle">
                Overall score of <strong>{averageRating ? averageRating.toFixed(1) : '5.0'} ★</strong> out of {reviews.length} exclusive testimonies.
              </p>
            </div>
            <button
              type="button"
              className={`write-story-toggle-btn ${showReviewForm ? 'active' : ''}`}
              onClick={() => setShowReviewForm((prev) => !prev)}
            >
              {showReviewForm ? '✕ Close Review Form' : '✦ Write a Scent Story'}
            </button>
          </div>

          {/* Interactive Scent Story review Form */}
          {showReviewForm && (
            <div className="scent-story-form-card">
              <div className="story-form-head">
                <h4>Share Your Experience</h4>
                <p>Let other fragrance enthusiasts know how this signature sillage behaves.</p>
              </div>
              
              <form className="scent-story-submission-form" onSubmit={handleReviewSubmit}>
                <div className="story-form-grid">
                  
                  {/* Name field */}
                  <div className="story-input-field">
                    <label htmlFor="review-name">Your Full Name</label>
                    <input
                      id="review-name"
                      name="name"
                      type="text"
                      value={reviewForm.name}
                      onChange={handleReviewChange}
                      placeholder="e.g. Zainab Shah"
                    />
                  </div>

                  {/* Interactive Star Rating Selector */}
                  <div className="story-input-field full-row">
                    <label>Scent Rating</label>
                    <div className="story-interactive-star-picker">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className={`story-star-btn ${star <= (hoverRating || reviewForm.rating) ? 'filled' : ''}`}
                          onClick={() => handleRatingSelect(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          ★
                        </button>
                      ))}
                      <span className="story-rating-guide">
                        {reviewForm.rating === 5 && 'Sillage Masterpiece'}
                        {reviewForm.rating === 4 && 'Premium Quality'}
                        {reviewForm.rating === 3 && 'Decent / Satisfying'}
                        {reviewForm.rating === 2 && 'Ordinary Blend'}
                        {reviewForm.rating === 1 && 'Unsatisfactory'}
                      </span>
                    </div>
                  </div>

                  {/* Comment field */}
                  <div className="story-input-field full-row">
                    <label htmlFor="review-comment">Your Scent Testimony</label>
                    <textarea
                      id="review-comment"
                      name="comment"
                      rows="4"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      placeholder="Describe the projection, sillage longevity, unique olfactory traits, and complements received..."
                    />
                  </div>

                  {/* Photo Upload block */}
                  <div className="story-input-field full-row">
                    <label>Add Scent Photos <span className="label-count-sub">(Max 3 Photos)</span></label>
                    <div className="story-photo-dropzone">
                      <input
                        id="review-file-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewPhotoUpload}
                        disabled={reviewForm.photos.length >= MAX_REVIEW_PHOTOS || reviewUploading}
                      />
                      <label htmlFor="review-file-input" className="dropzone-trigger">
                        <span>{reviewUploading ? 'Encrypting uploads...' : '✦ Upload custom pictures from library'}</span>
                      </label>
                    </div>

                    {reviewForm.photos.length > 0 && (
                      <div className="story-preview-gallery">
                        {reviewForm.photos.map((photo) => (
                          <div key={photo} className="story-preview-cell">
                            <img src={photo} alt="Upload Preview" />
                            <button type="button" className="story-remove-img" onClick={() => removeReviewPhoto(photo)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <div className="story-form-footer">
                  <button type="submit" className="story-submit-action-btn" disabled={reviewSubmitting || reviewUploading}>
                    {reviewSubmitting ? 'Publishing Story...' : 'Publish Scent Impression'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Feedback list */}
          {reviewsLoading ? (
            <div className="reviews-feed-loader">
              <div className="reviews-spinner-ring"></div>
              <p>Acquiring Verified Client Feedback...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-feed-empty">
              <div className="empty-feed-sparkle">✧</div>
              <p>No client stories registered for this fragrance yet. Be the first to publish.</p>
            </div>
          ) : (
            <div className="reviews-feed-cards-grid">
              {reviews.map((review) => {
                const initials = review.name ? review.name.substring(0, 2).toUpperCase() : 'UI';
                return (
                  <article className="luxury-feed-review-card" key={review._id}>
                    
                    <div className="review-card-head">
                      <div className="client-identity">
                        <div className="client-initials-avatar">{initials}</div>
                        <div>
                          <h4 className="client-profile-name">{review.name}</h4>
                          <span className="client-badge-verified">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Verified Scent Buyer
                          </span>
                        </div>
                      </div>
                      <span className="client-review-date-label">
                        {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="review-card-stars-row">
                      <div className="stars-cluster-gold">
                        {renderStars(review.rating)}
                      </div>
                      <span className="numeric-rating-text-label">{review.rating}.0</span>
                    </div>

                    <p className="client-testimonial-narrative">“{review.comment}”</p>

                    {/* Photos grid */}
                    {review.photos?.length > 0 && (
                      <div className="client-testimonial-photos-gallery">
                        {review.photos.map((photo, idx) => (
                          <a key={`${review._id}-${idx}`} href={photo} target="_blank" rel="noreferrer" className="feed-gallery-cell">
                            <img src={photo} alt="User submission" />
                            <div className="cell-expand-glass"><span>⤢</span></div>
                          </a>
                        ))}
                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PerfumeDetail;