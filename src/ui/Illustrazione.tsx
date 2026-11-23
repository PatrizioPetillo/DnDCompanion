// Illustrazioni dipinte nello stile DomusDraconis (idea di Patrizio, 18/11): una per classe, specie e background.
// I file stanno in src/assets/immagini/<classi|specie|background>/<id>.webp (vedi LEGGIMI.md lì accanto).
// L'elenco si legge quando si costruisce l'app: un'immagine che non c'è semplicemente non compare, senza buchi.
const FILE = import.meta.glob('../assets/immagini/*/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type Gruppo = 'classi' | 'specie' | 'background' | 'predefiniti';   // predefiniti: i personaggi pronti (23/11)
export const immagine = (gruppo: Gruppo, id: string | undefined): string | undefined =>
  id ? FILE[`../assets/immagini/${gruppo}/${id}.webp`] : undefined;

// Sfumatura morbida (23/11): più passaggi invece di una linea, così l'immagine «entra» nella pagina
export const sfumatura = (da: number, colore: string) =>
  `linear-gradient(to bottom, transparent ${da}%, color-mix(in srgb, ${colore} 35%, transparent) ${da + (100 - da) * 0.45}%, color-mix(in srgb, ${colore} 75%, transparent) ${da + (100 - da) * 0.75}%, ${colore} 100%)`;

// Fascia in cima a una scheda: l'immagine sfuma verso il colore della scheda, il testo resta su fondo pieno
// sfuma: da che altezza (%) parte la sfumatura; children: etichette sopra l'immagine (es. la difficoltà, 20/11)
export function Fascia({ gruppo, id, alto = 104, arrotonda = true, suSfondo = false, sfuma = 30, children }: {
  gruppo: Gruppo; id: string; alto?: number; arrotonda?: boolean; suSfondo?: boolean; sfuma?: number; children?: React.ReactNode;
}) {
  const src = immagine(gruppo, id);
  if (!src) return null;
  return (
    <div className={`relative overflow-hidden ${arrotonda ? 'rounded-t-[11px]' : 'rounded-xl'}`} style={{ height: alto }}>
      <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: '50% 30%' }} />
      <div aria-hidden="true" className="absolute inset-0"
        style={{ background: sfumatura(sfuma, `var(--color-${suSfondo ? 'sfondo' : 'superficie'})`) }} />
      {children}
    </div>
  );
}
