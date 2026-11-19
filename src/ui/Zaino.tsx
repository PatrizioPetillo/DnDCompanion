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

// Il libro del mago: una pagina per incantesimo, si sfoglia di lato (‹ 2/6 ›)
export function Libro({ magia: m, chiudi }: { magia: MagiaCalcolata; chiudi: () => void }) {
  const pagine = [...(m.libro?.scelti ?? [])].map((id) => DATI.incantesimi[id]).filter(Boolean)
    .sort((a, b) => a.livello - b.livello || a.nome.localeCompare(b.nome, 'it'));
  const preparati = m.preparati?.scelti ?? [];
  const [pagina, setPagina] = useState(0);
  const striscia = useRef<HTMLDivElement>(null);
  const vai = (n: number) => {
    const p = Math.max(0, Math.min(pagine.length - 1, n));
    striscia.current?.scrollTo({ left: p * striscia.current.clientWidth, behavior: 'smooth' });
    setPagina(p);
  };
  const cambio = m.cambio?.quando === 'riposoLungo'
    ? `Dopo un riposo lungo puoi cambiare ${m.cambio.quanti === 'tutti' ? 'tutti i preparati' : 'un preparato'}, scegliendo tra queste pagine (SRD p. ${m.cambio.srd.pagina}).`
    : null;
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="font-titolo text-lg text-accento">Libro degli incantesimi</h2>
      <p className="text-sm text-testo-2">Preparati {preparati.length}/{m.preparati?.limite ?? 0} · {pagine.length} incantesimi scritti</p>
    </>}>
      {pagine.length === 0 ? <p className="text-sm text-testo-2">Il libro è ancora vuoto: gli incantesimi si scrivono nel passo Magia.</p> : (
        <>
          <div ref={striscia} onScroll={(e) => setPagina(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex snap-x snap-mandatory overflow-x-auto" style={{ scrollbarWidth: 'none' }} aria-label="Pagine del libro">
            {pagine.map((i) => {
              const prep = preparati.includes(i.id);
              return (
                <article key={i.id} className="w-full shrink-0 snap-center px-0.5">
                  <div className={`min-h-64 rounded-xl border-2 bg-superficie p-4 ${prep ? 'border-oro' : 'border-bordo'}`}>
                    <p className="text-xs uppercase tracking-widest text-oro">{i.livello}° livello · {SCUOLA[i.scuola] ?? i.scuola}</p>
                    <h3 className="mt-1 font-titolo text-xl text-accento">{i.nome}</h3>
                    <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${prep ? 'bg-accento text-su-accento' : 'border border-bordo text-testo-2'}`}>
                      {prep ? 'Preparato' : 'Non preparato'}{i.rituale ? ' · rituale' : ''}
                    </p>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-testo-2">Tempo</dt><dd className="text-testo">{i.it?.tempo ?? i.tempo.testo}</dd>
                      <dt className="text-testo-2">Gittata</dt><dd className="text-testo">{i.it?.gittata ?? i.gittata}</dd>
                      <dt className="text-testo-2">Componenti</dt><dd className="text-testo">{i.it?.componenti ?? ''}</dd>
                      <dt className="text-testo-2">Durata</dt><dd className="text-testo">{i.it?.durata ?? i.durata}</dd>
                    </dl>
                    {i.rituale && !prep && <p className="mt-3 text-sm text-testo">Puoi lanciarlo come rituale leggendo dal libro, anche se non è preparato (Adepto dei rituali).</p>}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={() => vai(pagina - 1)} disabled={pagina === 0} aria-label="Pagina precedente"
              className="h-11 w-11 rounded-full border border-bordo text-xl text-testo disabled:opacity-30">‹</button>
            <span className="text-sm text-testo" aria-live="polite">{pagina + 1}/{pagine.length}</span>
            <button onClick={() => vai(pagina + 1)} disabled={pagina >= pagine.length - 1} aria-label="Pagina successiva"
              className="h-11 w-11 rounded-full border border-bordo text-xl text-testo disabled:opacity-30">›</button>
          </div>
        </>
      )}
      {cambio && <p className="mt-3 text-sm text-testo-2">{cambio}</p>}
    </FoglioDalBasso>
  );
}

// La borsa per componenti (SRD p. 105-106): le componenti senza costo ci sono sempre; quelle con un costo si contano
export function Borsa({ nome, scheda, tavolo, chiudi }: { nome: string; scheda: Scheda; tavolo: PropsTavolo | null; chiudi: () => void }) {
  const borsa = /borsa/i.test(nome);
  const { senzaCosto, conCosto } = componenti(scheda, tavolo?.partita ?? statoVuoto());
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
      <h3 className="mb-2 text-base font-medium text-testo">Senza costo: {borsa ? 'sempre nella borsa' : 'le sostituisce il focus'}</h3>
      {senzaCosto.length ? (
        <ul className="space-y-1 text-sm">
          {senzaCosto.map((c) => <li key={c.incantesimo}><span className="text-testo">{c.nome}:</span> <span className="text-testo-2">{c.testo}</span></li>)}
        </ul>
      ) : <p className="text-sm text-testo-2">Nessuno dei tuoi incantesimi ha componenti materiali senza costo.</p>}
    </FoglioDalBasso>
  );
}
