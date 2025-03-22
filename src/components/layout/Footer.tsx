import React from 'react';
import { Layout } from 'antd';
import { HeartIcon } from 'lucide-react';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <AntFooter className="py-6 px-4 bg-white border-t border-gray-200 text-center">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-gray-600 text-sm">
              &copy; {currentYear} IPUR CUYUNK. Hak Cipta Dilindungi.
            </p>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <span>Dibuat dengan</span>
            <HeartIcon className="w-4 h-4 mx-1 text-red-500" />
          </div>
        </div>
      </div>
    </AntFooter>
  );
};

export default Footer; 