import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Spin, Alert, Checkbox } from 'antd';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';

const { Title, Text } = Typography;

interface AuthError {
  message: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const setUserId = useStore(state => state.setUserId);
  
  useEffect(() => {
    // Cek apakah user sudah login
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        navigate('/');
      }
    };
    
    // Periksa local storage untuk kredensi yang disimpan
    const checkSavedCredentials = () => {
      const savedEmail = localStorage.getItem('savedEmail');
      const savedPassword = localStorage.getItem('savedPassword');
      
      if (savedEmail && savedPassword) {
        form.setFieldsValue({
          email: savedEmail,
          password: savedPassword,
          remember: true
        });
      }
    };
    
    checkUser();
    checkSavedCredentials();
  }, [navigate, setUserId, form]);
  
  const handleLogin = async (values: { email: string; password: string; remember?: boolean }) => {
    setLoading(true);
    setLoginError(null);
    
    try {
      // Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      if (data.user) {
        // Simpan kredensi jika remember dicentang
        if (values.remember) {
          localStorage.setItem('savedEmail', values.email);
          localStorage.setItem('savedPassword', values.password);
        } else {
          localStorage.removeItem('savedEmail');
          localStorage.removeItem('savedPassword');
        }
        
        setUserId(data.user.id);
        message.success('Login berhasil!');
        navigate('/');
      }
    } catch (error: unknown) {
      const err = error as AuthError;
      setLoginError(err.message || 'Terjadi kesalahan');
      message.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-blue-100 p-4">
      <Card 
        className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn"
        bordered={false}
      >
        <div className="text-center mb-8">
          <Title level={2} className="text-blue-600 mb-2">IPUR CUYUNK</Title>
          <Text className="text-gray-500">Login ke akun Anda</Text>
        </div>
        
        {loginError && (
          <Alert
            message="Login Gagal"
            description={loginError}
            type="error"
            showIcon
            closable
            className="mb-4"
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email wajib diisi' },
              { type: 'email', message: 'Format email tidak valid' }
            ]}
          >
            <Input 
              prefix={<Mail className="w-4 h-4 text-gray-400" />}
              placeholder="Email"
              size="large"
              disabled={loading}
              className="rounded-md py-2"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Password wajib diisi' },
              { min: 6, message: 'Password minimal 6 karakter' }
            ]}
          >
            <Input.Password 
              prefix={<Lock className="w-4 h-4 text-gray-400" />}
              placeholder="Password"
              size="large"
              disabled={loading}
              className="rounded-md py-2"
            />
          </Form.Item>
          
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox disabled={loading}>Simpan akun saya</Checkbox>
          </Form.Item>
          
          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<LogIn className="w-4 h-4" />}
              className="h-12 bg-blue-600 hover:bg-blue-700 rounded-md"
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        
        {loading && (
          <div className="flex justify-center mt-4">
            <Spin tip="Memproses..." />
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginPage; 