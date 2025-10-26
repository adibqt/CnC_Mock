import React, { useState, useEffect } from 'react';
import './RatingModal.css';

const RatingModal = ({ show, onClose, onSubmit, existingRating = null, doctorName }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReview(existingRating.review || '');
    } else {
      setRating(0);
      setReview('');
    }
  }, [existingRating]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, review: review.trim() || null });
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="rating-modal-close" onClick={onClose}>
          <i className="icofont-close-line"></i>
        </button>
        
        <div className="rating-modal-header">
          <h2>{existingRating ? 'Edit Your Rating' : 'Rate Your Experience'}</h2>
          {doctorName && <p className="doctor-name">Dr. {doctorName}</p>}
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star ${star <= (hover || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <i className={star <= (hover || rating) ? 'icofont-star' : 'icofont-star'}></i>
              </button>
            ))}
          </div>

          <div className="rating-label">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && '⭐ Poor'}
            {rating === 2 && '⭐⭐ Fair'}
            {rating === 3 && '⭐⭐⭐ Good'}
            {rating === 4 && '⭐⭐⭐⭐ Very Good'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
          </div>

          <div className="review-section">
            <label htmlFor="review">Share your experience (optional)</label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about your experience with this doctor..."
              maxLength={500}
              rows={4}
            />
            <div className="char-count">{review.length}/500</div>
          </div>

          <div className="rating-modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
