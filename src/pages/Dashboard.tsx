import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Button, Segmented } from 'antd';
import { Area, Pie } from '@ant-design/charts';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { isBrowser, isMobileView } from '../utils/browser';

const Dashboard = () => {
  const [visibleSection, setVisibleSection] = useState<'activity'|'charts'>('charts');
  const [isMobile, setIsMobile] = useState(false);

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

  // Data untuk grafik penjualan
  const salesData = sales.map(sale => ({
    date: new Date(sale.date).toLocaleDateString('id-ID'),
    penjualan: sale.total_amount,
  }));

  // Data untuk grafik produk terlaris
  const topProducts = products
    .slice(0, 5)
    .map(product => ({
      name: product.name,
      value: product.stock,
    }));

  const areaConfig = {
    data: salesData,
    xField: 'date',
    yField: 'penjualan',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#3b82f680 1:#3b82f6',
    },
    line: {
      color: '#3b82f6',
    },
  };

  const pieConfig = {
    data: topProducts,
    angleField: 'value',
    colorField: 'name',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} lg={8}>
          <Card className="hover-scale transition-all duration-300 transform hover:shadow-lg mobile-p-2">
            <Statistic
              title={<span className="mobile-text-xs">Total Penjualan</span>}
              value={totalSales}
              prefix={<DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600 animate-pulse" />}
              className="animate-slideInLeft"
              formatter={(value) => 
                new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value as number)
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={8}>
          <Card className="hover-scale transition-all duration-300 transform hover:shadow-lg mobile-p-2">
            <Statistic
              title={<span className="mobile-text-xs">Produk Terjual</span>}
              value={sales.length}
              prefix={<Package className="w-4 h-4 md:w-5 md:h-5 text-green-600 animate-pulse" />}
              className="animate-slideInLeft delay-100"
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card className="hover-scale transition-all duration-300 transform hover:shadow-lg mobile-p-2">
            <Statistic
              title={<span className="mobile-text-xs">Total Produk</span>}
              value={products.length}
              prefix={<ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-purple-600 animate-pulse" />}
              className="animate-slideInLeft delay-200"
            />
          </Card>
        </Col>
      </Row>

      {isMobile && (
        <div className="flex justify-center">
          <Segmented
            options={[
              { label: 'Grafik', value: 'charts' },
              { label: 'Aktivitas', value: 'activity' }
            ]}
            value={visibleSection}
            onChange={(value) => setVisibleSection(value as 'charts'|'activity')}
            className="mb-4"
          />
        </div>
      )}

      <div className={`${isMobile && visibleSection !== 'charts' ? 'hidden' : 'block'}`}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card 
              title={<span className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-blue-600" /> <span className="mobile-text-xs md:text-base">Grafik Penjualan</span></span>} 
              className="animate-slideUp delay-400 hover:shadow-lg transition-all duration-300 scroll-reveal"
            >
              {salesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Area {...areaConfig} height={isMobile ? 200 : 300} />
                </div>
              ) : (
                <Empty description="Belum ada data penjualan" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title={<span className="flex items-center"><Package className="w-4 h-4 mr-2 text-purple-600" /> <span className="mobile-text-xs md:text-base">Produk Terlaris</span></span>} 
              className="animate-slideUp delay-500 hover:shadow-lg transition-all duration-300 scroll-reveal"
            >
              {topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Pie {...pieConfig} height={isMobile ? 200 : 300} />
                </div>
              ) : (
                <Empty description="Belum ada data produk" />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <div className={`${isMobile && visibleSection !== 'activity' ? 'hidden' : 'block'}`}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              title={<span className="flex items-center"><Users className="w-4 h-4 mr-2 text-green-600" /> <span className="mobile-text-xs md:text-base">Aktivitas Terbaru</span></span>} 
              className="animate-slideUp delay-600 hover:shadow-lg transition-all duration-300 scroll-reveal"
            >
              <div className="space-y-4">
                {sales.slice(0, 5).map((sale, index) => (
                  <div 
                    key={sale.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all animate-slideInRight`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="p-1 md:p-2 bg-blue-100 rounded-full animate-pulse">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">Penjualan Baru</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {new Date(sale.date).toLocaleDateString('id-ID', {
                            weekday: isMobile ? undefined : 'long',
                            year: 'numeric',
                            month: isMobile ? 'short' : 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 md:mt-0">
                      <p className="font-semibold text-blue-600 text-sm md:text-base">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(sale.total_amount)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-2 md:hidden" />
                    </div>
                  </div>
                ))}
                
                {sales.length === 0 && (
                  <Empty description="Belum ada aktivitas penjualan" />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;