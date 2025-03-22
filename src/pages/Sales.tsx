import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, DatePicker, Space, Tag, Modal, Form, Select, InputNumber, Input, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';
import { DeleteOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/format';
import { isBrowser } from '../utils/browser';

const { RangePicker } = DatePicker;

// Definisikan interface untuk data sale
interface ProductInfo {
  name: string;
  price: number;
}

interface Sale {
  id: string;
  date: string;
  customer_name: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  products?: ProductInfo;
  created_at: string;
  user_id?: string;
}

const Sales: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const { products, sales, loading, fetchProducts, fetchSales, subscribeToSales } = useStore();
  const [isBrowserEnv, setIsBrowserEnv] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{id: string, email?: string} | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  useEffect(() => {
    // Mendapatkan user session saat ini
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };

    getCurrentUser();
    fetchData();
    const unsubscribe = subscribeToSales();
    
    // Hanya set isBrowser di client-side untuk menghindari error di server
    if (isBrowser()) {
      setIsBrowserEnv(true);
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchData, subscribeToSales]);

  // Filter berdasarkan tanggal
  const salesByDate = dateRange[0] && dateRange[1]
    ? sales.filter(sale => {
        const saleDate = dayjs(sale.date);
        return saleDate.isAfter(dateRange[0]) && saleDate.isBefore(dateRange[1]);
      })
    : sales;
    
  // Filter berdasarkan teks pencarian
  const filteredSales = salesByDate.filter(sale =>
    (sale.customer_name?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    (sale.products && sale.products.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  interface SaleFormValues {
    product_id: string;
    quantity: number;
    date: string;
    customer_name: string;
    status: string;
  }

  const handleAddSale = async (values: SaleFormValues) => {
    setSubmitting(true);
    
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      
      if (!userId) {
        message.error('Anda harus login untuk melakukan operasi ini');
        return;
      }
      
      const { product_id, quantity, date, customer_name, status } = values;
      
      // Get product details
      const { data: productData } = await supabase
        .from('products')
        .select('price, stock')
        .eq('id', product_id)
        .single();
      
      if (!productData) {
        throw new Error('Produk tidak ditemukan');
      }
      
      const { price, stock } = productData;
      
      // Check if we have enough stock
      if (stock < quantity) {
        message.error(`Stok tidak cukup. Tersedia: ${stock}`);
        return;
      }
      
      // Calculate total amount
      const total_amount = price * quantity;
      
      // Create new sale - omit user_id if column doesn't exist in schema
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          date,
          customer_name,
          product_id,
          quantity,
          total_amount,
          status,
          created_at: new Date().toISOString()
        });
      
      if (saleError) throw saleError;
      
      // Update product stock
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: stock - quantity })
        .eq('id', product_id);
      
      if (stockError) throw stockError;
      
      message.success('Penjualan berhasil ditambahkan');
      form.resetFields();
      setIsModalVisible(false);
    } catch (error: unknown) {
      console.error('Error adding sale:', error);
      const err = error as { message?: string };
      message.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      message.error('Anda harus login untuk menghapus penjualan');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Get the sale data first
      const { data: saleData, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete the sale
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', saleData.product_id)
        .single();
        
      if (productError) throw productError;
      if (!product) throw new Error('Produk tidak ditemukan');
      
      // Update product stock (return items to inventory)
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock + saleData.quantity })
        .eq('id', saleData.product_id);
        
      if (stockError) throw stockError;
      
      message.success('Penjualan berhasil dihapus');
      fetchSales();
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || 'Terjadi kesalahan saat menghapus penjualan');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Tag color="success">Selesai</Tag>;
      case 'pending':
        return <Tag color="warning">Tertunda</Tag>;
      case 'cancelled':
        return <Tag color="error">Dibatalkan</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const isMobile = isBrowser() && window.innerWidth <= 768;

  const columns: ColumnsType<Sale> = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: Sale, b: Sale) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Pelanggan',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: isBrowserEnv && isMobile,
    },
    {
      title: 'Produk',
      dataIndex: 'products',
      key: 'product',
      render: (products: ProductInfo | undefined) => products?.name || '-',
      ellipsis: isBrowserEnv && isMobile,
    },
    {
      title: 'Kuantitas',
      dataIndex: 'quantity',
      key: 'quantity',
      responsive: ['md'],
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: unknown, record: Sale) => (
        <Popconfirm
          title="Yakin ingin menghapus penjualan ini?"
          onConfirm={() => handleDelete(record.id)}
          okText="Ya"
          cancelText="Tidak"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            size={isMobile ? 'small' : 'middle'}
            loading={isDeleting}
          >
            {!isMobile && 'Hapus'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <Space className="flex-wrap animate-slideInLeft mobile-full-width" style={{ width: '100%' }}>
            <RangePicker 
              className="w-full transition-all mobile-full-width" 
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              placeholder={['Tanggal Mulai', 'Tanggal Akhir']}
            />
            <Input
              placeholder="Cari pelanggan atau produk..."
              onChange={e => setSearchText(e.target.value)}
              className="mobile-full-width"
            />
          </Space>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 animate-slideInRight hover:bg-blue-700 transition-colors mobile-full-width"
            onClick={() => setIsModalVisible(true)}
          >
            Penjualan Baru
          </Button>
        </div>
        <div className="overflow-x-auto animate-slideUp">
          <Table
            columns={columns.map(col => ({
              ...col,
              ellipsis: isBrowserEnv && isMobile,
            }))}
            dataSource={filteredSales as readonly Sale[]}
            rowKey="id"
            loading={loading}
            className="min-w-full"
            pagination={{
              pageSize: isMobile ? 5 : 10,
              showSizeChanger: !isMobile,
              pageSizeOptions: isMobile ? ['5', '10'] : ['10', '20', '50'],
              showTotal: (total) => `Total ${total} penjualan`,
            }}
          />
        </div>
      </Card>

      <Modal
        title="Tambah Penjualan Baru"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        maskClosable={!submitting}
        destroyOnClose={true}
        closable={!submitting}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSale}
          disabled={submitting}
          preserve={false}
        >
          <Form.Item
            name="date"
            label="Tanggal"
            rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
            initialValue={dayjs()}
          >
            <DatePicker 
              className="w-full"
              format="DD-MM-YYYY"
            />
          </Form.Item>
          
          <Form.Item
            name="customer_name"
            label="Nama Pelanggan"
            rules={[{ required: true, message: 'Nama pelanggan wajib diisi' }]}
          >
            <Input placeholder="Masukkan nama pelanggan" />
          </Form.Item>
          
          <Form.Item
            name="product_id"
            label="Produk"
            rules={[{ required: true, message: 'Produk wajib dipilih' }]}
          >
            <Select 
              placeholder="Pilih produk"
              options={products.map(p => ({ 
                value: p.id, 
                label: `${p.name} (Stok: ${p.stock})`,
                disabled: p.stock <= 0
              }))}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          
          <Form.Item
            name="quantity"
            label="Jumlah"
            rules={[{ required: true, message: 'Jumlah wajib diisi' }]}
          >
            <InputNumber
              min={1}
              className="w-full"
              placeholder="Masukkan jumlah"
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Status wajib diisi' }]}
            initialValue="completed"
          >
            <Select
              options={[
                { value: 'completed', label: 'Selesai' },
                { value: 'pending', label: 'Tertunda' },
                { value: 'canceled', label: 'Dibatalkan' }
              ]}
            />
          </Form.Item>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Simpan
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Sales;