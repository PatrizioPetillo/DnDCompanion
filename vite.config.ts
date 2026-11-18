import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Web app installabile, solo per telefono, funziona offline (sezione 9 del contesto).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Companion B20',
        short_name: 'Companion B20',
        description: 'Crea il tuo personaggio di livello 1 secondo le regole del tavolo. Compatibile con la quinta edizione.',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F3E9D2',
        theme_color: '#6E1A1A',
        // Icona provvisoria (un d20 in ottone sul rosso DomusDraconis): si cambia quando arriva il logo
        icons: [
          { src: 'icona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2}'], maximumFileSizeToCacheInBytes: 5_000_000 },
    }),
  ],
})
