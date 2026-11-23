// La finestra dei dadi (idea 6, 23/11): si apre già tirata, con vantaggio o svantaggio proposti dalle condizioni.
// Il dado gira mezzo secondo e i numeri scorrono; con «riduci movimento» il risultato compare subito.
// Regole in partita/dadi.ts (SRD p. 6-8, 16, 181). Il giocatore può sempre tirare i suoi dadi veri: qui è un aiuto.
import { useEffect, useRef, useState } from 'react';
import { combinaModo, tiraD20, tiraEspressione, type Modo, type TiroD20, type TiroDanni } from '../partita/dadi';
import { perTiro, type CondizioneSegnata } from '../partita/condizioni';
import { NOME_CAR } from '../regole/dati/base';
import type { RichiestaTiro } from '../partita/tiri';
import { testoEspressione } from '../partita/tiri';
import { FoglioDalBasso } from './SchedaIncantesimo';

const ridotto = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const segno = (n: number) => (n >= 0 ? `+ ${n}` : `− ${-n}`);
const NOMI_MODO: Record<Modo, string> = { normale: 'Normale', vantaggio: 'Vantaggio', svantaggio: 'Svantaggio' };

// Il numero che scorre: per mezzo secondo valori a caso tra min e max, poi quello vero.
// Si rimonta a ogni tiro (key), così parte da sé senza aggiornare lo stato dentro l'effetto.
function Risultato({ valore, min, max, piccolo = false }: { valore: number; min: number; max: number; piccolo?: boolean }) {
  const [gira, setGira] = useState(() => !ridotto());
  const [mostrato, setMostrato] = useState(() => (ridotto() ? valore : min));
  useEffect(() => {
    if (!gira) return;
    const t = setInterval(() => setMostrato(min + Math.floor(Math.random() * (max - min + 1))), 50);
    const fine = setTimeout(() => { clearInterval(t); setMostrato(valore); setGira(false); }, 500);
    return () => { clearInterval(t); clearTimeout(fine); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className={`inline-block ${gira ? 'anim-dado' : ''}`}><IconaD20 grande={!piccolo} /></span>
      <span className={`${piccolo ? 'text-3xl' : 'text-5xl'} font-titolo tabular-nums text-accento ${gira ? 'opacity-60' : 'anim-risultato'}`}>{gira ? mostrato : valore}</span>
    </span>
  );
}

export function Tiro({ r, condizioni = [], pfZero = false, chiudi }: { r: RichiestaTiro; condizioni?: CondizioneSegnata[]; pfZero?: boolean; chiudi: () => void }) {
  const daCond = r.d20 ? perTiro(condizioni, pfZero, r.d20.genere) : null;
  const proposta = daCond && r.d20?.svantaggio ? { ...daCond, svantaggi: [...daCond.svantaggi, r.d20.svantaggio] } : daCond;
  const modoProposto = proposta ? combinaModo(proposta.vantaggi.length, proposta.svantaggi.length) : 'normale';
  const [modo, setModo] = useState<Modo>(modoProposto);
  // si apre già tirata, con il modo proposto
  const [d20, setD20] = useState<TiroD20 | null>(() => (r.d20 && !proposta?.fallitoAuto
    ? tiraD20(r.d20.bonus, modoProposto, { attacco: r.d20.attacco, meno: proposta?.meno ?? 0 }) : null));
  const [danni, setDanni] = useState<Record<number, TiroDanni[]>>({});
  const [critico, setCritico] = useState(() => !!d20?.critico);
  const [n, setN] = useState(0);                        // cambia a ogni tiro: fa ripartire l'animazione
  const annuncio = useRef<HTMLParagraphElement>(null);

  const tira = (m: Modo) => {
    if (!r.d20 || proposta?.fallitoAuto) return;
    const t = tiraD20(r.d20.bonus, m, { attacco: r.d20.attacco, meno: proposta?.meno ?? 0 });
    setD20(t); setCritico(t.critico); setDanni({}); setN((x) => x + 1);
  };

  const tiraDanni = (k: number) => {
    const v = r.danni[k];
    const volte = v.ripeti ?? 1;
    setDanni((d) => ({ ...d, [k]: Array.from({ length: volte }, () => tiraEspressione(v.espressione, { critico: critico && !v.cura && !v.temporanei })) }));
    setN((x) => x + 1);
  };

  const esito = d20 && r.d20?.attacco ? (d20.critico ? '20 naturale: colpisce sempre ed è un colpo critico (SRD p. 7)' : d20.mancato ? '1 naturale: manca sempre (SRD p. 7)' : null) : null;
  const perche = proposta && (proposta.vantaggi.length || proposta.svantaggi.length)
    ? [proposta.vantaggi.length ? `vantaggio da ${proposta.vantaggi.join(', ')}` : '', proposta.svantaggi.length ? `svantaggio da ${proposta.svantaggi.join(', ')}` : ''].filter(Boolean).join(' e ')
    : null;

  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<div><h2 className="text-lg font-medium text-testo">{r.titolo}</h2>{r.sottotitolo && <p className="text-sm text-testo-2">{r.sottotitolo}</p>}</div>}>
      <div className="space-y-4">
        {r.d20 && (
          <section aria-label={r.d20.etichetta} className="rounded-xl border border-bordo bg-superficie p-3">
            <p className="text-sm text-testo-2">{r.d20.etichetta}</p>
            {proposta?.fallitoAuto ? (
              <p className="mt-2 text-base text-attenzione">Fallito in automatico: sei {proposta.fallitoAuto} (SRD p. 186-191). Non si tira.</p>
            ) : d20 && (
              <>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Risultato key={n} valore={d20.totale} min={1 + d20.bonus - d20.meno} max={20 + d20.bonus - d20.meno} />
                </div>
                <p className="mt-1 text-sm text-testo">
                  d20: {d20.dadi.length > 1 ? <>{d20.dadi.map((x, i) => {
                    const tenuto = i === (d20.dadi[0] === d20.tenuto ? 0 : 1);
                    return <span key={i}>{i > 0 && ' e '}<span className={tenuto ? 'font-medium' : 'text-testo-2 line-through'}>{x}</span></span>;
                  })} <span className="text-testo-2">({d20.modo})</span></> : d20.tenuto}
                  {' '}{segno(d20.bonus)}{d20.meno ? ` ${segno(-d20.meno)} indebolimento` : ''} = <strong>{d20.totale}</strong>
                </p>
                {esito && <p className={`mt-1 text-sm font-medium ${d20.critico ? 'text-accento' : 'text-attenzione'}`}>{esito}</p>}
              </>
            )}
            {!proposta?.fallitoAuto && (
              <>
                <div role="radiogroup" aria-label="Come tiri" className="mt-3 grid grid-cols-3 gap-2">
                  {(['normale', 'vantaggio', 'svantaggio'] as Modo[]).map((m) => (
                    <button key={m} role="radio" aria-checked={modo === m} onClick={() => { setModo(m); tira(m); }}
                      className={`min-h-11 rounded-lg text-sm ${modo === m ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}>{NOMI_MODO[m]}</button>
                  ))}
                </div>
                {perche && <p className="mt-1 text-xs text-testo-2">Proposto dalle tue condizioni: {perche}. Due fonti opposte si annullano (SRD p. 7).</p>}
                <button onClick={() => tira(modo)} className="mt-2 min-h-11 w-full rounded-lg border border-accento text-base text-accento">Tira di nuovo</button>
              </>
            )}
          </section>
        )}

        {r.cd && (
          <p className="rounded-xl border border-bordo bg-superficie p-3 text-sm text-testo">
            Il bersaglio fa un tiro salvezza su {NOME_CAR[r.cd.car]} contro la tua <strong>CD {r.cd.valore}</strong>: lo tira il master.
          </p>
        )}

        {r.danni.map((v, k) => {
          const tiri = danni[k];
          const tot = tiri?.reduce((s, t) => s + t.totale, 0);
          const doppio = critico && !v.cura && !v.temporanei;
          return (
            <section key={k} aria-label={v.etichetta} className="rounded-xl border border-bordo bg-superficie p-3">
              <button onClick={() => tiraDanni(k)} className="min-h-11 w-full rounded-lg bg-accento px-3 text-base font-medium text-su-accento">
                Tira {v.etichetta.toLowerCase()}: {v.ripeti ? `${v.ripeti} × ` : ''}{testoEspressione(doppio ? { ...v.espressione, gruppi: v.espressione.gruppi.map((g) => ({ ...g, n: g.n * 2 })) } : v.espressione)}{v.tipo ? ` ${v.tipo}` : v.cura ? ' PF' : ''}
              </button>
              {tiri && (
                <div className="mt-2">
                  <Risultato key={n} valore={tot!} min={0} max={Math.max(1, tot! * 2)} piccolo />
                  <p className="mt-1 text-sm text-testo">
                    {tiri.map((t, i) => <span key={i}>{i > 0 ? ' · ' : ''}{t.dadi.map((d) => d.valore).join(' + ')}{t.piu ? ` ${segno(t.piu)}` : ''}{tiri.length > 1 ? ` = ${t.totale}` : ''}</span>)}
                    {' '}{v.cura ? 'PF recuperati' : v.temporanei ? 'PF temporanei' : `danni${v.tipo ? ` ${v.tipo}` : ''}`}{doppio ? ' (critico: dadi doppi, modificatore una volta, SRD p. 16)' : ''}
                  </p>
                </div>
              )}
            </section>
          );
        })}
        {r.danni.length > 0 && r.d20?.attacco && (
          <label className="flex min-h-11 items-center gap-2 text-sm text-testo">
            <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} className="h-5 w-5 accent-[var(--accento)]" />
            Colpo critico (anche quando il master te lo dice, per esempio contro un bersaglio paralizzato)
          </label>
        )}
        {r.nota && <p className="text-sm text-testo-2">{r.nota}</p>}
        <p ref={annuncio} className="sr-only" aria-live="polite">{d20 ? `${r.d20?.etichetta}: ${d20.totale}` : ''}</p>
        <p className="text-xs text-testo-2">Puoi sempre tirare i tuoi dadi veri: qui c'è lo stesso calcolo.</p>
      </div>
    </FoglioDalBasso>
  );
}

export const IconaD20 = ({ grande = false }: { grande?: boolean }) => (
  <svg width={grande ? 44 : 32} height={grande ? 44 : 32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="text-oro" aria-hidden="true">
    <path d="M12 2 21 7v10l-9 5-9-5V7z" /><path d="M12 2 7.5 9.5h9zM3 7l4.5 2.5L3 17M21 7l-4.5 2.5L21 17M7.5 9.5 12 17l4.5-7.5M12 17v5M3 17l9 0 9 0" />
  </svg>
);
