import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { HospitalDashboardPage } from './pages/hospital/HospitalDashboardPage';
import { HospitalClaimsPage } from './pages/hospital/HospitalClaimsPage';
import { CreateClaimPage } from './pages/hospital/CreateClaimPage';
import { HospitalClaimDetailPage } from './pages/hospital/HospitalClaimDetailPage';
import { TPADashboardPage } from './pages/tpa/TPADashboardPage';
import { TPAReviewQueuePage } from './pages/tpa/TPAReviewQueuePage';
import { TPAClaimReviewPage } from './pages/tpa/TPAClaimReviewPage';
import { TPAQueryManagementPage } from './pages/tpa/TPAQueryManagementPage';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('HOSPITAL_STAFF' | 'TPA_MANAGER')[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective home dashboard if wrong portal accessed
    return <Navigate to={user.role === 'HOSPITAL_STAFF' ? '/hospital/dashboard' : '/tpa/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Root redirect based on role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'HOSPITAL_STAFF' ? '/hospital/dashboard' : '/tpa/dashboard'} replace />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Hospital Staff Portal */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL_STAFF']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboardPage />} />
        <Route path="claims" element={<HospitalClaimsPage />} />
        <Route path="claims/new" element={<CreateClaimPage />} />
        <Route path="claims/:id" element={<HospitalClaimDetailPage />} />
      </Route>

      {/* TPA Manager Portal */}
      <Route
        path="/tpa"
        element={
          <ProtectedRoute allowedRoles={['TPA_MANAGER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TPADashboardPage />} />
        <Route path="queue" element={<TPAReviewQueuePage />} />
        <Route path="claims/:id" element={<TPAClaimReviewPage />} />
        <Route path="queries" element={<TPAQueryManagementPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
