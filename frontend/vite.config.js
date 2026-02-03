import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // VITE_PROXY_TARGET no .env (ex.: http://localhost:5001 se backend usa APP_PORT=5001).
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err, req, res) => {
              console.error(
                `\n[vite proxy] Backend inacessível em ${proxyTarget}\n` +
                '  → Inicie o backend em outro terminal: cd backend && npm run dev\n' +
                '  → Se o backend usa outra porta, defina no frontend/.env: VITE_PROXY_TARGET=http://localhost:PORT\n'
              );
            });
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'chart-vendor': ['chart.js', 'react-chartjs-2'],
          },
        },
      },
    },
  };
});
