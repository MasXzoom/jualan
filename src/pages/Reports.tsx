import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, DatePicker, Select, Space, Tabs, Tooltip } from 'antd';
import { FileText, Download, BarChart2, PieChart, LineChart } from 'lucide-react';
import { Line } from '@ant-design/charts';

const { TabPane } = Tabs;

const Reports = () => {
  const [isBrowser, setIsBrowser] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set isBrowser ke true saat komponen di-mount di browser
    setIsBrowser(typeof window !== 'undefined');
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      // Tambahkan event listener untuk resize
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Data sampel untuk grafik garis
  const data = Array.from({ length: 30 }, (_, i) => ({
    date: `2024-03-${String(i + 1).padStart(2, '0')}`,
    value: Math.floor(Math.random() * 1000) + 500,
    category: 'Penjualan',
  }));

  const lineConfig = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const isMobile = isBrowser && windowWidth < 640;

  return (
    <div className="animate-fadeIn">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Space className="flex-wrap animate-slideInLeft mobile-full-width" style={{ width: '100%' }}>
                <DatePicker.RangePicker 
                  className="w-full transition-colors hover:border-blue-400 mobile-full-width" 
                  placeholder={['Tanggal Mulai', 'Tanggal Akhir']} 
                />
                <Select
                  defaultValue="sales"
                  className="w-full sm:w-40 transition-colors hover:border-blue-400 mobile-full-width"
                  options={[
                    { value: 'sales', label: 'Laporan Penjualan' },
                    { value: 'inventory', label: 'Laporan Inventaris' },
                    { value: 'revenue', label: 'Laporan Pendapatan' },
                  ]}
                />
              </Space>
              <Space className="animate-slideInRight mobile-full-width" wrap>
                <Tooltip title="Download dalam format Excel">
                  <Button
                    type="primary"
                    icon={<Download className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Ekspor Excel
                  </Button>
                </Tooltip>
                <Tooltip title="Download dalam format PDF">
                  <Button
                    icon={<FileText className="w-4 h-4" />}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    Ekspor PDF
                  </Button>
                </Tooltip>
              </Space>
            </div>

            <Tabs 
              defaultActiveKey="1"
              className="animate-slideUp"
              size={isMobile ? "small" : "middle"}
            >
              <TabPane 
                tab={
                  <span className="flex items-center">
                    <LineChart className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Grafik Garis</span>
                  </span>
                } 
                key="1"
              >
                <div className="animate-slideUp overflow-x-auto">
                  <Line {...lineConfig} height={isMobile ? 300 : 400} />
                </div>
              </TabPane>
              <TabPane 
                tab={
                  <span className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Grafik Batang</span>
                  </span>
                } 
                key="2"
              >
                <div className="animate-slideUp overflow-x-auto">
                  <Line {...lineConfig} height={isMobile ? 300 : 400} />
                </div>
              </TabPane>
              <TabPane 
                tab={
                  <span className="flex items-center">
                    <PieChart className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Grafik Lingkaran</span>
                  </span>
                } 
                key="3"
              >
                <div className="animate-slideUp overflow-x-auto">
                  <Line {...lineConfig} height={isMobile ? 300 : 400} />
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;