import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  updateProfile, 
  updatePassword, 
  fetchAddresses, 
  addAddress, 
  editAddress, 
  deleteAddress, 
  setDefaultAddress, 
  fetchOrders, 
  cancelOrder 
} from '../api.js';
import Loader from '../components/Loader.jsx';

export default function Profile() {
  const { user, setUser, logoutUser } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('settings'); // settings, addresses, orders
  const [loading, setLoading] = useState(true);

  // Settings State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Address Management State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Address Form Inputs
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrHouse, setAddrHouse] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [addrPincode, setAddrPincode] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('userToken')) {
      showToast('Please log in to access your profile', 'info');
      navigate('/login', { state: { from: { pathname: '/profile' } } });
      return;
    }

    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phoneNumber || '');
      setProfileImage(user.profileImage || '');
    }

    // Load Addresses & Orders
    Promise.all([fetchAddresses(), fetchOrders()])
      .then(([addrRes, orderRes]) => {
        setAddresses(addrRes);
        setOrders(orderRes);
      })
      .catch((e) => {
        showToast(e.message || 'Failed to load profile resources', 'error');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateProfile({
        name: profileName.trim(),
        phoneNumber: profilePhone.trim(),
        profileImage: profileImage.trim()
      });
      setUser(updated);
      showToast('Profile settings updated successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to update profile', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showToast('Please fill all password fields', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(oldPassword, newPassword, confirmNewPassword);
      showToast('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e) {
      showToast(e.message || 'Failed to change password', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Browser Geolocation reverse-geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    setDetectingLocation(true);
    showToast("Detecting coordinates...", "info");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            setAddrHouse(addr.house_number || addr.building || "");
            setAddrStreet(addr.road || addr.suburb || "");
            setAddrCity(addr.city || addr.town || addr.village || "");
            setAddrState(addr.state || "");
            setAddrPincode(addr.postcode || "");
            setAddrLandmark(addr.neighbourhood || addr.suburb || "");
            showToast("Location detected and fields prefilled!", "success");
          } else {
            showToast("Failed to parse address details from GPS.", "warning");
          }
        } catch (e) {
          console.error(e);
          showToast("Error communicating with reverse geocoder.", "error");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.warn("Location access denied or unavailable", error);
        showToast("Location permission denied. Please enter address manually.", "warning");
        setDetectingLocation(false);
      }
    );
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addrFullName.trim() || !addrPhone.trim() || !addrHouse.trim() || !addrStreet.trim() || !addrCity.trim() || !addrState.trim() || !addrPincode.trim()) {
      showToast('Please fill in all required address fields', 'error');
      return;
    }

    const payload = {
      fullName: addrFullName.trim(),
      phoneNumber: addrPhone.trim(),
      houseNumber: addrHouse.trim(),
      street: addrStreet.trim(),
      landmark: addrLandmark.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      country: addrCountry.trim(),
      pincode: addrPincode.trim(),
      isDefault: false
    };

    setBusy(true);
    try {
      let updatedAddresses;
      if (editingAddressId) {
        updatedAddresses = await editAddress(editingAddressId, payload);
        showToast('Address updated successfully', 'success');
      } else {
        updatedAddresses = await addAddress(payload);
        showToast('Address added successfully', 'success');
      }
      setAddresses(updatedAddresses);
      clearAddressForm();
    } catch (e) {
      showToast(e.message || 'Failed to save address', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr._id);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phoneNumber);
    setAddrHouse(addr.houseNumber);
    setAddrStreet(addr.street);
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrCountry(addr.country);
    setAddrPincode(addr.pincode);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const updated = await deleteAddress(id);
      setAddresses(updated);
      showToast('Address deleted successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to delete address', 'error');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const updated = await setDefaultAddress(id);
      setAddresses(updated);
      showToast('Default address updated', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to update default address', 'error');
    }
  };

  const clearAddressForm = () => {
    setEditingAddressId(null);
    setAddrFullName('');
    setAddrPhone('');
    setAddrHouse('');
    setAddrStreet('');
    setAddrLandmark('');
    setAddrCity('');
    setAddrState('');
    setAddrCountry('India');
    setAddrPincode('');
    setShowAddressForm(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This will restore plant stock inventory.")) return;
    try {
      const updatedOrder = await cancelOrder(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
      showToast('Order cancelled successfully. Stock restored.', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to cancel order', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.2rem' }}>
          My Account
        </h2>
        <button className="badge err" onClick={() => { logoutUser(); navigate('/'); }} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <nav className="row" style={{ gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button 
          className={activeTab === 'settings' ? 'badge ok' : 'badge'} 
          onClick={() => { setActiveTab('settings'); clearAddressForm(); }}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          ⚙️ Profile Settings
        </button>
        <button 
          className={activeTab === 'addresses' ? 'badge ok' : 'badge'} 
          onClick={() => setActiveTab('addresses')}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          🏠 Addresses
        </button>
        <button 
          className={activeTab === 'orders' ? 'badge ok' : 'badge'} 
          onClick={() => { setActiveTab('orders'); clearAddressForm(); }}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          📦 Order History
        </button>
      </nav>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Update Info Card */}
            <div className="auth-card" style={{ margin: 0, maxWidth: '100%' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Personal Information</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label htmlFor="prof-name">Full Name</label>
                  <input id="prof-name" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="prof-email">Email Address</label>
                  <input id="prof-email" type="email" value={user?.email || ''} disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="prof-phone">Phone Number</label>
                  <input id="prof-phone" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="prof-img">Profile Image URL</label>
                  <input id="prof-img" type="text" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
                </div>
                <button type="submit" disabled={busy} className="hero-btn btn-block" style={{ border: 'none', cursor: 'pointer', marginTop: '1.5rem' }}>
                  {busy ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="auth-card" style={{ margin: 0, maxWidth: '100%' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label htmlFor="pass-old">Current Password</label>
                  <input id="pass-old" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="pass-new">New Password</label>
                  <input id="pass-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="pass-confirm">Confirm New Password</label>
                  <input id="pass-confirm" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={busy} className="hero-btn btn-block" style={{ border: 'none', cursor: 'pointer', marginTop: '1.5rem' }}>
                  {busy ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', margin: 0 }}>Saved Addresses</h3>
            {!showAddressForm && (
              <button className="hero-btn" onClick={() => setShowAddressForm(true)} style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Add New Address
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddressForm && (
            <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 2rem 0', padding: '2rem' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', margin: 0 }}>
                  {editingAddressId ? 'Edit Address' : 'New Shipping Address'}
                </h4>
                <button 
                  type="button" 
                  className="badge ok"
                  onClick={handleDetectLocation} 
                  disabled={detectingLocation} 
                  style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', border: 'none' }}
                >
                  {detectingLocation ? 'Locating...' : '📍 Auto-Detect Location'}
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Full Name *</label>
                    <input type="text" value={addrFullName} onChange={(e) => setAddrFullName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Phone Number *</label>
                    <input type="tel" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>House/Flat No *</label>
                    <input type="text" value={addrHouse} onChange={(e) => setAddrHouse(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Street Address *</label>
                    <input type="text" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} required />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Landmark</label>
                    <input type="text" value={addrLandmark} onChange={(e) => setAddrLandmark(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>City *</label>
                    <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>State *</label>
                    <input type="text" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Pincode *</label>
                    <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Country *</label>
                    <input type="text" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} required />
                  </div>
                </div>

                <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" disabled={busy} className="hero-btn" style={{ border: 'none', cursor: 'pointer', padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
                    {busy ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                  </button>
                  <button type="button" className="badge" onClick={clearAddressForm} style={{ cursor: 'pointer', padding: '0.65rem 1.5rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List addresses */}
          {addresses.length === 0 ? (
            <p className="small" style={{ color: 'var(--text-muted)' }}>No saved addresses. Please add a shipping address.</p>
          ) : (
            <div className="address-card-grid">
              {addresses.map((addr) => (
                <div key={addr._id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                  {addr.isDefault && <span className="address-tag">DEFAULT</span>}
                  
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{addr.fullName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <div>House: {addr.houseNumber}, {addr.street}</div>
                    {addr.landmark && <div>Landmark: {addr.landmark}</div>}
                    <div>{addr.city}, {addr.state} - {addr.pincode}</div>
                    <div>{addr.country}</div>
                    <div style={{ marginTop: '0.25rem', fontWeight: 500, color: 'var(--text)' }}>📞 {addr.phoneNumber}</div>
                  </div>

                  <div className="row" style={{ gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-start' }}>
                    <button className="badge" onClick={() => handleEditAddressClick(addr)} style={{ padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button className="badge err" onClick={() => handleDeleteAddress(addr._id)} style={{ padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
                      Delete
                    </button>
                    {!addr.isDefault && (
                      <button className="badge ok" onClick={() => handleSetDefaultAddress(addr._id)} style={{ padding: '0.3rem 0.75rem', cursor: 'pointer' }}>
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>My Orders</h3>

          {orders.length === 0 ? (
            <p className="small" style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet.</p>
          ) : (
            <div>
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                const canCancel = order.orderStatus === 'Pending' || order.orderStatus === 'Processing';

                return (
                  <div key={order._id} style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', marginBottom: '1rem', overflow: 'hidden' }}>
                    {/* Header bar of order card */}
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1.25rem', 
                        backgroundColor: 'var(--bg-secondary)', 
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div className="small" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                          Order ID: {order._id}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                          Placed on: {dateStr}
                        </div>
                      </div>

                      <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${order.orderStatus === 'Cancelled' ? 'err' : order.orderStatus === 'Delivered' ? 'ok' : ''}`}>
                          Status: {order.orderStatus}
                        </span>
                        <div className="price" style={{ fontWeight: 700 }}>₹{order.totalAmount}</div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Detailed info drop-down */}
                    {isExpanded && (
                      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', animation: 'toastSlideIn 0.2s ease' }}>
                        {/* Products list */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                            Products In This Order
                          </h4>
                          {order.products.map((item) => (
                            <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                              <img src={item.image} alt={item.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                <div className="small" style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity} | ₹{item.price} each</div>
                              </div>
                              <div style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</div>
                            </div>
                          ))}
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                          {/* Shipping details */}
                          <div>
                            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                              Delivery Address
                            </h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.shippingAddress.fullName}</div>
                              <div>{order.shippingAddress.houseNumber}, {order.shippingAddress.street}</div>
                              {order.shippingAddress.landmark && <div>{order.shippingAddress.landmark}</div>}
                              <div>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</div>
                              <div>Phone: {order.shippingAddress.phoneNumber}</div>
                            </div>
                          </div>

                          {/* Payment details */}
                          <div>
                            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                              Payment Method
                            </h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                              <div>Method: <strong>{order.paymentMethod}</strong></div>
                              <div>Status: <strong className={order.paymentStatus === 'Paid' ? 'badge ok' : 'badge'}>{order.paymentStatus}</strong></div>
                              {order.transactionId && <div>Transaction ID: <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{order.transactionId}</code></div>}
                            </div>
                          </div>
                        </div>

                        {/* Cancellations action */}
                        {canCancel && (
                          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <button 
                              className="badge err" 
                              onClick={() => handleCancelOrder(order._id)}
                              style={{ cursor: 'pointer', padding: '0.50rem 1.25rem', border: 'none' }}
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
