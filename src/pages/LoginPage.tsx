import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert, Checkbox } from 'antd';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import logoSvg from '../assets/logo.svg';

const { Title, Text } = Typography;

console.log('LoginPage module loaded');

interface AuthError {
  message: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const setUserId = useStore(state => state.setUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const userId = useStore(state => state.userId);
  const [supabaseReady, setSupabaseReady] = useState(false);

  console.log('LoginPage rendering, userId:', userId ? 'exists' : 'none');

  // Cek apakah Supabase sudah siap
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        console.log('Checking Supabase connection...');
        // Minimal test call ke Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase connection test failed:', error);
          setError('Tidak dapat terhubung ke layanan autentikasi. Silakan coba lagi nanti.');
        } else {
          console.log('Supabase connection test successful:', data ? 'Session data received' : 'No active session');
          setSupabaseReady(true);
        }
      } catch (err) {
        console.error('Error checking Supabase:', err);
        setError('Kesalahan terjadi saat menyiapkan layanan autentikasi.');
      }
    };
    
    checkSupabase();
  }, []);

  // Jika pengguna sudah login, redirect ke dashboard
  useEffect(() => {
    console.log('LoginPage useEffect, checking userId:', userId);
    if (userId) {
      console.log('User is already logged in, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [userId, navigate]);

  const handleEmailLogin = async (values: { email: string; password: string; remember?: boolean }) => {
    try {
      console.log('Attempting login with email:', values.email);
      setLoading(true);
      setError(null);

      if (!supabaseReady) {
        console.error('Supabase not ready yet');
        throw new Error('Layanan autentikasi belum siap. Silakan coba lagi.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error('Login error:', error.message);
        throw error;
      }

      console.log('Login successful, user:', data.user?.email);
      message.success('Login berhasil!');
      setUserId(data.user?.id || null);
      navigate('/', { replace: true });
    } catch (err) {
      const authError = err as AuthError;
      console.error('Login failed:', authError.message);
      setError(authError.message || 'Login gagal. Silakan coba lagi.');
      message.error('Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { email: string; password: string }) => {
    try {
      console.log('Attempting registration with email:', values.email);
      setLoading(true);
      setError(null);

      if (!supabaseReady) {
        console.error('Supabase not ready yet');
        throw new Error('Layanan autentikasi belum siap. Silakan coba lagi.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error('Registration error:', error.message);
        throw error;
      }

      console.log('Registration successful, user:', data.user?.email);
      message.success('Pendaftaran berhasil! Silahkan login.');
      setMode('login');
    } catch (err) {
      const authError = err as AuthError;
      console.error('Registration failed:', authError.message);
      setError(authError.message || 'Pendaftaran gagal. Silakan coba lagi.');
      message.error('Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !supabaseReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <img src={logoSvg} alt="IPUR CUYUNK" className="w-16 h-16 mb-4" />
        <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden border-t-4 border-t-red-600">
          <div className="text-center">
            <Title level={4} className="text-red-600">Gagal Terhubung</Title>
            <Text className="block mb-4">{error}</Text>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden border-t-4 border-t-blue-600">
        <div className="flex flex-col items-center mb-6">
          <img src={logoSvg} alt="IPUR CUYUNK" className="w-16 h-16 mb-2" />
          <Title level={3} className="text-center !mb-1">
            {mode === 'login' ? 'Login' : 'Daftar'}
          </Title>
          <Text type="secondary" className="text-center">
            {mode === 'login' ? 'Masuk ke aplikasi untuk melanjutkan' : 'Buat akun baru untuk menggunakan aplikasi'}
          </Text>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-4"
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={mode === 'login' ? handleEmailLogin : handleRegister}
          className="mt-4"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Silakan masukkan email Anda' },
              { type: 'email', message: 'Email tidak valid' }
            ]}
          >
            <Input 
              prefix={<Mail className="mr-2 text-gray-400" size={18} />} 
              placeholder="Email" 
              size="large"
              disabled={loading || !supabaseReady}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Silakan masukkan password' },
              { min: 6, message: 'Password minimal 6 karakter' }
            ]}
          >
            <Input.Password 
              prefix={<Lock className="mr-2 text-gray-400" size={18} />} 
              placeholder="Password" 
              size="large"
              disabled={loading || !supabaseReady}
            />
          </Form.Item>

          {mode === 'login' && (
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox disabled={loading || !supabaseReady}>Ingat saya</Checkbox>
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              icon={<LogIn className="w-5 h-5" />}
              loading={loading || !supabaseReady}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (mode === 'login' ? 'Sedang Login...' : 'Mendaftar...') : (mode === 'login' ? 'Masuk' : 'Daftar')}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          {mode === 'login' ? (
            <Text>
              Belum punya akun?{' '}
              <Button 
                type="link" 
                className="p-0" 
                onClick={() => setMode('register')}
                disabled={loading || !supabaseReady}
              >
                Daftar disini
              </Button>
            </Text>
          ) : (
            <Text>
              Sudah punya akun?{' '}
              <Button 
                type="link" 
                className="p-0" 
                onClick={() => setMode('login')}
                disabled={loading || !supabaseReady}
              >
                Login
              </Button>
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage; 