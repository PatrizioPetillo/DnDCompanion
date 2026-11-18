// Scelta degli incantesimi, dal basso: stessa lista dal Background, dalla Specie e dalla Magia.
// Filtri anche al contrario («senza concentrazione»): in partita serve quello (sezione 6.5 bis).
import { useState } from 'react';
import { filtra, opzioniIncantesimi, scegliIncantesimo, type Filtri, type StatoIncantesimo, type TipoScelta } from '../creazione/magia';
import type { Bozza } from '../creazione/percorso';
import { DATI } from '../regole';
import type { Id } from '../regole/tipi';
import { etichetteIncantesimo, FoglioDalBasso, SchedaIncantesimo, SCUOLA } from './SchedaIncantesimo';

const TEMPO: Record<string, string> = { azione: 'Azione', azioneBonus: 'Azione bonus', reazione: 'Reazione', minuti: 'Minuti', ore: 'Ore' };

export function SelettoreIncantesimi({ bozza, cambia, magiaId, tipo, titolo, attesi, chiudi }: {
  bozza: Bozza; cambia: (b: Bozza) => void; magiaId: Id; tipo: TipoScelta; titolo: string; attesi: number; chiudi: () => void;
}) {
  const [filtri, setFiltri] = useState<Filtri>({});
  const [aperto, setAperto] = useState<Id | null>(null);
  const tutte = opzioniIncantesimi(bozza, magiaId, tipo);
  const voci = filtra(tutte, filtri);
  const scelti = tutte.filter((x) => x.stato === 'scelto').length;
  const scuole = [...new Set(tutte.map((x) => DATI.incantesimi[x.id].scuola))].sort();
  const interruttore = (chiave: 'concentrazione' | 'rituale', valore: 'si' | 'no', nome: string) => (
    <button
      onClick={() => setFiltri({ ...filtri, [chiave]: filtri[chiave] === valore ? undefined : valore })}
      aria-pressed={filtri[chiave] === valore}
      className={`min-h-11 rounded-full border px-3 text-sm ${filtri[chiave] === valore ? 'border-accento text-accento' : 'border-bordo text-testo'}`}
    >
      {nome}
    </button>
  );

  return (
    <FoglioDalBasso
      chiudi={chiudi}
      titolo={<>
        <p className="text-base font-medium text-testo">{titolo}</p>
        <p className={`text-sm ${scelti === attesi ? 'text-testo-2' : 'text-attenzione'}`}>{scelti} su {attesi}</p>
      </>}
    >
      <input
        type="search"
        placeholder="Cerca per nome (anche in inglese)"
        aria-label="Cerca un incantesimo"
        value={filtri.cerca ?? ''}
        onChange={(e) => setFiltri({ ...filtri, cerca: e.target.value })}
        className="mb-2 h-11 w-full rounded-lg border border-bordo bg-superficie px-3 text-base text-testo"
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {interruttore('concentrazione', 'no', 'Senza concentrazione')}
        {interruttore('rituale', 'si', 'Rituali')}
        <select
          aria-label="Scuola"
          value={filtri.scuola ?? ''}
          onChange={(e) => setFiltri({ ...filtri, scuola: e.target.value || undefined })}
          className="min-h-11 rounded-full border border-bordo bg-superficie px-3 text-sm text-testo"
        >
          <option value="">Tutte le scuole</option>
          {scuole.map((s) => <option key={s} value={s}>{SCUOLA[s]}</option>)}
        </select>
      </div>

      {voci.length === 0 && <p className="py-6 text-center text-sm text-testo-2">Nessun incantesimo con questi filtri.</p>}
      <ul className="divide-y divide-bordo">
        {voci.map((v) => {
          const i = DATI.incantesimi[v.id];
          const cliccabile = v.stato === 'scelto' || v.stato === 'sceglibile';
          return (
            <li key={v.id} className="flex items-center gap-2 py-1">
              <button
                onClick={() => cambia(scegliIncantesimo(bozza, magiaId, tipo, v.id))}
                disabled={!cliccabile}
                aria-pressed={v.stato === 'scelto'}
                className={`flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left ${cliccabile ? '' : 'opacity-60'}`}
              >
                <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${CERCHIO[v.stato]}`}>
                  {v.stato === 'scelto' || v.stato === 'altraFonte' ? '✓' : ''}
                </span>
                <span className="min-w-0">
                  <span className={`block text-base ${v.stato === 'scelto' ? 'font-medium text-accento' : 'text-testo'}`}>{v.nome}</span>
                  <span className="block text-xs text-testo-2">
                    {v.stato === 'altraFonte' ? `Già da ${v.fonte}` : [TEMPO[i.tempo.tipo], SCUOLA[i.scuola], ...etichetteIncantesimo(v.id)].join(' · ')}
                  </span>
                </span>
              </button>
              <button onClick={() => setAperto(v.id)} aria-label={`Leggi ${v.nome}`} className="min-h-11 min-w-11 rounded-full text-lg text-testo-2">ⓘ</button>
            </li>
          );
        })}
      </ul>
      {aperto && <SchedaIncantesimo id={aperto} chiudi={() => setAperto(null)} />}
    </FoglioDalBasso>
  );
}

const CERCHIO: Record<StatoIncantesimo, string> = {
  scelto: 'border-accento bg-accento text-su-accento',
  sceglibile: 'border-2 border-accento',
  pieno: 'border-bordo',
  altraFonte: 'border-testo-2 bg-testo-2 text-sfondo',
};
