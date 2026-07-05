import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fetchAddresses, checkout, addAddress } from '../api.js';
import Loader from '../components/Loader.jsx';
import { PLANT_IMAGE_MAP } from '../components/imageMap.js';

export default function Checkout() {
  const { user, cart, setCart, loadCart } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Address, 2: Summary, 3: Payment, 4: Confirmation
  
  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  // Add temporary address toggle & states
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newCountry, setNewCountry] = useState('India');
  const [newPincode, setNewPincode] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or Online
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Card details mock states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('userToken')) {
      showToast('Please log in to proceed to checkout', 'info');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (cart?.items?.length === 0 && step !== 4) {
      showToast('Your cart is empty', 'warning');
      navigate('/store');
      return;
    }

    // Load user addresses
    fetchAddresses()
      .then((addrRes) => {
        setAddresses(addrRes);
        const defaultAddr = addrRes.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (addrRes.length > 0) {
          setSelectedAddressId(addrRes[0]._id);
        }
      })
      .catch((e) => showToast(e.message || 'Failed to load addresses', 'error'))
      .finally(() => setLoading(false));
  }, [navigate, cart]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim() || !newHouse.trim() || !newStreet.trim() || !newCity.trim() || !newPincode.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: newFullName.trim(),
        phoneNumber: newPhone.trim(),
        houseNumber: newHouse.trim(),
        street: newStreet.trim(),
        landmark: newLandmark.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        country: newCountry.trim(),
        pincode: newPincode.trim(),
        isDefault: addresses.length === 0
      };
      const updated = await addAddress(payload);
      setAddresses(updated);
      
      // Auto-select the newly added address
      const newAddr = updated[updated.length - 1];
      if (newAddr) setSelectedAddressId(newAddr._id);
      
      // Reset form
      setShowNewAddressForm(false);
      setNewFullName('');
      setNewPhone('');
      setNewHouse('');
      setNewStreet('');
      setNewLandmark('');
      setNewCity('');
      setNewState('');
      setNewPincode('');
      showToast('Address saved successfully!', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to add address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select a shipping address', 'error');
      setStep(1);
      return;
    }

    if (paymentMethod === 'Online') {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        showToast('Please enter your card details', 'error');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        showToast('Invalid card number', 'error');
        return;
      }
    }

    setPaymentProcessing(true);
    
    // Simulate delay for online processing
    const delay = paymentMethod === 'Online' ? 2000 : 500;
    
    setTimeout(async () => {
      try {
        const orderData = await checkout({
          paymentMethod,
          addressId: selectedAddressId
        });
        
        setCreatedOrder(orderData);
        setCart({ items: [] }); // Clear cart context
        showToast('Order placed successfully!', 'success');
        setStep(4); // Move to Confirmation step
      } catch (e) {
        showToast(e.message || 'Checkout failed', 'error');
        // Redirect back to cart or address step if stock issues arise
        setStep(2);
      } finally {
        setPaymentProcessing(false);
      }
    }, delay);
  };

  if (loading) return <Loader />;

  // Calculate prices
  const subtotal = cart?.items?.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0) || 0;
  
  const deliveryFee = subtotal > 1000 ? 0 : 99;
  const total = subtotal + deliveryFee;
  const activeAddress = addresses.find(addr => addr._id === selectedAddressId);

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease', maxWidth: '800px' }}>
      
      {/* Step Wizard Header */}
      <div className="wizard-steps">
        <div className={`step-indicator ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>1. Address</div>
        <div className={`step-indicator ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>2. Summary</div>
        <div className={`step-indicator ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}`}>3. Payment</div>
        <div className={`step-indicator ${step >= 4 ? 'active' : ''}`}>4. Done</div>
      </div>

      {/* Step 1: Address Selection */}
      {step === 1 && (
        <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem' }}>Select Shipping Address</h3>
          
          {addresses.length === 0 && !showNewAddressForm ? (
            <div style={{ padding: '2rem 1rem', border: '1px dashed var(--border)', textAlign: 'center', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p className="small" style={{ color: 'var(--text-muted)' }}>No saved addresses found.</p>
              <button className="hero-btn" onClick={() => setShowNewAddressForm(true)} style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 1rem', marginTop: '0.5rem' }}>
                Add New Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {addresses.map(addr => (
                <div 
                  key={addr._id} 
                  onClick={() => setSelectedAddressId(addr._id)}
                  style={{ 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '1.25rem', 
                    cursor: 'pointer',
                    position: 'relative',
                    borderColor: selectedAddressId === addr._id ? 'var(--accent)' : 'var(--border)',
                    boxShadow: selectedAddressId === addr._id ? '0 0 0 2px rgba(120, 162, 6, 0.05)' : 'none',
                    backgroundColor: 'var(--bg)'
                  }}
                >
                  <input 
                    type="radio" 
                    checked={selectedAddressId === addr._id} 
                    onChange={() => setSelectedAddressId(addr._id)}
                    style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', accentColor: 'var(--accent)' }} 
                  />
                  <div style={{ paddingLeft: '2rem' }}>
                    <div style={{ fontWeight: 700 }}>{addr.fullName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {addr.houseNumber}, {addr.street}, {addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - {addr.pincode}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phone: {addr.phoneNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showNewAddressForm && addresses.length > 0 && (
            <button className="badge ok" onClick={() => setShowNewAddressForm(true)} style={{ cursor: 'pointer', marginBottom: '2rem', padding: '0.5rem 1rem', border: 'none' }}>
              + Add Another Address
            </button>
          )}

          {showNewAddressForm && (
            <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 2rem 0', padding: '1.5rem' }}>
              <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem' }}>New Shipping Address</h4>
              <form onSubmit={handleAddNewAddress} className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Full Name *</label>
                    <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Phone Number *</label>
                    <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>House/Flat No *</label>
                    <input type="text" value={newHouse} onChange={(e) => setNewHouse(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Street Address *</label>
                    <input type="text" value={newStreet} onChange={(e) => setNewStreet(e.target.value)} required />
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Landmark</label>
                    <input type="text" value={newLandmark} onChange={(e) => setNewLandmark(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>City *</label>
                    <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>State *</label>
                    <input type="text" value={newState} onChange={(e) => setNewState(e.target.value)} required />
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Pincode *</label>
                    <input type="text" value={newPincode} onChange={(e) => setNewPincode(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Country *</label>
                    <input type="text" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} required />
                  </div>
                </div>
                <div className="row" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                  <button type="submit" className="hero-btn" style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}>Save & Select</button>
                  <button type="button" className="badge" onClick={() => setShowNewAddressForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <Link to="/cart" className="category-btn" style={{ textDecoration: 'none' }}>← Back to Cart</Link>
            <button 
              className="hero-btn" 
              onClick={() => {
                if (!selectedAddressId) {
                  showToast('Please select a shipping address', 'error');
                } else {
                  setStep(2);
                }
              }}
              style={{ border: 'none', cursor: 'pointer', padding: '0.65rem 1.75rem' }}
            >
              Continue to Summary →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Order Summary */}
      {step === 2 && (
        <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Review Your Order</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* Products summary */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Items List
              </h4>
              {cart.items.map(item => (
                <div key={item.product?._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={item.product?.image} alt={item.product?.name} style={{ width: '40px', height: '40px', objectfit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.product?.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>x {item.quantity}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(item.product?.price || 0) * item.quantity}</div>
                </div>
              ))}
            </div>

            {/* Address summary */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Shipping Address
              </h4>
              {activeAddress ? (
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{activeAddress.fullName}</div>
                  <div>{activeAddress.houseNumber}, {activeAddress.street}</div>
                  <div>{activeAddress.city}, {activeAddress.state} - {activeAddress.pincode}</div>
                  <div>Phone: {activeAddress.phoneNumber}</div>
                </div>
              ) : (
                <p className="small" style={{ color: 'var(--error)' }}>No address selected</p>
              )}
            </div>

            {/* Total pricing */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
                <span>Total Amount</span>
                <span className="price">₹{total}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <button className="category-btn" onClick={() => setStep(1)}>← Change Address</button>
            <button className="hero-btn" onClick={() => setStep(3)} style={{ border: 'none', cursor: 'pointer', padding: '0.65rem 1.75rem' }}>
              Proceed to Payment →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Choose Payment Option</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Cash on Delivery option */}
            <div 
              onClick={() => setPaymentMethod('COD')}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem',
                cursor: 'pointer',
                borderColor: paymentMethod === 'COD' ? 'var(--accent)' : 'var(--border)',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <input 
                type="radio" 
                checked={paymentMethod === 'COD'} 
                onChange={() => setPaymentMethod('COD')} 
                style={{ accentColor: 'var(--accent)' }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>💵 Cash On Delivery (COD)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay by cash or card upon delivery.</div>
              </div>
            </div>

            {/* Online Payment (Demo) option */}
            <div 
              onClick={() => setPaymentMethod('Online')}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem',
                cursor: 'pointer',
                borderColor: paymentMethod === 'Online' ? 'var(--accent)' : 'var(--border)',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="radio" 
                  checked={paymentMethod === 'Online'} 
                  onChange={() => setPaymentMethod('Online')} 
                  style={{ accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>💳 Online Payment (Simulated Demo)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulate payment gateway interaction with visual loaders.</div>
                </div>
              </div>

              {/* Mock credit card inputs */}
              {paymentMethod === 'Online' && (
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ 
                    marginTop: '1rem', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid var(--border)',
                    animation: 'toastSlideIn 0.3s ease'
                  }}
                  className="grid"
                >
                  <div className="form-group">
                    <label>Card Number *</label>
                    <input 
                      type="text" 
                      placeholder="4111 2222 3333 4444" 
                      value={cardNumber} 
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').substring(0, 16);
                        const match = v.match(/\d{4}/g);
                        setCardNumber(match ? match.join(' ') : v);
                      }}
                      required
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Expiry Date *</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        value={cardExpiry}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').substring(0, 4);
                          setCardExpiry(v.length >= 2 ? `${v.substring(0, 2)}/${v.substring(2)}` : v);
                        }}
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>CVV *</label>
                      <input 
                        type="password" 
                        maxLength="3" 
                        placeholder="123" 
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing summary */}
          <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Final Amount to Pay:</span>
            <span className="price" style={{ fontSize: '1.25rem' }}>₹{total}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <button className="category-btn" onClick={() => setStep(2)} disabled={paymentProcessing}>
              ← Edit Order Summary
            </button>
            <button 
              className="hero-btn" 
              onClick={handlePlaceOrder}
              disabled={paymentProcessing}
              style={{ border: 'none', cursor: 'pointer', padding: '0.65rem 2rem' }}
            >
              {paymentProcessing ? 'Processing Payment...' : paymentMethod === 'Online' ? 'Pay Now & Place Order' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Order Confirmation */}
      {step === 4 && createdOrder && (
        <div style={{ animation: 'toastSlideIn 0.3s ease', textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '0.5rem' }}>Thank You For Your Order!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Your order has been placed successfully and will be delivered shortly.
          </p>

          <div 
            style={{ 
              maxWidth: '450px', 
              margin: '0 auto 2rem auto', 
              padding: '1.5rem', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '6px',
              textAlign: 'left',
              fontSize: '0.9rem',
              lineHeight: '1.6'
            }}
          >
            <div><strong>Order ID:</strong> <code style={{ fontSize: '0.85rem' }}>{createdOrder._id}</code></div>
            <div><strong>Total Paid:</strong> ₹{createdOrder.totalAmount}</div>
            <div><strong>Payment Option:</strong> {createdOrder.paymentMethod}</div>
            {createdOrder.transactionId && (
              <div><strong>Transaction ID:</strong> <code style={{ fontSize: '0.85rem' }}>{createdOrder.transactionId}</code></div>
            )}
            <div><strong>Shipping to:</strong> {createdOrder.shippingAddress?.fullName} ({createdOrder.shippingAddress?.city})</div>
          </div>

          <div className="row" style={{ gap: '1rem', justifyContent: 'center' }}>
            <Link to="/store" className="hero-btn" style={{ textDecoration: 'none' }}>
              Continue Shopping
            </Link>
            <Link to="/profile" className="badge" style={{ textDecoration: 'none', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center' }}>
              Check Order Status
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
