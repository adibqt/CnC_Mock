import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make API URL configurable for Vercel
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api`
        : process.env.VITE_API_URL || 'http://localhost:8000'
    )
  }
})
