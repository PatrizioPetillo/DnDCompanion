// Tendina nello stile di Character Keep: etichetta sopra, evidenziata finché è vuota.
// Le opzioni non valide restano visibili ma spente, con il motivo tra parentesi.
import type { Opzione } from '../creazione/opzioni';

export function Tendina({ etichetta, valore, opzioni, gruppi, cambia }: {
  etichetta: string;
  valore: string;
  opzioni: Opzione[];
  gruppi?: { titolo: string; opzioni: Opzione[] }[];
  cambia: (id: string) => void;
}) {
  const vuota = !valore;
  const voce = (o: Opzione) => (
    <option key={o.id} value={o.id} disabled={o.disattivata}>{o.nome}{o.motivo ? ` (${o.motivo})` : ''}</option>
  );
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-testo">{etichetta}</span>
      <select
        value={valore}
        onChange={(e) => cambia(e.target.value)}
        className={`h-12 w-full rounded-lg border px-3 text-base text-testo ${vuota ? 'border-attenzione bg-attenzione/10' : 'border-bordo bg-sfondo'}`}
      >
        <option value="">Scegli…</option>
        {opzioni.map(voce)}
        {gruppi?.map((g) => <optgroup key={g.titolo} label={g.titolo}>{g.opzioni.map(voce)}</optgroup>)}
      </select>
    </label>
  );
}

export const semplici = (voci: { id: string; nome: string }[]): Opzione[] => voci.map((v) => ({ ...v, disattivata: false }));
