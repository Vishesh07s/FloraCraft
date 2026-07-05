import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPlantDetails, addToCart, toggleWishlist, addReview, deleteReview, fetchPlants, fetchWishlist } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import PlantCard from '../components/PlantCard.jsx';
import { PLANT_IMAGE_MAP } from '../components/imageMap.js';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loadCart } = useApp();
  const { showToast } = useToast();

  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    // Fetch product details
    fetchPlantDetails(id)
      .then(async (data) => {
        if (!active) return;
        setPlant(data);
        setActiveImage(data.image);

        // Fetch user wishlist to see if this item is wishlisted
        if (localStorage.getItem('userToken')) {
          try {
            const wishlist = await fetchWishlist();
            setInWishlist(wishlist.some(item => item._id === data._id));
          } catch (e) {
            console.error("Wishlist fetch error:", e);
          }
        }

        // Fetch related products
        const cat = data.categories?.[0] || '';
        const relatedRes = await fetchPlants({ category: cat, limit: 5 });
        setRelated(relatedRes.items.filter(item => item._id !== data._id).slice(0, 4));
        setLoading(false);
      })
      .catch((e) => {
        if (active) {
          setError(e.message || 'Failed to load product details');
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }

    try {
      await addToCart(plant._id, 1);
      await loadCart();
      showToast(`"${plant.name}" added to cart successfully!`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to add item to cart', 'error');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      showToast('Please log in to manage your wishlist', 'info');
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }

    try {
      const res = await toggleWishlist(plant._id);
      setInWishlist(res.added);
      showToast(res.added ? 'Added to wishlist!' : 'Removed from wishlist', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to update wishlist', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to leave a review', 'info');
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      showToast('Review comment cannot be empty', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const updatedPlant = await addReview(plant._id, rating, comment.trim());
      setPlant(updatedPlant);
      showToast(editingReviewId ? 'Review updated!' : 'Review submitted successfully!', 'success');
      setComment('');
      setRating(5);
      setEditingReviewId(null);
    } catch (e) {
      showToast(e.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setRating(rev.rating);
    setComment(rev.comment);
    window.scrollTo({ top: document.querySelector('.reviews-section').offsetTop - 100, behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      const updatedPlant = await deleteReview(plant._id, reviewId);
      setPlant(updatedPlant);
      showToast('Review deleted successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to delete review', 'error');
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} />;
  if (!plant) return <div className="small">Product not found</div>;

  const fallbackImage = PLANT_IMAGE_MAP[plant.name] || 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=600&q=80';
  const displayImage = activeImage && !activeImage.includes('source.unsplash.com') ? activeImage : fallbackImage;

  // Compile image strip
  const imagesStrip = [plant.image, ...(plant.images || [])].filter(Boolean);

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      {/* Back button */}
      <Link to="/store" className="category-btn" style={{ display: 'inline-block', marginBottom: '2rem', textDecoration: 'none' }}>
        ← Back to Store
      </Link>

      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="gallery-container">
          <img className="main-image" src={displayImage} alt={plant.name} />
          {imagesStrip.length > 1 && (
            <div className="thumbnail-row">
              {imagesStrip.map((img, index) => (
                <img
                  key={index}
                  className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                  src={img && !img.includes('source.unsplash.com') ? img : fallbackImage}
                  alt={`${plant.name} thumbnail ${index}`}
                  onClick={() => setActiveImage(img)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              {plant.name}
            </h1>
            <div className="small" style={{ fontSize: '1.1rem', color: '#f5a623', fontWeight: 600 }}>
              ⭐ {Number(plant.rating).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>({plant.reviews?.length || 0} customer reviews)</span>
            </div>
          </div>

          <div className="price" style={{ fontSize: '2rem' }}>₹{plant.price}</div>

          <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
            {plant.categories?.map((c, i) => <span key={i} className="badge">{c}</span>)}
            <span className={plant.available && plant.stock > 0 ? 'badge ok' : 'badge err'}>
              {plant.available && plant.stock > 0 ? `In Stock (${plant.stock} left)` : 'Out of Stock'}
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0', color: 'var(--text-muted)' }}>
            <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>About this plant</h4>
            <p style={{ lineHeight: '1.7' }}>
              {plant.description || `The ${plant.name} is a beautiful, hand-selected houseplant from our FloraCraft collection. It adds clean air, vibrant green aesthetics, and natural tranquility to your home or office space. Thriving in typical indoor conditions, it is simple to care for and highly rewarding.`}
            </p>
          </div>

          <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleAddToCart}
              disabled={!plant.available || plant.stock <= 0}
              className="hero-btn"
              style={{ flex: 1, border: 'none', cursor: 'pointer', textAlign: 'center' }}
            >
              Add to Cart
            </button>
            <button
              onClick={handleToggleWishlist}
              className="badge"
              style={{ padding: '0.9rem 1.2rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <span style={{ fontSize: '1.3rem', color: inWishlist ? 'var(--error)' : 'var(--text-muted)' }}>
                {inWishlist ? '❤️' : '🤍'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.8rem', marginBottom: '2rem' }}>
          Customer Reviews ({plant.reviews?.length || 0})
        </h3>

        {/* Write Review */}
        <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 2rem 0', padding: '1.75rem' }}>
          <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem' }}>
            {editingReviewId ? 'Edit Your Review' : 'Write a Customer Review'}
          </h4>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-select">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`rating-star ${rating >= star ? 'selected' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="review-comment">Your Review *</label>
              <textarea
                id="review-comment"
                rows="4"
                placeholder="What did you like or dislike about this plant? How did it arrive?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
              />
            </div>
            <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={submittingReview}
                className="hero-btn"
                style={{ border: 'none', padding: '0.65rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {submittingReview ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
              </button>
              {editingReviewId && (
                <button
                  type="button"
                  className="badge"
                  style={{ cursor: 'pointer', padding: '0.65rem 1.2rem' }}
                  onClick={() => {
                    setEditingReviewId(null);
                    setComment('');
                    setRating(5);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Reviews List */}
        {plant.reviews && plant.reviews.length > 0 ? (
          <div>
            {plant.reviews.map((rev) => {
              const isOwnReview = user && rev.user === user.id;
              return (
                <div key={rev._id} className="review-card">
                  <div className="review-header">
                    <div>
                      <div className="review-user">{rev.userName} {isOwnReview && <span className="badge" style={{ fontSize: '0.65rem', marginLeft: '0.25rem', padding: '0.1rem 0.3rem' }}>You</span>}</div>
                      <div style={{ color: '#f5a623', fontSize: '0.85rem' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className="small" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {isOwnReview && (
                        <div className="row" style={{ gap: '0.5rem' }}>
                          <span
                            onClick={() => handleEditReview(rev)}
                            style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            Edit
                          </span>
                          <span
                            onClick={() => handleDeleteReview(rev._id)}
                            style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            Delete
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="small" style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review this plant!</p>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div style={{ marginTop: '5rem', borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'center' }}>
            You May Also Like
          </h3>
          <div className="grid">
            {related.map((item) => (
              <PlantCard
                key={item._id}
                plant={item}
                onClick={() => {
                  navigate(`/product/${item._id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
