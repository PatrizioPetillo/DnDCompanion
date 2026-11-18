// Illustrazioni dipinte nello stile DomusDraconis (idea di Patrizio, 18/11): una per classe, specie e background.
// I file stanno in src/assets/immagini/<classi|specie|background>/<id>.webp (vedi LEGGIMI.md lì accanto).
// L'elenco si legge quando si costruisce l'app: un'immagine che non c'è semplicemente non compare, senza buchi.
const FILE = import.meta.glob('../assets/immagini/*/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export type Gruppo = 'classi' | 'specie' | 'background';
export const immagine = (gruppo: Gruppo, id: string | undefined): string | undefined =>
  id ? FILE[`../assets/immagini/${gruppo}/${id}.webp`] : undefined;

// Fascia in cima a una scheda: l'immagine sfuma verso il colore della scheda, il testo resta su fondo pieno
export function Fascia({ gruppo, id, alto = 88, arrotonda = true, suSfondo = false }: { gruppo: Gruppo; id: string; alto?: number; arrotonda?: boolean; suSfondo?: boolean }) {
  const src = immagine(gruppo, id);
  if (!src) return null;
  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${arrotonda ? 'rounded-t-[11px]' : 'rounded-xl'}`} style={{ height: alto }}>
      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: '50% 30%' }} />
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent from-40% ${suSfondo ? 'to-sfondo' : 'to-superficie'}`} />
    </div>
  );
}
