// Prepara nel browser quello che il PDF usa: la fascia della classe (da WebP a JPEG, che pdf-lib legge),
// il ritratto e il font Cinzel dei titoli (WOFF: il WOFF2 dentro il PDF non si legge). Poi chiama creaPdf.
import cinzel from '@fontsource/cinzel/files/cinzel-latin-700-normal.woff?url';
import type { Bozza } from '../creazione/percorso';
import { immagine } from '../ui/Illustrazione';

async function jpeg(src: string, larghezza = 1200): Promise<Uint8Array | undefined> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = Math.min(larghezza, img.naturalWidth);
    c.height = Math.round(img.naturalHeight * (c.width / img.naturalWidth));
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : undefined;
  } catch { return undefined; }
}

export async function pdfDellaScheda(b: Bozza, ritratto?: string): Promise<Uint8Array> {
  const [{ creaPdf }, font, fascia, foto] = await Promise.all([
    import('./pdf'),
    fetch(cinzel).then((r) => r.arrayBuffer()).then((x) => new Uint8Array(x)).catch(() => undefined),
    b.classe && immagine('classi', b.classe) ? jpeg(immagine('classi', b.classe)!) : Promise.resolve(undefined),
    ritratto ? jpeg(ritratto, 320) : Promise.resolve(undefined),
  ]);
  return creaPdf(b, new Date(), { fascia, ritratto: foto }, font);
}
