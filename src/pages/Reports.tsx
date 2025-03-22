import React, { useState, useEffect } from 'react';
import { Card, Button, DatePicker, Select, Space, Tooltip, message, Typography, Empty, List, Tag } from 'antd';
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
        const saleDate = dayjs(sale.date);
        return dateRange[0] && dateRange[1] ? 
          saleDate.isAfter(dateRange[0]) && saleDate.isBefore(dateRange[1].add(1, 'day')) : 
          false;
      })
    : sales;

  // Mendapatkan data untuk laporan
  const getReportData = (): ReportDataItem[] => {
    switch (reportType) {
      case 'sales':
        return filteredSales.map(sale => ({
          'id': sale.id,
          'Tanggal': dayjs(sale.date).format('DD/MM/YYYY'),
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
          const date = dayjs(sale.date).format('DD/MM/YYYY');
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
      doc.text(`Tanggal: ${dayjs().format('DD/MM/YYYY')}`, 14, 30);
      
      // Create table
      const columns = Object.keys(data[0]).map(key => ({ header: key, dataKey: key }));
      
      // Filter info if date range is applied
      if (dateRange[0] && dateRange[1]) {
        doc.setFontSize(10);
        doc.text(`Periode: ${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`, 14, 38);
        // Adjust starting Y position
        autoTable(doc, {
          startY: 43,
          head: [columns.map(c => c.header)],
          body: data.map(item => 
            columns.map(c => String(item[c.dataKey as keyof typeof item] || ''))
          ),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
      } else {
        autoTable(doc, {
          startY: 35,
          head: [columns.map(c => c.header)],
          body: data.map(item => 
            columns.map(c => String(item[c.dataKey as keyof typeof item] || ''))
          ),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

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
          sm: 2, 
          md: 2, 
          lg: 3, 
          xl: 4, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: isMobile ? 4 : 8,
          responsive: true,
          showSizeChanger: !isMobile,
          size: isMobile ? 'small' : 'default'
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
              style={{ 
                height: 'auto',
                maxHeight: '240px'
              }}
              bodyStyle={{
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="flex flex-col gap-2 h-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <Text className="text-gray-700 text-xs">{item['Tanggal']}</Text>
                  </div>
                  <Tag color={item['Status'] === 'Completed' ? 'green' : 'blue'} className="text-xs px-1 py-0">
                    {item['Status'] || 'Diproses'}
                  </Tag>
                </div>
                
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" />
                  <Text strong className="text-xs truncate">{item['Pelanggan']}</Text>
                </div>
                
                <div className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-blue-600" />
                  <Text className="text-xs truncate">{item['Produk']}</Text>
                  <Tag color="blue" className="text-xs px-1 py-0">{item['Jumlah']} item</Tag>
                </div>
                
                <div className="mt-auto pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">Total</Text>
                    <Text strong className="text-base text-blue-600">{item['Total']}</Text>
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
          sm: 2, 
          md: 2, 
          lg: 3, 
          xl: 4, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: isMobile ? 4 : 8,
          responsive: true,
          showSizeChanger: !isMobile,
          size: isMobile ? 'small' : 'default'
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
              style={{ 
                height: 'auto',
                maxHeight: '240px'
              }}
              bodyStyle={{
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="flex flex-col gap-2 h-full">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-green-600" />
                  <Text strong className="text-xs truncate">{item['Nama Produk']}</Text>
                </div>
                
                <Text type="secondary" ellipsis={{ tooltip: item['Deskripsi'] }} className="text-xs truncate">
                  {item['Deskripsi']}
                </Text>
                
                <div className="mt-auto pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">Harga</Text>
                    <Text strong className="text-base text-green-600">{item['Harga']}</Text>
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
          sm: 2, 
          md: 2, 
          lg: 3, 
          xl: 4, 
          xxl: 4 
        }}
        dataSource={data}
        pagination={{
          pageSize: isMobile ? 4 : 8,
          responsive: true,
          showSizeChanger: !isMobile,
          size: isMobile ? 'small' : 'default'
        }}
        renderItem={(item) => (
          <List.Item>
            <Card 
              className="hover:shadow-lg transition-all duration-300"
              hoverable
              style={{ 
                height: 'auto',
                maxHeight: '240px'
              }}
              bodyStyle={{
                padding: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="flex flex-col gap-2 h-full">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <Text className="text-gray-700 text-xs">{item['Tanggal']}</Text>
                </div>
                
                <div className="mt-auto pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">Pendapatan</Text>
                    <Text strong className="text-base text-green-600">{item['Pendapatan']}</Text>
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

  // Add new dateRangePicker component
  const renderDateRangePicker = () => {
    return (
      <Card className="mb-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={5} className="m-0">Filter Periode Laporan</Title>
            <Text type="secondary">Pilih rentang tanggal untuk melihat laporan</Text>
          </div>
          <Space direction="vertical" size="middle" className="w-full md:w-auto max-w-full">
            <DatePicker.RangePicker 
              value={dateRange} 
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0], dates[1]]);
                } else {
                  setDateRange([null, null]);
                }
              }}
              format="DD/MM/YYYY"
              placeholder={['Tanggal Awal', 'Tanggal Akhir']}
              allowClear
              className="w-full"
              style={{ width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'auto' : '320px' }}
              size={isMobile ? 'middle' : 'large'}
              popupClassName="date-range-popup"
              separator={isMobile ? "→" : "-"}
              inputReadOnly={isMobile} // Mencegah keyboard mobile muncul, pengguna hanya menggunakan date picker
            />
            {dateRange[0] && dateRange[1] && (
              <div className={`${isMobile ? 'text-center' : 'text-right'}`}>
                <Text type="secondary" className="block mb-1">
                  Menampilkan laporan periode:
                </Text>
                <Tag color="blue" className="px-2 py-1">
                  {dateRange[0].format('DD/MM/YYYY')} - {dateRange[1].format('DD/MM/YYYY')}
                </Tag>
              </div>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  // Render main content
  return (
    <div className="animate-fadeIn pb-10">
      <div className="mb-4">
        <Card 
          className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
          title={
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Laporan</span>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <Title level={5} className="m-0">Jenis Laporan</Title>
              <Text type="secondary">Pilih jenis laporan yang ingin Anda lihat</Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <Space>
                <Select
                  value={reportType}
                  onChange={setReportType}
                  style={{ minWidth: 180 }}
                  options={[
                    { value: 'sales', label: 'Penjualan' },
                    { value: 'inventory', label: 'Inventaris' },
                    { value: 'revenue', label: 'Pendapatan' },
                  ]}
                />
                <Select
                  value={currency}
                  onChange={setCurrency}
                  style={{ minWidth: 100 }}
                  options={[
                    { value: 'IDR', label: 'IDR' },
                    { value: 'USD', label: 'USD' },
                  ]}
                />
              </Space>
              <Space>
                <Tooltip title="Download Excel">
                  <Button
                    type="primary"
                    ghost
                    icon={<Download className="w-4 h-4" />}
                    onClick={exportToExcel}
                    loading={loading}
                  >
                    Excel
                  </Button>
                </Tooltip>
                <Tooltip title="Download PDF">
                  <Button
                    danger
                    type="primary"
                    ghost
                    icon={<FileText className="w-4 h-4" />}
                    onClick={exportToPDF}
                    loading={loading}
                  >
                    PDF
                  </Button>
                </Tooltip>
              </Space>
            </div>
          </div>
        </Card>
      </div>

      {/* Tampilkan Date Range Picker */}
      {renderDateRangePicker()}

      {/* Render report content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;