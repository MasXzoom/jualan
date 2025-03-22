import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

const ErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Maaf, halaman yang Anda cari tidak ditemukan."
        extra={
          <Link to="/">
            <Button type="primary" className="bg-blue-600 hover:bg-blue-700">
              Kembali ke Dashboard
            </Button>
          </Link>
        }
      />
    </div>
  );
};

export default ErrorPage; 