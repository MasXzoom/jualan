import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and/or Anon Key is missing. Check your environment variables.');
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