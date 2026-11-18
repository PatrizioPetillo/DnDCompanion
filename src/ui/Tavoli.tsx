// Il link del tavolo (sezione 5.1). Il master crea un tavolo e manda il link (WhatsApp o altro); il giocatore lo apre
// e crea il personaggio già con le regole del master. Senza link l'app non ha restrizioni.
import { useState } from 'react';
import { elenco, tavoli, type Archivio } from '../archivio/archivio';
import type { Elementi } from '../creazione/personalizzati';
import { creaLinkTavolo } from '../esporta/link';
import { DATI } from '../regole';
import { descriviTavolo, NOME_ECCEZIONE, NOME_METODO } from '../regole/tavolo';
import type { EccezioneTavolo, Id, MetodoPunteggi, Tavolo } from '../regole/tipi';
import { Avatar } from './Avatar';
import { Separatore } from './PassoMagia';
import { FoglioDalBasso } from './SchedaIncantesimo';

// ───────── «I miei tavoli» ─────────
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
        <ul className="overflow-hidden rounded-xl border border-bordo bg-superficie">
          {voci.map((v) => (
            <li key={v.id} className="border-b border-bordo last:border-b-0">
              <button onClick={() => apri(v.id)} className="block min-h-16 w-full px-4 py-3 text-left">
                <span className="block text-base font-medium text-testo">{v.tavolo.nome || 'Tavolo senza nome'}</span>
                <span className="block truncate text-sm text-testo-2">{descriviTavolo(v.tavolo, DATI).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────── Il tavolo, come lo prepara il master: si salva a ogni tocco ─────────
export function ModuloTavolo({ tavolo, cambia, elimina, mieiElementi }: {
  tavolo: Tavolo;
  cambia: (t: Tavolo) => void;
  elimina: () => void;
  mieiElementi: Elementi;
}) {
  const [stato, setStato] = useState<string | null>(null);
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
    const url = await creaLinkTavolo(tavolo, location.href);
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
      <h1 className="mb-4 font-titolo text-2xl text-accento">{tavolo.nome || 'Nuovo tavolo'}</h1>
      <label className="block text-sm font-medium text-testo" htmlFor="nome-tavolo">Nome del tavolo</label>
      <input id="nome-tavolo" value={tavolo.nome} onChange={(e) => cambia({ ...tavolo, nome: e.target.value })} maxLength={80}
        placeholder="Es. La Torre di Hillmarch" className={`mt-1 h-12 w-full rounded-lg border bg-superficie px-3 text-base text-testo ${tavolo.nome.trim() ? 'border-bordo' : 'border-attenzione bg-attenzione/10'}`} />

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

      <div className="mt-6 space-y-2 border-t border-bordo pt-4">
        <button onClick={condividi} disabled={!tavolo.nome.trim()} className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo-2">
          {tavolo.nome.trim() ? 'Condividi il link ai giocatori' : 'Dai un nome al tavolo per condividerlo'}
        </button>
        {stato && <p role="status" className="text-sm text-testo">{stato}</p>}
        <p className="text-xs text-testo-2">Se cambi le regole, rimanda il link: chi ha già creato il personaggio tiene le regole di prima.</p>
        <button onClick={() => window.confirm(`Eliminare il tavolo «${tavolo.nome || 'senza nome'}»? I personaggi già creati non cambiano.`) && elimina()}
          className="h-12 w-full rounded-xl border border-attenzione text-base text-attenzione">Elimina il tavolo</button>
      </div>
    </section>
  );
}

// ───────── Il giocatore apre il link ─────────
export function TavoloRicevuto({ tavolo, archivio, nuovo, usa }: {
  tavolo: Tavolo;
  archivio: Archivio;
  nuovo: () => void;
  usa: (id: string) => void;
}) {
  const [scegli, setScegli] = useState(false);
  const voci = elenco(archivio);
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
