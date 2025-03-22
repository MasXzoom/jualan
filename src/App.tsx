import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import GlobalNotification from './components/common/GlobalNotification';
import id_ID from 'antd/lib/locale/id_ID';
import { supabase } from './lib/supabase';
import { useStore } from './lib/store';
import { theme as appTheme } from './lib/theme';

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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-50">
        <img src="/src/assets/logo.svg" alt="IPUR CUYUNK" className="w-16 h-16 mb-4" />
        <Spin size="large" />
        <div className="mt-4 text-blue-600 font-medium">Memuat aplikasi...</div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={appTheme} locale={id_ID}>
      <GlobalNotification />
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

          {/* Halaman Error 404 untuk rute yang tidak ditemukan */}
          <Route path="/404" element={<ErrorPage />} />
          
          {/* Rute default redirect ke halaman 404 jika tidak ditemukan */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;