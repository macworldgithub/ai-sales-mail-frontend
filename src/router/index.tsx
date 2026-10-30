import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import SidebarLayout from '../commons/SideBarLayout';
import LoginPage from '../pages/auth/Login';
const DashboardPage = lazy(() => import('../pages/Home'));
const EmailCampaignsPage = lazy(() => import('../pages/EmailComapignPage'));
import ProtectedRoute from './protectedRoute';
export default function AppRouter() {
  return <BrowserRouter><Suspense fallback={<Spin fullscreen />}><Routes>
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/*" element={<ProtectedRoute><SidebarLayout><Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/email-campaigns" element={<EmailCampaignsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes></SidebarLayout></ProtectedRoute>} />
  </Routes></Suspense></BrowserRouter>;
}
