import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, registerUser, loginWithGoogle } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const { setUser } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (adminToken) {
      navigate('/admin');
    } else if (userToken) {
      navigate('/store');
    }
  }, [userToken, adminToken, navigate]);

  const from = location.state?.from?.pathname || '/store';

  // Google Login response handler
  const handleGoogleLoginResponse = async (response) => {
    setBusy(true);
    try {
      const data = await loginWithGoogle(response.credential);
      setUser(data.user);
      showToast(isRegister ? 'Account created successfully! Welcome to FloraCraft.' : 'Logged in successfully', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleLoginResponse,
      });

      const btnElem = document.getElementById("google-signin-btn");
      if (btnElem) {
        window.google.accounts.id.renderButton(btnElem, {
          theme: "outline",
          size: "large",
          width: 350,
          text: isRegister ? "signup_with" : "signin_with"
        });
      }
    };

    loadGoogleScript();
  }, [isRegister]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        showToast('Please enter your name', 'error');
        return;
      }
      if (password.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
    }

    setBusy(true);
    try {
      if (isRegister) {
        const data = await registerUser(name.trim(), email.trim(), password, confirmPassword, phoneNumber.trim());
        setUser(data.user);
        showToast('Account created successfully! Welcome to FloraCraft.', 'success');
      } else {
        const data = await loginUser(email.trim(), password);
        setUser(data.user);
        showToast('Logged in successfully', 'success');
      }
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card" style={{ animation: 'toastSlideIn 0.4s ease' }}>
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="small" style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'Join FloraCraft for premium house plants.' : 'Sign in to access your cart, orders, and profile.'}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name *</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address *</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-phone">Phone Number (Optional)</label>
              <input
                id="auth-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-password">Password *</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password *</label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" disabled={busy} className="hero-btn btn-block" style={{ border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
            {busy ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="divider" style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--border, #e0e0e0)' }}></span>
          <span style={{ padding: '0 10px', fontSize: '0.85rem', color: 'var(--text-muted, #757575)' }}>OR</span>
          <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--border, #e0e0e0)' }}></span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '1rem' }}>
          <div id="google-signin-btn"></div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setName('');
              setPassword('');
              setConfirmPassword('');
              setPhoneNumber('');
            }}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </span>
        </div>
      </div>
    </div>
  );
}
