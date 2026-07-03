import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Store from './pages/Store.jsx'
import Admin from './pages/Admin.jsx'
export default function App(){
  return (
    <BrowserRouter>
      <div className="container">
        <header className="header">
          <div className="brand">🪴 FloraCraft</div>
          <nav className="row" style={{gap:'0.5rem'}}>
            <NavLink to="/" end className={({isActive})=> isActive ? 'badge ok':'badge'}>Store</NavLink>
            <NavLink to="/admin" className={({isActive})=> isActive ? 'badge ok':'badge'}>Admin</NavLink>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Store/>}/>
          <Route path="/admin" element={<Admin/>}/>
        </Routes>
        <footer className="footer-container">
          <div className="footer-content">
            <div className="footer-brand-section">
              <div className="brand" style={{ display: 'inline-block' }}>🪴 FloraCraft</div>
              <p className="footer-tagline">Bringing clean air, botanical aesthetics, and premium houseplants directly to your home.</p>
            </div>
            
            <div className="footer-links-section">
              <h4>Navigation</h4>
              <nav className="footer-nav">
                <NavLink to="/" end>Store</NavLink>
                <NavLink to="/admin">Admin</NavLink>
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
    </BrowserRouter>
  )
}