import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

console.log('Initializing store...');

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

export interface Sale {
  id: string;
  date: string;
  customer_name: string | null;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  user_id?: string;
  products?: {
    name: string;
    price: number;
  };
}

// Tipe untuk notifikasi
type NotificationType = 'success' | 'error' | 'info' | 'warning';
type NotificationFunction = (
  type: NotificationType, 
  message: string, 
  description?: string, 
  duration?: number
) => void;

interface StoreState {
  products: Product[];
  sales: Sale[];
  totalSales: number;
  loading: boolean;
  error: string | null;
  userId: string | null;
  notifications: {type: NotificationType, message: string, description?: string}[];
  addNotification: (notifyFn: NotificationFunction) => void;
  setUserId: (id: string | null) => void;
  fetchProducts: () => Promise<void>;
  fetchSales: () => Promise<void>;
  subscribeToProducts: () => (() => void) | void;
  subscribeToSales: () => (() => void) | void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      sales: [],
      totalSales: 0,
      loading: false,
      error: null,
      userId: null,
      notifications: [],
      
      // Fungsi untuk menambahkan notifikasi
      addNotification: function(notifyFn: NotificationFunction) {
        console.log('Initializing notification function');
        const originalNotify = notifyFn;
        
        // Simpan referensi ke fungsi notifikasi asli
        const notificationFunction: NotificationFunction = (type, message, description, duration) => {
          console.log(`Adding notification: ${type} - ${message}`);
          originalNotify(type, message, description, duration);
          set(state => ({
            notifications: [
              ...state.notifications,
              { type, message, description }
            ].slice(-5) // Hanya simpan 5 notifikasi terakhir
          }));
        };
        
        // Update state dengan fungsi notifikasi yang sudah disiapkan
        set({ addNotification: () => notificationFunction });
      },
      
      setUserId: (id: string | null) => {
        console.log('Setting userId:', id ? id.substring(0, 8) + '...' : 'null');
        set({ userId: id });
      },

      fetchProducts: async () => {
        const userId = get().userId;
        
        console.log('Fetching products, userId:', userId ? 'exists' : 'none');
        
        // Jika belum login, tidak perlu fetch
        if (!userId) {
          console.log('No userId, skipping products fetch');
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

          if (error) {
            console.error('Supabase error fetching products:', error);
            throw error;
          }
          
          console.log(`Fetched ${data?.length || 0} products`);
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
        
        console.log('Fetching sales, userId:', userId ? 'exists' : 'none');
        
        // Jika belum login, tidak perlu fetch
        if (!userId) {
          console.log('No userId, skipping sales fetch');
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

          if (error) {
            console.error('Supabase error fetching sales:', error);
            throw error;
          }
          
          console.log(`Fetched ${data?.length || 0} sales`);
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
        if (!userId) {
          console.log('No userId, skipping products subscription');
          return;
        }
        
        console.log('Subscribing to products changes');
        const products = supabase
          .channel('products_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            (payload) => {
              console.log('Products change detected:', payload.eventType);
              get().fetchProducts();
            }
          )
          .subscribe();

        return () => {
          console.log('Unsubscribing from products changes');
          supabase.removeChannel(products);
        };
      },

      subscribeToSales: () => {
        const userId = get().userId;
        if (!userId) {
          console.log('No userId, skipping sales subscription');
          return;
        }
        
        console.log('Subscribing to sales changes');
        const sales = supabase
          .channel('sales_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'sales' },
            (payload) => {
              console.log('Sales change detected:', payload.eventType);
              get().fetchSales();
            }
          )
          .subscribe();

        return () => {
          console.log('Unsubscribing from sales changes');
          supabase.removeChannel(sales);
        };
      },
    }),
    {
      name: 'ipur-cuyunk-storage',
      partialize: (state) => ({ 
        userId: state.userId 
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Store rehydrated with state:', state ? 'exists' : 'none');
        if (state?.userId) {
          console.log('Restored userId from storage:', state.userId.substring(0, 8) + '...');
        }
      },
    }
  )
);