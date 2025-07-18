import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(({ mode }) => {
  // Debug: ver qué variables están disponibles
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_KEY: process.env.VITE_SUPABASE_KEY,
    VITE_RAWG_API_KEY: process.env.VITE_RAWG_API_KEY,
  });
  
  return {
    plugins: [angular()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(process.env.VITE_SUPABASE_KEY || ''),
      'import.meta.env.VITE_RAWG_API_KEY': JSON.stringify(process.env.VITE_RAWG_API_KEY || ''),
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});