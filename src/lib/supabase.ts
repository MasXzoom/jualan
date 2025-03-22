import { createClient } from '@supabase/supabase-js';

// Cek environment variables yang tersedia
console.log('Environment variables available:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'defined' : 'undefined',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'defined' : 'undefined'
});

// Gunakan fallback dari vercel.json jika environment variables tidak tersedia
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hxjxyuftzkikeslrgmed.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4anh5dWZ0emtpa2VzbHJnbWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2MTE0ODQsImV4cCI6MjA1ODE4NzQ4NH0.s8VoerotQ8cVLHV5reO1wKg66ODQA-z120EvW3Po7fI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or Anon Key is missing. Check your environment variables.');
} else {
  console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 15) + '...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for Supabase
export type Tables = {
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    created_at: string;
    updated_at: string;
  };
  sales: {
    id: string;
    date: string;
    customer_name: string | null;
    product_id: string;
    quantity: number;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    products?: {
      name: string;
      price: number;
    };
  };
};