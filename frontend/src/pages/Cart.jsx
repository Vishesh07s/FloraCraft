import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateCartQuantity, removeFromCart, clearCart } from '../api.js';
import Loader from '../components/Loader.jsx';
import { PLANT_IMAGE_MAP } from '../components/imageMap.js';

export default function Cart() {
  const { user, cart, setCart, loadCart, cartCount } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect guests to login
  useEffect(() => {
    if (!localStorage.getItem('userToken')) {
      showToast('Please log in to view your shopping cart', 'info');
      navigate('/login', { state: { from: { pathname: '/cart' } } });
    } else {
      loadCart().finally(() => setLoading(false));
    }
  }, [user, navigate]);

  const handleUpdateQty = async (productId, currentQty, increment) => {
    const targetQty = increment ? currentQty + 1 : currentQty - 1;
    if (targetQty < 1) return;

    setUpdatingId(productId);
    try {
      const updatedCart = await updateCartQuantity(productId, targetQty);
      setCart(updatedCart);
    } catch (e) {
      showToast(e.message || 'Failed to update quantity', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm("Remove this plant from your cart?")) return;
    setUpdatingId(productId);
    try {
      const updatedCart = await removeFromCart(productId);
      setCart(updatedCart);
      showToast('Item removed from cart', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to remove item', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;
    setLoading(true);
    try {
      const updatedCart = await clearCart();
      setCart(updatedCart);
      showToast('Cart cleared', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to clear cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const subtotal = cart?.items?.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  const deliveryFee = subtotal > 1000 || subtotal === 0 ? 0 : 99;
  const finalTotal = subtotal + deliveryFee;

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.2rem', marginBottom: '1rem' }}>
        Shopping Cart
      </h2>

      {cart?.items?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🛒</span>
          <h3>Your cart is empty</h3>
          <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Explore our curated plants catalog and add freshness to your space.
          </p>
          <Link to="/store" className="hero-btn" style={{ textDecoration: 'none' }}>
            Shop Plants
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          {/* Cart items list */}
          <div>
            {cart.items.map((item) => {
              const plant = item.product;
              if (!plant) return null;
              const fallback = PLANT_IMAGE_MAP[plant.name] || 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=600&q=80';
              const src = plant.image && !plant.image.includes('source.unsplash.com') ? plant.image : fallback;

              return (
                <div key={plant._id} className="cart-item-row" style={{ opacity: updatingId === plant._id ? 0.6 : 1 }}>
                  <img className="cart-item-img" src={src} alt={plant.name} />
                  
                  <div className="cart-item-details">
                    <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                      <Link to={`/product/${plant._id}`} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                        {plant.name}
                      </Link>
                    </h4>
                    <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Category: {plant.categories?.[0] || 'Plants'}
                    </p>
                    <div className="price" style={{ fontSize: '1.1rem' }}>₹{plant.price}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => handleUpdateQty(plant._id, item.quantity, false)}
                        disabled={item.quantity <= 1 || updatingId === plant._id}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => handleUpdateQty(plant._id, item.quantity, true)}
                        disabled={item.quantity >= plant.stock || updatingId === plant._id}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(plant._id)}
                      disabled={updatingId === plant._id}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <Link to="/store" className="category-btn" style={{ textDecoration: 'none' }}>
                ← Continue Shopping
              </Link>
              <button
                className="badge err"
                onClick={handleClearCart}
                style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary" style={{ animation: 'toastSlideIn 0.3s ease' }}>
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Order Summary</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span>Items Total ({cartCount})</span>
              <span>₹{subtotal}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>

            {deliveryFee > 0 && (
              <p className="small" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Add <strong>₹{1000 - subtotal}</strong> more for FREE delivery.
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--border)', margin: '1rem 0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
              <span>Total Price</span>
              <span className="price">₹{finalTotal}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="hero-btn btn-block"
              style={{ border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: '1.5rem' }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
