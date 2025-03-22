import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, DatePicker, Select, Space, Tooltip, message, Typography, Empty, List, Tag } from 'antd';
import { FileText, Download, Clock, User, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../lib/store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Define types for report data
type ReportDataItem = Record<string, string | number | null>;

const Reports = () => {
  const [isBrowser, setIsBrowser] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { sales, products, loading } = useStore();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');

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

  // Konversi mata uang
  const convertCurrency = (amount: number): number => {
    if (currency === 'USD') {
      // Anggap rate IDR ke USD adalah 1 USD = 15,000 IDR
      return amount / 15000;
    }
    return amount;
  };

  // Format mata uang
  const formatCurrencyWithType = (amount: number): string => {
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(convertCurrency(amount));
  };

  // Filter data berdasarkan tanggal jika ada filter tanggal
  const filteredSales = dateRange[0] && dateRange[1]
    ? sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const startDate = dateRange[0]?.toDate();
        const endDate = dateRange[1]?.toDate();
        return startDate && endDate ? saleDate >= startDate && saleDate <= endDate : false;
      })
    : sales;

  // Mendapatkan data untuk laporan
  const getReportData = (): ReportDataItem[] => {
    switch (reportType) {
      case 'sales':
        return filteredSales.map(sale => ({
          'id': sale.id,
          'Tanggal': new Date(sale.date).toLocaleDateString('id-ID'),
          'Pelanggan': sale.customer_name,
          'Produk': sale.products?.name || '-',
          'Jumlah': sale.quantity,
          'Total': formatCurrencyWithType(sale.total_amount),
          'Status': sale.status,
          'raw_total': sale.total_amount
        }));
      case 'inventory':
        return products.map(product => ({
          'id': product.id,
          'Nama Produk': product.name,
          'Deskripsi': product.description || '-',
          'Harga': formatCurrencyWithType(product.price),
          'Stok': product.stock,
          'raw_price': product.price
        }));
      case 'revenue': {
        // Agregasi penjualan per hari
        const aggregated: Record<string, number> = {};
        filteredSales.forEach(sale => {
          const date = new Date(sale.date).toLocaleDateString('id-ID');
          aggregated[date] = (aggregated[date] || 0) + sale.total_amount;
        });
        return Object.keys(aggregated).map((date, index) => ({
          'id': index,
          'Tanggal': date,
          'Pendapatan': formatCurrencyWithType(aggregated[date]),
          'raw_amount': aggregated[date]
        }));
      }
      default:
        return [];
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const data = getReportData().map(item => {
        // Create a new object without the raw values
        const exportItem: Record<string, string | number | null> = {};
        Object.entries(item).forEach(([key, value]) => {
          if (!['id', 'raw_total', 'raw_price', 'raw_amount'].includes(key)) {
            exportItem[key] = value;
          }
        });
        return exportItem;
      });
      
      if (data.length === 0) {
        message.warning('Tidak ada data untuk diekspor');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      
      // Generate filename
      const reportTypeNames = {
        'sales': 'Penjualan',
        'inventory': 'Inventaris',
        'revenue': 'Pendapatan'
      };
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Laporan_${reportTypeNames[reportType as keyof typeof reportTypeNames]}_${timestamp}.xlsx`;
      
      // Trigger download
      XLSX.writeFile(workbook, filename);
      message.success('Berhasil mengunduh laporan Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Gagal mengunduh laporan Excel');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const data = getReportData().map(item => {
        // Create a new object without the raw values
        const exportItem: Record<string, string | number | null> = {};
        Object.entries(item).forEach(([key, value]) => {
          if (!['id', 'raw_total', 'raw_price', 'raw_amount'].includes(key)) {
            exportItem[key] = value;
          }
        });
        return exportItem;
      });
      
      if (data.length === 0) {
        message.warning('Tidak ada data untuk diekspor');
        return;
      }

      const doc = new jsPDF();

      // Add title
      const reportTypeNames = {
        'sales': 'Penjualan',
        'inventory': 'Inventaris',
        'revenue': 'Pendapatan'
      };
      const title = `Laporan ${reportTypeNames[reportType as keyof typeof reportTypeNames]}`;
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      
      // Add date
      doc.setFontSize(11);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);
      
      // Create table
      const columns = Object.keys(data[0]).map(key => ({ header: key, dataKey: key }));
      
      autoTable(doc, {
        startY: 35,
        head: [columns.map(c => c.header)],
        body: data.map(item => 
          columns.map(c => String(item[c.dataKey as keyof typeof item] || ''))
        ),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Laporan_${reportTypeNames[reportType as keyof typeof reportTypeNames]}_${timestamp}.pdf`;
      
      // Save PDF
      doc.save(filename);
      message.success('Berhasil mengunduh laporan PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      message.error('Gagal mengunduh laporan PDF');
    }
  };

  // Render sales report as cards
  const renderSalesReport = () => {
    const data = getReportData();
    
    if (data.length === 0) {
      return <Empty description="Tidak ada data penjualan" />;
    }
    
    return (
      <List
        grid={{ 
          gutter: 16, 
          xs: 1, 
          sm: 1, 
          md: 2, 
          lg: 3, 
          xl: 3, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: 6,
          responsive: true,
          showSizeChanger: !isMobile,
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <Text className="text-gray-700">{item['Tanggal']}</Text>
                  </div>
                  <Tag color={item['Status'] === 'Completed' ? 'green' : 'blue'}>
                    {item['Status'] || 'Diproses'}
                  </Tag>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <Text strong>{item['Pelanggan']}</Text>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <Text>{item['Produk']}</Text>
                  <Tag color="blue">{item['Jumlah']} item</Tag>
                </div>
                
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Total</Text>
                    <Text strong className="text-lg text-blue-600">{item['Total']}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Render inventory report as cards
  const renderInventoryReport = () => {
    const data = getReportData();
    
    if (data.length === 0) {
      return <Empty description="Tidak ada data inventaris" />;
    }
    
    return (
      <List
        grid={{ 
          gutter: 16, 
          xs: 1, 
          sm: 1, 
          md: 2, 
          lg: 3, 
          xl: 3, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: 8,
          responsive: true,
          showSizeChanger: !isMobile,
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <Text strong>{item['Nama Produk']}</Text>
                </div>
                
                <Text type="secondary" ellipsis={{ tooltip: item['Deskripsi'] }}>
                  {item['Deskripsi']}
                </Text>
                
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Text strong>{item['Harga']}</Text>
                    <Tag 
                      color={(item['Stok'] as number) > 10 ? 'green' : (item['Stok'] as number) > 5 ? 'orange' : 'red'}
                    >
                      Stok: {item['Stok']}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Render revenue report as cards
  const renderRevenueReport = () => {
    const data = getReportData();
    
    if (data.length === 0) {
      return <Empty description="Tidak ada data pendapatan" />;
    }
    
    return (
      <List
        grid={{ 
          gutter: 16, 
          xs: 1, 
          sm: 1, 
          md: 2, 
          lg: 2, 
          xl: 3, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: 6,
          responsive: true,
          showSizeChanger: !isMobile,
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <Text className="text-gray-700">{item['Tanggal']}</Text>
                </div>
                
                <div className="mt-2 pt-2">
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Pendapatan</Text>
                    <Text strong className="text-lg text-green-600">{item['Pendapatan']}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // Render the correct report type
  const renderReportContent = () => {
    switch (reportType) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'revenue':
        return renderRevenueReport();
      default:
        return <Empty description="Pilih jenis laporan" />;
    }
  };

  const isMobile = isBrowser && windowWidth < 640;

  return (
    <div className="animate-fadeIn">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Title level={4} className="mb-0">Laporan Bisnis</Title>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Space className="flex-wrap animate-slideInLeft mobile-full-width" style={{ width: '100%' }}>
                <DatePicker.RangePicker 
                  className="w-full transition-colors hover:border-blue-400 mobile-full-width" 
                  placeholder={['Tanggal Mulai', 'Tanggal Akhir']}
                  onChange={(dates) => {
                    if (dates) {
                      setDateRange([dates[0] || null, dates[1] || null]);
                    } else {
                      setDateRange([null, null]);
                    }
                  }}
                />
                <Select
                  defaultValue="sales"
                  className="w-full sm:w-40 transition-colors hover:border-blue-400 mobile-full-width"
                  options={[
                    { value: 'sales', label: 'Laporan Penjualan' },
                    { value: 'inventory', label: 'Laporan Inventaris' },
                    { value: 'revenue', label: 'Laporan Pendapatan' },
                  ]}
                  onChange={(value) => setReportType(value)}
                />
                <Select
                  value={currency}
                  onChange={(value: 'IDR' | 'USD') => setCurrency(value)}
                  options={[
                    { value: 'IDR', label: 'Rupiah (IDR)' },
                    { value: 'USD', label: 'US Dollar (USD)' },
                  ]}
                  className="w-full sm:w-40 transition-colors hover:border-blue-400 mobile-full-width"
                />
              </Space>
              <Space className="animate-slideInRight mobile-full-width" wrap>
                <Tooltip title="Download dalam format Excel">
                  <Button
                    type="primary"
                    icon={<Download className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={exportToExcel}
                    disabled={loading || sales.length === 0}
                  >
                    Ekspor Excel
                  </Button>
                </Tooltip>
                <Tooltip title="Download dalam format PDF">
                  <Button
                    icon={<FileText className="w-4 h-4" />}
                    className="hover:bg-gray-100 transition-colors"
                    onClick={exportToPDF}
                    disabled={loading || sales.length === 0}
                  >
                    Ekspor PDF
                  </Button>
                </Tooltip>
              </Space>
            </div>

            <div className="animate-slideUp">
              {renderReportContent()}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;