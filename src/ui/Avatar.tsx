import { immagine } from './Illustrazione';

// Avatar del personaggio: il ritratto scelto dal telefono, altrimenti l'illustrazione della classe, altrimenti le iniziali.
export function Avatar({ ritratto, classe, iniziali, dim = 56 }: { ritratto?: string; classe?: string; iniziali: string; dim?: number }) {
  const src = ritratto ?? immagine('classi', classe);
  return src
    ? <img src={src} alt="" width={dim} height={dim} className="shrink-0 rounded-full border border-bordo object-cover" style={{ width: dim, height: dim, objectPosition: ritratto ? '50% 50%' : '50% 25%' }} />
    : (
      <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full border border-accento/40 bg-accento/10 font-titolo text-accento"
        style={{ width: dim, height: dim, fontSize: dim * 0.36 }}>
        {iniziali}
      </span>
    );
}

// Riduce la foto scelta a un quadrato piccolo (JPEG): pochi kB, così nel telefono ci stanno centinaia di personaggi
export async function riduciRitratto(file: File, lato = 160): Promise<string> {
  const img = await createImageBitmap(file);
  const c = document.createElement('canvas');
  c.width = lato; c.height = lato;
  const lato0 = Math.min(img.width, img.height);
  c.getContext('2d')!.drawImage(img, (img.width - lato0) / 2, (img.height - lato0) / 2, lato0, lato0, 0, 0, lato, lato);
  img.close();
  return c.toDataURL('image/jpeg', 0.82);
}
