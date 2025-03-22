import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';
import id_ID from 'antd/lib/locale/id_ID';
import { supabase } from './lib/supabase';
import { useStore } from './lib/store';

const theme = {
  token: {
    colorPrimary: '#3b82f6',
    borderRadius: 8,
  },
};

// Route yang memerlukan autentikasi
const ProtectedRoute = () => {
  const userId = useStore(state => state.userId);
  
  if (!userId) {
    // Redirect ke halaman login jika pengguna belum login
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  const setUserId = useStore(state => state.setUserId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up Supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
        }
        setLoading(false);
      }
    );

    // Check initial session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
      setLoading(false);
    };
    
    checkUser();
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setUserId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme} locale={id_ID}>
      <Router>
        <Routes>
          {/* Halaman login sebagai rute publik */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rute yang dilindungi, memerlukan autentikasi */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Rute default redirect ke login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;