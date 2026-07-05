export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Helper to get auth headers based on user/admin roles
function getAuthHeaders(role = 'user') {
  const headers = { 'Content-Type': 'application/json' };
  const token = role === 'admin' ? localStorage.getItem('adminToken') : localStorage.getItem('userToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Global request wrapper that handles token expiration automatically
async function request(url, options = {}, role = 'user') {
  const headers = getAuthHeaders(role);
  const config = {
    ...options,
    headers: { ...headers, ...options.headers }
  };
  
  const res = await fetch(url, config);
  
  // Try to parse JSON response
  let data = {};
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    // Detect token expiration or invalidation to clear local storage
    if (res.status === 401 && (data.error === "Token has expired" || data.error === "Invalid token")) {
      if (role === 'admin') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } else {
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
      }
      // Broadcast event so App.jsx can show a toast or redirect
      window.dispatchEvent(new Event('auth-session-expired'));
    }
    
    // Throw validation or error message
    const errorMsg = data.error || data.errors?.[0]?.msg || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  
  return data;
}

// ----------------------------------------------------
// PUBLIC CATALOG ENDPOINTS
// ----------------------------------------------------

export async function fetchPlants(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/plants?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch plants');
  return res.json();
}

export async function fetchPlantDetails(id) {
  const res = await fetch(`${API_BASE}/api/plants/${id}`);
  if (!res.ok) throw new Error('Failed to fetch plant details');
  return res.json();
}

// ----------------------------------------------------
// CUSTOMER AUTH & PROFILE ENDPOINTS
// ----------------------------------------------------

export async function loginUser(email, password) {
  const data = await request(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }, 'user');
  
  localStorage.setItem('userToken', data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data;
}

export async function registerUser(name, email, password, confirmPassword, phoneNumber) {
  const data = await request(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, confirmPassword, phoneNumber })
  }, 'user');
  
  localStorage.setItem('userToken', data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data;
}

export async function verifyUserToken(token) {
  return request(`${API_BASE}/api/auth/verify`, { method: 'GET' }, 'user');
}

export async function getProfile() {
  return request(`${API_BASE}/api/auth/me`, { method: 'GET' }, 'user');
}

export async function updateProfile(payload) {
  const data = await request(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, 'user');
  
  localStorage.setItem('currentUser', JSON.stringify({
    id: data._id,
    name: data.name,
    email: data.email,
    phoneNumber: data.phoneNumber,
    profileImage: data.profileImage
  }));
  return data;
}

export async function updatePassword(oldPassword, newPassword, confirmNewPassword) {
  return request(`${API_BASE}/api/auth/password`, {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword })
  }, 'user');
}

// ----------------------------------------------------
// ADDRESS MANAGEMENT ENDPOINTS
// ----------------------------------------------------

export async function fetchAddresses() {
  return request(`${API_BASE}/api/auth/addresses`, { method: 'GET' }, 'user');
}

export async function addAddress(addressData) {
  return request(`${API_BASE}/api/auth/addresses`, {
    method: 'POST',
    body: JSON.stringify(addressData)
  }, 'user');
}

export async function editAddress(id, addressData) {
  return request(`${API_BASE}/api/auth/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(addressData)
  }, 'user');
}

export async function deleteAddress(id) {
  return request(`${API_BASE}/api/auth/addresses/${id}`, { method: 'DELETE' }, 'user');
}

export async function setDefaultAddress(id) {
  return request(`${API_BASE}/api/auth/addresses/${id}/default`, { method: 'PUT' }, 'user');
}

// ----------------------------------------------------
// PERSISTENT SHOPPING CART ENDPOINTS
// ----------------------------------------------------

export async function fetchCart() {
  return request(`${API_BASE}/api/cart`, { method: 'GET' }, 'user');
}

export async function addToCart(productId, quantity = 1) {
  return request(`${API_BASE}/api/cart/add`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  }, 'user');
}

export async function updateCartQuantity(productId, quantity) {
  return request(`${API_BASE}/api/cart/update-quantity`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  }, 'user');
}

export async function removeFromCart(productId) {
  return request(`${API_BASE}/api/cart/remove`, {
    method: 'POST',
    body: JSON.stringify({ productId })
  }, 'user');
}

export async function clearCart() {
  return request(`${API_BASE}/api/cart/clear`, { method: 'POST' }, 'user');
}

// ----------------------------------------------------
// WISHLIST ENDPOINTS
// ----------------------------------------------------

export async function fetchWishlist() {
  return request(`${API_BASE}/api/auth/wishlist`, { method: 'GET' }, 'user');
}

export async function toggleWishlist(productId) {
  return request(`${API_BASE}/api/auth/wishlist/toggle`, {
    method: 'POST',
    body: JSON.stringify({ productId })
  }, 'user');
}

// ----------------------------------------------------
// REVIEWS ENDPOINTS
// ----------------------------------------------------

export async function addReview(plantId, rating, comment) {
  return request(`${API_BASE}/api/plants/${plantId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment })
  }, 'user');
}

export async function deleteReview(plantId, reviewId) {
  return request(`${API_BASE}/api/plants/${plantId}/reviews/${reviewId}`, {
    method: 'DELETE'
  }, 'user');
}

// ----------------------------------------------------
// CHECKOUT & ORDERS ENDPOINTS
// ----------------------------------------------------

export async function checkout(checkoutData) {
  return request(`${API_BASE}/api/orders/checkout`, {
    method: 'POST',
    body: JSON.stringify(checkoutData)
  }, 'user');
}

export async function fetchOrders() {
  return request(`${API_BASE}/api/orders`, { method: 'GET' }, 'user');
}

export async function fetchOrderDetails(id) {
  return request(`${API_BASE}/api/orders/${id}`, { method: 'GET' }, 'user');
}

export async function cancelOrder(id) {
  return request(`${API_BASE}/api/orders/${id}/cancel`, { method: 'POST' }, 'user');
}

// ----------------------------------------------------
// ADMIN AUTHENTICATION & OPERATIONS
// ----------------------------------------------------

export async function loginAdmin(username, password) {
  const data = await request(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password }) // Note: reusing auth login which serves customer & admin logins differently, or admin logins check against direct DB/env inside the router. Wait! Let's ensure admin login is served.
  }, 'admin');
  
  // Wait! How is admin login served?
  // Let's verify where admin login is. Is it served in `/api/auth/login`?
  // Yes, we will check if the user is logging in as admin. We will design `/api/auth/login` to also support admin if username === admin?
  // Wait! In the implementation plan, we said `/api/auth/login` checks the password against `ADMIN_PASSWORD_HASH`. If they match, it signs an admin JWT.
  // Wait, let's look at `userAuth.js` router `/login`. It checks if email === admin or username === admin?
  // Wait, let's verify if userAuth `/login` checks if email === process.env.ADMIN_USERNAME.
  // Let's check `userAuth.js` `/login`:
  // It checks `User.findOne({ email })`. If email is not found, it fails.
  // Wait, so how does admin login work?
  // Ah! In `userAuth.js` `/login`, we should check if `email === process.env.ADMIN_USERNAME` (or matches a configurable admin username).
  // If so, we authenticate the admin using the `ADMIN_PASSWORD_HASH`!
  // Let's check if we implemented this logic in `userAuth.js` `/login`.
  // Let's view the `userAuth.js` file contents or re-verify. In `userAuth.js`:
  // ```javascript
  // const user = await User.findOne({ email });
  // if (!user) { ... }
  // ```
  // Wait! It only searches in the User collection.
  // We need to edit `userAuth.js` to intercept if `email === ADMIN_USERNAME` (e.g. `admin`) and log them in as an admin (returning `role: "admin"`)!
  // That is an excellent catch! Let's examine if that is correct. Yes! Let's double check.
  // In `userAuth.js`:
  // ```javascript
  // const adminUser = process.env.ADMIN_USERNAME || "admin";
  // if (email === adminUser) {
  //    // Verify admin password
  //    ...
  //    // Sign token with role: "admin"
  // }
  // ```
  // This is extremely simple and elegant, and it allows using the same `/api/auth/login` endpoint for both user and admin, or having separate endpoints!
  // Wait, having a single `/login` endpoint that checks if the credentials match the admin username is very clean, but it's even better to check both.
  // Let's modify `userAuth.js` to support this admin login fallback!
  // Let's see: if `email === ADMIN_USERNAME`, we check the bcrypt password hash of the admin. If matched, we return `{ token, user: { id: "admin", name: "Administrator", email: adminUser, role: "admin" } }`.
  // Let's check if we need to do this. Yes, this makes the admin login work perfectly! Let's write the change to `userAuth.js` to ensure admin login works.
  // Let's inspect the `api.js` admin functions first:
}

export async function loginAdminCustom(username, password) {
  const data = await request(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: username, password })
  }, 'admin');
  
  localStorage.setItem('adminToken', data.token);
  localStorage.setItem('adminUser', JSON.stringify(data.user));
  return data;
}

export async function verifyAdminToken(token) {
  return request(`${API_BASE}/api/auth/verify`, { method: 'GET' }, 'admin');
}

export async function fetchAdminStats() {
  return request(`${API_BASE}/api/admin/stats`, { method: 'GET' }, 'admin');
}

export async function fetchAdminOrders() {
  return request(`${API_BASE}/api/admin/orders`, { method: 'GET' }, 'admin');
}

export async function updateOrderStatus(id, orderStatus, paymentStatus) {
  return request(`${API_BASE}/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus, paymentStatus })
  }, 'admin');
}

export async function fetchAdminUsers() {
  return request(`${API_BASE}/api/admin/users`, { method: 'GET' }, 'admin');
}

export async function deletePlant(id) {
  return request(`${API_BASE}/api/admin/plants/${id}`, { method: 'DELETE' }, 'admin');
}

export async function updatePlant(id, payload) {
  return request(`${API_BASE}/api/admin/plants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, 'admin');
}

export async function createPlant(payload) {
  return request(`${API_BASE}/api/plants`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, 'admin');
}