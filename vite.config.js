import { defineConfig } from 'vite';

export default defineConfig({
  // Configuración para cargar variables de entorno
  envPrefix: 'VITE_',
  
  // Configuración para development
  server: {
    port: 4200,
    host: true
  },
  
  // Configuración para build
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
