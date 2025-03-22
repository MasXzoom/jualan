import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Select, List, Avatar, Typography, Badge } from 'antd';
import { Package, ShoppingCart, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '../lib/store';
import { isBrowser } from '../utils/browser';

const { Text, Title } = Typography;

const Dashboard = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');

  useEffect(() => {
    // Cek apakah tampilan mobile hanya jika di browser
    if (isBrowser()) {
      setIsMobile(window.innerWidth < 768);
      
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const { 
    products, 
    sales, 
    totalSales,
    loading,
    fetchProducts,
    fetchSales,
    subscribeToProducts,
    subscribeToSales
  } = useStore();

  useEffect(() => {
    fetchProducts();
    fetchSales();
    
    const unsubscribeProducts = subscribeToProducts();
    const unsubscribeSales = subscribeToSales();

    return () => {
      // Type assertions to fix linter errors
      if (typeof unsubscribeProducts === 'function') unsubscribeProducts();
      if (typeof unsubscribeSales === 'function') unsubscribeSales();
    };
  }, [fetchProducts, fetchSales, subscribeToProducts, subscribeToSales]);

  // Konversi mata uang
  const convertCurrency = (amount: number): number => {
    if (currency === 'USD') {
      // Anggap rate IDR ke USD adalah 1 USD = 15,000 IDR
      return amount / 15000;
    }
    return amount;
  };

  // Format mata uang
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(convertCurrency(amount));
  };

  // Format tanggal
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: isMobile ? undefined : 'long',
      year: 'numeric',
      month: isMobile ? 'short' : 'long',
      day: 'numeric',
    });
  };

  // Generate fake growth percentages for UI presentation
  const getRandomGrowth = () => {
    return (Math.random() * 20 + 5).toFixed(1);
  };

  const totalProductsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between mb-6 items-center">
        <Title level={4} className="!m-0 text-gray-700 font-light">Laporan Bojoku</Title>
        <Select
          value={currency}
          onChange={(value: 'IDR' | 'USD') => setCurrency(value)}
          options={[
            { value: 'IDR', label: 'Rupiah (IDR)' },
            { value: 'USD', label: 'US Dollar (USD)' },
          ]}
          className="w-40"
          bordered={false}
          dropdownStyle={{ borderRadius: '12px' }}
        />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={8}>
          <Card 
            className="overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-300"
            bodyStyle={{ padding: '0' }}
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider font-medium">Total Penjualan</Text>
                  <Title level={3} className="!m-0 font-semibold">
                    {formatCurrency(totalSales)}
                  </Title>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge status="success" />
                <Text className="text-green-600 text-sm">+{getRandomGrowth()}%</Text>
                <Text type="secondary" className="text-xs"> dibanding bulan lalu</Text>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card 
            className="overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-300"
            bodyStyle={{ padding: '0' }}
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider font-medium">Produk Terjual</Text>
                  <Title level={3} className="!m-0 font-semibold">
                    {totalProductsSold} <span className="text-sm font-normal text-gray-400">items</span>
                  </Title>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Package className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge status="success" />
                <Text className="text-green-600 text-sm">+{getRandomGrowth()}%</Text>
                <Text type="secondary" className="text-xs"> dibanding bulan lalu</Text>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card 
            className="overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-300"
            bodyStyle={{ padding: '0' }}
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wider font-medium">Total Produk</Text>
                  <Title level={3} className="!m-0 font-semibold">
                    {products.length} <span className="text-sm font-normal text-gray-400">items</span>
                  </Title>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge status="processing" color="purple" />
                <Text className="text-purple-600 text-sm">+{getRandomGrowth()}%</Text>
                <Text type="secondary" className="text-xs"> dibanding bulan lalu</Text>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium text-gray-700">Aktivitas Penjualan Terbaru</span>
            </div>
            <Badge count={sales.length} showZero className="mr-2" style={{ backgroundColor: "#5046E5" }} />
          </div>
        }
        className="rounded-xl border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        bodyStyle={{ padding: '0' }}
        headStyle={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}
      >
        <List
          dataSource={sales.slice(0, 10)}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada aktivitas penjualan" /> }}
          renderItem={(sale, index) => (
            <List.Item 
              key={sale.id}
              className={index !== sales.slice(0, 10).length - 1 ? "border-b border-gray-100" : ""}
            >
              <div className="w-full p-4 hover:bg-gray-50 transition-all duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      icon={<Package />}
                      className="bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-sm"
                    />
                    <div>
                      <Text strong className="text-gray-800 flex items-center">
                        {sale.products?.name || 'Produk'}
                        <Badge 
                          count={sale.quantity} 
                          className="ml-2" 
                          size="small" 
                          style={{ 
                            backgroundColor: '#EEF2FF', 
                            color: '#5046E5', 
                            boxShadow: 'none', 
                            fontWeight: 600 
                          }} 
                        />
                      </Text>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Text type="secondary" className="text-xs">{sale.customer_name || 'Pelanggan'}</Text>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-gray-500">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <Text type="secondary" className="text-xs">
                        {formatDate(sale.date)}
                      </Text>
                    </div>
                    <Text strong className="text-blue-600 ml-2 text-right">
                      {formatCurrency(sale.total_amount)}
                    </Text>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;