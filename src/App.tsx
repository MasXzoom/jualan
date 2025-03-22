import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import ErrorPage from './components/common/ErrorPage';
import LoginPage from './pages/LoginPage';
import { useStore } from './lib/store';
import { supabase } from './lib/supabase';
import { Spin, message, ConfigProvider } from 'antd';
import { theme, colorScheme } from './theme';
import GlobalNotification from './components/common/GlobalNotification';

// Komponen untuk route yang memerlukan autentikasi
const ProtectedRoute = () => {
  const userId = useStore(state => state.userId);
  
  console.log('Protected route check, userId:', userId ? 'exists' : 'none');
  
  if (!userId) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('User authenticated, rendering protected content');
  return <Layout />;
};

function App() {
  const { userId, setUserId } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('App is initializing...');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth session...');
        setLoading(true);
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError.message);
          throw sessionError;
        }
        
        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            console.log('Auth state changed, userId:', session?.user?.id || 'none');
            setUserId(session?.user?.id || null);
          }
        );
        
        // Set initial user
        if (session?.user) {
          console.log('Session found, setting userId:', session.user.id);
          setUserId(session.user.id);
        } else {
          console.log('No session found');
          setUserId(null);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth check failed:', err);
        setError('Gagal memeriksa status otentikasi. Silakan coba lagi.');
        message.error('Gagal memeriksa status otentikasi');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [setUserId]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  console.log('App rendering, userId:', userId ? 'exists' : 'none');

  return (
    <ConfigProvider theme={theme}>
      <Router>
        <div style={{ colorScheme }}>
          <GlobalNotification />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<Products />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="reports" element={<Reports />} />
              <Route path="*" element={<ErrorPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;