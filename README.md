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

## Deployment ke Vercel

Untuk melakukan deployment aplikasi ke Vercel, ikuti langkah-langkah berikut:

1. Daftar/login ke [Vercel](https://vercel.com)
2. Buat project baru dengan mengimpor repositori GitHub Anda
3. Pada bagian "Configure Project", tambahkan Environment Variables:
   - Klik "Add" pada bagian "Environment Variables"
   - Tambahkan variabel `VITE_SUPABASE_URL` dengan nilai URL Supabase Anda
   - Tambahkan variabel `VITE_SUPABASE_ANON_KEY` dengan nilai Anon Key Supabase Anda
   - **Penting:** Pastikan nama variabel tepat sama dengan yang digunakan di aplikasi
4. Klik "Deploy" untuk memulai proses deployment

Jika mendapatkan error "Environment Variable references Secret which does not exist", pastikan Anda:
- Menambahkan variabel langsung ke dalam project (bukan sebagai Secret)
- Menggunakan nama yang sama persis: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- Nilai variabel diisi dengan benar tanpa tanda kutip

### Deployment Manual dengan Vercel CLI

Alternatif lain, Anda dapat menggunakan Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --env VITE_SUPABASE_URL=<your-supabase-url> --env VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Untuk production
vercel --prod --env VITE_SUPABASE_URL=<your-supabase-url> --env VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Struktur Folder

- `/src/components` - UI components
- `/src/pages` - Halaman aplikasi
- `/src/lib` - Kode utilitas dan store
- `/src/utils` - Fungsi pembantu

## License

MIT 