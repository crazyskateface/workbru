import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Theme context and Auth Provider
import { ThemeProvider } from './contexts/ThemeContext';
import AuthProvider from './contexts/AuthProvider';

function App() {
  const { user, isLoading } = useAuthStore();
  useAnalytics();

  useEffect(() => {
    console.log('[App] Auth state changed:', { user, isLoading });
  }, [user, isLoading]);

  // Protected route component
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    console.log('[App] Checking protected route:', { 
      isLoading, 
      hasUser: !!user, 
      requireAdmin,
      userRole: user?.role 
    });

    if (isLoading) {
      console.log('[App] Still loading, showing spinner');
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!user) {
      console.log('[App] No user, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && user.role !== 'admin') {
      console.log('[App] User not admin, redirecting to app');
      return <Navigate to="/app" replace />;
    }
    
    console.log('[App] Access granted to protected route');
    return <>{children}</>;
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>          {/* Public routes */}
          <Route path="/" element={
            user ? (
              user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />
            ) : <LandingPage />
          } />          <Route path="/login" element={
            user ? (
              user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />
            ) : <LoginPage />
          } />
          <Route path="/register" element={
            user ? (
              user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />
            ) : <LandingPage />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;