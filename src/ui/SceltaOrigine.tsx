// Scelte dell'origine che stanno nel passo Background (come in Character Keep):
// i bonus alle caratteristiche (SRD p. 83) e le 2 lingue (p. 20-21).
import { useState } from 'react';
import { opzioniLingua } from '../creazione/opzioni';
import { NOME_CAR } from '../regole/dati/base';
import type { Car } from '../regole/tipi';
import { Tendina } from './Tendina';

const riquadro = 'mt-2 rounded-xl border bg-superficie p-4';
const selezione = 'h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo';

export function BonusBackground({ car, bonus, imposta }: {
  car: Car[];
  bonus: Partial<Record<Car, number>>;
  imposta: (b: Partial<Record<Car, number>>) => void;
}) {
  const tripla = Object.keys(bonus).length === 3;
  const [modo, setModo] = useState<'due' | 'tre'>(tripla ? 'tre' : 'due');
  const piuDue = (Object.keys(bonus) as Car[]).find((c) => bonus[c] === 2) ?? '';
  const piuUno = tripla ? '' : (Object.keys(bonus) as Car[]).find((c) => bonus[c] === 1) ?? '';
  const vuoto = Object.keys(bonus).length === 0 || (modo === 'due' && (!piuDue || !piuUno));

  const scegliModo = (m: 'due' | 'tre') => {
    setModo(m);
    imposta(m === 'tre' ? Object.fromEntries(car.map((c) => [c, 1])) : {});
  };
  const scegli = (valore: 2 | 1, c: Car | '') => {
    const altro = valore === 2 ? piuUno : piuDue;
    const nuovo: Partial<Record<Car, number>> = {};
    if (c) nuovo[c] = valore;
    if (altro && altro !== c) nuovo[altro] = valore === 2 ? 1 : 2;
    imposta(nuovo);
  };

  return (
    <fieldset className={`${riquadro} ${vuoto ? 'border-attenzione' : 'border-bordo'}`}>
      <legend className="px-1 text-sm font-medium text-testo">Bonus alle caratteristiche</legend>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {(['due', 'tre'] as const).map((m) => (
          <button
            key={m}
            onClick={() => scegliModo(m)}
            aria-pressed={modo === m}
            className={`min-h-11 rounded-lg text-base ${modo === m ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}
          >
            {m === 'due' ? '+2 e +1' : '+1 a tutte e tre'}
          </button>
        ))}
      </div>
      {modo === 'tre' ? (
        <p className="text-base text-testo">{car.map((c) => `+1 ${NOME_CAR[c]}`).join(' · ')}</p>
      ) : (
        <div className="space-y-2">
          {([2, 1] as const).map((v) => (
            <label key={v} className="flex items-center gap-3 text-base text-testo">
              <span className="w-8 font-medium">+{v}</span>
              <select
                value={v === 2 ? piuDue : piuUno}
                onChange={(e) => scegli(v, e.target.value as Car | '')}
                className={selezione}
              >
                <option value="">Scegli…</option>
                {car.filter((c) => c !== (v === 2 ? piuUno : piuDue)).map((c) => <option key={c} value={c}>{NOME_CAR[c]}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function SceltaLingue({ lingue, imposta, giaConosciute = [] }: { lingue: string[]; imposta: (l: string[]) => void; giaConosciute?: string[] }) {
  const cambia = (i: number, id: string) => {
    const nuove = [lingue[0] ?? '', lingue[1] ?? ''];
    nuove[i] = id;
    imposta(nuove.filter(Boolean));
  };
  return (
    <div className={`${riquadro} space-y-3 border-bordo`}>
      <p className="text-sm text-testo-2">Conosci già il Comune. Scegli altre 2 lingue.</p>
      {[0, 1].map((i) => {
        const o = opzioniLingua(lingue, i, giaConosciute);
        return (
          <Tendina
            key={i}
            etichetta={`Lingua ${i + 1}`}
            valore={lingue[i] ?? ''}
            opzioni={o.standard}
            gruppi={[{ titolo: 'Rare (con il permesso del master)', opzioni: o.rare }]}
            cambia={(id) => cambia(i, id)}
          />
        );
      })}
    </div>
  );
}