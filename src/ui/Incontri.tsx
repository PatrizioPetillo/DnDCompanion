// Incontri del master (21/11): prepara i nemici, vede subito la difficoltà per il suo gruppo, poi tira l'iniziativa.
// Dal 23/11 c'è l'elenco dei mostri dell'SRD, solo i numeri; per gli altri il master scrive i suoi (SRD p. 202, 253, 13).
import { useEffect, useState } from 'react';
import type { Incontro, MembroGruppo } from '../archivio/archivio';
import { calcolaScheda } from '../regole';
import {
  budgetGruppo, cambiaPf, cambiaTiro, difficolta, GRADI, NOME_DIFFICOLTA, nomeGrado, peNemici, prossimoTurno, SPIEGA_DIFFICOLTA,
  cambiaCondizioneNemico, scriviTotale, sposta, tiraIniziativa, totale, turnoPrecedente, type Combattimento, type Combattente, type Nemico,
} from '../creazione/incontri';
import { caricaMostri, cercaMostri, daMostro, type Mostro } from '../creazione/mostri';
import { CONDIZIONE, CONDIZIONI, inEffetto, type IdCondizione } from '../partita/condizioni';
import { valePer, type StatoAlTavolo } from '../partita/al-tavolo';
import { DATI } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import type { Car } from '../regole/tipi';
import { semplici, Tendina } from './Tendina';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { SchedaMostro } from './SchedaMostro';

const nuovoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const pe = (n: number) => n.toLocaleString('it-IT');

// I personaggi del gruppo, con i numeri della loro scheda e, dal tavolo collegato, PF, condizioni e iniziativa
// che manda il telefono del giocatore (23/11). Senza tavolo collegato i PF sono quelli pieni della scheda.
export interface InfoPg {
  id: string; nome: string; livello: number; bonus: number; chi: string;
  ca: number; pfMax: number; pfAttuali: number | null; pfTemp: number; percezione: number; cd: number | null;
  ts: { car: Car; totale: number; competente: boolean }[];
  condizioni: { nome: string; inclusa: boolean }[]; concentrazione: string | null;
  morte: StatoAlTavolo['morte'] | null; stato?: StatoAlTavolo; collegato: boolean; aggiornato: string;
}
const CARS: Car[] = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
function personaggi(membri: MembroGruppo[]): InfoPg[] {
  return membri.flatMap((m) => {
    const b = m.bozza;
    if (!b.classe || !b.specie || !b.background) return [];
    try {
      const s = calcolaScheda(b as never);
      const st = m.stato;
      const pfAttuali = st ? Math.max(0, Math.min(s.pf.totale, s.pf.totale - st.pfPersi)) : null;
      const segnate = st?.condizioni ?? [];
      const effetto = inEffetto(segnate, pfAttuali === 0 && !st?.morte.morto);
      const cd = s.magia.map((x) => x.cd?.totale ?? 0).filter(Boolean);
      return [{
        id: m.id, nome: b.nome.trim() || 'Senza nome', livello: b.livello ?? 1, bonus: s.iniziativa.totale,
        chi: `${DATI.specie[b.specie]?.nome ?? b.specie} · ${DATI.classi[b.classe]?.nome ?? b.classe} ${b.livello ?? 1}`,
        ca: s.ca.formule.find((f) => f.id === s.ca.attuale)!.valore.totale, pfMax: s.pf.totale, pfAttuali, pfTemp: st?.pfTemporanei ?? 0,
        percezione: s.percezionePassiva, cd: cd.length ? Math.max(...cd) : null,
        ts: CARS.map((car) => ({ car, totale: s.tiriSalvezza[car].totale, competente: s.tiriSalvezza[car].competente })),
        condizioni: effetto.map((id) => {
          const l = segnate.find((x) => x.id === id)?.livello;
          return { nome: `${CONDIZIONE[id].nome}${l ? ` ${l}` : ''}`, inclusa: !segnate.some((x) => x.id === id) };
        }),
        concentrazione: st?.concentrazione ? DATI.incantesimi[st.concentrazione]?.nome ?? st.concentrazione : null,
        morte: st && pfAttuali === 0 ? st.morte : null, ...(st ? { stato: st } : {}), collegato: !!m.pg, aggiornato: m.ricevuto,
      }];
    } catch { return []; }
  });
}

export function Incontri({ incontri, membri, salva, togli }: {
  incontri: Incontro[]; membri: MembroGruppo[]; salva: (i: Incontro) => void; togli: (id: string) => void;
}) {
  const [aperto, setAperto] = useState<string | null>(null);
  const inc = incontri.find((i) => i.id === aperto);
  const pg = personaggi(membri);
  return (
    <section className="mt-6">
      <h2 className="text-base font-medium text-testo">Incontri</h2>
      <p className="mb-2 text-xs text-testo-2">Scrivi i nemici: vedi quanto è difficile per il tuo gruppo e, al tavolo, l'ordine dei turni.</p>
      {incontri.length > 0 && (
        <ul className="mb-2 overflow-hidden rounded-xl border border-bordo">
          {incontri.map((i) => {
            const d = difficolta(peNemici(i.nemici), budget(i, pg));
            return (
              <li key={i.id} className="border-b border-bordo last:border-b-0">
                <button onClick={() => setAperto(i.id)} className="flex min-h-14 w-full items-center gap-3 bg-superficie px-3 py-2 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base text-testo">{i.nome || 'Incontro senza nome'}</span>
                    <span className="block text-xs text-testo-2">{i.nemici.reduce((t, n) => t + n.quanti, 0)} nemici · {NOME_DIFFICOLTA[d]}{i.combattimento ? ` · round ${i.combattimento.round}` : ''}</span>
                  </span>
                  <span aria-hidden className="text-testo-2">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button onClick={() => { const i: Incontro = { id: nuovoId(), nome: '', nemici: [] }; salva(i); setAperto(i.id); }}
        className="min-h-12 w-full rounded-xl border border-accento text-base text-accento">+ Prepara un incontro</button>
      {inc && <SchedaIncontro inc={inc} pg={pg} salva={salva} chiudi={() => setAperto(null)} togli={() => { togli(inc.id); setAperto(null); }} />}
    </section>
  );
}

function budget(i: Incontro, pg: { livello: number }[]) {
  return budgetGruppo(pg.length ? pg.map((p) => p.livello) : Array.from({ length: i.manuale?.quanti ?? 4 }, () => i.manuale?.livello ?? 1));
}

function SchedaIncontro({ inc, pg, salva, chiudi, togli }: {
  inc: Incontro; pg: InfoPg[];
  salva: (i: Incontro) => void; chiudi: () => void; togli: () => void;
}) {
  const metti = (o: Partial<Incontro>) => salva({ ...inc, ...o });
  const c = inc.combattimento;
  const [mostro, setMostro] = useState<string | null>(null);     // la scheda completa aperta sopra l'incontro
  // L'iniziativa tirata sul telefono del giocatore (tavolo collegato) entra da sola, se è di questo combattimento
  const arrivate = c ? c.ordine.flatMap((x) => {
    if (x.tipo !== 'pg' || (!x.attesa && !x.dalGiocatore)) return [];
    const i = pg.find((p) => `pg:${p.id}` === x.id)?.stato?.iniziativa;
    return i && valePer(i, c.iniziato) && (x.attesa || x.scritto !== i.totale) ? [{ id: x.id, totale: i.totale }] : [];
  }) : [];
  const firmaArrivate = arrivate.map((a) => `${a.id}:${a.totale}`).join(',');
  useEffect(() => {
    if (!c || !arrivate.length) return;
    metti({ combattimento: arrivate.reduce((cc, a) => scriviTotale(cc, a.id, a.totale, true), c) });
  }, [firmaArrivate]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="text-lg font-medium text-testo">{c ? `Round ${c.round}` : 'Prepara l\'incontro'}</h2>}>
      {mostro && <SchedaMostro id={mostro} chiudi={() => setMostro(null)} />}
      {c ? <Combattendo c={c} pg={pg} nemici={inc.nemici} apriMostro={setMostro} cambia={(n) => metti({ combattimento: n })} fine={() => window.confirm('Finire il combattimento?') && metti({ combattimento: undefined })} />
        : <Prepara inc={inc} pg={pg} metti={metti} togli={togli} apriMostro={setMostro} />}
    </FoglioDalBasso>
  );
}

function Prepara({ inc, pg, metti, togli, apriMostro }: { inc: Incontro; pg: InfoPg[]; apriMostro: (id: string) => void; metti: (o: Partial<Incontro>) => void; togli: () => void }) {
  const [elenco, setElenco] = useState(false);
  const b = budget(inc, pg);
  const tot = peNemici(inc.nemici);
  const d = difficolta(tot, b);
  const nemico = (id: string, o: Partial<Nemico>) => metti({ nemici: inc.nemici.map((n) => (n.id === id ? { ...n, ...o } : n)) });
  const campo = 'h-11 rounded-lg border border-bordo bg-sfondo px-2 text-base text-testo';
  const intero = (v: string) => Number(v.replace(/[^\d-]/g, '')) || 0;
  const colore = d === 'oltre' || d === 'alto' ? 'text-attenzione' : 'text-testo';
  // Barra: dove cade il totale rispetto alle soglie (la scala arriva a 1,25 volte l'alta)
  const scala = b.alto * 1.25 || 1, pct = (x: number) => `${Math.min(100, (x / scala) * 100)}%`;
  return (
    <div className="space-y-4">
      <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Nome dell'incontro</span>
        <input value={inc.nome} maxLength={80} onChange={(e) => metti({ nome: e.target.value })} placeholder="Es. L'imboscata al guado" className={`w-full ${campo}`} /></label>

      <div className="rounded-xl border border-bordo bg-superficie p-3" aria-live="polite">
        <p className={`text-base font-medium ${colore}`}>Difficoltà: {NOME_DIFFICOLTA[d]}</p>
        {d !== 'vuoto' && <p className="text-sm text-testo-2">{SPIEGA_DIFFICOLTA[d]}</p>}
        <div className="relative mt-3 h-3 rounded-full bg-bordo" aria-hidden>
          <div className="absolute inset-y-0 left-0 rounded-full bg-accento" style={{ width: pct(tot) }} />
          {[b.basso, b.moderato, b.alto].map((x) => <span key={x} className="absolute -top-1 h-5 w-0.5 bg-testo" style={{ left: pct(x) }} />)}
        </div>
        <p className="mt-2 text-sm text-testo">{pe(tot)} PE di nemici · soglie {pe(b.basso)} / {pe(b.moderato)} / {pe(b.alto)} (bassa, moderata, alta)</p>
        <p className="text-xs text-testo-2">
          {pg.length ? `Per il tuo gruppo: ${pg.length} personaggi (${pg.map((p) => p.nome).join(', ')}). ` : 'Nessuna scheda nel gruppo: scrivi tu quanti sono. '}
          SRD p. 202
        </p>
        {!pg.length && (
          <div className="mt-2 flex gap-3">
            <label className="flex items-center gap-2 text-sm text-testo">Personaggi
              <input inputMode="numeric" value={inc.manuale?.quanti ?? 4} onChange={(e) => metti({ manuale: { quanti: Math.max(1, intero(e.target.value)), livello: inc.manuale?.livello ?? 1 } })} className={`w-14 text-center ${campo}`} /></label>
            <label className="flex items-center gap-2 text-sm text-testo">Livello
              <input inputMode="numeric" value={inc.manuale?.livello ?? 1} onChange={(e) => metti({ manuale: { quanti: inc.manuale?.quanti ?? 4, livello: Math.min(20, Math.max(1, intero(e.target.value))) } })} className={`w-14 text-center ${campo}`} /></label>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-medium text-testo">Nemici</h3>
        {inc.nemici.map((n) => (
          <div key={n.id} className="space-y-2 rounded-xl border border-bordo bg-superficie p-3">
            <div className="flex gap-2">
              <input aria-label="Nome del nemico" value={n.nome} maxLength={60} placeholder="Nome (es. Goblin)" onChange={(e) => nemico(n.id, { nome: e.target.value })} className={`min-w-0 flex-1 ${campo}`} />
              <button onClick={() => metti({ nemici: inc.nemici.filter((x) => x.id !== n.id) })} aria-label={`Togli ${n.nome || 'il nemico'}`} className="h-11 w-11 shrink-0 rounded-lg text-lg text-attenzione">×</button>
            </div>
            <div className="flex items-center justify-between text-sm text-testo">
              <span>Quanti</span>
              <span className="flex items-center gap-1">
                <button onClick={() => nemico(n.id, { quanti: Math.max(1, n.quanti - 1) })} aria-label="Uno in meno" className="h-11 w-11 rounded-full border border-bordo">−</button>
                <span className="w-8 text-center text-base">{n.quanti}</span>
                <button onClick={() => nemico(n.id, { quanti: Math.min(50, n.quanti + 1) })} aria-label="Uno in più" className="h-11 w-11 rounded-full border border-bordo">+</button>
              </span>
            </div>
            {n.mostro && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-testo-2">Dall'SRD · CA {n.ca}{n.immunita?.length ? ` · immune a: ${n.immunita.map(nomeCond).join(', ')}` : ''}</p>
                <button onClick={() => apriMostro(n.mostro!)} className="min-h-11 shrink-0 px-2 text-sm text-accento">Scheda</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs text-testo-2">
              <label className="block">GS
                <select value={n.gs} onChange={(e) => nemico(n.id, { gs: e.target.value })} className={`mt-1 w-full ${campo}`}>
                  {GRADI.map((g) => <option key={g} value={g}>{nomeGrado(g)}</option>)}
                </select></label>
              <label className="block">Iniziativa
                <input inputMode="numeric" value={n.iniziativa} onChange={(e) => nemico(n.id, { iniziativa: intero(e.target.value) })} className={`mt-1 w-full text-center ${campo}`} /></label>
              <label className="block">PF (facoltativi)
                <input inputMode="numeric" value={n.pf ?? ''} placeholder="—" onChange={(e) => { const v = intero(e.target.value); nemico(n.id, { pf: v > 0 ? v : undefined }); }} className={`mt-1 w-full text-center ${campo}`} /></label>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setElenco(true)} className="min-h-12 rounded-xl border border-accento text-base text-accento">+ Dall'SRD</button>
          <button onClick={() => metti({ nemici: [...inc.nemici, { id: nuovoId(), nome: '', gs: '1/4', quanti: 1, iniziativa: 0 }] })}
            className="min-h-12 rounded-xl border border-bordo text-base text-testo">+ Scritto da te</button>
        </div>
        <p className="text-xs text-testo-2">Dall'SRD i numeri si riempiono da soli. Per un mostro di un altro manuale, scrivi GS e bonus all'iniziativa dalla sua scheda.</p>
        {elenco && <ElencoMostri chiudi={() => setElenco(false)} scegli={(m) => {
          // lo stesso mostro già nell'incontro: uno in più, invece di una riga nuova
          const c = inc.nemici.find((x) => x.mostro === m.id);
          metti({ nemici: c ? inc.nemici.map((x) => (x.id === c.id ? { ...x, quanti: Math.min(50, x.quanti + 1) } : x))
            : [...inc.nemici, { id: nuovoId(), quanti: 1, ...daMostro(m) }] });
          setElenco(false);
        }} />}
      </div>

      <button disabled={!inc.nemici.length && !pg.length} onClick={() => metti({ combattimento: tiraIniziativa(pg, inc.nemici) })}
        className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Inizia: tira l'iniziativa dei nemici</button>
      {!pg.length && <p className="text-xs text-testo-2">Senza schede nel gruppo, nell'ordine dei turni ci saranno solo i nemici.</p>}
      <p className="text-xs text-testo-2">Tu tiri per i nemici (i nemici uguali una volta sola); ogni giocatore tira la sua (SRD p. 13). Con il tavolo collegato il totale arriva dal suo telefono, altrimenti scrivi quello che ti dice.</p>
      <button onClick={() => window.confirm(`Eliminare «${inc.nome || 'l\'incontro'}»?`) && togli()} className="min-h-11 w-full text-sm text-attenzione">Elimina l'incontro</button>
    </div>
  );
}

const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

function Frecce({ c, i, nome, cambia }: { c: Combattimento; i: number; nome: string; cambia: (c: Combattimento) => void }) {
  return (
    <span className="flex flex-col">
      <button onClick={() => cambia(sposta(c, i, -1))} disabled={i === 0} aria-label={`Sposta ${nome} su`} className="h-11 w-11 text-testo-2 disabled:opacity-30">▲</button>
      <button onClick={() => cambia(sposta(c, i, 1))} disabled={i === c.ordine.length - 1} aria-label={`Sposta ${nome} giù`} className="h-11 w-11 text-testo-2 disabled:opacity-30">▼</button>
    </span>
  );
}

// Un personaggio nell'ordine dei turni (23/11): il totale lo tira il giocatore; chiuso mostra PF, CA e condizioni,
// aperto (come le schede di Classe, Specie e Background) tutti i numeri che servono al master.
function RigaPg({ x, i, c, info, ora, cambia }: { x: Combattente; i: number; c: Combattimento; info?: InfoPg; ora: boolean; cambia: (c: Combattimento) => void }) {
  const [aperto, setAperto] = useState(false);
  const [testo, setTesto] = useState<string | null>(null);      // mentre il master scrive
  const valore = testo ?? (x.attesa ? '' : String(totale(x)));
  const scrivi = (t: string) => {
    setTesto(t);
    const n = parseInt(t.replace('−', '-'), 10);
    if (t.trim() === '') cambia(scriviTotale(c, x.id, null));
    else if (!Number.isNaN(n)) cambia(scriviTotale(c, x.id, n));
  };
  const pf = info ? (info.pfAttuali ?? info.pfMax) : null;
  const aTerra = info?.pfAttuali === 0;
  const idDettagli = `dettagli-${x.id}`;
  return (
    <li aria-current={ora ? 'step' : undefined} className={`rounded-xl border p-3 ${ora ? 'border-accento bg-accento/10' : 'border-bordo bg-superficie'}`}>
      <div className="flex items-center gap-2">
        <span className="w-9 text-center text-lg font-medium text-testo">{x.attesa ? '—' : totale(x)}</span>
        <button onClick={() => setAperto(!aperto)} aria-expanded={aperto} aria-controls={idDettagli} className="min-h-11 min-w-0 flex-1 text-left">
          <span className="block truncate text-base text-testo">{x.nome}{ora ? ' · tocca a lui' : ''}</span>
          {info && (
            <span className={`block text-xs ${aTerra ? 'text-attenzione' : 'text-testo-2'}`}>
              PF {pf}/{info.pfMax}{info.pfTemp ? ` +${info.pfTemp}` : ''} · CA {info.ca}{info.condizioni.filter((k) => !k.inclusa).length ? ` · ${info.condizioni.filter((k) => !k.inclusa).map((k) => k.nome.toLowerCase()).join(', ')}` : ''}
            </span>
          )}
          <span className="block text-xs text-accento">{aperto ? 'Chiudi i dettagli' : 'Dettagli'}</span>
        </button>
        <Frecce c={c} i={i} nome={x.nome} cambia={cambia} />
      </div>
      <label className="mt-1 flex flex-wrap items-center gap-2 text-xs text-testo-2">
        Iniziativa (la tira il giocatore)
        <input inputMode="numeric" value={valore} placeholder="—" aria-label={`Iniziativa di ${x.nome}`}
          onChange={(e) => scrivi(e.target.value)} onBlur={() => setTesto(null)}
          className="h-11 w-14 rounded border border-bordo bg-sfondo text-center text-base text-testo" />
        <span>{x.attesa ? (info?.collegato ? 'aspetta il tiro: arriva dal suo telefono, o scrivilo tu' : 'scrivi il totale che ti dice') : x.dalGiocatore ? 'dal suo telefono' : `bonus ${segno(x.bonus)}`}</span>
      </label>
      {aperto && info && (
        <div id={idDettagli} className="anim-srotola mt-2 space-y-2 border-t border-bordo pt-2 text-sm">
          <p className="text-xs text-testo-2">{info.chi}</p>
          <div className="grid grid-cols-4 gap-1 text-center">
            {[['CA', info.ca], ['PF', `${pf}/${info.pfMax}`], ['Perc.', info.percezione], ['CD', info.cd ?? '—']].map(([e, v]) => (
              <span key={e} className="rounded-lg bg-sfondo py-1"><span className="block text-base text-testo">{v}</span><span className="block text-xs text-testo-2">{e}</span></span>
            ))}
          </div>
          {info.pfTemp > 0 && <p className="text-testo">PF temporanei: {info.pfTemp}</p>}
          <div>
            <p className="text-xs text-testo-2">Tiri salvezza</p>
            <p className="grid grid-cols-3 gap-x-2 text-testo">
              {info.ts.map((t) => <span key={t.car}>{NOME_CAR[t.car].slice(0, 3)} {segno(t.totale)}{t.competente ? ' ●' : ''}</span>)}
            </p>
          </div>
          <p className="text-testo"><span className="text-testo-2">Condizioni: </span>
            {info.condizioni.length ? info.condizioni.map((k) => k.inclusa ? `${k.nome.toLowerCase()} (inclusa)` : k.nome.toLowerCase()).join(', ') : 'nessuna'}</p>
          {info.concentrazione && <p className="text-testo"><span className="text-testo-2">In concentrazione: </span><em>{info.concentrazione}</em></p>}
          {info.morte && (
            <p className="text-attenzione">{info.morte.morto ? 'Morto' : info.morte.stabile ? 'A 0 PF, stabile' : `A 0 PF: tiri contro la morte ${info.morte.successi} successi, ${info.morte.fallimenti} fallimenti`}</p>
          )}
          <p className="text-xs text-testo-2">
            {info.stato ? `PF e condizioni dal telefono del giocatore, aggiornati alle ${new Date(info.aggiornato).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}.`
              : 'Senza tavolo collegato: PF pieni e condizioni dalla scheda ricevuta, non aggiornati durante la partita.'}
          </p>
        </div>
      )}
      {aperto && !info && <p id={idDettagli} className="mt-2 text-xs text-testo-2">La scheda di questo personaggio non è più nel gruppo.</p>}
    </li>
  );
}

function Combattendo({ c, pg, nemici, apriMostro, cambia, fine }: {
  c: Combattimento; pg: InfoPg[]; nemici: Nemico[]; apriMostro: (id: string) => void; cambia: (c: Combattimento) => void; fine: () => void;
}) {
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {c.ordine.map((x, i) => {
          const ora = i === c.turno;
          if (x.tipo === 'pg') return <RigaPg key={x.id} x={x} i={i} c={c} ora={ora} cambia={cambia} info={pg.find((p) => `pg:${p.id}` === x.id)} />;
          return (
            <li key={x.id} aria-current={ora ? 'step' : undefined}
              className={`rounded-xl border p-3 ${ora ? 'border-accento bg-accento/10' : 'border-bordo bg-superficie'}`}>
              <div className="flex items-center gap-2">
                <span className="w-9 text-center text-lg font-medium text-testo">{totale(x)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-testo">{x.quanti && x.quanti > 1 ? `${x.quanti} × ` : ''}{x.nome}{ora ? ' · tocca a lui' : ''}</span>
                  {x.ca && <span className="block text-xs text-testo-2">CA {x.ca}</span>}
                  {(() => { const id = nemici.find((n) => `n:${n.id}` === x.id)?.mostro; return id ? (
                    <button onClick={() => apriMostro(id)} className="min-h-11 text-sm text-accento">Scheda: azioni e tratti</button>) : null; })()}
                  <label className="flex items-center gap-1 text-xs text-testo-2">d20
                    <input inputMode="numeric" value={x.tiro} aria-label={`d20 di ${x.nome}`} onChange={(e) => cambia(cambiaTiro(c, x.id, Number(e.target.value) || 1))}
                      className="h-11 w-12 rounded border border-bordo bg-sfondo text-center text-base text-testo" /> {segno(x.bonus)}</label>
                </span>
                <Frecce c={c} i={i} nome={x.nome} cambia={cambia} />
              </div>
              {x.tipo === 'nemico' && <CondizioniNemico x={x} cambia={(k, cond, si) => cambia(cambiaCondizioneNemico(c, x.id, k, cond, si))} />}
              {x.pf && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {x.pf.map((v, k) => (
                    <label key={k} className={`flex items-center gap-1 rounded-lg border px-2 text-sm ${v === 0 ? 'border-bordo text-testo-2 line-through' : 'border-bordo text-testo'}`}>
                      {x.pf!.length > 1 ? `${k + 1}:` : 'PF'}
                      <input inputMode="numeric" value={v} aria-label={`PF di ${x.nome} ${k + 1}`} onChange={(e) => cambia(cambiaPf(c, x.id, k, Number(e.target.value) || 0))}
                        className="h-11 w-12 bg-transparent text-center text-base" />/{x.pfMax}
                    </label>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => cambia(turnoPrecedente(c))} className="h-12 rounded-xl border border-bordo text-base text-testo">Indietro</button>
        <button onClick={() => cambia(prossimoTurno(c))} className="col-span-2 h-12 rounded-xl bg-accento text-base font-medium text-su-accento">Prossimo turno</button>
      </div>
      <p className="text-xs text-testo-2">Parità: tra mostri e personaggi decidi tu, tra personaggi decidono i giocatori (SRD p. 13). Usa le frecce.</p>
      <button onClick={fine} className="min-h-11 w-full text-sm text-attenzione">Fine del combattimento</button>
    </div>
  );
}

const nomeCond = (id: IdCondizione) => CONDIZIONI.find((c) => c.id === id)?.nome.toLowerCase() ?? id;

// L'elenco dei mostri dell'SRD: ricerca per nome (anche inglese) e grado di sfida. Solo i numeri della scheda.
function ElencoMostri({ chiudi, scegli }: { chiudi: () => void; scegli: (m: Mostro) => void }) {
  const [tutti, setTutti] = useState<Mostro[] | null>(null);
  const [q, setQ] = useState('');
  const [gs, setGs] = useState('');
  useEffect(() => { void caricaMostri().then(setTutti); }, []);
  const lista = tutti ? cercaMostri(tutti, q, gs) : [];
  const gradi = tutti ? GRADI.filter((g) => g !== '0*' && tutti.some((m) => m.gs === g)) : [];
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="text-lg font-medium text-testo">Mostri dell'SRD</h2>}>
      <div className="space-y-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca (anche in inglese)" aria-label="Cerca un mostro"
          className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" />
        <Tendina etichetta="Grado di sfida" valore={gs || 'tutti'} opzioni={semplici([{ id: 'tutti', nome: 'Tutti' }, ...gradi.map((g) => ({ id: g, nome: g }))])} cambia={(v) => setGs(v === 'tutti' ? '' : v)} />
        {!tutti ? <p className="text-sm text-testo-2">Carico l'elenco…</p> : (
          <>
            <p className="text-xs text-testo-2">{lista.length} mostri · tocca per aggiungerlo all'incontro</p>
            <ul className="overflow-hidden rounded-xl border border-bordo">
              {lista.slice(0, 80).map((m) => (
                <li key={m.id} className="border-b border-bordo last:border-b-0">
                  <button onClick={() => scegli(m)} className="w-full px-3 py-2 text-left">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-base text-testo">{m.nome}</span>
                      <span className="shrink-0 text-sm text-testo-2">GS {m.gs}</span>
                    </span>
                    <span className="block text-xs text-testo-2">{m.tipo}</span>
                    <span className="block text-xs text-testo">CA {m.ca} · PF {m.pf} ({m.dadiPf}) · Iniziativa {m.iniziativa >= 0 ? '+' : '−'}{Math.abs(m.iniziativa)}{m.srd?.pagina ? ` · SRD p. ${m.srd.pagina}` : ' · SRD 5.2.1'}</span>
                  </button>
                </li>
              ))}
            </ul>
            {lista.length > 80 && <p className="text-xs text-testo-2">Ne vedi 80: scrivi qualche lettera del nome o scegli il grado di sfida.</p>}
          </>
        )}
        <p className="text-xs text-testo-2">Nell'incontro, «Scheda» apre azioni, tratti e reazioni del mostro come nell'SRD.</p>
      </div>
    </FoglioDalBasso>
  );
}

// Le condizioni di un nemico in combattimento: una tendina per aggiungerle, le immunità spente
function CondizioniNemico({ x, cambia }: { x: { nome: string; quanti?: number; immunita?: IdCondizione[]; condizioni?: IdCondizione[][] }; cambia: (k: number, c: IdCondizione, si: boolean) => void }) {
  const quanti = x.quanti ?? 1;
  return (
    <div className="mt-2 space-y-2">
      {Array.from({ length: quanti }, (_, k) => {
        const segnate = x.condizioni?.[k] ?? [];
        return (
          <div key={k} className="flex flex-wrap items-center gap-1">
            {quanti > 1 && <span className="w-6 text-xs text-testo-2">{k + 1}:</span>}
            {segnate.map((id) => (
              <button key={id} onClick={() => cambia(k, id, false)} aria-label={`Togli ${nomeCond(id)} da ${x.nome}${quanti > 1 ? ` ${k + 1}` : ''}`}
                className="min-h-11 rounded-full border border-attenzione px-3 text-sm text-attenzione">{nomeCond(id)} ×</button>
            ))}
            <select value="" aria-label={`Aggiungi una condizione a ${x.nome}${quanti > 1 ? ` ${k + 1}` : ''}`} onChange={(e) => e.target.value && cambia(k, e.target.value as IdCondizione, true)}
              className="h-11 rounded-lg border border-bordo bg-sfondo px-2 text-sm text-testo-2">
              <option value="">+ Condizione</option>
              {CONDIZIONI.filter((c) => !segnate.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id} disabled={x.immunita?.includes(c.id)}>{c.nome}{x.immunita?.includes(c.id) ? ' (immune)' : ''}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
