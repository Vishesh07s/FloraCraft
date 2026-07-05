import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fetchWishlist, toggleWishlist, addToCart } from '../api.js';
import Loader from '../components/Loader.jsx';
import PlantCard from '../components/PlantCard.jsx';

export default function Wishlist() {
  const { user, loadCart } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('userToken')) {
      showToast('Please log in to view your wishlist', 'info');
      navigate('/login', { state: { from: { pathname: '/wishlist' } } });
      return;
    }
    
    fetchWishlist()
      .then(setWishlist)
      .catch((e) => showToast(e.message || 'Failed to load wishlist', 'error'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRemoveWishlist = async (productId, e) => {
    e.stopPropagation(); // Avoid navigating to product detail
    try {
      const res = await toggleWishlist(productId);
      setWishlist((prev) => prev.filter(item => item._id !== productId));
      showToast('Removed from wishlist', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to remove from wishlist', 'error');
    }
  };

  const handleMoveToCart = async (plant, e) => {
    e.stopPropagation();
    try {
      // 1. Add to Cart
      await addToCart(plant._id, 1);
      // 2. Remove from Wishlist
      await toggleWishlist(plant._id);
      // 3. Update Wishlist state
      setWishlist((prev) => prev.filter(item => item._id !== plant._id));
      // 4. Update cart context
      await loadCart();
      showToast(`"${plant.name}" moved to cart!`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to move to cart', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.2rem', marginBottom: '1rem' }}>
        My Wishlist
      </h2>

      {wishlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>❤️</span>
          <h3>Your wishlist is empty</h3>
          <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Save your favorite plants here to buy them later.
          </p>
          <Link to="/store" className="hero-btn" style={{ textDecoration: 'none' }}>
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid">
          {wishlist.map((plant) => (
            <div 
              key={plant._id} 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => navigate(`/product/${plant._id}`)}
            >
              <PlantCard plant={plant} onClick={() => {}} />
              
              {/* Wishlist management buttons overlaid */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '0.75rem', 
                  right: '0.75rem', 
                  display: 'flex', 
                  gap: '0.25rem',
                  zIndex: 10 
                }}
              >
                <button
                  className="badge err"
                  onClick={(e) => handleRemoveWishlist(plant._id, e)}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                  title="Remove from wishlist"
                >
                  &times;
                </button>
              </div>

              {/* Move to cart action at the bottom of the card container */}
              <div style={{ padding: '0 1rem 1rem 1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginTop: '-8px' }}>
                <button
                  className="hero-btn btn-block"
                  disabled={!plant.available || plant.stock <= 0}
                  onClick={(e) => handleMoveToCart(plant, e)}
                  style={{ padding: '0.5rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
                >
                  {plant.available ? 'Move to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
