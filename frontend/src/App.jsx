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
        <footer className="footer" style={{ borderTop: '1px solid #1f2937', paddingTop: '1.5rem', marginTop: '3rem' }}>
          <div>Built with ♥ by <strong>Vishesh Singh</strong></div>
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span>📧 visheshsingh074@gmail.com</span>
            <span>🔗 <a href="https://github.com/Vishesh07s" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>GitHub</a></span>
            <span>🔗 <a href="https://linkedin.com/in/vishesh-singh-987a26336" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none' }}>LinkedIn</a></span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}