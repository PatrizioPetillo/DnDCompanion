// Il link del tavolo (sezione 5.1). Il master crea un tavolo e manda il link (WhatsApp o altro); il giocatore lo apre
// e crea il personaggio già con le regole del master. Senza link l'app non ha restrizioni.
import { rigaGruppo, riassuntoGruppo, type RigaGruppo } from '../creazione/gruppo';
import type { Incontro, MembroGruppo, OggettoDelMaster } from '../archivio/archivio';
import { Incontri } from './Incontri';
import { MandaEventi } from './Eventi';
import { DaiBottino } from './Monete';
import { OggettiTavolo } from './OggettiTavolo';
import { useEffect, useRef, useState } from 'react';
import { elenco, tavoli, type Archivio } from '../archivio/archivio';
import type { Elementi } from '../creazione/personalizzati';
import { creaLinkTavolo } from '../esporta/link';
import { nuovoCanaleTavolo, tavoliAttivi } from '../sblocchi/tavolo-canale';
import { DATI } from '../regole';
import { descriviTavolo, NOME_ECCEZIONE, NOME_METODO } from '../regole/tavolo';
import { LIVELLO_MASSIMO, NOME_REGOLA_PF, type RegolaPf } from '../regole/livelli';
import type { EccezioneTavolo, Id, MetodoPunteggi, Tavolo } from '../regole/tipi';
import { Avatar } from './Avatar';
import { Separatore } from './PassoMagia';
import { SceltaPronti } from './Pronti';
import { predefinitiPer, type Predefinito } from '../creazione/predefiniti';
import { FoglioDalBasso } from './SchedaIncantesimo';

// ───────── «I miei tavoli» ─────────
// Sotto il nome nell'elenco (23/11, richiesta di Patrizio): i personaggi al tavolo; senza, la prima frase delle note
export function sottotitoloTavolo(v: { tavolo: Tavolo; gruppo?: MembroGruppo[] }): string {
  const nomi = (v.gruppo ?? []).map((m) => m.bozza.nome.trim() || 'Senza nome');
  if (nomi.length) return nomi.join(', ');
  const frase = (v.tavolo.note ?? '').trim().split(/(?<=[.!?])\s|\n/)[0]?.trim();
  return frase || 'Ancora nessun personaggio';
}

export function ElencoTavoli({ archivio, apri, crea }: { archivio: Archivio; apri: (id: string) => void; crea: () => void }) {
  const voci = tavoli(archivio);
  return (
    <section>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="font-titolo text-2xl text-accento">I miei tavoli</h1>
        <button onClick={crea} aria-label="Crea un nuovo tavolo"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-accento text-accento">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <p className="mb-4 text-sm text-testo-2">Per chi fa il master: scegli le regole e manda il link ai giocatori. Chi lo apre crea il personaggio con le tue regole.</p>
      {voci.length === 0 ? (
        <div className="rounded-xl border border-bordo bg-superficie p-4 text-center">
          <p className="text-base text-testo">Crea il tuo primo tavolo</p>
          <button onClick={crea} className="mt-3 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Crea un tavolo</button>
        </div>
      ) : (
        <ul className="riquadro overflow-hidden rounded-xl border bg-superficie">
          {voci.map((v) => (
            <li key={v.id} className="border-b border-bordo last:border-b-0">
              <button onClick={() => apri(v.id)} className="block min-h-16 w-full px-4 py-3 text-left">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-base font-medium text-testo">{v.tavolo.nome || 'Tavolo senza nome'}</span>
                  <span className="shrink-0 text-sm text-testo-2">Livello {v.tavolo.livello}</span>
                </span>
                <span className="block truncate text-sm text-testo-2">{sottotitoloTavolo(v)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────── Il tavolo, come lo prepara il master: si salva a ogni tocco ─────────
export function ModuloTavolo({ tavolo, cambia: cambiaGrezzo, elimina, torna, salvato = true, mieiElementi, membri = [], apriMembro, togliMembro, oggetti = [], salvaOggetto: salvaOggettoG, togliOggetto: togliOggettoG, incontri = [], salvaIncontro: salvaIncontroG, togliIncontro: togliIncontroG }: {
  tavolo: Tavolo;
  cambia: (t: Tavolo) => void;
  torna?: () => void;          // 23/11: torna all'elenco dei tavoli
  salvato?: boolean;           // false = la memoria del telefono ha rifiutato la scrittura
  elimina: () => void;
  mieiElementi: Elementi;
  membri?: MembroGruppo[];
  apriMembro?: (m: MembroGruppo) => void;
  togliMembro?: (id: string) => void;
  oggetti?: OggettoDelMaster[];
  salvaOggetto?: (o: OggettoDelMaster) => void;
  togliOggetto?: (uid: string) => void;
  incontri?: Incontro[];
  salvaIncontro?: (i: Incontro) => void;
  togliIncontro?: (id: string) => void;
}) {
  const [stato, setStato] = useState<string | null>(null);
  // 23/11: ogni modifica si salva subito; la riga «Salvato» lo conferma per un attimo
  const [appena, setAppena] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const segna = () => { setAppena(true); clearTimeout(timer.current); timer.current = setTimeout(() => setAppena(false), 1800); };
  useEffect(() => () => clearTimeout(timer.current), []);
  const conSegno = <A extends unknown[]>(f?: (...a: A) => void) => f && ((...a: A) => { f(...a); segna(); });
  const cambia = conSegno(cambiaGrezzo)!;
  const salvaOggetto = conSegno(salvaOggettoG), togliOggetto = conSegno(togliOggettoG);
  const salvaIncontro = conSegno(salvaIncontroG), togliIncontro = conSegno(togliIncontroG);
  const [regole, setRegole] = useState(!tavolo.nome.trim());   // un tavolo nuovo si apre sulle regole
  const escludi = tavolo.fonti.escludi ?? [];
  const alterna = (id: Id) => cambia({ ...tavolo, fonti: { srd: true, escludi: escludi.includes(id) ? escludi.filter((x) => x !== id) : [...escludi, id] } });
  const metodo = (m: MetodoPunteggi) => {
    const nuovi = tavolo.metodiPunteggi.includes(m) ? tavolo.metodiPunteggi.filter((x) => x !== m) : [...tavolo.metodiPunteggi, m];
    if (nuovi.length) cambia({ ...tavolo, metodiPunteggi: nuovi });   // almeno un metodo
  };
  const eccezione = (e: EccezioneTavolo) => {
    const ora = tavolo.eccezioni ?? [];
    cambia({ ...tavolo, eccezioni: ora.includes(e) ? ora.filter((x) => x !== e) : [...ora, e] });
  };
  // I background dai miei elementi: messi nel tavolo, viaggiano nel link
  const bgTavolo = tavolo.elementi?.background ?? {};
  const alternaBg = (id: Id) => {
    const bg = { ...bgTavolo };
    if (bg[id]) delete bg[id]; else bg[id] = mieiElementi.background[id];
    cambia({ ...tavolo, elementi: { ...tavolo.elementi, background: bg } });
  };
  const spTavolo = tavolo.elementi?.specie ?? {};
  const alternaSp = (id: Id) => {
    const sp = { ...spTavolo };
    if (sp[id]) delete sp[id]; else { const { modulo: _m, ...senza } = mieiElementi.specie![id]; void _m; sp[id] = senza; }   // il modulo non serve ai giocatori: link più corto
    cambia({ ...tavolo, elementi: { background: bgTavolo, ...tavolo.elementi, specie: sp } });
  };
  const condividi = async () => {
    // Tavolo collegato (23/11): la prima volta si crea il canale, così le schede dei giocatori arrivano da sole
    let t = tavolo;
    if (!t.canale && tavoliAttivi()) { t = { ...t, canale: await nuovoCanaleTavolo() }; cambia(t); }
    const url = await creaLinkTavolo(t, location.href);
    setRegole(false);
    try {
      if (navigator.share) await navigator.share({ title: tavolo.nome || 'Tavolo', text: `Crea il personaggio per «${tavolo.nome || 'il tavolo'}»`, url });
      else { await navigator.clipboard.writeText(url); setStato('Link copiato: incollalo nel messaggio ai giocatori.'); }
    } catch { /* condivisione annullata */ }
  };

  const gruppo = (titolo: string, elementi: { id: Id; nome: string }[]) => (
    <>
      <h2 className="mb-1 mt-5 text-base font-medium text-testo">{titolo}</h2>
      <p className="mb-2 text-xs text-testo-2">Tocca per togliere o rimettere. Barrati = non ammessi.</p>
      <div className="flex flex-wrap gap-2">
        {elementi.map((x) => {
          const si = !escludi.includes(x.id);
          return (
            <button key={x.id} onClick={() => alterna(x.id)} aria-pressed={si}
              className={`min-h-11 rounded-full px-4 text-sm ${si ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2 line-through'}`}>
              {x.nome}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        {torna ? (
          <button onClick={torna} className="-ml-2 flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-accento">
            <span aria-hidden="true">←</span> I miei tavoli
          </button>
        ) : <span />}
        <p role="status" className={`text-sm ${!salvato ? 'font-medium text-attenzione' : appena ? 'text-accento' : 'text-testo-2'}`}>
          {!salvato ? 'Non salvato: memoria piena' : appena ? '✓ Salvato' : 'Si salva da solo'}
        </p>
      </div>
      <h1 className="mb-1 font-titolo text-2xl text-accento">{tavolo.nome || 'Nuovo tavolo'}</h1>
      {tavolo.nome.trim() && <p className="mb-3 text-sm text-testo-2">{descriviTavolo(tavolo, DATI).join(' · ')}</p>}

      {/* 23/11: prima il gruppo e il gioco, le regole in un riquadro che si apre (richiesta di Patrizio) */}
      <button onClick={condividi} disabled={!tavolo.nome.trim()} className="mt-2 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo-2">
        {tavolo.nome.trim() ? 'Invita i giocatori (manda il link)' : 'Dai un nome al tavolo per invitare'}
      </button>
      {stato && <p role="status" className="mt-2 text-sm text-testo">{stato}</p>}

      <div className="mt-4 rounded-xl border border-bordo bg-superficie">
        <button onClick={() => setRegole(!regole)} aria-expanded={regole} className="flex min-h-12 w-full items-center justify-between px-4 text-left">
          <span className="text-base font-medium text-testo">Regole del tavolo</span>
          <span className="text-sm text-accento">{regole ? 'Chiudi' : 'Modifica'}</span>
        </button>
        {regole && (
          <div className="anim-srotola border-t border-bordo px-4 pb-4 pt-3">
      <label className="block text-sm font-medium text-testo" htmlFor="nome-tavolo">Nome del tavolo</label>
      <input id="nome-tavolo" value={tavolo.nome} onChange={(e) => cambia({ ...tavolo, nome: e.target.value })} maxLength={80}
        placeholder="Es. La Torre di Hillmarch" className={`mt-1 h-12 w-full rounded-lg border bg-superficie px-3 text-base text-testo ${tavolo.nome.trim() ? 'border-bordo' : 'border-attenzione bg-attenzione/10'}`} />

      {/* Livello di partenza e PF dal 2° livello (23/11, scelte di Patrizio) */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-testo">Livello di partenza
          <select value={tavolo.livello} onChange={(e) => cambia({ ...tavolo, livello: Number(e.target.value) })}
            className="mt-1 h-12 w-full rounded-lg border border-bordo bg-superficie px-2 text-base text-testo">
            {Array.from({ length: LIVELLO_MASSIMO }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}° livello</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-testo">PF dal 2° livello
          <select value={tavolo.pf ?? 'scelta'} onChange={(e) => {
            const v = e.target.value as RegolaPf;
            const { pf: _pf, ...resto } = tavolo;
            cambia(v === 'scelta' ? resto : { ...resto, pf: v });
          }} className="mt-1 h-12 w-full rounded-lg border border-bordo bg-superficie px-2 text-base text-testo">
            {(Object.keys(NOME_REGOLA_PF) as RegolaPf[]).map((r) => <option key={r} value={r}>{NOME_REGOLA_PF[r]}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-1 text-xs text-testo-2">I personaggi nuovi nascono al livello di partenza. Per ora l'app arriva al {LIVELLO_MASSIMO}° livello. Valore fisso: metà del dado vita + 1 (SRD p. 23).</p>

      <h2 className="mb-2 mt-5 text-base font-medium text-testo">Punteggi delle caratteristiche</h2>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(NOME_METODO) as MetodoPunteggi[]).map((m) => (
          <button key={m} onClick={() => metodo(m)} aria-pressed={tavolo.metodiPunteggi.includes(m)}
            className={`min-h-11 rounded-lg px-1 text-sm ${tavolo.metodiPunteggi.includes(m) ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2'}`}>
            {NOME_METODO[m]}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-testo-2">Puoi sceglierne più di uno: il giocatore usa uno di quelli.</p>

      {gruppo('Classi', Object.values(DATI.classi))}
      {gruppo('Specie', Object.values(DATI.specie).filter((s) => !s.personalizzato))}
      {gruppo('Background', Object.values(DATI.background).filter((b) => !b.personalizzato))}

      {Object.keys(mieiElementi.specie ?? {}).length > 0 && (
        <>
          <h2 className="mb-1 mt-5 text-base font-medium text-testo">Specie dai tuoi manuali</h2>
          <p className="mb-2 text-xs text-testo-2">Quelle che hai inserito tu (Eberron, Ravenloft…): se le metti nel tavolo, arrivano ai giocatori con il link.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(mieiElementi.specie ?? {}).map((sp) => (
              <button key={sp.id} onClick={() => alternaSp(sp.id)} aria-pressed={!!spTavolo[sp.id]}
                className={`min-h-11 rounded-full px-4 text-sm ${spTavolo[sp.id] ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2'}`}>
                {sp.nome}
              </button>
            ))}
          </div>
        </>
      )}
      {Object.keys(mieiElementi.background).length > 0 && (
        <>
          <h2 className="mb-1 mt-5 text-base font-medium text-testo">Background dai tuoi manuali</h2>
          <p className="mb-2 text-xs text-testo-2">Quelli che hai inserito tu: se li metti nel tavolo, arrivano ai giocatori con il link.</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(mieiElementi.background).map((b) => (
              <button key={b.id} onClick={() => alternaBg(b.id)} aria-pressed={!!bgTavolo[b.id]}
                className={`min-h-11 rounded-full px-4 text-sm ${bgTavolo[b.id] ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2'}`}>
                {b.nome}
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-1 mt-5 text-base font-medium text-testo">Eccezioni già concesse</h2>
      <p className="mb-2 text-xs text-testo-2">I giocatori non ricevono l'avviso «chiedi al master» per queste.</p>
      <div className="space-y-2">
        {(Object.keys(NOME_ECCEZIONE) as EccezioneTavolo[]).map((e) => {
          const si = (tavolo.eccezioni ?? []).includes(e);
          return (
            <button key={e} onClick={() => eccezione(e)} aria-pressed={si}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-superficie px-4 text-left text-base ${si ? 'border-accento text-testo' : 'border-bordo text-testo-2'}`}>
              <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${si ? 'border-accento bg-accento text-su-accento' : 'border-bordo'}`}>{si ? '✓' : ''}</span>
              {NOME_ECCEZIONE[e]}
            </button>
          );
        })}
      </div>

      <label className="mb-1 mt-5 block text-base font-medium text-testo" htmlFor="note-tavolo">Note per i giocatori</label>
      <textarea id="note-tavolo" value={tavolo.note ?? ''} onChange={(e) => cambia({ ...tavolo, note: e.target.value })} rows={4} maxLength={2000}
        placeholder="Ambientazione, data della sessione, cose da sapere" className="w-full rounded-lg border border-bordo bg-superficie p-3 text-base text-testo" />

            <p className="mt-3 text-xs text-testo-2">Se cambi le regole, rimanda il link: chi ha già creato il personaggio tiene le regole di prima.</p>
          </div>
        )}
      </div>

      <Gruppo gruppo={membri} apri={apriMembro} togli={togliMembro} collegato={!!tavolo.canale && tavoliAttivi()} />
      <MandaEventi membri={membri} nomeTavolo={tavolo.nome} />

      {salvaIncontro && togliIncontro && <Incontri incontri={incontri} membri={membri} salva={salvaIncontro} togli={togliIncontro} />}

      {salvaOggetto && togliOggetto && <OggettiTavolo oggetti={oggetti} nomeTavolo={tavolo.nome} salva={salvaOggetto} togli={togliOggetto} />}
      <DaiBottino nomeTavolo={tavolo.nome} inGruppo={membri.length} />

      <div className="mt-6 border-t border-bordo pt-4">
        <button onClick={() => window.confirm(`Eliminare il tavolo «${tavolo.nome || 'senza nome'}»? I personaggi già creati non cambiano.`) && elimina()}
          className="h-12 w-full rounded-xl border border-attenzione text-base text-attenzione">Elimina il tavolo</button>
      </div>
    </section>
  );
}

// ───────── Il gruppo del master (21/11) ─────────
function Gruppo({ gruppo, apri, togli, collegato = false }: { gruppo: MembroGruppo[]; apri?: (m: MembroGruppo) => void; togli?: (id: string) => void; collegato?: boolean }) {
  const righe = gruppo.map((m) => ({ m, r: rigaGruppo(m.id, m.bozza) })).filter((x): x is { m: MembroGruppo; r: RigaGruppo } => !!x.r);
  // chi ha accettato l'invito e sta ancora creando il personaggio (23/11)
  const inCorso = gruppo.filter((m) => !rigaGruppo(m.id, m.bozza));
  const sintesi = riassuntoGruppo(righe.map((x) => x.r));
  return (
    <section className="mt-6 border-t border-bordo pt-4" aria-labelledby="titolo-gruppo">
      <h2 id="titolo-gruppo" className="font-titolo text-lg text-accento">Il gruppo {righe.length > 0 && <span className="font-sans text-sm text-testo-2">({righe.length})</span>}</h2>
      {inCorso.length > 0 && (
        <ul className="mt-2 space-y-1">
          {inCorso.map((m) => (
            <li key={m.id} className="flex min-h-11 items-center justify-between rounded-xl border border-dashed border-bordo px-3 text-sm">
              <span className="text-testo">{m.bozza.nome.trim() || 'Un giocatore'}{m.bozza.classe ? ` · ${DATI.classi[m.bozza.classe]?.nome ?? ''}` : ''}</span>
              <span className="text-xs text-testo-2">sta creando il personaggio</span>
            </li>
          ))}
        </ul>
      )}
      {righe.length === 0 ? (
        <p className="mt-1 text-sm text-testo-2">{collegato
          ? 'Quando un giocatore accetta il tuo invito, il suo personaggio compare qui da solo, anche mentre lo crea. Ti arriva un avviso.'
          : 'Quando un giocatore ti manda la sua scheda con il link, aprila e tocca «Aggiungi al gruppo»: qui vedrai tutti i personaggi insieme.'}</p>
      ) : (
        <>
          <ul className="mt-2 space-y-2">
            {righe.map(({ m, r }) => (
              <li key={m.id} className="rounded-xl border border-bordo bg-superficie">
                <button onClick={() => apri?.(m)} className="w-full p-3 text-left">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-medium text-testo">{r.nome}</span>
                    {r.avvisi > 0 && <span className="text-xs text-attenzione">{r.avvisi} da controllare</span>}
                  </span>
                  <span className="block text-xs text-testo-2">{r.chi}</span>
                  <span className="mt-2 grid grid-cols-5 gap-1 text-center">
                    {[['CA', r.ca], ['PF', r.pf], ['Iniz.', r.iniziativa], ['Perc.', r.percezione], ['CD', r.cd ?? '—']].map(([e, v]) => (
                      <span key={String(e)} className="rounded-lg bg-sfondo py-1">
                        <span className="block text-base font-medium text-testo">{v}</span>
                        <span className="block text-xs text-testo-2">{e}</span>
                      </span>
                    ))}
                  </span>
                </button>
                {togli && (
                  <div className="flex justify-end border-t border-bordo px-2">
                    <button onClick={() => window.confirm(`Togliere ${r.nome} dal gruppo?`) && togli(m.id)} className="min-h-11 px-3 text-sm text-attenzione">Togli dal gruppo</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-bordo bg-superficie p-3 text-sm text-testo">
            {sintesi.migliorPercezione && <p><span className="text-testo-2">Percezione passiva più alta:</span> {sintesi.migliorPercezione.nome} ({sintesi.migliorPercezione.percezione})</p>}
            <p className="mt-1"><span className="text-testo-2">Lingue del gruppo:</span> {sintesi.lingue.map((l) => `${l.lingua}${righe.length > 1 && l.chi.length === 1 ? ` (solo ${l.chi[0]})` : ''}`).join(', ')}</p>
          </div>
          <p className="mt-2 text-xs text-testo-2">Tocca un personaggio per aprire la sua scheda. {collegato ? 'Quando il giocatore la cambia, si aggiorna da sola.' : 'Se il giocatore ti rimanda il link, la scheda si aggiorna.'}</p>
        </>
      )}
    </section>
  );
}

// ───────── Il giocatore apre il link ─────────
export function TavoloRicevuto({ tavolo, archivio, nuovo, pronto, usa, rifiuta }: {
  tavolo: Tavolo;
  archivio: Archivio;
  nuovo: () => void;
  pronto: (p: Predefinito) => void;
  usa: (id: string) => void;
  rifiuta: () => void;
}) {
  const [scegli, setScegli] = useState(false);
  const [pronti, setPronti] = useState(false);
  const [accettato, setAccettato] = useState(false);
  const voci = elenco(archivio);
  if (!accettato) return <Invito tavolo={tavolo} accetta={() => setAccettato(true)} rifiuta={rifiuta} />;
  return (
    <section>
      <p className="text-sm text-testo-2">Ti hanno invitato al tavolo</p>
      <h1 className="mb-3 font-titolo text-2xl text-accento">{tavolo.nome || 'Tavolo senza nome'}</h1>
      {tavolo.note && <p className="mb-3 whitespace-pre-line rounded-xl border border-bordo bg-superficie p-4 text-base text-testo">{tavolo.note}</p>}
      <Separatore titolo="Le regole del master" />
      <ul className="mb-5 space-y-1 text-sm text-testo">
        {descriviTavolo(tavolo, DATI).map((r) => <li key={r}>· {r}</li>)}
      </ul>
      <button onClick={nuovo} className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Nuovo personaggio per questo tavolo</button>
      {predefinitiPer(tavolo).length > 0 && (
        <button onClick={() => setPronti(true)} className="mt-2 h-12 w-full rounded-xl border border-bordo text-base text-testo">Usa un personaggio pronto</button>
      )}
      {pronti && <SceltaPronti elenco={predefinitiPer(tavolo)} livelloFisso={tavolo.livello} chiudi={() => setPronti(false)} scegli={(p) => { setPronti(false); pronto(p); }} />}
      {voci.length > 0 && (
        <button onClick={() => setScegli(true)} className="mt-2 h-12 w-full rounded-xl border border-bordo text-base text-testo">Usa un mio personaggio</button>
      )}
      <p className="mt-2 text-xs text-testo-2">Con un tuo personaggio l'app non cambia niente: controlla le regole del tavolo e ti dice cosa non va.</p>
      {scegli && (
        <FoglioDalBasso chiudi={() => setScegli(false)} titolo={<h2 className="text-lg font-medium text-testo">Quale personaggio?</h2>}>
          <ul className="overflow-hidden rounded-xl border border-bordo">
            {voci.map((v) => (
              <li key={v.id} className="border-b border-bordo last:border-b-0">
                <button onClick={() => { setScegli(false); usa(v.id); }} className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left">
                  <Avatar ritratto={v.ritratto} classe={v.classeId} iniziali={v.iniziali} />
                  <span className="min-w-0">
                    <span className="block truncate text-base text-testo">{v.nome}</span>
                    <span className="block truncate text-sm text-testo-2">{v.specie} · {v.classe}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </FoglioDalBasso>
      )}
    </section>
  );
}

// L'invito, nello stile DomusDraconis (richiesta di Patrizio, 18/11): pergamena, bordo d'ottone, titolo in Cinzel.
// Senza server l'app non può contare chi accetta: il limite di giocatori è un'idea per dopo (sezione 8).
function Invito({ tavolo, accetta, rifiuta }: { tavolo: Tavolo; accetta: () => void; rifiuta: () => void }) {
  const primo = useRef<HTMLButtonElement>(null);
  useEffect(() => { primo.current?.focus(); }, []);
  const regole = descriviTavolo(tavolo, DATI);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onKeyDown={(e) => e.key === 'Escape' && rifiuta()}>
      <div role="dialog" aria-modal="true" aria-labelledby="invito-titolo"
        className="anim-pergamena w-full max-w-sm rounded-2xl border-2 border-oro bg-superficie p-1.5 shadow-2xl">
        <div className="rounded-xl border border-oro/50 px-5 pb-5 pt-4 text-center">
          <Sigillo />
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-oro">Un invito al tavolo</p>
          <h2 id="invito-titolo" className="mt-1 font-titolo text-2xl leading-tight text-accento">{tavolo.nome || 'Tavolo senza nome'}</h2>
          <p className="mt-3 text-base text-testo">Il master ti invita a creare un personaggio per la sua avventura, con le sue regole.</p>
          {tavolo.note && <p className="mt-3 whitespace-pre-line border-y border-oro/40 py-2 text-sm italic text-testo-2">{tavolo.note}</p>}
          <ul className="mt-3 space-y-0.5 text-left text-sm text-testo-2">
            {regole.map((r) => <li key={r}><span aria-hidden className="text-oro">◆</span> {r}</li>)}
          </ul>
          <button ref={primo} onClick={accetta} className="mt-5 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Accetta l'invito</button>
          <button onClick={rifiuta} className="mt-2 h-12 w-full rounded-xl border border-bordo text-base text-testo">No, grazie</button>
        </div>
      </div>
    </div>
  );
}

// Un d20 d'ottone, lo stesso dell'icona dell'app
const Sigillo = () => (
  <svg width="44" height="44" viewBox="0 0 48 48" className="anim-sigillo mx-auto text-oro" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M24 3 43 14v20L24 45 5 34V14z" />
    <path d="M24 3 14 20h20zM14 20 5 34M34 20l9 14M14 20l10 25 10-25M5 14l9 6M43 14l-9 6" />
  </svg>
);
