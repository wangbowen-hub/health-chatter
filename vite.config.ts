import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/api/dify': {
        target: 'http://dify.trialdata.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dify/, '')
      }
    }
  },
});
