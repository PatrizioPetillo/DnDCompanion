# Servizio degli sblocchi (Cloudflare)

Serve agli oggetti da identificare: quando il master tocca «Sblocca», il telefono del giocatore scopre l'oggetto da solo.
Conserva solo id casuali e chiavi. Piano Workers gratuito (100.000 richieste al giorno).

## Pubblicarlo (una volta sola)
1. Crea un account gratuito su cloudflare.com.
2. Da questa cartella: `npm install`, poi `npx wrangler login` (si apre il browser) e `npx wrangler deploy`.
3. Wrangler stampa l'indirizzo, tipo `https://companion-b20-sblocchi.<tuonome>.workers.dev`.
4. Su Vercel, nel progetto: Settings → Environment Variables → `VITE_SBLOCCHI_URL` = quell'indirizzo. Poi ridistribuisci.

Senza la variabile l'app funziona lo stesso: lo sblocco passa solo dal QR al tavolo.

## Provarlo sul PC
`npx wrangler dev`, poi nel file `.env.local` dell'app: `VITE_SBLOCCHI_URL=http://localhost:8787`.
