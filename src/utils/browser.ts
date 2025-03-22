/**
 * Memeriksa apakah kode berjalan di browser atau di server
 * Berguna untuk menghindari error "window is not defined" di SSR
 */
export const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Mendapatkan lebar window dengan aman (mengembalikan 0 jika di server)
 */
export const getWindowWidth = (): number => {
  if (!isBrowser()) return 0;
  return window.innerWidth;
};

/**
 * Memeriksa apakah tampilan saat ini adalah mobile (lebar < 768px)
 */
export const isMobileView = (): boolean => {
  if (!isBrowser()) return false;
  return window.innerWidth < 768;
}; 