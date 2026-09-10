import React from 'react';
import './AdminLayout.css';

export default function AdminNavbar() {
  return (
    <header className="admin-navbar">
      <div className="navbar-left">
        <img src="/images/emblem.png" alt="National Crime Records Bureau Emblem" className="navbar-logo" />
        <div className="brand-text">
          <span className="brand-title">National Crime Records Bureau</span>
        </div>
      </div>
      
      <div className="navbar-center">
        <h1>AAROHAN (Administration Portal)</h1>
      </div>
      
      <div className="navbar-right">
        <div className="user-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="profile-svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="user-details">
          <span className="user-name">System Admin</span>
        </div>
      </div>
    </header>
  );
}
