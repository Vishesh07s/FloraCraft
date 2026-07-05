import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, verifyUserToken, verifyAdminToken } from '../api.js';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

export function AppProvider({ children, showToast }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('adminUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState({ items: [] });

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Verify tokens on startup to catch expired sessions
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      verifyUserToken(userToken).catch(() => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        setUser(null);
        showToast('Your session has expired. Please log in again.', 'warning');
      });
    }

    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      verifyAdminToken(adminToken).catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAdmin(null);
        showToast('Admin session expired. Please log in again.', 'warning');
      });
    }
  }, [showToast]);

  // Sync cart automatically when customer user session changes
  useEffect(() => {
    if (user) {
      fetchCart()
        .then(setCart)
        .catch(() => setCart({ items: [] }));
    } else {
      setCart({ items: [] });
    }
  }, [user]);

  const loadCart = async () => {
    if (user) {
      try {
        const data = await fetchCart();
        setCart(data);
      } catch (e) {
        console.error("Cart fetch error:", e);
      }
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    setUser(null);
    setCart({ items: [] });
    showToast('Logged out successfully', 'success');
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
    showToast('Admin logged out successfully', 'success');
  };

  // Sync token expiry events globally
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setAdmin(null);
      setCart({ items: [] });
      showToast('Session expired. Please log in again.', 'error');
    };
    window.addEventListener('auth-session-expired', handleExpired);
    return () => window.removeEventListener('auth-session-expired', handleExpired);
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      admin,
      setAdmin,
      cart,
      setCart,
      cartCount,
      loadCart,
      logoutUser,
      logoutAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
}
