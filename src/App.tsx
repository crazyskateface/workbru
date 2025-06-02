import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useAnalytics } from './hooks/useAnalytics';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import WorkspaceDetailsPage from './pages/WorkspaceDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminWorkspaces from './pages/admin/Workspaces';
import ImportWorkspaces from './pages/admin/ImportWorkspaces';
import AdminUsers from './pages/admin/Users';
import NotFoundPage from './pages/NotFoundPage';

// Theme context
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const { user, isLoading /*initializeAuth*/ } = useAuthStore();
  const location = useLocation();
  useAnalytics();

  useEffect(() => {
    console.log('[App] User state changed:', user?.email || 'null', 'isLoading:', isLoading);
  }, [user, isLoading]);  

  // Protected route component
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!user) {
      console.log('[App] User is null, redirecting to login');
      localStorage.setItem('attemptedRoute', location.pathname + location.search);
      return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && user.role !== 'admin') {
      return <Navigate to="/app\" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          user ? <Navigate to="/app\" replace /> : <LandingPage />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/app\" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/app\" replace /> : <RegisterPage />
        } />
        
        {/* User routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="workspace/:id" element={<WorkspaceDetailsPage />} />
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="workspaces" element={<AdminWorkspaces />} />
          <Route path="import" element={<ImportWorkspaces />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;