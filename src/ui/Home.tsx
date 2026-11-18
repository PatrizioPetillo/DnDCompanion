// Home (sezione 12 ter): nome dell'app, crediti, l'ingresso a «I miei personaggi» e a «Informazioni».
// I loghi di DomusDraconis e di B20 GDR vanno qui quando arrivano i file (quello di B20 con il permesso degli admin).
import { CREDITI } from '../licenza';

export function Home({ personaggi, apriPersonaggi, apriInformazioni }: { personaggi: number; apriPersonaggi: () => void; apriInformazioni: () => void }) {
  return (
    <section className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <h1 className="font-titolo text-4xl text-accento">Companion B20</h1>
      <p className="mt-3 max-w-72 text-base text-testo">Crea il tuo personaggio di livello 1 e usalo al tavolo, con ogni numero spiegato.</p>
      <p className="mt-1 text-sm text-testo-2">Regole SRD 5.2 · compatibile con la quinta edizione</p>
      <button onClick={apriPersonaggi} className="mt-8 h-12 w-full max-w-80 rounded-xl bg-accento text-base font-medium text-su-accento">
        I miei personaggi{personaggi ? ` (${personaggi})` : ''}
      </button>
      <button onClick={apriInformazioni} className="mt-3 h-12 w-full max-w-80 rounded-xl border border-bordo text-base text-testo">Informazioni</button>
      <p className="mt-8 text-xs text-testo-2">{CREDITI}</p>
    </section>
  );
}
