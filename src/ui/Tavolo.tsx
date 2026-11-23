// Uso al tavolo, dentro la scheda del Riepilogo (sezione 6.2): riposi, PF attuali, pallini delle risorse,
// slot da spuntare e «Cosa posso lanciare adesso?» con la concentrazione. La logica è in partita/partita.ts.
import { useState } from 'react';
import { azzeraMorte, cura, danno, fineConcentrazione, tiroMorte, lancia, modiDiLancio, riposoBreve, riposoLungo, segnaGratuito, segnaPatto, segnaRisorsa, segnaSlot,
  spendiDadoVita, temporanei, vista, type StatoPartita, type VistaPartita } from '../partita/partita';
import { DATI } from '../regole';
import type { Id, MagiaCalcolata, Scheda } from '../regole/tipi';
import type { Bozza } from '../creazione/percorso';
import { dopoIlLancio, mancaComponente } from '../partita/componenti';
import { cambia as cambiaIncantesimo, cambiati, cambiDopoRiposoLungo, sostituti, type CambioPossibile } from '../partita/riposo-incantesimi';
import { Tendina } from './Tendina';
import { FoglioDalBasso, SchedaIncantesimo } from './SchedaIncantesimo';
import { DADI_INCANTESIMI, testoDadi } from '../regole/dati/dadi-incantesimi';
import { daIncantesimo, type RichiestaTiro } from '../partita/tiri';
import { IconaD20, Tiro } from './Tiro';
import { aggiungi, cambiaLivello, CONDIZIONE, CONDIZIONI, fannoPerdereConcentrazione, inEffetto, livelloIndebolimento, riassunto, togli, type IdCondizione } from '../partita/condizioni';
import { GUIDA_CONDIZIONI } from '../guide/guide';
import { spiegaRisorsa } from '../creazione/spiega-risorse';

export interface PropsTavolo {
  scheda: Scheda; partita: StatoPartita; cambia: (s: StatoPartita) => void; dado: number;
  bozza?: Bozza; cambiaBozza?: (b: Bozza) => void;      // per cambiare gli incantesimi dopo il riposo lungo
}
const nome = (id: Id) => DATI.incantesimi[id]?.nome ?? id;

// Pallini: pieno = disponibile. Toccare un pieno lo usa, toccare un vuoto lo restituisce.
export function Pallini({ etichetta, totale, rimasti, cambia }: { etichetta: string; totale: number; rimasti: number; cambia: (usato: boolean) => void }) {
  return (
    <span className="flex flex-wrap gap-1.5" role="group" aria-label={`${etichetta}: ${rimasti} su ${totale}`}>
      {Array.from({ length: totale }, (_, i) => {
        const pieno = i < rimasti;
        return (
          <button key={i} onClick={() => cambia(pieno)} aria-label={pieno ? `Usa ${etichetta}` : `Restituisci ${etichetta}`}
            className="flex h-11 w-9 items-center justify-center">
            <span className={`h-5 w-5 rounded-full border-2 ${pieno ? 'border-accento bg-accento' : 'border-bordo bg-transparent'}`} />
          </button>
        );
      })}
    </span>
  );
}

export function Riposi({ scheda, partita, cambia, dado, bozza, cambiaBozza }: PropsTavolo) {
  const [breve, setBreve] = useState(false);
  const [dopoLungo, setDopoLungo] = useState<Bozza | null>(null);   // la scheda com'era prima del riposo: i cambi si contano da lì
  const [tiro, setTiro] = useState('');
  const v = vista(scheda, partita, dado);
  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button onClick={() => setBreve(true)} className="h-11 rounded-xl border border-bordo text-sm text-testo">Riposo breve</button>
        <button
          onClick={() => {
            if (!window.confirm('Riposo lungo: tornano tutti i PF, gli slot e le risorse. Confermi?')) return;
            cambia(riposoLungo(partita));
            // Gli incantesimi che cambiano la CA (Armatura magica, 8 ore) sono finiti (21/11)
            const b = bozza?.equip?.attivi?.length ? { ...bozza, equip: { ...bozza.equip, attivi: [] } } : bozza;
            if (b && b !== bozza) cambiaBozza?.(b);
            if (b && cambiaBozza && scheda.magia.length) setDopoLungo(b);   // poi, a chi usa la magia, i cambi permessi
          }}
          className="h-11 rounded-xl border border-bordo text-sm text-testo"
        >Riposo lungo</button>
      </div>
      {breve && (
        <FoglioDalBasso chiudi={() => setBreve(false)} titolo={<h2 className="text-lg font-medium text-testo">Riposo breve (1 ora)</h2>}>
          <p className="text-sm text-testo">
            Puoi spendere i dadi vita per recuperare PF: tira il dado e scrivi il risultato, l'app aggiunge la Costituzione (SRD p. 187).
          </p>
          <p className="mt-2 text-sm text-testo-2">Dadi vita: {v.dadiVita.rimasti} su {v.dadiVita.totale} (d{dado}) · PF {v.pf.attuali} su {v.pf.massimo}</p>
          <div className="mt-2 flex gap-2">
            <input value={tiro} onChange={(e) => setTiro(e.target.value)} inputMode="numeric" placeholder={`1-${dado}`} aria-label="Risultato del dado vita"
              className="h-12 w-20 rounded-lg border border-bordo bg-superficie px-3 text-base text-testo" />
            <button
              disabled={v.dadiVita.rimasti === 0 || !(Number(tiro) >= 1 && Number(tiro) <= dado)}
              onClick={() => { cambia(spendiDadoVita(partita, Number(tiro), scheda.modificatori.COS)); setTiro(''); }}
              className="h-12 flex-1 rounded-xl border border-accento text-base text-accento disabled:border-bordo disabled:text-testo-2/50"
            >Spendi un dado vita</button>
          </div>
          <button onClick={() => { cambia(riposoBreve(partita, scheda)); setBreve(false); }}
            className="mt-3 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Concludi il riposo breve</button>
          <p className="mt-2 text-xs text-testo-2">Tornano lo slot del patto del warlock e le capacità che lo dicono (per esempio 1 uso dell'Ira).</p>
        </FoglioDalBasso>
      )}
      {dopoLungo && bozza && cambiaBozza && <CambiDopoRiposo prima={dopoLungo} bozza={bozza} cambia={cambiaBozza} chiudi={() => setDopoLungo(null)} />}
    </>
  );
}

// Dopo il riposo lungo: i cambi di incantesimi che la classe permette (SRD p. 104). Il conto parte da prima del riposo.
function CambiDopoRiposo({ prima, bozza, cambia, chiudi }: { prima: Bozza; bozza: Bozza; cambia: (b: Bozza) => void; chiudi: () => void }) {
  const { possibili, no } = cambiDopoRiposoLungo(bozza);
  const iniziali = cambiDopoRiposoLungo(prima).possibili;
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="text-lg font-medium text-testo">Riposo lungo fatto</h2>
      <p className="text-sm text-testo-2">PF, slot e risorse sono tornati. Ora puoi cambiare gli incantesimi che le regole permettono.</p>
    </>}>
      <div className="space-y-4">
        {possibili.map((c) => {
          const prima0 = iniziali.find((x) => x.magia === c.magia && x.tipo === c.tipo)?.attuali ?? c.attuali;
          return <BloccoCambio key={`${c.magia}-${c.tipo}`} c={c} prima={prima0} bozza={bozza} cambia={cambia} />;
        })}
        {no.map((x) => <p key={x} className="text-sm text-testo-2">{x}</p>)}
        {possibili.length === 0 && no.length === 0 && <p className="text-sm text-testo-2">Nessun incantesimo da cambiare.</p>}
      </div>
      <button onClick={chiudi} className="mt-4 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Fatto</button>
    </FoglioDalBasso>
  );
}

function BloccoCambio({ c, prima, bozza, cambia }: { c: CambioPossibile; prima: Id[]; bozza: Bozza; cambia: (b: Bozza) => void }) {
  const usati = cambiati(prima, c.attuali);
  const esaurito = c.quanti !== 'tutti' && usati >= c.quanti;
  const opz = sostituti(bozza, c);
  return (
    <div className="rounded-xl border border-bordo bg-superficie p-3">
      <p className="text-base font-medium text-testo">{c.nome} · {c.tipo === 'trucchetti' ? 'trucchetti' : 'preparati'}</p>
      <p className="mb-2 text-sm text-testo-2">{c.regola} <span className="whitespace-nowrap">SRD p. {c.pagina}</span></p>
      <div className="space-y-2">
        {c.attuali.map((id) => {
          const cambiato = !prima.includes(id);
          return (
            <Tendina key={id} etichetta={cambiato ? 'Cambiato' : c.tipo === 'trucchetti' ? 'Trucchetto' : 'Preparato'} valore={id}
              opzioni={[{ id, nome: DATI.incantesimi[id]?.nome ?? id, disattivata: false },
                ...opz.map((o) => ({ id: o.id, nome: o.nome, disattivata: esaurito && !cambiato, ...(esaurito && !cambiato ? { motivo: 'hai già fatto il tuo cambio' } : {}) }))]}
              cambia={(v) => v && v !== id && cambia(cambiaIncantesimo(bozza, c, id, v, prima))} />
          );
        })}
      </div>
      {c.quanti !== 'tutti' && <p className="mt-2 text-xs text-testo-2">Cambi fatti: {usati} su {c.quanti}</p>}
    </div>
  );
}

export function PuntiFerita({ scheda, partita, cambia }: PropsTavolo) {
  const [n, setN] = useState('');
  const [critico, setCritico] = useState(false);
  const v = vista(scheda, partita, 0).pf;
  const valore = Number(n);
  const ok = Number.isInteger(valore) && valore > 0;
  const fai = (f: (s: StatoPartita) => StatoPartita) => { if (ok) { cambia(f(partita)); setN(''); setCritico(false); } };
  return (
    <div className="rounded-xl border border-bordo bg-superficie p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-testo-2">Punti ferita</span>
        <span className={`text-2xl font-medium ${v.attuali === 0 ? 'text-attenzione' : 'text-testo'}`}>
          {v.attuali}<span className="text-base text-testo-2"> / {v.massimo}</span>
          {v.temporanei > 0 && <span className="text-base text-accento"> +{v.temporanei}</span>}
        </span>
      </div>
      {v.attuali === 0 && <Morte partita={partita} cambia={cambia} massimo={v.massimo} />}
      <div className="mt-2 flex gap-2">
        <input value={n} onChange={(e) => setN(e.target.value)} inputMode="numeric" placeholder="PF" aria-label="Quanti PF"
          className="h-11 w-16 rounded-lg border border-bordo bg-sfondo px-2 text-center text-base text-testo" />
        <button onClick={() => fai((s) => danno(s, valore, v.massimo, critico))} className="h-11 flex-1 rounded-lg border border-attenzione text-sm text-testo">Danno</button>
        <button onClick={() => fai((s) => cura(s, valore))} className="h-11 flex-1 rounded-lg border border-ok text-sm text-testo">Cura</button>
        <button onClick={() => fai((s) => temporanei(s, valore))} className="h-11 flex-1 rounded-lg border border-bordo text-sm text-testo">Temp.</button>
      </div>
      {v.attuali === 0 && !partita.morte.morto && (
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-testo">
          <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} className="h-5 w-5 accent-[var(--accento)]" />
          Il danno è un colpo critico (due fallimenti)
        </label>
      )}
    </div>
  );
}

// Tiri salvezza contro la morte (SRD p. 17-18): il giocatore tira il d20 vero e scrive il risultato
function Morte({ partita, cambia, massimo }: { partita: StatoPartita; cambia: (s: StatoPartita) => void; massimo: number }) {
  const [d20, setD20] = useState('');
  const m = partita.morte;
  const valido = Number.isInteger(Number(d20)) && Number(d20) >= 1 && Number(d20) <= 20;
  const fila = (pieni: number, colore: string, nome: string) => (
    <span className="flex gap-1.5" aria-label={`${nome}: ${pieni} su 3`}>
      {[0, 1, 2].map((i) => <span key={i} className={`h-4 w-4 rounded-full border-2 ${i < pieni ? colore : 'border-bordo'}`} />)}
    </span>
  );
  return (
    <div className="mt-2 rounded-lg border border-attenzione/60 p-2">
      {m.morto ? (
        <p className="text-sm font-medium text-attenzione">Il personaggio è morto (SRD p. 17). Parlane con il master.</p>
      ) : m.stabile ? (
        <p className="text-sm text-testo">Stabile: privo di sensi ma non tira più contro la morte. Senza cure torna a 1 PF dopo 1d4 ore.</p>
      ) : (
        <>
          <p className="text-sm text-testo">A 0 PF sei privo di sensi: all'inizio del tuo turno tira un d20 contro la morte. 10 o più è un successo, 1 vale due fallimenti, 20 ti fa tornare a 1 PF.</p>
          <div className="mt-2 flex items-center justify-between text-sm text-testo">
            <span className="flex items-center gap-2">Successi {fila(m.successi, 'border-ok bg-ok', 'Successi')}</span>
            <span className="flex items-center gap-2">Fallimenti {fila(m.fallimenti, 'border-attenzione bg-attenzione', 'Fallimenti')}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <input value={d20} onChange={(e) => setD20(e.target.value)} inputMode="numeric" placeholder="d20" aria-label="Risultato del d20 contro la morte"
              className="h-11 w-16 rounded-lg border border-bordo bg-sfondo px-2 text-center text-base text-testo" />
            <button disabled={!valido} onClick={() => { cambia(tiroMorte(partita, Number(d20), massimo)); setD20(''); }}
              className="h-11 flex-1 rounded-lg border border-accento text-sm text-accento disabled:border-bordo disabled:text-testo-2/50">Segna il tiro</button>
          </div>
        </>
      )}
      {(m.successi > 0 || m.fallimenti > 0 || m.morto || m.stabile) && (
        <button onClick={() => cambia(azzeraMorte(partita))} className="mt-1 min-h-11 text-sm text-accento">Azzera i tiri contro la morte</button>
      )}
    </div>
  );
}

// Il nome di una risorsa: toccandolo si legge cosa fa (23/11, partito dall'Ispirazione bardica)
export function NomeRisorsa({ r, children }: { r: { id: string; nome: string; dettaglio?: string }; children?: React.ReactNode }) {
  const [aperto, setAperto] = useState(false);
  const s = spiegaRisorsa(r);
  if (!s) return <>{children ?? r.nome}</>;
  return (
    <>
      <button onClick={() => setAperto(true)} className="min-h-11 text-left underline decoration-dotted decoration-1 underline-offset-4" aria-haspopup="dialog">
        {children ?? r.nome}<span className="sr-only">: cosa fa</span>
      </button>
      {aperto && (
        <FoglioDalBasso chiudi={() => setAperto(false)} titolo={<h2 className="text-lg font-medium text-testo">{r.nome}</h2>}>
          <p className="text-base text-testo">{s.testo}</p>
          {s.pagina && <p className="mt-3 text-xs text-testo-2">SRD 5.2 p. {s.pagina}</p>}
        </FoglioDalBasso>
      )}
    </>
  );
}

export function RisorseTavolo({ scheda, partita, cambia }: PropsTavolo) {
  const v = vista(scheda, partita, 0);
  if (!v.risorse.length) return null;
  return (
    <div>
      <h2 className="mb-1 text-base font-medium text-testo">Risorse</h2>
      <ul>
        {v.risorse.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-testo"><NomeRisorsa r={r} /><span className="block text-xs text-testo-2">tornano con il riposo {r.recupero}</span></span>
            {r.usi <= 8
              ? <Pallini etichetta={r.nome} totale={r.usi} rimasti={r.rimasti} cambia={(u) => cambia(segnaRisorsa(partita, r.id, u, r.usi))} />
              : <span className="flex items-center gap-1">
                  <button onClick={() => cambia(segnaRisorsa(partita, r.id, true, r.usi))} className="h-11 w-11 rounded-lg border border-bordo" aria-label={`Usa 1 ${r.nome}`}>−</button>
                  <span className="w-12 text-center text-sm text-testo">{r.rimasti}/{r.usi}</span>
                  <button onClick={() => cambia(segnaRisorsa(partita, r.id, false, r.usi))} className="h-11 w-11 rounded-lg border border-bordo" aria-label={`Restituisci 1 ${r.nome}`}>+</button>
                </span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────── Magia al tavolo ─────────
const TEMPI: { id: string; nome: string }[] = [
  { id: 'tutti', nome: 'Tutti' }, { id: 'azione', nome: 'Azione' }, { id: 'azioneBonus', nome: 'Azione bonus' },
  { id: 'reazione', nome: 'Reazione' }, { id: 'rituale', nome: 'Rituale' },
];

export function MagiaTavolo({ scheda, partita, cambia, bozza }: PropsTavolo) {
  const ignoraNonConsumate = !!bozza?.tavolo?.eccezioni?.includes('componenti-non-consumate');
  const [filtro, setFiltro] = useState('tutti');
  const [lancio, setLancio] = useState<{ magia: MagiaCalcolata; id: Id } | null>(null);
  const [leggi, setLeggi] = useState<Id | null>(null);
  const [tiro, setTiro] = useState<RichiestaTiro | null>(null);   // dadi (idea 6)
  const [avviso, setAvviso] = useState<string | null>(null);
  const v = vista(scheda, partita, 0);
  const passa = (id: Id) => {
    const i = DATI.incantesimi[id];
    if (!i) return false;
    if (filtro === 'tutti') return true;
    if (filtro === 'rituale') return i.rituale;
    return i.tempo.tipo === filtro;
  };
  return (
    <div className="space-y-3">
      {(v.slot.length > 0 || v.patto) && (
        <div className="rounded-xl border border-bordo bg-superficie p-3">
          {v.slot.map((s) => (
            <div key={s.livello} className="flex items-center justify-between">
              <span className="text-sm text-testo">Slot di {s.livello}°</span>
              <Pallini etichetta={`slot di ${s.livello}°`} totale={s.totale} rimasti={s.rimasti} cambia={(u) => cambia(segnaSlot(partita, s.livello, u, s.totale))} />
            </div>
          ))}
          {v.patto && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-testo">Slot del patto ({v.patto.livello}°)<span className="block text-xs text-testo-2">tornano con il riposo breve</span></span>
              <Pallini etichetta="slot del patto" totale={v.patto.totale} rimasti={v.patto.rimasti} cambia={(u) => cambia(segnaPatto(partita, u, v.patto!.totale))} />
            </div>
          )}
        </div>
      )}

      {v.concentrazione && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accento bg-superficie p-3">
          <span className="text-sm text-testo">In concentrazione: <span className="font-medium">{nome(v.concentrazione)}</span></span>
          <button onClick={() => cambia(fineConcentrazione(partita))} className="min-h-11 rounded-lg px-3 text-sm text-accento">Termina</button>
        </div>
      )}
      {avviso && <p role="status" className="rounded-xl border border-attenzione/50 bg-superficie p-3 text-sm text-testo">{avviso}</p>}

      <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Filtra per tempo di lancio">
        {TEMPI.map((t) => (
          <button key={t.id} onClick={() => setFiltro(t.id)} aria-pressed={filtro === t.id}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-sm ${filtro === t.id ? 'border-accento bg-accento text-su-accento' : 'border-bordo text-testo-2'}`}>
            {t.nome}
          </button>
        ))}
      </div>

      {[...scheda.magia].sort((a, b) => Number(b.fonte.tipo === 'classe') - Number(a.fonte.tipo === 'classe')).map((m) => {
        const ids = [...new Set([...m.trucchetti.scelti, ...m.semprePreparati, ...(m.preparati?.scelti ?? []),
          ...(m.preparatiDa === 'libro' ? (m.libro?.scelti ?? []).filter((x) => DATI.incantesimi[x]?.rituale) : [])])].filter(passa);
        if (!ids.length) return null;
        const g = v.gratuiti.find((x) => x.magia === m.id);
        return (
          <div key={m.id} className="rounded-xl border border-bordo bg-superficie p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-medium text-testo">{m.nome}</span>
              {m.cd && <span className="shrink-0 text-sm text-testo">CD {m.cd.totale} · +{m.attacco!.totale}</span>}
            </div>
            {g && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-testo-2">Gratis: {g.incantesimi.map(nome).join(', ')} (riposo {g.recupero})</span>
                <Pallini etichetta="lancio gratuito" totale={g.usi} rimasti={g.rimasti} cambia={(u) => cambia(segnaGratuito(partita, m.id, u, g.usi))} />
              </div>
            )}
            <ul className="mt-1">
              {ids.map((id) => {
                const i = DATI.incantesimi[id];
                const soloRituale = i.livello > 0 && !m.semprePreparati.includes(id) && !(m.preparati?.scelti ?? []).includes(id);
                const tag = [i.livello === 0 ? 'trucchetto' : `${i.livello}°`, i.concentrazione ? 'C' : '', soloRituale ? 'solo rituale (dal libro)' : i.rituale ? 'R' : '',
                  i.tiro ? (i.tiro.tipo === 'attacco' ? `attacco +${m.attacco?.totale}` : `TS ${i.tiro.car} CD ${m.cd?.totale}`) : '',
                  testoDadi(id, m.caratteristica ? scheda.modificatori[m.caratteristica] : 0, 0, scheda.livello) ?? ''].filter(Boolean).join(' · ');
                const manca = mancaComponente(scheda, partita, id, undefined, ignoraNonConsumate);   // componente con costo finita: si lancia lo stesso, segnato in rosso
                return (
                  <li key={id} className={`flex items-center gap-2 border-t border-bordo py-1 first:border-t-0 ${manca ? '-mx-1 rounded-lg border-2 !border-attenzione px-1' : ''}`}>
                    <button onClick={() => setLeggi(id)} className="min-h-11 flex-1 text-left">
                      <span className="block text-base text-testo">{i.nome}</span>
                      <span className="block text-xs text-testo-2">{tag}</span>
                      {manca && <span className="block text-xs text-attenzione">Manca la componente con costo: aggiungila dalla borsa nello Zaino</span>}
                    </button>
                    {i.livello > 0 && (
                      <button onClick={() => setLancio({ magia: m, id })} className="min-h-11 shrink-0 rounded-lg border border-accento px-3 text-sm text-accento">Lancia</button>
                    )}
                    {i.livello === 0 && DADI_INCANTESIMI[id] && (() => {
                      const rq = daIncantesimo(id, m, m.caratteristica ? scheda.modificatori[m.caratteristica] : 0, undefined, (scheda.bonusDanniTrucchetti?.[id] ?? []).reduce((s, t) => s + t.valore, 0), scheda.livello);
                      return rq && <button onClick={() => setTiro(rq)} aria-label={`Tira: ${i.nome}`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-oro/70"><IconaD20 /></button>;
                    })()}
                    {i.livello === 0 && i.concentrazione && (
                      <button onClick={() => cambia(lancia(partita, v, m.id, id, { tipo: 'trucchetto' }).stato)} className="min-h-11 shrink-0 rounded-lg border border-bordo px-3 text-sm text-testo">Lancia</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <p className="text-xs text-testo-2">C = concentrazione · R = rituale. Tocca un nome per leggere l'incantesimo.</p>

      {lancio && (
        <SceltaLancio v={v} m={lancio.magia} id={lancio.id} partita={partita} chiudi={() => setLancio(null)}
          fatto={(s, interrotto, livello) => {
            cambia(dopoIlLancio(scheda, s, lancio.id)); setLancio(null);
            setAvviso(interrotto ? `Hai interrotto ${nome(interrotto)}: ora sei concentrato su ${nome(lancio.id)}.` : null);
            // dadi (idea 6): se l'incantesimo fa danni o cura, si apre il tiro con lo slot usato
            const rq = daIncantesimo(lancio.id, lancio.magia, lancio.magia.caratteristica ? scheda.modificatori[lancio.magia.caratteristica] : 0, livello, (scheda.bonusDanniTrucchetti?.[lancio.id] ?? []).reduce((s, t) => s + t.valore, 0), scheda.livello);
            if (rq) setTiro(rq);
          }} />
      )}
      {leggi && <SchedaIncantesimo id={leggi} chiudi={() => setLeggi(null)} />}
      {tiro && <Tiro r={tiro} {...condizioniPerTiro({ scheda, partita, cambia, dado: 0 })} chiudi={() => setTiro(null)} />}
    </div>
  );
}

function SceltaLancio({ v, m, id, partita, chiudi, fatto }: {
  v: VistaPartita; m: MagiaCalcolata; id: Id; partita: StatoPartita; chiudi: () => void; fatto: (s: StatoPartita, interrotto: Id | null, livello?: number) => void;
}) {
  const i = DATI.incantesimi[id];
  const modi = modiDiLancio(v, m, id);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="text-lg font-medium text-testo">Lancia {i.nome}</h2>
      <p className="text-sm text-testo-2">{i.it?.tempo ?? i.tempo.testo} · {i.it?.gittata ?? i.gittata}</p>
    </>}>
      {i.concentrazione && v.concentrazione && v.concentrazione !== id && (
        <p className="mb-2 text-sm text-attenzione">Sei concentrato su {nome(v.concentrazione)}: lanciare questo lo interrompe.</p>
      )}
      <div className="space-y-2">
        {modi.map((o) => (
          <button key={o.etichetta} disabled={!o.disponibile}
            onClick={() => { const r = lancia(partita, v, m.id, id, o.modo); fatto(r.stato, r.interrotto, 'livello' in o.modo ? o.modo.livello : undefined); }}
            className="min-h-12 w-full rounded-xl border border-accento px-3 text-left text-base text-accento disabled:border-bordo disabled:text-testo-2/50">
            {o.etichetta}
          </button>
        ))}
        {modi.length === 0 && <p className="text-sm text-testo-2">Adesso non puoi lanciarlo: non è preparato.</p>}
      </div>
      <p className="mt-3 text-xs text-testo-2">Un solo incantesimo con uno slot per turno (SRD p. 105).</p>
    </FoglioDalBasso>
  );
}

// ───────── Condizioni (22/11) ─────────
// Il giocatore segna quelle che ha; l'app riassume cosa cambia ai tiri (glossario dell'SRD, p. 177-191).
// Le condizioni che contano per i dadi (idea 6): quelle segnate, più il privo di sensi a 0 PF
export const condizioniPerTiro = (t: PropsTavolo) => ({ condizioni: t.partita.condizioni ?? [], pfZero: vista(t.scheda, t.partita, 0).pf.attuali === 0 && !t.partita.morte.morto });

export function CondizioniTavolo({ scheda, partita, cambia }: PropsTavolo) {
  const [aperta, setAperta] = useState<IdCondizione | null>(null);
  const [nota, setNota] = useState<string | null>(null);
  const lista = partita.condizioni ?? [];
  const pfZero = vista(scheda, partita, 0).pf.attuali === 0 && !partita.morte.morto;
  const effetto = inEffetto(lista, pfZero);
  const r = riassunto(lista, pfZero);
  const lv = livelloIndebolimento(lista);
  const metti = (nuova: typeof lista) => {
    let st: StatoPartita = { ...partita, condizioni: nuova };
    if (partita.concentrazione && fannoPerdereConcentrazione(nuova, pfZero)) {
      setNota(`Concentrazione persa su ${nome(partita.concentrazione)}: da incapacitato non puoi mantenerla (SRD p. 184).`);
      st = fineConcentrazione(st);
    }
    cambia(st);
  };
  const derivate = effetto.filter((id) => !lista.some((c) => c.id === id));
  return (
    <div className="rounded-xl border border-bordo bg-superficie p-3">
      <h2 className="text-base font-medium text-testo">Condizioni</h2>
      {!effetto.length && <p className="text-sm text-testo-2">Nessuna. Quando il master ti dice «sei prono», «sei avvelenato»…, segnala qui.</p>}
      <select value="" aria-label="Aggiungi una condizione" onChange={(e) => { if (e.target.value) metti(aggiungi(lista, e.target.value as IdCondizione)); }}
        className="mt-2 h-11 w-full rounded-lg border border-bordo bg-sfondo px-2 text-base text-testo">
        <option value="">+ Aggiungi una condizione…</option>
        {CONDIZIONI.map((c) => {
          const gia = lista.some((x) => x.id === c.id) && c.id !== 'indebolimento';
          return <option key={c.id} value={c.id} disabled={gia}>{c.nome}{c.id === 'indebolimento' && lv ? ` (+1 livello, ora ${lv})` : ''}</option>;
        })}
      </select>
      {effetto.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {lista.map((c) => (
            <li key={c.id} className="flex items-center rounded-full border border-attenzione">
              <button onClick={() => setAperta(c.id)} className="min-h-11 pl-3 pr-1 text-sm text-testo">{CONDIZIONE[c.id].nome}{c.id === 'indebolimento' ? ` ${lv}` : ''}</button>
              <button onClick={() => metti(togli(lista, c.id))} aria-label={`Togli ${CONDIZIONE[c.id].nome}`} className="h-11 w-9 text-base text-testo-2">×</button>
            </li>
          ))}
          {derivate.map((id) => (
            <li key={id}><button onClick={() => setAperta(id)} className="min-h-11 rounded-full border border-dashed border-bordo px-3 text-sm text-testo-2">
              {CONDIZIONE[id].nome}{id === 'privo-di-sensi' && pfZero ? ' (0 PF)' : ''}</button></li>
          ))}
        </ul>
      )}
      {lv > 0 && (
        <div className="mt-2 flex items-center justify-between text-sm text-testo">
          <span>Livello di indebolimento</span>
          <span className="flex items-center gap-1">
            <button onClick={() => metti(cambiaLivello(lista, lv - 1))} aria-label="Un livello in meno" className="h-11 w-11 rounded-full border border-bordo">−</button>
            <span className="w-6 text-center text-base">{lv}</span>
            <button disabled={lv >= 6} onClick={() => metti(cambiaLivello(lista, lv + 1))} aria-label="Un livello in più" className="h-11 w-11 rounded-full border border-bordo disabled:opacity-30">+</button>
          </span>
        </div>
      )}
      {r.righe.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-bordo pt-2" aria-live="polite">
          {r.righe.map((x, i) => <li key={i} className={`text-sm ${x.grave ? 'font-medium text-attenzione' : 'text-testo'}`}>{x.testo}</li>)}
        </ul>
      )}
      {nota && <p role="status" className="mt-2 text-sm text-attenzione">{nota}</p>}
      {pfZero && <p className="mt-2 text-xs text-testo-2">A 0 PF sei privo di sensi finché non recuperi almeno 1 PF (SRD p. 17).</p>}
      {effetto.length > 0 && <p className="mt-2 text-xs text-testo-2">Finiscono quando lo dice l'effetto o il master: toglile tu. Il riposo lungo toglie solo 1 livello di indebolimento.</p>}

      {aperta && (
        <FoglioDalBasso chiudi={() => setAperta(null)} titolo={<><h2 className="text-lg font-medium text-testo">{CONDIZIONE[aperta].nome}</h2><p className="text-sm text-testo-2">SRD p. {CONDIZIONE[aperta].pagina}</p></>}>
          <ul className="space-y-2">
            {(GUIDA_CONDIZIONI.sezioni[0].capitoli.find((c) => c.id === aperta)?.righe ?? [CONDIZIONE[aperta].riga]).map((t, i) => <li key={i} className="text-base text-testo">{t}</li>)}
          </ul>
        </FoglioDalBasso>
      )}
    </div>
  );
}
