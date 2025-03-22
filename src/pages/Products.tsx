import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';

const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: number | string;
  stock: number | string;
}

// Fungsi parser kustom untuk InputNumber
const priceParser = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

const Products = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const { products, loading, fetchProducts, subscribeToProducts } = useStore();
  const [isBrowser, setIsBrowserState] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{id: string, email?: string} | null>(null);

  useEffect(() => {
    // Mendapatkan user session saat ini
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
      }
    };

    getCurrentUser();
    fetchProducts();
    const unsubscribe = subscribeToProducts();
    
    // Hanya set isBrowser di client-side untuk menghindari error di server
    if (typeof window !== 'undefined') {
      setIsBrowserState(true);
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchProducts, subscribeToProducts]);

  const handleAddEdit = async (values: Partial<Product>) => {
    setSubmitting(true);
    const { id, name, description, price, stock } = values;
    
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      
      if (!userId) {
        message.error('Anda harus login untuk melakukan operasi ini');
        setSubmitting(false);
        return;
      }
      
      if (id) {
        // Edit existing product
        const { error } = await supabase
          .from('products')
          .update({ 
            name, 
            description, 
            price, 
            stock, 
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (error) throw error;
        message.success('Produk berhasil diperbarui');
      } else {
        // Add new product - omit user_id if column doesn't exist in schema
        const { error } = await supabase
          .from('products')
          .insert({ 
            name, 
            description, 
            price, 
            stock, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
        message.success('Produk berhasil ditambahkan');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error adding/editing product:', error);
      message.error(error.message || 'Terjadi kesalahan saat menambah/mengedit produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) {
        message.error('Anda harus login untuk menghapus produk');
        return;
      }
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      message.success('Produk berhasil dihapus');
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || 'Terjadi kesalahan saat menghapus produk');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Nama Produk',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatCurrency(price),
      sorter: (a: Product, b: Product) => a.price - b.price,
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      render: (stock: number) => (
        <Tag color={stock > 10 ? 'green' : 'orange'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button 
            type="text" 
            icon={<Edit2 className="w-4 h-4" />}
            className="text-blue-600 hover:text-blue-800"
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Yakin ingin menghapus produk ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button 
              type="text" 
              icon={<Trash2 className="w-4 h-4" />}
              className="text-red-600 hover:text-red-800"
            >
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="animate-fadeIn">
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <Input
            placeholder="Cari produk..."
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs animate-slideInLeft mobile-full-width"
            style={{ width: '100%' }}
          />
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            className="bg-blue-600 animate-slideInRight hover:bg-blue-700 transition-colors mobile-full-width"
          >
            Tambah Produk
          </Button>
        </div>
        <div className="overflow-x-auto animate-slideUp">
          <Table
            columns={columns.map(col => ({
              ...col,
              ellipsis: isBrowser && window.innerWidth < 768,
            }))}
            dataSource={filteredProducts as Product[]}
            rowKey="id"
            loading={loading}
            className="min-w-full"
            scroll={{ x: true }}
            rowClassName={(_, index) => 
              index % 2 === 0 ? 'bg-gray-50 hover:bg-blue-50 transition-colors' : 'hover:bg-blue-50 transition-colors'
            }
            pagination={{
              responsive: true,
              showSizeChanger: true,
              defaultPageSize: isBrowser && window.innerWidth < 768 ? 5 : 10,
              pageSizeOptions: isBrowser && window.innerWidth < 768 ? ['5', '10', '20'] : ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} produk`,
              size: isBrowser && window.innerWidth < 768 ? 'small' : 'default'
            }}
          />
        </div>
      </Card>

      <Modal
        title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
        maskClosable={!submitting}
        destroyOnClose={true}
        closable={!submitting}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEdit}
          disabled={submitting}
          preserve={false}
        >
          {editingId && (
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>
          )}
          
          <Form.Item
            name="name"
            label="Nama Produk"
            rules={[{ required: true, message: 'Nama produk wajib diisi' }]}
          >
            <Input placeholder="Masukkan nama produk" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Deskripsi"
          >
            <TextArea 
              placeholder="Masukkan deskripsi produk"
              rows={isBrowser && window.innerWidth < 768 ? 3 : 4} 
            />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Harga"
            rules={[{ required: true, message: 'Harga produk wajib diisi' }]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={priceParser}
              placeholder="Masukkan harga produk"
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="stock"
            label="Stok"
            rules={[{ required: true, message: 'Stok produk wajib diisi' }]}
          >
            <InputNumber 
              className="w-full"
              placeholder="Masukkan jumlah stok"
              min={0}
            />
          </Form.Item>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setEditingId(null);
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
              {editingId ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;