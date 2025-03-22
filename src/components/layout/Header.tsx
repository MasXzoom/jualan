import React, { useEffect, useState } from 'react';
import { Layout, Button, Dropdown, Menu, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { LogOut, User } from 'lucide-react';

const { Header: AntHeader } = Layout;

interface AuthError {
  message: string;
}

const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState<{id: string, email?: string} | null>(null);
  const setUserId = useStore(state => state.setUserId);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          setUserId(session.user.id);
        } else {
          setUser(null);
          setUserId(null);
        }
      }
    );
    
    // Check initial session
    checkUser();
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setUserId]);
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      setUserId(user.id);
    }
  };
  
  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      message.success('Berhasil keluar');
    } catch (error: unknown) {
      const err = error as AuthError;
      message.error(err.message || 'Gagal keluar');
    } finally {
      setLoading(false);
    }
  };
  
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/products':
        return 'Produk';
      case '/sales':
        return 'Penjualan';
      case '/reports':
        return 'Laporan';
      default:
        return 'Sales Tracker';
    }
  };

  const userMenu = (
    <Menu
      items={[
        {
          key: 'signout',
          label: 'Keluar',
          icon: <LogOut className="w-4 h-4" />,
          onClick: handleSignOut,
        },
      ]}
    />
  );

  return (
    <AntHeader className="bg-white px-6 flex items-center justify-between border-b border-gray-200">
      <h2 className="text-xl font-semibold">{getPageTitle(location.pathname)}</h2>
      <div className="flex items-center">
        <div className="text-xl font-bold text-blue-600 mr-4">IPUR CUYUNK</div>
        {user && (
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Button 
              type="text" 
              className="flex items-center"
              icon={<User className="w-5 h-5" />}
              loading={loading}
            >
              {user.email ? user.email.split('@')[0] : 'User'}
            </Button>
          </Dropdown>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;