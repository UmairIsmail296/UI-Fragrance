import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api.js';

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews');
      setReviews(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const cancelDelete = () => {
    if (!deleting) setReviewToDelete(null);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/reviews/${reviewToDelete._id}`);
      setReviews((current) => current.filter((review) => review._id !== reviewToDelete._id));
      setReviewToDelete(null);
      toast.success('Review deleted successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Review Management</h2>
        <button className="btn-outline small" onClick={fetchReviews} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-reviews-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Perfume</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Photos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td>{review.name}</td>
                  <td>{review.perfumeId?.name || 'Unavailable'}</td>
                  <td>{review.rating} / 5</td>
                  <td className="review-comment-cell">{review.comment}</td>
                  <td>
                    {(review.photos || []).length > 0 ? (
                      <div className="review-photo-list">
                        {review.photos.map((photo, index) => (
                          <a
                            key={`${review._id}-${index}`}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View photo ${index + 1} attached to ${review.name}'s review`}
                          >
                            <img src={photo} alt={`Review photo ${index + 1}`} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="payment-proof-missing">None</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger small"
                      onClick={() => setReviewToDelete(review)}
                      aria-label={`Delete review by ${review.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center">No reviews submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reviewToDelete && (
        <div className="confirm-modal-overlay" onClick={cancelDelete}>
          <div className="confirm-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete this review?</h3>
            <p>
              Are you sure you want to delete the review from{' '}
              <strong>{reviewToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn-modal-cancel" onClick={cancelDelete} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-modal-delete" onClick={confirmDelete} disabled={deleting}>
                {deleting ? <span className="spinner small"></span> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManager;
