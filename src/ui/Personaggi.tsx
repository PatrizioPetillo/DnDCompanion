// «I miei personaggi» (scelta di Patrizio, 18/11): titolo con l'icona «+» accanto per crearne uno nuovo;
// ogni riga ha l'avatar a sinistra e accanto Nome · Livello, sotto Specie · Classe, sotto ancora l'origine
// (il background) piccola, in corsivo e grigia. Il «⋯» apre duplica ed elimina.
import { useState } from 'react';
import { elenco, statoCopia, type Archivio, type VoceElenco } from '../archivio/archivio';
import { iPhoneNonInstallata } from './salvataggio';
import { Avatar } from './Avatar';
import { FoglioDalBasso } from './SchedaIncantesimo';

export function Personaggi({ archivio, apri, crea, duplica, elimina, importa, scaricaCopia }: {
  archivio: Archivio;
  scaricaCopia: () => void;
  apri: (id: string) => void;
  crea: () => void;
  duplica: (id: string) => void;
  elimina: (id: string) => void;
  importa: (testo: string) => void;
}) {
  const voci = elenco(archivio);
  const [menu, setMenu] = useState<VoceElenco | null>(null);
  const copia = statoCopia(archivio);
  return (
    <section>
      {iPhoneNonInstallata() && (
        <div className="mb-4 rounded-xl border border-attenzione bg-superficie p-3 text-sm text-testo">
          <strong>Su iPhone installa l'app</strong>: tocca Condividi e poi «Aggiungi alla schermata Home».
          Aperta solo in Safari, dopo 7 giorni senza usarla Safari può cancellare i personaggi.
        </div>
      )}
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

      {voci.length > 0 && (
        <div className={`mt-4 rounded-xl border bg-superficie p-3 ${copia.daRifare ? 'border-attenzione' : 'border-bordo'}`}>
          <p className="flex justify-between text-sm text-testo"><span>Copia di sicurezza</span><span className={copia.daRifare ? 'text-attenzione' : 'text-testo-2'}>Ultima: {copia.testo}</span></p>
          <p className="mt-1 text-xs text-testo-2">I personaggi stanno solo in questo telefono. Con la copia li ritrovi se cambi telefono o se il browser li cancella.</p>
          <button onClick={scaricaCopia} className="mt-2 h-12 w-full rounded-xl border border-accento text-base text-accento">Scarica la copia di tutti i personaggi</button>
        </div>
      )}

      <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-bordo text-base text-testo">
        Importa una scheda o una copia (JSON)
        <input type="file" accept="application/json,.json" className="sr-only"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) importa(await f.text()); e.target.value = ''; }} />
      </label>
      <p className="mt-1 text-xs text-testo-2">Si aggiunge alla lista: non sostituisce nessun personaggio, e chi c'è già non si duplica.</p>

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
