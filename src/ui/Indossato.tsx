// «Cosa indossi» (21/11): l'armatura indossata, lo scudo imbracciato e gli incantesimi che cambiano la CA mentre durano.
// Sta nel passo Equipaggiamento e nello Zaino della scheda: si cambia anche a scheda salvata (è un dato di gioco).
import type { Bozza } from '../creazione/percorso';
import type { Scheda } from '../regole/tipi';

export function Indossato({ bozza, scheda, cambia }: { bozza: Bozza; scheda: Scheda; cambia?: (b: Bozza) => void }) {
  const armature = scheda.ca.formule.filter((f) => f.id.startsWith('armatura:'));
  const haScudo = scheda.inventario.some((v) => v.oggetto === 'shield');
  const incantesimi = scheda.ca.formule.filter((f) => f.incantesimo);
  const equip = bozza.equip ?? {};
  const attivi = equip.attivi ?? [];
  const valore = (id: string) => scheda.ca.formule.find((f) => f.id === id)?.valore.totale;
  const metti = (e: Bozza['equip']) => cambia?.({ ...bozza, equip: { ...equip, ...e } });
  if (!armature.length && !haScudo && !incantesimi.length) return null;
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-bordo bg-superficie p-3">
      <h3 className="text-sm font-medium text-testo">Cosa indossi</h3>
      {armature.length > 0 && (
        <label className="flex items-center justify-between gap-3 text-sm text-testo">
          <span>Armatura</span>
          <select disabled={!cambia} value={scheda.ca.indossata ?? 'nessuna'}
            onChange={(e) => metti({ armatura: e.target.value, attivi: e.target.value === 'nessuna' ? attivi : [] })}
            className="min-h-11 max-w-56 rounded-lg border border-testo-2/60 bg-sfondo px-2 text-sm text-testo">
            <option value="nessuna">Nessuna</option>
            {armature.map((f) => <option key={f.id} value={f.id.slice('armatura:'.length)}>{f.nome} (CA {f.valore.totale})</option>)}
          </select>
        </label>
      )}
      {haScudo && (
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-testo">
          <span>Scudo imbracciato <span className="text-testo-2">(+2 CA)</span></span>
          <input type="checkbox" disabled={!cambia} checked={scheda.ca.scudo} onChange={(e) => metti({ scudo: e.target.checked })} className="h-6 w-6 accent-[var(--accento)]" />
        </label>
      )}
      {incantesimi.map((f) => (
        <label key={f.id} className="flex min-h-11 items-center justify-between gap-3 text-sm text-testo">
          <span>{f.nome} attiva <span className="text-testo-2">(CA {valore(f.id)}, senza armatura · finisce col riposo lungo)</span></span>
          <input type="checkbox" disabled={!cambia} checked={attivi.includes(f.id)}
            onChange={(e) => metti(e.target.checked ? { attivi: [...attivi, f.id], armatura: 'nessuna' } : { attivi: attivi.filter((x) => x !== f.id) })}
            className="h-6 w-6 accent-[var(--accento)]" />
        </label>
      ))}
    </div>
  );
}
