// Attesa con il d20 d'ottone (23/11): mentre l'app prepara il PDF o il file per Foundry.
// Stesso dado della schermata di apertura (index.html); fermo con «riduci movimento».
import { IconaD20 } from './Tiro';

export function Caricamento({ testo }: { testo: string }) {
  return (
    <div role="status" aria-live="polite" className="anim-compare fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-sfondo/85 backdrop-blur-[2px]">
      <span className="anim-attesa text-oro [&_svg]:h-20 [&_svg]:w-20"><IconaD20 grande /></span>
      <p className="font-titolo text-lg text-testo">{testo}</p>
    </div>
  );
}
