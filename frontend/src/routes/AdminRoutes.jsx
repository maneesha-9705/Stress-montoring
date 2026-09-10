import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminVictims from '../pages/admin/AdminVictims';
import AdminVictimDetails from '../pages/admin/AdminVictimDetails';
import AdminCounselors from '../pages/admin/AdminCounselors';
import AdminCounselorDetails from '../pages/admin/AdminCounselorDetails';
import AdminWelfare from '../pages/admin/AdminWelfare';
import AdminAlerts from '../pages/admin/AdminAlerts';
import AdminReports from '../pages/admin/AdminReports';
import AdminUsers from '../pages/admin/AdminUsers';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        
        <Route path="victims" element={<AdminVictims />} />
        <Route path="victims/:id" element={<AdminVictimDetails />} />
        
        <Route path="counselors" element={<AdminCounselors />} />
        <Route path="counselors/:id" element={<AdminCounselorDetails />} />
        
        <Route path="welfare" element={<AdminWelfare />} />
        <Route path="welfare-oversight" element={<AdminWelfare />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="alert-center" element={<AdminAlerts />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="geographic-reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />

        {/* Fallback route for unmatched /admin/* paths */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
