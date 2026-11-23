// La scheda di un incantesimo, dal basso, sopra la lista (sezione 6.3). Il testo completo (SRD 5.2.1 in italiano)
// si carica solo quando la si apre: è un file a parte, pesante.
import { useEffect, useId, useRef, useState } from 'react';
import { DATI } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import type { Id } from '../regole/tipi';

export const SCUOLA: Record<string, string> = {
  abjuration: 'abiurazione', conjuration: 'evocazione', divination: 'divinazione', enchantment: 'ammaliamento',
  evocation: 'invocazione', illusion: 'illusione', necromancy: 'necromanzia', transmutation: 'trasmutazione',
};

interface Tabella { titolo?: string; colonne: string[]; righe: string[][] }
type Testi = Record<Id, { testo: string; superiori?: string; potenziato?: string; tabelle?: Tabella[] }>;

// Il testo dell'SRD con i suoi paragrafi (riga vuota), gli elenchi puntati («• ») e le tabelle al posto di «[[tabelle]]» (23/11)
function TestoSrd({ testo, tabelle = [], prima }: { testo: string; tabelle?: Tabella[]; prima?: string }) {
  return (
    <>
      {testo.split('\n\n').map((par, k) => {
        if (par.trim() === '[[tabelle]]') return tabelle.map((t, j) => <TabellaSrd key={`t${j}`} t={t} />);
        const [testa, ...voci] = par.split('\n• ');
        return (
          <div key={k}>
            <p>{k === 0 && prima ? <><strong>{prima}</strong> </> : null}{testa.replace(/^• /, '')}</p>
            {voci.length > 0 && <ul className="mt-1 list-disc space-y-1 pl-5">{voci.map((v) => <li key={v}>{v}</li>)}</ul>}
          </div>
        );
      })}
    </>
  );
}

function TabellaSrd({ t }: { t: Tabella }) {
  // Con tante colonne (Teletrasporto: 5) testo più piccolo e numeri su una riga, così sta nei 360 px del telefono
  const fitta = t.colonne.length > 3;
  const cella = `${fitta ? 'px-1' : 'px-2'} py-1`;
  return (
    <div className="overflow-x-auto">
      {t.titolo && <p className="mb-1 text-sm font-medium text-testo">{t.titolo}</p>}
      <table className={`w-full border-collapse ${fitta ? 'text-xs' : 'text-sm'}`}>
        <thead><tr>{t.colonne.map((c) => <th key={c} scope="col" className={`border-b border-bordo ${cella} text-left align-bottom font-medium text-testo-2`}>{c}</th>)}</tr></thead>
        <tbody>{t.righe.map((r, i) => <tr key={i} className="even:bg-sfondo">{r.map((c, j) => <td key={j} className={`${cella} align-top text-testo ${c.length <= 6 ? 'whitespace-nowrap' : ''}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
let cache: Testi | null = null;

// Fogli aperti uno sopra l'altro: Esc e Tab valgono solo per quello in cima (23/11)
const pila: number[] = [];
let prossimo = 0;

export function FoglioDalBasso({ titolo, chiudi, children }: { titolo: React.ReactNode; chiudi: () => void; children: React.ReactNode }) {
  const foglio = useRef<HTMLDivElement>(null);
  const idTitolo = useId();
  const chiudiRef = useRef(chiudi);
  useEffect(() => { chiudiRef.current = chiudi; }, [chiudi]);
  // Accessibilità (revisione del 23/11): il fuoco entra nel foglio, Tab resta dentro, alla chiusura torna dov'era
  useEffect(() => {
    const mio = ++prossimo;
    pila.push(mio);
    const prima = document.activeElement as HTMLElement | null;
    foglio.current?.focus();
    const tasti = (e: KeyboardEvent) => {
      if (pila[pila.length - 1] !== mio) return;
      if (e.key === 'Escape') { e.preventDefault(); chiudiRef.current(); return; }
      if (e.key !== 'Tab' || !foglio.current) return;
      const f = [...foglio.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const [primo, ultimo] = [f[0], f[f.length - 1]];
      if (e.shiftKey && (document.activeElement === primo || document.activeElement === foglio.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
    };
    window.addEventListener('keydown', tasti);
    return () => {
      window.removeEventListener('keydown', tasti);
      pila.splice(pila.indexOf(mio), 1);
      if (prima && document.contains(prima)) prima.focus();
    };
  }, []);   // una volta sola: rieseguirlo a ogni render ruberebbe il fuoco ai campi mentre si scrive
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40" onClick={chiudi}>
      <div
        ref={foglio}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex max-h-[88vh] w-full max-w-120 flex-col rounded-t-2xl border-t border-bordo bg-sfondo pb-[env(safe-area-inset-bottom)] outline-none"
      >
        <div className="flex items-start justify-between gap-2 border-b border-bordo px-4 py-3">
          <div id={idTitolo} className="min-w-0">{titolo}</div>
          <button onClick={chiudi} className="min-h-11 shrink-0 rounded-lg px-3 text-base text-accento">Chiudi</button>
        </div>
        {/* tabIndex: il testo lungo si scorre anche con la tastiera (axe: scrollable-region-focusable) */}
        <div className="overflow-y-auto px-4 py-3" tabIndex={0}>{children}</div>
      </div>
    </div>
  );
}

export function etichetteIncantesimo(id: Id): string[] {
  const i = DATI.incantesimi[id];
  if (!i) return [];
  const e: string[] = [];
  if (i.concentrazione) e.push('Concentrazione');
  if (i.rituale) e.push('Rituale');
  if (i.componenti.M?.costoMo) e.push(`Materiale ${i.componenti.M.costoMo} mo${i.componenti.M.consumato ? ', si consuma' : ''}`);
  return e;
}

export function SchedaIncantesimo({ id, chiudi }: { id: Id; chiudi: () => void }) {
  const i = DATI.incantesimi[id];
  const [testi, setTesti] = useState<Testi | null>(cache);
  useEffect(() => {
    if (!cache) import('../regole/dati/incantesimi-testi.json').then((m) => { cache = m.default as Testi; setTesti(cache); });
  }, []);
  if (!i) return null;
  const t = testi?.[id];
  const tipo = i.livello === 0 ? `Trucchetto di ${SCUOLA[i.scuola]}` : `${i.livello}° livello, ${SCUOLA[i.scuola]}`;
  return (
    <FoglioDalBasso
      chiudi={chiudi}
      titolo={<>
        <p className="font-titolo text-xl text-accento">{i.nome}</p>
        <p className="text-sm text-testo-2">{tipo} · {i.nomeEn}</p>
      </>}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-testo-2">Tempo</dt><dd className="text-testo">{i.it?.tempo ?? i.tempo.testo}</dd>
        <dt className="text-testo-2">Gittata</dt><dd className="text-testo">{i.it?.gittata ?? i.gittata}</dd>
        <dt className="text-testo-2">Componenti</dt><dd className="text-testo">{i.it?.componenti}</dd>
        <dt className="text-testo-2">Durata</dt><dd className="text-testo">{i.it?.durata ?? i.durata}</dd>
        {i.tiro && <><dt className="text-testo-2">Tiro</dt><dd className="text-testo">{i.tiro.tipo === 'attacco' ? 'Attacco con incantesimo' : `Tiro salvezza su ${NOME_CAR[i.tiro.car]}`}</dd></>}
        {i.danni && <><dt className="text-testo-2">Danni</dt><dd className="text-testo">{i.danni.join(', ')}</dd></>}
      </dl>
      {etichetteIncantesimo(id).length > 0 && (
        <p className="mt-2 flex flex-wrap gap-1">
          {etichetteIncantesimo(id).map((e) => <span key={e} className="rounded-full border border-bordo px-2 py-0.5 text-xs text-testo">{e}</span>)}
        </p>
      )}
      <div className="mt-3 space-y-2 text-base leading-relaxed text-testo">
        {!testi && <p className="text-testo-2">Carico il testo…</p>}
        {testi && !t?.testo && <p className="text-testo-2">Testo non disponibile: vedi l'SRD{i.srd ? `, p. ${i.srd.pagina}` : ''}.</p>}
        {t?.testo && <TestoSrd testo={t.testo} tabelle={t.tabelle} />}
        {t?.potenziato && <TestoSrd testo={t.potenziato} prima="Trucchetto potenziato." />}
        {t?.superiori && <TestoSrd testo={t.superiori} prima="Con uno slot di livello superiore." />}
      </div>
      <p className="mt-4 text-xs text-testo-2">Testo dall'SRD 5.2.1 in italiano, licenza CC-BY-4.0.</p>
    </FoglioDalBasso>
  );
}
