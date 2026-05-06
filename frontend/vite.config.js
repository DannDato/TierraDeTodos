import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  const targetBase = env.VITE_API_BASE;
  const targetPort = env.VITE_API_PORT;

  if (command === 'serve' && (!targetBase || !targetPort)) {
    throw new Error('Faltan VITE_API_BASE y/o VITE_API_PORT para levantar el proxy de desarrollo.');
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: `${targetBase}:${targetPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
})
