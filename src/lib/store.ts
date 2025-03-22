import { create } from 'zustand';
import { supabase } from './supabase';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface ProductInfo {
  name: string;
  price: number;
}

interface Sale {
  id: string;
  date: string;
  customer_name: string | null;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  user_id?: string;
  products?: ProductInfo;
}

interface StoreState {
  products: Product[];
  sales: Sale[];
  totalSales: number;
  loading: boolean;
  error: string | null;
  userId: string | null;
  setUserId: (id: string | null) => void;
  fetchProducts: () => Promise<void>;
  fetchSales: () => Promise<void>;
  subscribeToProducts: () => (() => void) | void;
  subscribeToSales: () => (() => void) | void;
}

export const useStore = create<StoreState>((set, get) => ({
  products: [],
  sales: [],
  totalSales: 0,
  loading: false,
  error: null,
  userId: null,
  
  setUserId: (id: string | null) => set({ userId: id }),

  fetchProducts: async () => {
    const userId = get().userId;
    
    // Jika belum login, tidak perlu fetch
    if (!userId) {
      set({ products: [] });
      return;
    }
    
    try {
      set({ loading: true });
      
      // Query tanpa filter user_id (karena mungkin kolom belum dibuat)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ products: data || [] });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchSales: async () => {
    const userId = get().userId;
    
    // Jika belum login, tidak perlu fetch
    if (!userId) {
      set({ sales: [], totalSales: 0 });
      return;
    }
    
    try {
      set({ loading: true });
      
      // Query tanpa filter user_id (karena mungkin kolom belum dibuat)
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          products:product_id (name, price)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ 
        sales: data || [],
        totalSales: data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  subscribeToProducts: () => {
    const userId = get().userId;
    if (!userId) return;
    
    const products = supabase
      .channel('products_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          get().fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(products);
    };
  },

  subscribeToSales: () => {
    const userId = get().userId;
    if (!userId) return;
    
    const sales = supabase
      .channel('sales_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => {
          get().fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sales);
    };
  },
}));