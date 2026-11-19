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
        // Icona: pergamena, piuma e d20 (19/11)
        icons: [
          { src: 'icona-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icona-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'], maximumFileSizeToCacheInBytes: 5_000_000 },
    }),
  ],
  // I pezzi grandi si scaricano solo quando servono: pdf (pdf-lib + fontkit, solo all'esportazione)
  // e incantesimi-testi (solo aprendo la scheda di un incantesimo). Il principale sta sotto i 200 kB compressi.
  build: { chunkSizeWarningLimit: 1200 },
})
