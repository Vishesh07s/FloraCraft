import React, { useEffect, useState } from 'react';
import AdminForm from '../components/AdminForm.jsx';
import { 
  loginAdminCustom, 
  fetchAdminStats, 
  fetchAdminOrders, 
  updateOrderStatus, 
  fetchAdminUsers, 
  deletePlant, 
  updatePlant, 
  createPlant 
} from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';

export default function Admin() {
  const { admin, setAdmin, logoutAdmin } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, products, orders, users
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Admin login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState({ totalProducts: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Product CRUD states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);

  // Form states for editing a plant
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategories, setEditCategories] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

  // Sync data if admin is logged in
  useEffect(() => {
    if (admin) {
      loadAdminData();
    }
  }, [admin, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsData = await fetchAdminStats();
        setStats(statsData);
      } else if (activeTab === 'products') {
        // Load all plants
        const res = await fetch('/api/plants?limit=60'); // fetch directly from local API
        const data = await res.json();
        setProductsList(data.items || []);
      } else if (activeTab === 'orders') {
        const ordersData = await fetchAdminOrders();
        setOrders(ordersData);
      } else if (activeTab === 'users') {
        const usersData = await fetchAdminUsers();
        setUsers(usersData);
      }
    } catch (e) {
      showToast(e.message || 'Failed to load administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }
    setBusy(true);
    try {
      const data = await loginAdminCustom(username.trim(), password);
      setAdmin(data.user);
      showToast('Welcome back, Administrator!', 'success');
    } catch (e) {
      showToast(e.message || 'Invalid administrator credentials', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePlant = async (payload) => {
    try {
      await createPlant(payload);
      showToast('Plant created successfully!', 'success');
      setShowAddForm(false);
      loadAdminData();
    } catch (e) {
      showToast(e.message || 'Failed to create plant', 'error');
    }
  };

  const handleEditPlantClick = (plant) => {
    setEditingPlant(plant);
    setEditName(plant.name);
    setEditPrice(plant.price);
    setEditStock(plant.stock || 0);
    setEditCategories(plant.categories?.join(', ') || '');
    setEditImage(plant.image || '');
    setEditAvailable(plant.available);
  };

  const handleSavePlantUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || Number(editPrice) < 0 || Number(editStock) < 0) {
      showToast('Please fill in valid name, price, and stock', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: editName.trim(),
        price: Number(editPrice),
        stock: Number(editStock),
        available: Boolean(editAvailable),
        categories: editCategories.split(',').map(c => c.trim()).filter(Boolean),
        image: editImage.trim()
      };
      await updatePlant(editingPlant._id, payload);
      showToast('Product updated successfully!', 'success');
      setEditingPlant(null);
      loadAdminData();
    } catch (e) {
      showToast(e.message || 'Failed to update product', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePlant = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deletePlant(id);
      showToast('Product deleted from database', 'success');
      loadAdminData();
    } catch (e) {
      showToast(e.message || 'Failed to delete product', 'error');
    }
  };

  const handleUpdateStatus = async (orderId, orderStatus, paymentStatus) => {
    try {
      await updateOrderStatus(orderId, orderStatus, paymentStatus);
      showToast('Order status updated', 'success');
      loadAdminData();
    } catch (e) {
      showToast(e.message || 'Failed to update status', 'error');
    }
  };

  // If not authenticated as Admin, show Admin login card
  if (!admin) {
    return (
      <div className="container">
        <div className="auth-card" style={{ animation: 'toastSlideIn 0.4s ease' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', color: 'var(--text)' }}>🛡️ Admin Access</h2>
          <p className="small" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Please authenticate using admin credentials to manage inventory, catalog details, sales reports, and customer orders.
          </p>

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label htmlFor="adm-user">Username</label>
              <input 
                id="adm-user"
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="adm-pass">Password</label>
              <input 
                id="adm-pass"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" disabled={busy} className="hero-btn btn-block" style={{ border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
              {busy ? 'Verifying...' : 'Admin Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.2rem', margin: 0 }}>
            Admin Dashboard
          </h2>
          <span className="small" style={{ color: 'var(--text-muted)' }}>Logged in as: {admin.email}</span>
        </div>
        <button className="badge err" onClick={logoutAdmin} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }}>
          Logout Admin
        </button>
      </div>

      {/* Tabs */}
      <nav className="row" style={{ gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button 
          className={activeTab === 'dashboard' ? 'badge ok' : 'badge'} 
          onClick={() => setActiveTab('dashboard')}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          📊 Stats & Analytics
        </button>
        <button 
          className={activeTab === 'products' ? 'badge ok' : 'badge'} 
          onClick={() => { setActiveTab('products'); setShowAddForm(false); setEditingPlant(null); }}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          🪴 Products Catalog
        </button>
        <button 
          className={activeTab === 'orders' ? 'badge ok' : 'badge'} 
          onClick={() => setActiveTab('orders')}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          📋 Customer Orders
        </button>
        <button 
          className={activeTab === 'users' ? 'badge ok' : 'badge'} 
          onClick={() => setActiveTab('users')}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          👥 Registered Users
        </button>
      </nav>

      {loading ? <Loader /> : (
        <div>
          
          {/* Dashboard Stats */}
          {activeTab === 'dashboard' && (
            <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
              <div className="admin-stats-grid">
                <div className="stat-box">
                  <span className="stat-num">₹{stats.totalRevenue}</span>
                  <span className="stat-label">Total Revenue</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.totalProducts}</span>
                  <span className="stat-label">Products Count</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.totalOrders}</span>
                  <span className="stat-label">Total Orders</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{stats.totalUsers}</span>
                  <span className="stat-label">Registered Customers</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Welcome to your Administration Console</h4>
                <p className="small">Use the navigation tabs above to manage plant catalog records, check shipping orders, and monitor customer users.</p>
              </div>
            </div>
          )}

          {/* Products Manager */}
          {activeTab === 'products' && (
            <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', margin: 0 }}>Manage Catalog</h3>
                {!showAddForm && !editingPlant && (
                  <button className="hero-btn" onClick={() => setShowAddForm(true)} style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    + Create New Plant
                  </button>
                )}
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 2rem 0', padding: '2rem' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', margin: 0 }}>Add Plant Product</h4>
                    <button className="badge" onClick={() => setShowAddForm(false)}>Cancel</button>
                  </div>
                  <AdminForm onSubmit={handleCreatePlant} />
                </div>
              )}

              {/* Edit form */}
              {editingPlant && (
                <div className="auth-card" style={{ maxWidth: '100%', margin: '0 0 2rem 0', padding: '2rem' }}>
                  <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1.5rem' }}>Edit Plant: {editingPlant.name}</h4>
                  <form onSubmit={handleSavePlantUpdate} className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Plant Name *</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Price (₹) *</label>
                        <input type="number" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                      </div>
                    </div>
                    
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Stock Quantity *</label>
                        <input type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Status</label>
                        <select value={editAvailable ? 'true' : 'false'} onChange={(e) => setEditAvailable(e.target.value === 'true')}>
                          <option value="true">Available / In Stock</option>
                          <option value="false">Out of Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Categories (comma separated) *</label>
                      <input type="text" value={editCategories} onChange={(e) => setEditCategories(e.target.value)} required />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Image URL</label>
                      <input type="text" value={editImage} onChange={(e) => setEditImage(e.target.value)} />
                    </div>

                    <div className="row" style={{ gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" disabled={busy} className="hero-btn" style={{ border: 'none', cursor: 'pointer', padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
                        {busy ? 'Saving...' : 'Save Updates'}
                      </button>
                      <button type="button" className="badge" onClick={() => setEditingPlant(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products List Table */}
              {productsList.length === 0 ? (
                <p className="small">No products found in the database.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Plant Info</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Categories</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img src={p.image} alt={p.name} style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                              <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                            </div>
                          </td>
                          <td>₹{p.price}</td>
                          <td>{p.stock !== undefined ? p.stock : 15}</td>
                          <td>
                            <span className={p.available ? 'badge ok' : 'badge err'} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                              {p.available ? 'Available' : 'Out of Stock'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.categories?.join(', ')}</td>
                          <td>
                            <div className="row" style={{ gap: '0.5rem' }}>
                              <button className="badge" onClick={() => handleEditPlantClick(p)} style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                Edit
                              </button>
                              <button className="badge err" onClick={() => handleDeletePlant(p._id)} style={{ cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Customer Orders */}
          {activeTab === 'orders' && (
            <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem' }}>Manage Platform Orders</h3>
              
              {orders.length === 0 ? (
                <p className="small">No orders found on the platform.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="responsive-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td><code>{o._id.substring(0, 8)}...</code></td>
                          <td>
                            <div><strong>{o.user?.name || 'Guest'}</strong></div>
                            <div className="small" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email || ''}</div>
                          </td>
                          <td><strong>₹{o.totalAmount}</strong></td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${o.orderStatus === 'Cancelled' ? 'err' : o.orderStatus === 'Delivered' ? 'ok' : ''}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td>
                            <span className={o.paymentStatus === 'Paid' ? 'badge ok' : 'badge'} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <div className="row" style={{ gap: '0.25rem', flexWrap: 'nowrap' }}>
                              <select 
                                value={o.orderStatus} 
                                onChange={(e) => handleUpdateStatus(o._id, e.target.value, o.paymentStatus)}
                                style={{ padding: '0.2rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)' }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              
                              <select 
                                value={o.paymentStatus} 
                                onChange={(e) => handleUpdateStatus(o._id, o.orderStatus, e.target.value)}
                                style={{ padding: '0.2rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)' }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Registered Users */}
          {activeTab === 'users' && (
            <div style={{ animation: 'toastSlideIn 0.2s ease' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', marginBottom: '1rem' }}>User Profiles</h3>

              {users.length === 0 ? (
                <p className="small">No users registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {u.profileImage ? (
                                <img src={u.profileImage} alt={u.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '1.2rem' }}>👤</span>
                              )}
                              <strong>{u.name}</strong>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>{u.phoneNumber || 'N/A'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}