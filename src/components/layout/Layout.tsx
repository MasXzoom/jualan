import React, { useState, ReactNode } from 'react';
import { Layout as AntLayout, Button } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';

const { Content } = AntLayout;

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Render the children directly if provided, otherwise use Outlet
  const contentToRender = children || <Outlet />;

  return (
    <AntLayout className="min-h-screen">
      <div className="block md:hidden fixed top-0 left-0 right-0 z-30 bg-white p-2 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">IPUR CUYUNK</h1>
          <Button
            type="text"
            icon={<Menu className="w-5 h-5" />}
            onClick={toggleMobileMenu}
            className="p-1"
          />
        </div>
      </div>
      
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleMobileMenu}></div>
      
      <div className={`md:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <Sidebar onClose={toggleMobileMenu} />
      </div>
      
      <AntLayout className="md:ml-[250px] transition-all duration-300">
        <div className="hidden md:block">
          <Header />
        </div>
        <div className="block md:hidden h-[50px]"></div>
        <Content className="p-4 md:p-6 overflow-auto bg-gray-50">
          <div className="max-w-[1200px] mx-auto">
            {contentToRender}
          </div>
        </Content>
        <Footer />
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;