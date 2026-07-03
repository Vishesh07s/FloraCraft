import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-container">
      {/* Hero Banner Section */}
      <section className="hero-section">
        <div className="hero-text-content">
          <span className="hero-badge">Big Sale - 20% Off Members</span>
          <h1 className="hero-heading">Breathe Life Into Your Space</h1>
          <p className="hero-subtext">
            Transform your home and office with FloraCraft's handpicked selection of air-purifying, low-maintenance, and aesthetic plants.
          </p>
          <Link to="/store" className="hero-btn">Explore Store</Link>
        </div>
        <div className="hero-image-content">
          <img 
            src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80" 
            alt="FloraCraft Hero Plant" 
          />
        </div>
      </section>

      {/* Features Row */}
      <section className="features-row">
        <div className="feature-item">
          <span className="feature-icon">🚚</span>
          <div>
            <h3>Free Delivery</h3>
            <p>On all orders above ₹999</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🔒</span>
          <div>
            <h3>Secure Payment</h3>
            <p>100% protected checkout</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🪴</span>
          <div>
            <h3>Premium Care</h3>
            <p>Locally grown & handpicked</p>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          <div className="category-card" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=80')" }}>
            <div className="category-card-body">
              <h3>Indoor Air Purifiers</h3>
              <p>Clean your indoor air with beautiful foliage</p>
              <Link to="/store" className="category-btn">Shop Indoor</Link>
            </div>
          </div>
          <div className="category-card" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80')" }}>
            <div className="category-card-body">
              <h3>Outdoor Garden Beauties</h3>
              <p>Transform your balcony and lawn</p>
              <Link to="/store" className="category-btn">Shop Outdoor</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
