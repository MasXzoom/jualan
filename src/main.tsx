import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Starting application in', import.meta.env.MODE, 'mode');

// Tangkap dan log semua error global
window.addEventListener('error', (event) => {
  console.error('[Global Error]:', event.error);
  console.error('Message:', event.message);
  console.error('Stack:', event.error?.stack);
  
  // Log error ke UI jika dalam development
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '0';
    errorDiv.style.left = '0';
    errorDiv.style.right = '0';
    errorDiv.style.padding = '10px';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.7)';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = `Error: ${event.message}`;
    document.body.appendChild(errorDiv);
    
    // Hapus pesan error setelah 5 detik
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 5000);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]:', event.reason);
  console.error('Stack:', event.reason?.stack);
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found in the document!');
} else {
  console.log('Root element found, mounting React app...');
  
  try {
    const root = createRoot(rootElement);
    
    root.render(
      // Hanya gunakan StrictMode dalam development
      import.meta.env.DEV ? (
        <StrictMode>
          <App />
        </StrictMode>
      ) : (
        <App />
      )
    );
    
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Error mounting React app:', error);
  }
}
