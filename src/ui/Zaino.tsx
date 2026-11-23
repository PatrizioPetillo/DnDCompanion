// Oggetti dello zaino che si aprono (richiesta di Patrizio, 19/11): il libro degli incantesimi, sfogliabile a pagine,
// e la borsa per componenti con le componenti dentro.
import { useRef, useState } from 'react';
import { cambiaComponente, componenti } from '../partita/componenti';
import { statoVuoto } from '../partita/partita';
import { DATI } from '../regole';
import type { MagiaCalcolata, Scheda } from '../regole/tipi';
import { FoglioDalBasso } from './SchedaIncantesimo';
import type { PropsTavolo } from './Tavolo';

const SCUOLA: Record<string, string> = {
  abjuration: 'abiurazione', conjuration: 'evocazione', divination: 'divinazione', enchantment: 'ammaliamento',
  evocation: 'invocazione', illusion: 'illusione', necromancy: 'necromanzia', transmutation: 'trasmutazione',
};

// Il libro del mago (richiesta del 19/11): una pagina per livello, sfogliabile di lato (‹ 1° livello ›);
// in ogni pagina l'elenco degli incantesimi, e toccandone uno si apre la sua scheda.
export function Libro({ magia: m, chiudi }: { magia: MagiaCalcolata; chiudi: () => void }) {
  const scritti = [...(m.libro?.scelti ?? [])].map((id) => DATI.incantesimi[id]).filter(Boolean);
  const livelli = [...new Set(scritti.map((i) => i.livello))].sort((a, b) => a - b);
  const pagine = livelli.map((l) => ({
    livello: l,
    incantesimi: scritti.filter((i) => i.livello === l).sort((a, b) => a.nome.localeCompare(b.nome, 'it')),
  }));
  const preparati = m.preparati?.scelti ?? [];
  const [pagina, setPagina] = useState(0);
  const [aperto, setAperto] = useState<string | null>(null);
  const striscia = useRef<HTMLDivElement>(null);
  const vai = (n: number) => {
    const p = Math.max(0, Math.min(pagine.length - 1, n));
    striscia.current?.scrollTo({ left: p * striscia.current.clientWidth, behavior: 'smooth' });
    setPagina(p);
  };
  const cambio = m.cambio?.quando === 'riposoLungo'
    ? `Dopo un riposo lungo puoi cambiare ${m.cambio.quanti === 'tutti' ? 'tutti i preparati' : 'un preparato'}, scegliendo tra gli incantesimi del libro (SRD p. ${m.cambio.srd.pagina}).`
    : null;
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="font-titolo text-lg text-accento">Libro degli incantesimi</h2>
      <p className="text-sm text-testo-2">Preparati {preparati.length}/{m.preparati?.limite ?? 0} · {scritti.length} incantesimi scritti</p>
    </>}>
      {scritti.length === 0 ? <p className="text-sm text-testo-2">Il libro è ancora vuoto: gli incantesimi si scrivono nel passo Magia.</p> : (
        <>
          {pagine.length > 1 && (
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => vai(pagina - 1)} disabled={pagina === 0} aria-label="Livello precedente"
                className="h-11 w-11 rounded-full border border-bordo text-xl text-testo disabled:opacity-30">‹</button>
              <span className="font-titolo text-base text-accento" aria-live="polite">{pagine[pagina].livello}° livello</span>
              <button onClick={() => vai(pagina + 1)} disabled={pagina >= pagine.length - 1} aria-label="Livello successivo"
                className="h-11 w-11 rounded-full border border-bordo text-xl text-testo disabled:opacity-30">›</button>
            </div>
          )}
          <div ref={striscia} onScroll={(e) => setPagina(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex snap-x snap-mandatory items-start overflow-x-auto" style={{ scrollbarWidth: 'none' }} aria-label="Pagine del libro">
            {pagine.map((p) => (
              <section key={p.livello} className="w-full shrink-0 snap-center px-0.5" aria-label={`${p.livello}° livello`}>
                {pagine.length === 1 && <h3 className="mb-2 font-titolo text-base text-accento">{p.livello}° livello</h3>}
                <ul className="space-y-2">
                  {p.incantesimi.map((i) => {
                    const prep = preparati.includes(i.id);
                    const su = aperto === i.id;
                    return (
                      <li key={i.id} className={`rounded-xl border-2 bg-superficie ${prep ? 'border-oro' : 'border-bordo'}`}>
                        <button onClick={() => setAperto(su ? null : i.id)} aria-expanded={su}
                          className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left">
                          <span className="min-w-0 flex-1">
                            <span className="block text-base text-testo">{i.nome}</span>
                            <span className="block text-xs text-testo-2">{SCUOLA[i.scuola] ?? i.scuola}{i.rituale ? ' · rituale' : ''}</span>
                          </span>
                          {prep && <span className="rounded-full bg-accento px-2 py-0.5 text-xs text-su-accento">Preparato</span>}
                          <span aria-hidden className={`text-testo-2 transition-transform ${su ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {su && (
                          <div className="border-t border-bordo px-3 pb-3 pt-2">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                              <dt className="text-testo-2">Tempo</dt><dd className="text-testo">{i.it?.tempo ?? i.tempo.testo}</dd>
                              <dt className="text-testo-2">Gittata</dt><dd className="text-testo">{i.it?.gittata ?? i.gittata}</dd>
                              <dt className="text-testo-2">Componenti</dt><dd className="text-testo">{i.it?.componenti ?? ''}</dd>
                              <dt className="text-testo-2">Durata</dt><dd className="text-testo">{i.it?.durata ?? i.durata}</dd>
                            </dl>
                            {i.rituale && !prep && <p className="mt-2 text-sm text-testo">Puoi lanciarlo come rituale leggendo dal libro, anche se non è preparato (Adepto dei rituali).</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
      {cambio && <p className="mt-3 text-sm text-testo-2">{cambio}</p>}
    </FoglioDalBasso>
  );
}

// La borsa per componenti (SRD p. 105-106): le componenti senza costo ci sono sempre; quelle con un costo si contano
export function Borsa({ nome, scheda, tavolo, chiudi, ignoraNonConsumate = false }: { nome: string; scheda: Scheda; tavolo: PropsTavolo | null; chiudi: () => void; ignoraNonConsumate?: boolean }) {
  const borsa = /borsa/i.test(nome);
  const { senzaCosto, conCosto, nonServono } = componenti(scheda, tavolo?.partita ?? statoVuoto(), undefined, ignoraNonConsumate);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="font-titolo text-lg text-accento">{nome}</h2>
      <p className="text-sm text-testo-2">{borsa ? 'Contiene tutte le componenti senza costo dei tuoi incantesimi' : 'Sostituisce le componenti senza costo dei tuoi incantesimi'} (SRD p. 105-106). Quelle con un costo no: vanno comprate.</p>
    </>}>
      {conCosto.length > 0 && (
        <>
          <h3 className="mb-2 text-base font-medium text-testo">Con un costo: si comprano</h3>
          <ul className="mb-4 space-y-2">
            {conCosto.map((c) => {
              const finita = c.disponibili === 0;
              return (
                <li key={c.incantesimo} className={`rounded-xl border-2 bg-superficie p-3 ${finita ? 'border-attenzione' : 'border-bordo'}`}>
                  <p className="text-base text-testo">{c.nome}</p>
                  <p className="text-sm text-testo-2">{c.testo}{c.consumata ? ' · si consuma lanciando' : ''}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`flex-1 text-sm ${finita ? 'text-attenzione' : 'text-testo'}`}>
                      {finita ? 'Finita: puoi lanciarlo solo se il master lo concede' : `Ne hai ${c.disponibili}`}
                    </span>
                    {tavolo && <>
                      <button onClick={() => tavolo.cambia(cambiaComponente(tavolo.partita, c, -1))} disabled={finita} aria-label={`Togli una componente di ${c.nome}`}
                        className="h-11 w-11 rounded-lg border border-bordo text-lg text-testo disabled:opacity-30">−</button>
                      <button onClick={() => tavolo.cambia(cambiaComponente(tavolo.partita, c, 1))} aria-label={`Aggiungi una componente di ${c.nome}`}
                        className="h-11 rounded-lg border border-accento px-3 text-sm text-accento">+ Aggiungi</button>
                    </>}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {nonServono.length > 0 && (
        <>
          <h3 className="mb-1 text-base font-medium text-testo">Con un costo, ma non servono al tuo tavolo</h3>
          <p className="mb-2 text-xs text-testo-2">Regola del master: le componenti che non si consumano non vanno comprate.</p>
          <ul className="mb-4 space-y-1 text-sm">
            {nonServono.map((c) => <li key={c.incantesimo}><span className="text-testo">{c.nome}:</span> <span className="text-testo-2">{c.testo}</span></li>)}
          </ul>
        </>
      )}
      <h3 className="mb-2 text-base font-medium text-testo">Senza costo: {borsa ? 'sempre nella borsa' : 'le sostituisce il focus'}</h3>
      {senzaCosto.length ? (
        <ul className="space-y-1 text-sm">
          {senzaCosto.map((c) => <li key={c.incantesimo}><span className="text-testo">{c.nome}:</span> <span className="text-testo-2">{c.testo}</span></li>)}
        </ul>
      ) : <p className="text-sm text-testo-2">Nessuno dei tuoi incantesimi ha componenti materiali senza costo.</p>}
    </FoglioDalBasso>
  );
}
