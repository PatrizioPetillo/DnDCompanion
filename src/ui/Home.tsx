// Home (sezione 12 ter): i loghi, il nome dell'app, crediti (ora in Informazioni, dal menu e dal link in fondo), l'ingresso a «I miei personaggi», ai tavoli e a «Informazioni».
// I loghi stanno solo qui (decisione del 17/11). Quello di B20 GDR solo con il permesso degli admin: senza, LOGO_B20 = false.
import logoB20 from '../assets/loghi/b20.webp';
import logoDomus from '../assets/loghi/domusdraconis.webp';

const LOGO_B20 = true;   // mettere false finché gli admin di B20 non danno il permesso

function Logo({ src, nome }: { src: string; nome: string }) {
  return <img src={src} alt={nome} width={80} height={80} className="h-20 w-20 rounded-full border-2 border-oro object-cover shadow-md" />;
}

export function Home({ personaggi, apriPersonaggi, apriTavoli, apriInformazioni }: { personaggi: number; apriPersonaggi: () => void; apriTavoli: () => void; apriInformazioni: () => void }) {
  return (
    <section className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex items-center gap-4">
        <Logo src={logoDomus} nome="DomusDraconis" />
        {LOGO_B20 && <Logo src={logoB20} nome="B20 GDR" />}
      </div>
      <h1 className="font-titolo text-4xl text-accento">Companion B20</h1>
      <p className="mt-3 max-w-72 text-base text-testo">Crea il tuo personaggio di livello 1 e usalo al tavolo, con ogni numero spiegato.</p>
      <p className="mt-1 text-sm text-testo-2">Regole SRD 5.2 · compatibile con la quinta edizione</p>
      <button onClick={apriPersonaggi} className="mt-8 h-12 w-full max-w-80 rounded-xl bg-accento text-base font-medium text-su-accento">
        I miei personaggi{personaggi ? ` (${personaggi})` : ''}
      </button>
      <button onClick={apriTavoli} className="mt-3 h-12 w-full max-w-80 rounded-xl border border-bordo text-base text-testo">I miei tavoli (per il master)</button>
      <button onClick={apriInformazioni} className="mt-8 min-h-11 px-4 text-sm text-testo-2 underline underline-offset-4">Informazioni, crediti e note legali</button>
    </section>
  );
}
