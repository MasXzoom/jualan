import { ThemeConfig } from 'antd';

// Warna utama aplikasi
export const colors = {
  primary: '#2563EB', // Blue 600
  secondary: '#6366F1', // Indigo 500
  success: '#22C55E', // Green 500
  warning: '#F59E0B', // Amber 500
  error: '#EF4444', // Red 500
  info: '#3B82F6', // Blue 500
  light: '#F9FAFB', // Gray 50
  dark: '#1F2937', // Gray 800
  white: '#FFFFFF',
  black: '#000000',
  
  // Variasi warna primer
  primaryLight: '#DBEAFE', // Blue 100
  primaryLighter: '#EFF6FF', // Blue 50
  primaryDark: '#1D4ED8', // Blue 700
};

// Konfigurasi tema Ant Design
export const theme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorInfo: colors.info,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorTextBase: colors.dark,
    borderRadius: 8,
    wireframe: false,
    colorBgContainer: colors.white,
  },
  components: {
    Button: {
      colorPrimary: colors.primary,
      algorithm: true,
    },
    Card: {
      colorBorderSecondary: '#E5E7EB', // Gray 200
      borderRadiusLG: 12,
    },
    Table: {
      colorBgContainer: colors.white,
      borderRadiusLG: 8,
    },
  },
};

// Color scheme for CSS
export const colorScheme = 'light'; 