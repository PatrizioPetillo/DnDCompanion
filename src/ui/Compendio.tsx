// Elenco degli incantesimi (20/11): dalla Home e dal menu in alto. Raggruppati per livello, con filtri per classe,
// livello, scuola, concentrazione e rituali, e la ricerca per nome (anche in inglese). Toccando si apre la scheda.
import { useState } from 'react';
import { CLASSI_INCANTATRICI, compendio, type FiltriCompendio } from '../creazione/compendio';
import { DATI } from '../regole';
import type { Id } from '../regole/tipi';
import { etichetteIncantesimo, FoglioDalBasso, SchedaIncantesimo, SCUOLA } from './SchedaIncantesimo';

const TEMPO: Record<string, string> = { azione: 'Azione', azioneBonus: 'Azione bonus', reazione: 'Reazione', minuti: 'Minuti', ore: 'Ore' };
const SCUOLE = [...new Set(Object.values(DATI.incantesimi).map((i) => i.scuola))].sort((a, b) => (SCUOLA[a] ?? a).localeCompare(SCUOLA[b] ?? b, 'it'));
const titoloLivello = (l: number) => (l === 0 ? 'Trucchetti' : `${l}° livello`);

export function IconaCompendio({ dim = 28 }: { dim?: number }) {
  return (
    <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 18a2 2 0 0 1 2-2h10" />
      <path d="M9 8h5M9 11h3" />
      <path d="M19.5 3.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
    </svg>
  );
}

export function Compendio({ chiudi }: { chiudi: () => void }) {
  const [f, setF] = useState<FiltriCompendio>({});
  const [aperto, setAperto] = useState<Id | null>(null);
  const gruppi = compendio(f);
  const totale = gruppi.reduce((n, g) => n + g.incantesimi.length, 0);
  const tendina = 'min-h-11 rounded-full border bg-superficie px-3 text-sm text-testo';
  const attiva = (v: unknown) => (v !== undefined && v !== '' ? 'border-accento' : 'border-bordo');
  const interruttore = (chiave: 'concentrazione' | 'rituale', valore: 'si' | 'no', nome: string) => (
    <button onClick={() => setF({ ...f, [chiave]: f[chiave] === valore ? undefined : valore })} aria-pressed={f[chiave] === valore}
      className={`min-h-11 rounded-full border px-3 text-sm ${f[chiave] === valore ? 'border-accento text-accento' : 'border-bordo text-testo'}`}>
      {nome}
    </button>
  );
  const filtrato = Object.values(f).some((v) => v !== undefined && v !== '');

  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="font-titolo text-lg text-accento">Incantesimi</h2>
      <p className="text-sm text-testo-2">{totale} {filtrato ? 'trovati' : 'nell\'SRD 5.2'} · tocca per leggere</p>
    </>}>
      <input type="search" placeholder="Cerca per nome (anche in inglese)" aria-label="Cerca un incantesimo"
        value={f.cerca ?? ''} onChange={(e) => setF({ ...f, cerca: e.target.value })}
        className="mb-2 h-11 w-full rounded-lg border border-bordo bg-superficie px-3 text-base text-testo" />
      <div className="mb-2 flex flex-wrap gap-2">
        <select aria-label="Classe" value={f.classe ?? ''} onChange={(e) => setF({ ...f, classe: e.target.value || undefined })} className={`${tendina} ${attiva(f.classe)}`}>
          <option value="">Tutte le classi</option>
          {CLASSI_INCANTATRICI.map((c) => <option key={c} value={c}>{DATI.classi[c]?.nome ?? c}</option>)}
        </select>
        <select aria-label="Livello" value={f.livello ?? ''} onChange={(e) => setF({ ...f, livello: e.target.value === '' ? undefined : Number(e.target.value) })} className={`${tendina} ${attiva(f.livello)}`}>
          <option value="">Tutti i livelli</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => <option key={l} value={l}>{titoloLivello(l)}</option>)}
        </select>
        <select aria-label="Scuola" value={f.scuola ?? ''} onChange={(e) => setF({ ...f, scuola: e.target.value || undefined })} className={`${tendina} ${attiva(f.scuola)}`}>
          <option value="">Tutte le scuole</option>
          {SCUOLE.map((s) => <option key={s} value={s}>{SCUOLA[s] ?? s}</option>)}
        </select>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {interruttore('concentrazione', 'no', 'Senza concentrazione')}
        {interruttore('rituale', 'si', 'Rituali')}
        {filtrato && <button onClick={() => setF({})} className="min-h-11 px-2 text-sm text-accento">Azzera</button>}
      </div>
      <p className="mb-3 text-xs text-testo-2">Al 1° livello si usano solo i trucchetti e gli incantesimi di 1°.</p>

      {totale === 0 && <p className="py-6 text-center text-sm text-testo-2">Nessun incantesimo con questi filtri.</p>}
      {gruppi.map((g) => (
        <section key={g.livello} className="mb-4">
          <h3 className="sticky top-0 z-1 -mx-1 mb-1 bg-sfondo/95 px-1 py-1 font-titolo text-base text-accento">
            {titoloLivello(g.livello)} <span className="font-sans text-xs text-testo-2">({g.incantesimi.length})</span>
          </h3>
          <ul className="divide-y divide-bordo">
            {g.incantesimi.map((id) => {
              const i = DATI.incantesimi[id];
              return (
                <li key={id}>
                  <button onClick={() => setAperto(id)} className="flex min-h-12 w-full items-center gap-3 py-1 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-testo">{i.nome}</span>
                      <span className="block text-xs text-testo-2">{[TEMPO[i.tempo.tipo], SCUOLA[i.scuola] ?? i.scuola, ...etichetteIncantesimo(id)].join(' · ')}</span>
                    </span>
                    <span aria-hidden className="text-testo-2">›</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {aperto && <SchedaIncantesimo id={aperto} chiudi={() => setAperto(null)} />}
    </FoglioDalBasso>
  );
}
