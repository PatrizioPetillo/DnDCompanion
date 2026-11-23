// I PF di un livello nuovo secondo la regola del tavolo (SRD p. 23): in «Sali di livello» (NuovoLivello) e nel passo
// Classe quando il tavolo parte da un livello più alto.
import { useState } from 'react';
import { pfFisso } from '../creazione/livello';
import type { RegolaPf } from '../regole/livelli';

const segno = (n: number) => (n >= 0 ? `+ ${n}` : `− ${-n}`);

export function SceltaPf({ livello, dadoVita, cos, regola, tiro, cambia }: {
  livello: number; dadoVita: number; cos: number; regola: RegolaPf; tiro: number | null; cambia: (t: number | null, usaTiro: boolean) => void;
}) {
  const fisso = pfFisso(dadoVita);
  const [modo, setModo] = useState<'fisso' | 'tiro'>(regola === 'scelta' ? (tiro !== null ? 'tiro' : 'fisso') : regola);
  const [testo, setTesto] = useState(tiro !== null ? String(tiro) : '');
  const usaTiro = regola === 'tiro' || (regola === 'scelta' && modo === 'tiro');
  const dado = usaTiro ? tiro : fisso;
  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-medium text-testo">Punti ferita del {livello}° livello</legend>
      {regola === 'scelta' && (
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Come calcoli i PF">
          {(['fisso', 'tiro'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={modo === m} onClick={() => { setModo(m); cambia(m === 'fisso' ? null : (Number(testo) || null), m === 'tiro'); }}
              className={`min-h-11 rounded-lg px-2 text-sm ${modo === m ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2'}`}>
              {m === 'fisso' ? `Valore fisso (${fisso})` : `Tiro del d${dadoVita}`}
            </button>
          ))}
        </div>
      )}
      {regola !== 'scelta' && <p className="text-sm text-testo-2">Regola del tavolo: {regola === 'fisso' ? 'valore fisso' : 'tiro del dado vita'}.</p>}
      {usaTiro && (
        <label className="flex items-center gap-2 text-sm text-testo">
          Tira 1d{dadoVita} e scrivi il risultato
          <input inputMode="numeric" value={testo} aria-label={`Risultato del d${dadoVita}`} onChange={(e) => {
            setTesto(e.target.value);
            const n = parseInt(e.target.value, 10);
            cambia(Number.isInteger(n) && n >= 1 && n <= dadoVita ? n : null, true);
          }} className={`h-11 w-16 rounded-lg border bg-sfondo text-center text-base ${tiro === null ? 'border-attenzione' : 'border-bordo'}`} />
        </label>
      )}
      <p className="text-base text-testo">
        {dado !== null ? <>PF in più: <strong>{Math.max(1, dado + cos)}</strong> <span className="text-sm text-testo-2">({usaTiro ? `tiro ${dado}` : `fisso ${fisso}`} {segno(cos)} Costituzione{dado + cos < 1 ? ', minimo 1' : ''})</span></>
          : <span className="text-sm text-attenzione">Scrivi un numero da 1 a {dadoVita}.</span>}
      </p>
    </fieldset>
  );
}
