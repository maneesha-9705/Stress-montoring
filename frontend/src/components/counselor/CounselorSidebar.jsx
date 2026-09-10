import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './CounselorLayout.css';

export default function CounselorSidebar() {
  const { t } = useLanguage();

  return (
    <nav className="counselor-sidebar">
      <h2 className="sidebar-heading">{t('language') === 'हिंदी' ? 'परामर्शदाता मेनू' : 'Counselor Navigation'}</h2>
      <ul className="counselor-nav-list">
        <li>
          <NavLink to="/counselor/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📊</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navDashboard')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navRequests')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/appointments" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">📅</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navAppointments')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/victims" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">👥</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navMyVictims')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/follow-ups" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔄</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navFollowUps')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">🔔</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navNotifications')}</span>
            </div>
          </NavLink>
        </li>
        <li>
          <NavLink to="/counselor/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            <div className="nav-text-container">
              <span className="nav-label-primary">{t('navProfile')}</span>
            </div>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
