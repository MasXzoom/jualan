# IPUR CUYUNK - Aplikasi Penjualan

Aplikasi web penjualan sederhana dengan fitur manajemen produk, penjualan, dan laporan.

## Fitur

- Autentikasi pengguna dengan login email dan password
- Dashboard dengan grafik dan statistik penjualan
- Manajemen produk (tambah, edit, hapus)
- Pencatatan penjualan dan pengelolaan stok otomatis
- Laporan dan analisis data penjualan
- Responsive design untuk mobile dan desktop

## Teknologi

- React JS
- Ant Design UI Components
- TypeScript
- Supabase (Auth, Database)
- Tailwind CSS untuk styling
- Lucide React untuk icons
- Vite sebagai build tool

## Cara Instalasi

```bash
# Clone repository
git clone <repository-url>

# Masuk ke direktori proyek
cd web-penjualan

# Instal dependensi
npm install

# Jalankan aplikasi dalam mode development
npm run dev
```

## Konfigurasi

Untuk menjalankan aplikasi ini, Anda perlu mengatur variabel lingkungan di file `.env`:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Struktur Folder

- `/src/components` - UI components
- `/src/pages` - Halaman aplikasi
- `/src/lib` - Kode utilitas dan store
- `/src/utils` - Fungsi pembantu

## License

MIT 