// «I miei personaggi» (scelta di Patrizio, 18/11): titolo con l'icona «+» accanto per crearne uno nuovo;
// ogni riga ha l'avatar a sinistra e accanto Nome · Livello, sotto Specie · Classe, sotto ancora l'origine
// (il background) piccola, in corsivo e grigia. Il «⋯» apre duplica ed elimina.
import { useState } from 'react';
import { elenco, type Archivio, type VoceElenco } from '../archivio/archivio';
import { Avatar } from './Avatar';
import { FoglioDalBasso } from './SchedaIncantesimo';

export function Personaggi({ archivio, apri, crea, duplica, elimina, importa }: {
  archivio: Archivio;
  apri: (id: string) => void;
  crea: () => void;
  duplica: (id: string) => void;
  elimina: (id: string) => void;
  importa: (testo: string) => void;
}) {
  const voci = elenco(archivio);
  const [menu, setMenu] = useState<VoceElenco | null>(null);
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-titolo text-2xl text-accento">I miei personaggi</h1>
        <button onClick={crea} aria-label="Crea un nuovo personaggio"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-accento text-accento">
          <IconaPiu />
        </button>
      </div>

      {voci.length === 0 && (
        <div className="rounded-xl border border-bordo bg-superficie p-4 text-center">
          <p className="text-base text-testo">Crea il tuo primo personaggio</p>
          <p className="mt-1 text-sm text-testo-2">Classe, background, specie: l'app ti guida un passo alla volta e controlla le regole.</p>
          <button onClick={crea} className="mt-3 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Crea personaggio</button>
        </div>
      )}

      <ul className="overflow-hidden rounded-xl border border-bordo bg-superficie empty:hidden">
        {voci.map((v) => (
          <li key={v.id} className="flex items-center border-b border-bordo last:border-b-0">
            <button onClick={() => apri(v.id)} className="flex min-h-20 min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left">
              <Avatar ritratto={v.ritratto} classe={v.classeId} iniziali={v.iniziali} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-base font-medium text-testo">{v.nome}</span>
                  <span className="shrink-0 text-sm text-testo-2">Livello {v.livello}</span>
                </span>
                <span className="block truncate text-sm text-testo">{v.specie} · {v.classe}</span>
                <span className="block truncate text-xs italic text-testo-2/70">{v.origine}</span>
                {!v.pronto && <span className="mt-1 inline-block rounded-full border border-attenzione/60 px-2 text-xs text-attenzione">In creazione</span>}
              </span>
            </button>
            <button onClick={() => setMenu(v)} aria-label={`Altre azioni per ${v.nome}`} className="flex h-20 w-12 shrink-0 items-center justify-center text-testo-2">
              <IconaPunti />
            </button>
          </li>
        ))}
      </ul>

      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-bordo text-base text-testo">
        Importa una scheda (JSON)
        <input type="file" accept="application/json,.json" className="sr-only"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) importa(await f.text()); e.target.value = ''; }} />
      </label>
      <p className="mt-1 text-xs text-testo-2">Si aggiunge alla lista: non sostituisce nessun personaggio.</p>

      {menu && (
        <FoglioDalBasso chiudi={() => setMenu(null)} titolo={<h2 className="text-lg font-medium text-testo">{menu.nome}</h2>}>
          <div className="space-y-2">
            <button onClick={() => { apri(menu.id); setMenu(null); }} className="h-12 w-full rounded-xl border border-bordo text-base text-testo">Apri</button>
            <button onClick={() => { duplica(menu.id); setMenu(null); }} className="h-12 w-full rounded-xl border border-bordo text-base text-testo">Duplica (per provare una variante)</button>
            <button
              onClick={() => { if (window.confirm(`Eliminare ${menu.nome}? Non si può annullare: se vuoi tenerlo, prima scarica la copia JSON dal riepilogo.`)) { elimina(menu.id); setMenu(null); } }}
              className="h-12 w-full rounded-xl border border-attenzione text-base text-attenzione"
            >Elimina</button>
          </div>
        </FoglioDalBasso>
      )}
    </section>
  );
}

const IconaPiu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);
const IconaPunti = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
);
