// Eventi dal master (22/11). Lato giocatore: ascolta il canale dei suoi personaggi, applica, mostra cosa è successo con «Annulla»,
// chiede l'esito dei tiri salvezza. Lato master: manda danni, cure, condizioni e tiri salvezza a chi è nel gruppo.
import { useEffect, useRef, useState } from 'react';
import type { Archivio, MembroGruppo } from '../archivio/archivio';
import { annulla, riceviEventi, rispondiTs, type Avviso } from '../partita/canale';
import { CONDIZIONI, effettoTs, type IdCondizione } from '../partita/condizioni';
import { descrivi, NOME_CAR, type Evento } from '../partita/eventi';
import { calcolaScheda } from '../regole';
import type { Car, Personaggio } from '../regole/tipi';
import { idDaSegreto } from '../sblocchi/cifra';
import { ascoltaCanale, cercaEventi, mandaEvento, servizioAttivo } from '../sblocchi/servizio';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { casuale } from '../partita/dadi';

// ───────── Giocatore ─────────
export function useEventi(archivio: Archivio, setArchivio: (f: (a: Archivio) => Archivio) => void) {
  const [avvisi, setAvvisi] = useState<(Avviso & { chiave: number })[]>([]);
  const ultimo = useRef(archivio);
  useEffect(() => { ultimo.current = archivio; }, [archivio]);
  const collegati = archivio.personaggi.filter((p) => p.canale).map((p) => `${p.id}:${p.canale!.id}`).sort().join(',');

  useEffect(() => {
    if (!collegati || !servizioAttivo()) return;
    const coppie = collegati.split(',').map((x) => x.split(':') as [string, string]);
    const arrivate = (pgId: string, voci: Parameters<typeof riceviEventi>[2]) => {
      const r = riceviEventi(ultimo.current, pgId, voci);
      if (r.archivio === ultimo.current) return;
      ultimo.current = r.archivio;
      setArchivio(() => r.archivio);
      if (r.avvisi.length) setAvvisi((v) => [...v, ...r.avvisi.map((x, i) => ({ ...x, chiave: Date.now() + i }))].slice(-4));
    };
    const controlla = () => coppie.forEach(([pg, id]) => {
      const dopo = ultimo.current.personaggi.find((p) => p.id === pg)?.ultimoEvento ?? 0;
      void cercaEventi(id, dopo).then((v) => { if (v.length) arrivate(pg, v); });
    });
    controlla();
    const visibile = () => { if (document.visibilityState === 'visible') controlla(); };
    window.addEventListener('online', controlla);
    document.addEventListener('visibilitychange', visibile);
    const stop = coppie.map(([pg, id]) => ascoltaCanale(id, (v) => arrivate(pg, [v])));
    return () => { window.removeEventListener('online', controlla); document.removeEventListener('visibilitychange', visibile); stop.forEach((f) => f()); };
  }, [collegati, setArchivio]);

  const togliAvviso = (chiave: number) => setAvvisi((v) => v.filter((x) => x.chiave !== chiave));
  const aggiungiAvviso = (a: Avviso) => setAvvisi((v) => [...v, { ...a, chiave: Date.now() }].slice(-4));
  return { avvisi, togliAvviso, aggiungiAvviso };
}

export function AvvisiMaster({ archivio, setArchivio, avvisi, togli, aggiungi }: {
  archivio: Archivio; setArchivio: (f: (a: Archivio) => Archivio) => void;
  avvisi: (Avviso & { chiave: number })[]; togli: (chiave: number) => void; aggiungi: (a: Avviso) => void;
}) {
  const attese = archivio.personaggi.flatMap((p) => (p.inAttesa ?? []).map((e) => ({ p, e })));
  if (!avvisi.length && !attese.length) return null;
  return (
    <div className="mb-4 space-y-2" aria-live="polite">
      {attese.map(({ p, e }) => <TiroSalvezza key={`${p.id}-${e.seq}`} nome={p.bozza.nome.trim() || 'Il tuo personaggio'} p={p} ev={e.evento}
        rispondi={(esito) => { const r = rispondiTs(archivio, p.id, e.seq, esito); setArchivio(() => r.archivio); if (r.avviso) aggiungi(r.avviso); }} />)}
      {avvisi.map((a) => (
        <div key={a.chiave} className="anim-srotola flex items-center gap-2 rounded-xl border border-oro bg-superficie p-3">
          <p className="min-w-0 flex-1 text-sm text-testo"><span className="text-testo-2">Dal master a {a.nome}: </span>{a.testo}</p>
          <button onClick={() => { const n = annulla(archivio, a); if (n) setArchivio(() => n); togli(a.chiave); }} className="min-h-11 px-2 text-sm text-accento">Annulla</button>
          <button onClick={() => togli(a.chiave)} aria-label="Chiudi" className="h-11 w-9 text-lg text-testo-2">×</button>
        </div>
      ))}
    </div>
  );
}

function TiroSalvezza({ nome, p, ev, rispondi }: { nome: string; p: Archivio['personaggi'][number]; ev: Evento; rispondi: (e: 'riuscito' | 'fallito') => void }) {
  const [tiro, setTiro] = useState<string | null>(null);
  const [esito, setEsito] = useState<'riuscito' | 'fallito' | null>(null);
  if (ev.tipo !== 'ts') return null;
  let bonus = 0;
  try { bonus = calcolaScheda(p.bozza as Personaggio).tiriSalvezza[ev.car as Car].totale; } catch { /* scheda incompleta */ }
  let pfZero = false;
  try { pfZero = p.partita.pfPersi >= calcolaScheda(p.bozza as Personaggio).pf.totale; } catch { /* idem */ }
  const eff = effettoTs(p.partita.condizioni ?? [], pfZero, ev.car);
  const totaleBonus = bonus - eff.meno;
  const tira = () => {
    if (eff.fallitoAuto) { setTiro('Fallito in automatico per una condizione (SRD p. 177-191).'); setEsito('fallito'); return; }
    const d = [casuale(20), casuale(20)];
    const d20 = eff.svantaggio ? Math.min(...d) : d[0];
    const tot = d20 + totaleBonus;
    setEsito(tot >= ev.cd ? 'riuscito' : 'fallito');
    setTiro(`${eff.svantaggio ? `d20 con svantaggio (${d[0]}, ${d[1]}): ${d20}` : `d20: ${d20}`} ${totaleBonus >= 0 ? '+' : '−'} ${Math.abs(totaleBonus)} = ${tot}: ${tot >= ev.cd ? 'riuscito' : 'fallito'}.`);
  };
  return (
    <div className="space-y-2 rounded-xl border border-attenzione bg-superficie p-3">
      <p className="text-sm text-testo"><span className="text-testo-2">Dal master a {nome}: </span>{descrivi(ev)}.</p>
      <p className="text-xs text-testo-2">Il tuo tiro salvezza su {NOME_CAR[ev.car]}: {totaleBonus >= 0 ? '+' : '−'}{Math.abs(totaleBonus)}
        {eff.meno ? ` (con −${eff.meno} di indebolimento)` : ''}{eff.svantaggio ? ', con svantaggio' : ''}{eff.fallitoAuto ? '; per una tua condizione lo fallisci in automatico' : ''}.</p>
      {tiro && <p className="text-sm font-medium text-testo">{tiro} Tocca l'esito per applicarlo (o ritira, se hai l'Ispirazione eroica).</p>}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={tira} className="min-h-11 rounded-lg border border-bordo text-sm text-testo">Tira per me</button>
        <button onClick={() => rispondi('riuscito')} disabled={eff.fallitoAuto} className={`min-h-11 rounded-lg border border-ok text-sm disabled:opacity-40 ${esito === 'riuscito' ? 'bg-ok font-medium text-sfondo' : 'text-testo'}`}>Riuscito</button>
        <button onClick={() => rispondi('fallito')} className={`min-h-11 rounded-lg border border-attenzione text-sm ${esito === 'fallito' ? 'bg-attenzione font-medium text-sfondo' : 'text-testo'}`}>Fallito</button>
      </div>
    </div>
  );
}

// ───────── Master ─────────
type Tipo = 'danno' | 'cura' | 'temporanei' | 'condizione' | 'ts';
const CARS: Car[] = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];

export function MandaEventi({ membri, nomeTavolo }: { membri: MembroGruppo[]; nomeTavolo: string }) {
  const [aperto, setAperto] = useState(false);
  const collegati = membri.filter((m) => m.canale);
  const [scelti, setScelti] = useState<string[]>([]);
  const [tipo, setTipo] = useState<Tipo>('danno');
  const [n, setN] = useState('');
  const [nota, setNota] = useState('');
  const [critico, setCritico] = useState(false);
  const [cond, setCond] = useState<IdCondizione | ''>('');
  const [toglie, setToglie] = useState(false);
  const [car, setCar] = useState<Car>('DES');
  const [cd, setCd] = useState('13');
  const [meta, setMeta] = useState(true);
  const [stato, setStato] = useState<string | null>(null);
  if (!servizioAttivo() || !membri.length) return null;
  const num = Number(n.replace(/\D/g, '')) || 0;
  const evento = (): Evento | null => {
    const x = nota.trim() ? { nota: nota.trim().slice(0, 80) } : {};
    if (tipo === 'danno') return num ? { tipo, n: num, ...(critico ? { critico: true } : {}), ...x } : null;
    if (tipo === 'cura' || tipo === 'temporanei') return num ? { tipo, n: num, ...x } : null;
    if (tipo === 'condizione') return cond ? { tipo, id: cond, ...(toglie ? { togli: true } : {}), ...x } : null;
    const c = Number(cd) || 0;
    return c && (num || cond) ? { tipo: 'ts', car, cd: c, ...(num ? { n: num, ...(meta ? { meta: true } : {}) } : {}), ...(cond ? { condizione: cond } : {}), ...x } : null;
  };
  const e = evento();
  const manda = async () => {
    if (!e) return;
    setStato('Mando…');
    const esiti = await Promise.all(collegati.filter((m) => scelti.includes(m.id)).map(async (m) => [m.bozza.nome, await mandaEvento(await idDaSegreto(m.canale!), m.canale!, { ...e, tavolo: nomeTavolo })] as const));
    const ko = esiti.filter(([, ok]) => !ok).map(([nome]) => nome);
    setStato(ko.length ? `Non arrivato a: ${ko.join(', ')}. Controlla la connessione e riprova.` : `Mandato a ${esiti.length === 1 ? esiti[0][0] : `${esiti.length} personaggi`}.`);
    if (!ko.length) { setN(''); setNota(''); setCritico(false); }
  };
  const campo = 'h-11 rounded-lg border border-bordo bg-sfondo px-2 text-base text-testo';
  return (
    <>
      <button onClick={() => { setScelti(collegati.map((m) => m.id)); setStato(null); setAperto(true); }}
        className="mt-2 min-h-12 w-full rounded-xl border border-accento text-base text-accento">Danni, cure e condizioni ai giocatori</button>
      {aperto && (
        <FoglioDalBasso chiudi={() => setAperto(false)} titolo={<><h2 className="text-lg font-medium text-testo">Al gruppo</h2><p className="text-sm text-testo-2">Arriva sul telefono del giocatore, che può annullare</p></>}>
          <div className="space-y-3">
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-testo">A chi</legend>
              {membri.map((m) => (
                <label key={m.id} className={`flex min-h-11 items-center gap-2 text-base ${m.canale ? 'text-testo' : 'text-testo-2'}`}>
                  <input type="checkbox" disabled={!m.canale} checked={scelti.includes(m.id)} onChange={(ev) => setScelti(ev.target.checked ? [...scelti, m.id] : scelti.filter((x) => x !== m.id))}
                    className="h-5 w-5 accent-[var(--accento)]" />
                  {m.bozza.nome.trim() || 'Senza nome'}{!m.canale && <span className="text-xs"> · non collegato: deve rimandarti il link della scheda</span>}
                </label>
              ))}
            </fieldset>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cosa mandi">
              {([['danno', 'Danno'], ['cura', 'Cura'], ['temporanei', 'PF temp.'], ['condizione', 'Condizione'], ['ts', 'Tiro salvezza']] as [Tipo, string][]).map(([t, et]) => (
                <button key={t} role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)}
                  className={`min-h-11 rounded-lg border text-sm ${tipo === t ? 'border-accento bg-accento text-su-accento' : 'border-bordo text-testo'}`}>{et}</button>
              ))}
            </div>
            {tipo === 'ts' && (
              <div className="flex gap-2">
                <select aria-label="Caratteristica" value={car} onChange={(ev) => setCar(ev.target.value as Car)} className={`flex-1 ${campo}`}>
                  {CARS.map((c) => <option key={c} value={c}>{NOME_CAR[c]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-testo">CD
                  <input inputMode="numeric" value={cd} onChange={(ev) => setCd(ev.target.value.replace(/\D/g, ''))} className={`w-16 text-center ${campo}`} /></label>
              </div>
            )}
            {(tipo === 'danno' || tipo === 'cura' || tipo === 'temporanei' || tipo === 'ts') && (
              <label className="flex items-center justify-between gap-2 text-sm text-testo">{tipo === 'ts' ? 'Danni se fallisce (facoltativi)' : 'Quanti PF'}
                <input inputMode="numeric" value={n} onChange={(ev) => setN(ev.target.value)} className={`w-20 text-center ${campo}`} /></label>
            )}
            {tipo === 'danno' && <label className="flex min-h-11 items-center gap-2 text-sm text-testo"><input type="checkbox" checked={critico} onChange={(ev) => setCritico(ev.target.checked)} className="h-5 w-5 accent-[var(--accento)]" />Colpo critico (conta per chi è a 0 PF)</label>}
            {tipo === 'ts' && num > 0 && <label className="flex min-h-11 items-center gap-2 text-sm text-testo"><input type="checkbox" checked={meta} onChange={(ev) => setMeta(ev.target.checked)} className="h-5 w-5 accent-[var(--accento)]" />Metà danni se riesce ({Math.floor(num / 2)})</label>}
            {(tipo === 'condizione' || tipo === 'ts') && (
              <select aria-label="Condizione" value={cond} onChange={(ev) => setCond(ev.target.value as IdCondizione | '')} className={`w-full ${campo}`}>
                <option value="">{tipo === 'ts' ? 'Nessuna condizione se fallisce' : 'Scegli la condizione…'}</option>
                {CONDIZIONI.map((c) => <option key={c.id} value={c.id}>{tipo === 'ts' ? `Se fallisce: ${c.nome.toLowerCase()}` : c.nome}</option>)}
              </select>
            )}
            {tipo === 'condizione' && <label className="flex min-h-11 items-center gap-2 text-sm text-testo"><input type="checkbox" checked={toglie} onChange={(ev) => setToglie(ev.target.checked)} className="h-5 w-5 accent-[var(--accento)]" />Toglila invece di metterla</label>}
            <input value={nota} maxLength={80} onChange={(ev) => setNota(ev.target.value)} placeholder="Da cosa (facoltativo), es. Palla di fuoco" aria-label="Da cosa" className={`w-full ${campo}`} />
            {e && <p className="text-sm text-testo-2">Arriverà così: «{descrivi(e)}».</p>}
            <button disabled={!e || !scelti.length} onClick={() => void manda()} className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Manda</button>
            {stato && <p role="status" className="text-sm text-testo">{stato}</p>}
          </div>
        </FoglioDalBasso>
      )}
    </>
  );
}
