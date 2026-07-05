import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { ToastProvider, useToast } from './context/ToastContext.jsx'
import { AppProvider, useApp } from './context/AppContext.jsx'

// Import pages
import Home from './pages/Home.jsx'
import Store from './pages/Store.jsx'
import Admin from './pages/Admin.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Cart from './pages/Cart.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Profile from './pages/Profile.jsx'
import Checkout from './pages/Checkout.jsx'
import Login from './pages/Login.jsx'

// Dynamic adaptative Header component
function Header() {
  const { user, admin, logoutUser, logoutAdmin, cartCount } = useApp();

  return (
    <header className="header" style={{ animation: 'toastSlideIn 0.3s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand" style={{ display: 'inline-block' }}>🪴 FloraCraft</div>
        </Link>
        {user && (
          <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
            Welcome, {user.name}!
          </span>
        )}
        {admin && (
          <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
            🛡️ Administrative Console
          </span>
        )}
      </div>

      <nav className="row" style={{ gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>Home</NavLink>
        <NavLink to="/store" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>Store</NavLink>

        {admin ? (
          <>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>Admin Dashboard</NavLink>
            <button 
              className="badge err" 
              onClick={logoutAdmin} 
              style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}
            >
              Logout Admin
            </button>
          </>
        ) : (
          <>
            {user ? (
              <>
                <NavLink to="/wishlist" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>❤️ Wishlist</NavLink>
                <NavLink to="/cart" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>
                  🛒 Cart {cartCount > 0 && (
                    <span style={{ 
                      marginLeft: '4px', 
                      backgroundColor: '#ffffff', 
                      color: 'var(--accent)', 
                      borderRadius: '50%', 
                      padding: '0.1rem 0.4rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      border: '1px solid var(--accent)'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>👤 My Account</NavLink>
                <button 
                  className="badge err" 
                  onClick={logoutUser} 
                  style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/cart" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>🛒 Cart</NavLink>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'badge ok' : 'badge'}>Login / Register</NavLink>
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
}

// Inner App wrapping logic containing routing
function AppContent() {
  const { user } = useApp();

  return (
    <div className="container">
      <Header />
      
      <main style={{ minHeight: '60vh', padding: '1rem 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="footer-container" style={{ marginTop: '4rem' }}>
        <div className="footer-content">
          <div className="footer-brand-section">
            <div className="brand" style={{ display: 'inline-block' }}>🪴 FloraCraft</div>
            <p className="footer-tagline">Bringing clean air, botanical aesthetics, and premium houseplants directly to your home.</p>
          </div>
          
          <div className="footer-links-section">
            <h4>Navigation</h4>
            <nav className="footer-nav">
              <Link to="/store">Store</Link>
              <Link to="/cart">Cart</Link>
              <Link to={user ? "/profile" : "/login"}>Account</Link>
            </nav>
          </div>

          <div className="footer-social-section">
            <h4>Connect</h4>
            <div className="footer-socials">
              <a href="mailto:visheshsingh074@gmail.com" title="Email" className="social-icon">📧</a>
              <a href="https://github.com/Vishesh07s" target="_blank" rel="noreferrer" title="GitHub" className="social-icon">🐙</a>
              <a href="https://linkedin.com/in/vishesh-singh-987a26336" target="_blank" rel="noreferrer" title="LinkedIn" className="social-icon">🔗</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FloraCraft. All rights reserved. | Built with ♥ by <strong>Vishesh Singh</strong></p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        {/* We need useToast inside AppProvider, so we nest them */}
        <ToastConsumerWrapper />
      </ToastProvider>
    </BrowserRouter>
  )
}

function ToastConsumerWrapper() {
  const { showToast } = useToast();
  return (
    <AppProvider showToast={showToast}>
      <AppContent />
    </AppProvider>
  )
}