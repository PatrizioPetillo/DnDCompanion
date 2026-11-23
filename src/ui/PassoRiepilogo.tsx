// Passo 8: Riepilogo (sezione 5.2 e 5.4). La scheda completa con le schede in alto (scelta di Patrizio, 18/11):
// Combattimento, Abilità, Magia, Zaino, Chi è. In cima gli avvisi da sistemare o accettare; in fondo l'esportazione.
// La stessa scheda diventerà quella da usare al tavolo (slot, riposi, risorse).
import { useState } from 'react';
import { comePersonaggio, type IdPasso } from '../creazione/percorso';
import { Restituisci } from './PassoEquipaggiamento';
import { IconaD20, Tiro } from './Tiro';
import { daAttacco, daIncantesimo, daIniziativa, daProva, daTiroSalvezza, type RichiestaTiro } from '../partita/tiri';
import { accettaAvviso, avvisiRiepilogo, riepilogo, type Riepilogo } from '../creazione/riepilogo';
import type { Bozza } from '../creazione/percorso';
import { metri } from '../regole/misure';
import type { Numero, Scheda as SchedaCalcolata } from '../regole/tipi';
import { calcolaScheda, DATI } from '../regole';
import type { StatoPartita } from '../partita/partita';
import type { Elementi } from '../creazione/personalizzati';
import { Avatar, riduciRitratto } from './Avatar';
import { Fascia, immagine } from './Illustrazione';
import { iniziali } from '../archivio/archivio';
import { condizioniPerTiro, CondizioniTavolo, NomeRisorsa, MagiaTavolo, PuntiFerita, RisorseTavolo, Riposi, type PropsTavolo } from './Tavolo';
import { Borsa, Libro } from './Zaino';
import { Indossato } from './Indossato';
import { OggettiMagici } from './OggettiMagici';
import { Monete } from './Monete';
import { FoglioDalBasso } from './SchedaIncantesimo';

type Scheda = 'combattimento' | 'abilita' | 'magia' | 'zaino' | 'chi';
// Icone disegnate a mano (tratto semplice), per riconoscere la scheda al volo
const ICONE: Record<Scheda, string> = {
  combattimento: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z',                        // scudo
  abilita: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3z',      // stella
  magia: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19', // scintilla
  zaino: 'M8 6V5a4 4 0 018 0v1M5 8h14v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8zM9 13h6',             // zaino
  chi: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',                         // persona
};
const SCHEDE: { id: Scheda; titolo: string }[] = [
  { id: 'combattimento', titolo: 'Combattimento' }, { id: 'abilita', titolo: 'Abilità' }, { id: 'magia', titolo: 'Magia' },
  { id: 'zaino', titolo: 'Zaino' }, { id: 'chi', titolo: 'Chi è' },
];

const somma = (n: Numero, finale: string) =>
  `${n.termini.map((t) => `${t.etichetta} ${t.valore < 0 ? `−${-t.valore}` : t.valore}`).join(' + ')} = ${finale}`;
const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function PassoRiepilogo({ bozza, cambia, apri, ricevuta, partita, cambiaPartita, ritratto, bloccata, riapri, cambiaRitratto }: {
  bozza: Bozza; cambia: (b: Bozza) => void; apri: (p: IdPasso) => void; ricevuta?: boolean;
  bloccata?: boolean; riapri?: () => void; cambiaRitratto?: (r: string | undefined) => void;   // personaggio salvato (19/11)
  partita?: StatoPartita; cambiaPartita?: (s: StatoPartita) => void;    // uso al tavolo; assenti per una scheda ricevuta
  ritratto?: string;
  elementi?: Elementi;                                                    // background personalizzati che la scheda usa: viaggiano con lei
}) {
  const [vistaScheda, setScheda] = useState<Scheda>('combattimento');
  const [ritrattoAperto, setRitrattoAperto] = useState(false);
  const r = riepilogo(bozza);
  if (!r) return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Riepilogo</h1>
      <p className="text-sm text-testo-2">Scegli almeno classe, background e specie: poi qui trovi la scheda completa.</p>
    </section>
  );
  const schede = SCHEDE.filter((s) => s.id !== 'magia' || r.magia.fonti.length > 0);
  const pg = comePersonaggio(bozza)!;
  const scheda: SchedaCalcolata = calcolaScheda(pg);
  const tavolo: PropsTavolo | null = partita && cambiaPartita && !ricevuta
    ? { scheda, partita, cambia: cambiaPartita, dado: DATI.classi[pg.classe].dadoVita, bozza, cambiaBozza: cambia } : null;

  return (
    <section>
      {/* Testata (20/11): il ritratto se c'è, altrimenti l'immagine della classe; toccando l'avatar si apre in grande */}
      {ritratto ? <FasciaRitratto src={ritratto} /> : pg && <Fascia gruppo="classi" id={pg.classe} alto={120} arrotonda={false} suSfondo />}
      <div className={`mb-3 flex items-center gap-3 ${ritratto || (pg && immagine('classi', pg.classe)) ? 'relative -mt-10' : ''}`}>
        <button onClick={() => setRitrattoAperto(true)} aria-label={ritratto ? 'Apri il ritratto' : 'Scegli un ritratto'} className="relative shrink-0 rounded-full">
          <Avatar ritratto={ritratto} classe={pg?.classe} iniziali={iniziali(r.testata.nome)} />
          {cambiaRitratto && <span aria-hidden className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-bordo bg-superficie text-xs text-accento">✎</span>}
        </button>
        <div className="min-w-0">
          <h1 className="font-titolo text-2xl text-accento">{r.testata.nome}</h1>
          <p className="text-sm text-testo-2">{r.testata.descrizione}</p>
        </div>
      </div>

      {ritrattoAperto && <FoglioRitratto ritratto={ritratto} nome={r.testata.nome} cambia={cambiaRitratto} chiudi={() => setRitrattoAperto(false)} />}

      <Avvisi bozza={bozza} cambia={cambia} apri={apri} ricevuta={ricevuta || bloccata} />

      {tavolo && <Riposi {...tavolo} />}

      <nav className="sticky z-5 -mx-4 mb-3 border-b border-bordo bg-sfondo/95 px-4 backdrop-blur" style={{ top: 'var(--alto-testata, 0px)' }} aria-label="Sezioni della scheda">
        <div className="flex justify-between gap-1 overflow-x-auto py-2" role="tablist">
          {schede.map((s) => (
            <button key={s.id} role="tab" aria-selected={vistaScheda === s.id} onClick={() => setScheda(s.id)}
              className={`flex min-h-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[12px] ${vistaScheda === s.id ? 'bg-accento font-medium text-su-accento' : 'text-testo-2'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONE[s.id]} /></svg>
              {s.titolo}
            </button>
          ))}
        </div>
      </nav>

      <div role="tabpanel">
        {vistaScheda === 'combattimento' && <Combattimento r={r} tavolo={tavolo} scheda={scheda} />}
        {vistaScheda === 'abilita' && <Abilita r={r} scheda={scheda} tavolo={tavolo} />}
        {vistaScheda === 'magia' && (tavolo ? <MagiaTavolo {...tavolo} /> : <Magia r={r} />)}
        {vistaScheda === 'zaino' && <Zaino r={r} scheda={scheda} tavolo={tavolo} bozza={bozza} cambia={ricevuta ? undefined : cambia} restituibile={!ricevuta && !bloccata} />}
        {vistaScheda === 'chi' && <ChiE r={r} bozza={bozza} cambia={cambia} ricevuta={ricevuta || bloccata}
          salvato={bloccata ? { il: bozza.conclusoIl!, riapri } : undefined} />}
      </div>

    </section>
  );
}

function Avvisi({ bozza, cambia, apri, ricevuta }: { bozza: Bozza; cambia: (b: Bozza) => void; apri: (p: IdPasso) => void; ricevuta?: boolean }) {
  const tutti = avvisiRiepilogo(bozza);
  const aperti = tutti.filter((a) => !a.accettato);
  const accettati = tutti.filter((a) => a.accettato);
  // Niente da controllare: l'etichetta sparisce (richiesta del 19/11). Le eccezioni accettate stanno in «Chi è».
  if (aperti.length === 0) return null;
  // Richiuso: la scheda resta in vista; il numero dice quanti avvisi restano
  return (
    <details className="mb-3 rounded-xl border border-attenzione bg-superficie">
      <summary className="flex min-h-12 cursor-pointer items-center px-3 text-sm text-testo">
        {`Da controllare: ${aperti.length} ${aperti.length === 1 ? 'avviso' : 'avvisi'}`}
        {accettati.length > 0 && <span className="ml-1 text-testo-2">· {accettati.length} {accettati.length === 1 ? 'eccezione accettata' : 'eccezioni accettate'}</span>}
      </summary>
    <div className="space-y-2 px-3 pb-3">
      {aperti.map((a) => (
        <div key={a.id} className={`rounded-xl border bg-superficie p-3 ${a.livello === 'errore' ? 'border-attenzione' : 'border-attenzione/50'}`}>
          <p className="text-sm text-testo">{a.messaggio}{a.srd?.pagina ? <span className="text-testo-2"> (SRD p. {a.srd.pagina})</span> : null}</p>
          {!ricevuta && <div className="mt-2 flex gap-2">
            <button onClick={() => apri(a.passo)} className="min-h-11 flex-1 rounded-lg border border-bordo px-3 text-sm text-testo">Vai a {a.titoloPasso}</button>
            {a.accettabile && (
              <button onClick={() => cambia(accettaAvviso(bozza, a.id))} className="min-h-11 flex-1 rounded-lg border border-accento px-3 text-sm text-accento">
                Accetta (ok del master)
              </button>
            )}
          </div>}
        </div>
      ))}
    </div>
    </details>
  );
}

function Combattimento({ r, tavolo, scheda }: { r: Riepilogo; tavolo: PropsTavolo | null; scheda: SchedaCalcolata }) {
  const [spiega, setSpiega] = useState<string | null>(null);
  const [tiro, setTiro] = useState<RichiestaTiro | null>(null);      // dadi (idea 6, 23/11)
  const c = r.combattimento;
  const aperto = c.numeri.find((n) => n.id === spiega);
  return (
    <div className="space-y-4">
      {tavolo && <PuntiFerita {...tavolo} />}
      {tavolo && <CondizioniTavolo {...tavolo} />}
      <div className="grid grid-cols-3 gap-2">
        {c.numeri.filter((n) => !tavolo || n.id !== 'pf').map((n) => (
          <button key={n.id} disabled={!n.somma} onClick={() => setSpiega(spiega === n.id ? null : n.id)} aria-expanded={spiega === n.id}
            className={`rounded-xl border bg-superficie p-2 text-center ${spiega === n.id ? 'border-accento' : 'border-bordo'}`}>
            <span className="block text-xl font-medium text-testo">{n.valore}</span>
            <span className="block text-xs leading-tight text-testo-2">{n.etichetta}</span>
          </button>
        ))}
      </div>
      {aperto?.somma && <p className="-mt-2 text-sm text-testo-2">{aperto.etichetta}: {somma(aperto.somma, aperto.valore)}</p>}
      <BottoneTiro etichetta="Tira l'iniziativa" onClick={() => setTiro(daIniziativa(scheda.iniziativa.totale))} />
      {tavolo?.partita.iniziativa && (
        <p className="-mt-2 text-sm text-testo-2">Ultima iniziativa: <span className="text-testo">{tavolo.partita.iniziativa.totale}</span> (alle {new Date(tavolo.partita.iniziativa.il).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}){tavolo.bozza?.tavolo?.canale ? ' · arriva da sola al master' : ''}</p>
      )}

      <div>
        <h2 className="mb-2 text-base font-medium text-testo">Tiri salvezza</h2>
        <div className="grid grid-cols-2 gap-x-4">
          {c.tiriSalvezza.map((t) => (
            <button key={t.car} onClick={() => setTiro(daTiroSalvezza(t.car, scheda.tiriSalvezza[t.car].totale))}
              aria-label={`Tira il tiro salvezza su ${t.nome} ${t.valore}${t.competente ? ', con competenza' : ''}`}
              className="flex min-h-11 items-center gap-2 rounded-lg text-left text-sm">
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${t.competente ? 'bg-accento' : 'border border-bordo'}`} />
              <span className="flex-1 text-testo">{t.nome}</span>
              <span className="text-testo">{t.valore}</span>
              <span aria-hidden className="text-oro"><IconaD20 /></span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-base font-medium text-testo">Attacchi</h2>
        <ul className="space-y-2">
          {c.attacchi.map((a) => (
            <li key={a.id} className="rounded-xl border border-bordo bg-superficie p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-medium text-testo">{a.nome}{a.quantita > 1 ? ` × ${a.quantita}` : ''}</span>
                <span className="text-base text-testo">{segno(a.colpire.totale)}</span>
              </div>
              <p className="text-sm text-testo">{a.danni.testo}{a.danni.testoDueMani ? ` · a due mani ${a.danni.testoDueMani}` : ''}</p>
              <p className="text-xs text-testo-2">
                {a.gittata ? `Gittata ${metri(a.gittata[0]).replace(' metri', '')}/${metri(a.gittata[1])}` : 'Mischia'}
                {a.padronanza ? ` · Padronanza: ${a.padronanza}` : ''}
              </p>
              {a.note.map((n) => <p key={n} className="text-xs text-attenzione">{n}</p>)}
              {a.danni.dadi && <BottoneTiro etichetta={`Tira: ${a.nome}`} onClick={() => setTiro(daAttacco(a))} />}
            </li>
          ))}
        </ul>
      </div>

      {c.trucchetti.length > 0 && (
        <div>
          <h2 className="mb-2 text-base font-medium text-testo">Trucchetti d'attacco</h2>
          <ul className="space-y-2">
            {c.trucchetti.map((t) => (
              <li key={t.id} className="rounded-xl border border-bordo bg-superficie p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-medium text-testo">{t.nome}</span>
                  <span className="shrink-0 text-sm text-testo">{t.tiro}</span>
                </div>
                <p className="text-sm text-testo">{t.dadi}</p>
                <p className="text-xs text-testo-2">{t.fonte}{t.nota ? ` · ${t.nota}` : ''}</p>
                {(() => {
                  const [mid, iid] = t.id.split(':');
                  const m = scheda.magia.find((x) => x.id === mid);
                  const rq = m && daIncantesimo(iid, m, m.caratteristica ? scheda.modificatori[m.caratteristica] : 0);
                  return rq ? <BottoneTiro etichetta={`Tira: ${t.nome}`} onClick={() => setTiro(rq)} /> : null;
                })()}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tavolo && <RisorseTavolo {...tavolo} />}
      {!tavolo && c.risorse.length > 0 && (
        <div>
          <h2 className="mb-2 text-base font-medium text-testo">Risorse</h2>
          <ul className="space-y-1">
            {c.risorse.map((x) => (
              <li key={x.nome} className="text-sm text-testo">
                <span className="font-medium"><NomeRisorsa r={x} /></span>: {x.usi}{x.dettaglio ? ` (${x.dettaglio})` : ''} <span className="text-testo-2">· {x.recupero}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {c.altro.length > 0 && <ul className="space-y-1 text-sm text-testo">{c.altro.map((x) => <li key={x}>{x}</li>)}</ul>}
      {tiro && <Tiro r={tiro} {...(tavolo ? condizioniPerTiro(tavolo) : {})} chiudi={() => setTiro(null)}
        // l'iniziativa resta nella scheda: con il tavolo collegato arriva al master (SRD p. 13: ognuno tira la sua)
        {...(tavolo && tiro.d20?.genere === 'iniziativa' ? { quandoTira: (t: { totale: number }) => tavolo.cambia({ ...tavolo.partita, iniziativa: { totale: t.totale, il: new Date().toISOString() } }) } : {})} />}
    </div>
  );
}

// Il pulsante dei dadi: sempre uguale, con l'icona del d20 (idea 6)
function BottoneTiro({ etichetta, onClick }: { etichetta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-oro/70 text-sm text-testo">
      <IconaD20 /> {etichetta}
    </button>
  );
}

function Abilita({ r, scheda, tavolo }: { r: Riepilogo; scheda: SchedaCalcolata; tavolo: PropsTavolo | null }) {
  const [tiro, setTiro] = useState<RichiestaTiro | null>(null);
  // Come nella creazione: FOR DES COS a sinistra, INT SAG CAR a destra, colonne indipendenti
  const riquadro = (c: Riepilogo['abilita'][number]) => (
    <div key={c.car} className="rounded-xl border border-bordo bg-superficie p-2.5">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-sm font-medium text-testo">{c.nome}</span>
        <span className="text-sm text-testo">{c.punteggio} <span className="text-testo-2">({c.mod})</span></span>
      </div>
      {c.voci.length > 0 && (
        <ul className="mt-1">
          {c.voci.map((v) => (
            <li key={v.id}>
              <button onClick={() => setTiro(daProva(v.nome, scheda.abilita[v.id].totale, scheda.abilita[v.id].svantaggio ? 'armatura' : undefined))}
                aria-label={`Tira ${v.nome} ${v.valore}${v.maestria ? ', maestria' : v.competente ? ', con competenza' : ''}`}
                className="flex min-h-11 w-full items-center gap-1.5 text-left text-xs">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${v.maestria ? 'bg-oro ring-2 ring-accento' : v.competente ? 'bg-accento' : 'border border-bordo'}`} />
                <span className={`min-w-0 flex-1 ${v.competente ? 'text-testo' : 'text-testo-2'}`}>{v.nome}{v.maestria ? ' (maestria)' : ''}
                  {v.svantaggio && <span className="block text-xs text-attenzione">{v.svantaggio}</span>}</span>
                <span className="text-testo">{v.valore}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  const colonna = (cs: string[]) => <div className="space-y-2">{r.abilita.filter((c) => cs.includes(c.car)).map(riquadro)}</div>;
  return (
    <>
      <p className="mb-2 text-xs text-testo-2">Tocca un'abilità per tirare la prova.</p>
      <div className="grid grid-cols-2 items-start gap-2">{colonna(['FOR', 'DES', 'COS'])}{colonna(['INT', 'SAG', 'CAR'])}</div>
      {tiro && <Tiro r={tiro} {...(tavolo ? condizioniPerTiro(tavolo) : {})} chiudi={() => setTiro(null)} />}
    </>
  );
}

function Magia({ r }: { r: Riepilogo }) {
  return (
    <div className="space-y-3">
      {r.magia.slot.length > 0 && <p className="text-sm text-testo">{r.magia.slot.join(' · ')}</p>}
      {r.magia.fonti.map((f) => (
        <div key={f.id} className="rounded-xl border border-bordo bg-superficie p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-medium text-testo">{f.nome}</span>
            {f.cd !== null && <span className="shrink-0 text-sm text-testo">CD {f.cd} · {f.attacco}</span>}
          </div>
          {f.trucchetti.length > 0 && <p className="mt-1 text-sm text-testo"><span className="text-testo-2">Trucchetti: </span>{f.trucchetti.join(', ')}</p>}
          {f.incantesimi.length > 0 && <p className="mt-1 text-sm text-testo"><span className="text-testo-2">Incantesimi: </span>{f.incantesimi.join(', ')}</p>}
          {f.lanciGratuiti && <p className="mt-1 text-sm text-testo">{f.lanciGratuiti}</p>}
          {f.note.map((n) => <p key={n} className="mt-1 text-xs text-testo-2">{n}</p>)}
        </div>
      ))}
    </div>
  );
}

// Zaino: il libro degli incantesimi e la borsa per componenti si aprono (richiesta del 19/11)
function Zaino({ r, scheda, tavolo, bozza, cambia, restituibile = false }: { r: Riepilogo; scheda: SchedaCalcolata; tavolo: PropsTavolo | null; bozza: Bozza; cambia?: (b: Bozza) => void; restituibile?: boolean }) {
  const [aperto, setAperto] = useState<'libro' | { borsa: string } | null>(null);
  const m = r.zaino.monete.totale;
  const libro = scheda.magia.find((x) => x.libro);
  // Il libro del mago; la borsa per componenti e i focus (sostituiscono le componenti senza costo, SRD p. 105-106)
  const apribile = (id: string, nome: string) => (id === 'spellbook' && libro ? 'libro' as const
    : DATI.oggetti[id]?.focus && scheda.magia.length ? { borsa: nome } : null);
  return (
    <div className="space-y-3">
      <Monete bozza={bozza} totale={m} cambia={cambia} />
      <Indossato bozza={bozza} scheda={scheda} cambia={cambia} />
      <OggettiMagici bozza={bozza} cambia={cambia} />
      <ul className="overflow-hidden rounded-xl border border-bordo bg-superficie">
        {r.zaino.inventario.map((v) => {
          const a = apribile(v.oggetto, v.nome);
          return (
            <li key={v.oggetto} className="border-b border-bordo px-3 py-2 last:border-b-0">
              {a ? (
                <button onClick={() => setAperto(a)} className="flex min-h-11 w-full items-center justify-between text-left text-base text-testo">
                  <span>{v.quantita > 1 ? `${v.quantita} × ` : ''}{v.nome}</span>
                  <span className="text-sm text-accento">Apri ›</span>
                </button>
              ) : v.contenuto ? (
                <details>
                  <summary className="min-h-11 cursor-pointer py-2.5 text-base text-testo">{v.quantita > 1 ? `${v.quantita} × ` : ''}{v.nome}</summary>
                  <p className="mt-1 text-sm text-testo-2">{v.contenuto.map((c) => `${c.quantita > 1 ? `${c.quantita} × ` : ''}${c.nome}`).join(', ')}</p>
                </details>
              ) : <span className="text-base text-testo">{v.quantita > 1 ? `${v.quantita} × ` : ''}{v.nome}</span>}
              {restituibile && cambia && <div className="mt-1 flex justify-end"><Restituisci bozza={bozza} cambia={cambia} id={v.oggetto} nome={v.nome} /></div>}
            </li>
          );
        })}
        {r.zaino.inventario.length === 0 && <li className="px-3 py-3 text-sm text-testo-2">Lo zaino è vuoto.</li>}
      </ul>
      {aperto === 'libro' && libro && <Libro magia={libro} chiudi={() => setAperto(null)} />}
      {aperto && aperto !== 'libro' && <Borsa nome={aperto.borsa} scheda={scheda} tavolo={tavolo} chiudi={() => setAperto(null)} ignoraNonConsumate={!!bozza.tavolo?.eccezioni?.includes('componenti-non-consumate')} />}
    </div>
  );
}

interface Salvato { il: string; riapri?: () => void }

function ChiE({ r, bozza, cambia, ricevuta, salvato }: { r: Riepilogo; bozza: Bozza; cambia: (b: Bozza) => void; ricevuta?: boolean; salvato?: Salvato }) {
  const accettati = avvisiRiepilogo(bozza).filter((a) => a.accettato);
  return (
    <div className="space-y-4">
      <dl className="space-y-2">
        {r.chiE.righe.map((x) => (
          <div key={x.etichetta}>
            <dt className="text-xs text-testo-2">{x.etichetta}</dt>
            <dd className="whitespace-pre-line text-base text-testo">{x.valore}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h2 className="mb-2 text-base font-medium text-testo">Privilegi e talenti</h2>
        <ul className="space-y-1 text-sm text-testo">{r.chiE.privilegi.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
      {accettati.length > 0 && (
        <div>
          <h2 className="mb-2 text-base font-medium text-testo">Eccezioni accettate dal master</h2>
          <ul className="space-y-2">
            {accettati.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm text-testo">
                <span className="flex-1">{a.messaggio}</span>
                {!ricevuta && <button onClick={() => cambia(accettaAvviso(bozza, a.id, false))} className="min-h-11 shrink-0 rounded-lg px-2 text-accento">Annulla</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {salvato && <Creazione {...salvato} />}
    </div>
  );
}

// Dopo il salvataggio la creazione è chiusa: qui l'uscita di sicurezza (il ritratto si cambia toccandolo in cima)
function Creazione({ il, riapri }: Salvato) {
  return (
    <div className="rounded-xl border border-bordo bg-superficie p-3">
      <h2 className="text-base font-medium text-testo">Creazione</h2>
      <p className="mt-1 text-sm text-testo-2">Salvato il {new Date(il).toLocaleDateString('it-IT')}. Le scelte della creazione sono bloccate; il ritratto si cambia toccandolo in cima alla scheda.</p>
      {riapri && <button onClick={riapri} className="mt-3 min-h-11 w-full rounded-lg border border-attenzione/60 px-3 text-sm text-attenzione">Riapri la creazione</button>}
    </div>
  );
}

// Il ritratto nella testata: largo come lo schermo, centrato sul viso, sfuma nello sfondo come le illustrazioni
function FasciaRitratto({ src }: { src: string }) {
  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-xl" style={{ height: 180 }}>
      <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: '50% 30%' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, var(--color-sfondo))' }} />
    </div>
  );
}

// Toccando l'avatar: il ritratto in grande, e (se la scheda è tua) Cambia / Togli. Si può cambiare anche a scheda salvata.
function FoglioRitratto({ ritratto, nome, cambia, chiudi }: { ritratto?: string; nome: string; cambia?: (r: string | undefined) => void; chiudi: () => void }) {
  const [errore, setErrore] = useState(false);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="font-titolo text-lg text-accento">{nome || 'Ritratto'}</h2>}>
      {ritratto
        ? <img src={ritratto} alt={`Ritratto di ${nome}`} className="mx-auto aspect-square w-full max-w-96 rounded-xl border border-bordo object-cover" />
        : <p className="text-sm text-testo-2">Nessun ritratto: per ora si vede l'immagine della classe.</p>}
      {cambia && (
        <div className="mt-4 flex gap-2">
          <label className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl bg-accento px-3 text-base font-medium text-su-accento">
            {ritratto ? 'Cambia il ritratto' : 'Scegli un ritratto'}
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try { cambia(await riduciRitratto(f)); setErrore(false); } catch { setErrore(true); }
            }} />
          </label>
          {ritratto && <button onClick={() => { cambia(undefined); chiudi(); }} className="min-h-12 rounded-xl border border-bordo px-4 text-base text-testo">Togli</button>}
        </div>
      )}
      {errore && <p className="mt-2 text-sm text-attenzione">Non riesco a leggere questa immagine: prova con un'altra foto.</p>}
    </FoglioDalBasso>
  );
}
