import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, FileText, Menu as MenuIcon, X } from 'lucide-react';

const { Sider } = Layout;

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(window.innerWidth < 768);
  const isMobile = window.innerWidth < 768;

  React.useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = (path: string) => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard className={`w-5 h-5 ${location.pathname === '/' ? 'animate-pulse' : ''}`} />,
      label: <Link to="/" onClick={() => handleClick('/')}>Dashboard</Link>,
    },
    {
      key: '/products',
      icon: <Package className={`w-5 h-5 ${location.pathname === '/products' ? 'animate-pulse' : ''}`} />,
      label: <Link to="/products" onClick={() => handleClick('/products')}>Produk</Link>,
    },
    {
      key: '/sales',
      icon: <ShoppingCart className={`w-5 h-5 ${location.pathname === '/sales' ? 'animate-pulse' : ''}`} />,
      label: <Link to="/sales" onClick={() => handleClick('/sales')}>Penjualan</Link>,
    },
    {
      key: '/reports',
      icon: <FileText className={`w-5 h-5 ${location.pathname === '/reports' ? 'animate-pulse' : ''}`} />,
      label: <Link to="/reports" onClick={() => handleClick('/reports')}>Laporan</Link>,
    },
  ];

  return (
    <Sider
      theme="light"
      className="min-h-screen border-r border-gray-200 transition-all duration-300 animate-slideInLeft fixed left-0 z-20 md:relative"
      width={250}
      breakpoint="lg"
      collapsedWidth={collapsed && !isMobile ? 80 : 0}
      collapsed={collapsed && !isMobile}
      onBreakpoint={broken => {
        setCollapsed(broken);
      }}
      onCollapse={value => {
        if (!isMobile) {
          setCollapsed(value);
        }
      }}
      zeroWidthTriggerStyle={{
        top: '10px',
        display: isMobile ? 'none' : 'block'
      }}
      trigger={!isMobile && <MenuIcon />}
    >
      <div className="h-16 flex items-center justify-between border-b border-gray-200 px-4">
        <h1 className={`text-xl font-bold text-blue-600 transition-all duration-300 ${collapsed && !isMobile ? 'hidden' : 'block'}`}>
          IPUR CUYUNK
        </h1>
        {isMobile && (
          <Button 
            type="text" 
            className="absolute right-2 top-3"
            icon={<X className="w-5 h-5" />} 
            onClick={onClose}
          />
        )}
      </div>
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0 hover:bg-opacity-10 transition-colors"
        />
        {!isMobile && !collapsed && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button 
              type="text" 
              icon={<MenuIcon className="w-4 h-4" />} 
              onClick={() => setCollapsed(!collapsed)}
              className="hover-scale transition-transform"
            >
              Tutup Menu
            </Button>
          </div>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;