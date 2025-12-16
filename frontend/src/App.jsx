import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { supabase } from './utils/supabase';

// Pages
import Landing from './pages/Landing';
import IssuerLogin from './pages/Login/IssuerLogin';
import OwnerLogin from './pages/Login/OwnerLogin';
import AdminLogin from './pages/Login/AdminLogin';
import IssuerDashboard from './pages/Dashboard/IssuerDashboard';
import OwnerDashboard from './pages/Dashboard/OwnerDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login/${requiredRole || 'issuer'}`} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);

          // Fetch user profile
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setRole(userData.role);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);

          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setRole(userData.role);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [setUser, setRole, setIsLoading]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />

        {/* Login Routes */}
        <Route path="/login/issuer" element={<IssuerLogin />} />
        <Route path="/login/owner" element={<OwnerLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />

        {/* Protected Routes - Issuer */}
        <Route
          path="/issuer/*"
          element={
            <ProtectedRoute requiredRole="issuer">
              <IssuerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Owner */}
        <Route
          path="/owner/*"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
