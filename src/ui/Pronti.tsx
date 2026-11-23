// Personaggi pronti (idea 12, 23/11/2026): un foglio con i 12 personaggi, uno per classe. Senza tavolo si sceglie
// il livello (1-5); con il tavolo nascono al livello del tavolo e compaiono solo quelli che il master ammette.
import { useState } from 'react';
import type { Predefinito } from '../creazione/predefiniti';
import { DATI } from '../regole';
import { LIVELLO_MASSIMO } from '../regole/livelli';
import { immagine } from './Illustrazione';
import { FoglioDalBasso } from './SchedaIncantesimo';

// Il ritratto del personaggio pronto: il volto ritagliato (512 × 512, <id>-volto.webp); la figura intera
// (<id>.webp, 800 × 1200, scelta di Patrizio del 23/11) si apre dal ritratto, con «Figura intera»
export async function ritrattoPronto(id: string): Promise<string | undefined> {
  const url = immagine('predefiniti', `${id}-volto`);
  if (!url) return undefined;
  try {
    const b = await (await fetch(url)).blob();
    return await new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(b); });
  } catch { return undefined; }
}

export function SceltaPronti({ elenco, livelloFisso, scegli, daZero, chiudi }: {
  elenco: Predefinito[]; livelloFisso?: number; scegli: (p: Predefinito, livello: number) => void; daZero?: () => void; chiudi: () => void;
}) {
  const [livello, setLivello] = useState(livelloFisso ?? 1);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="text-lg font-medium text-testo">Nuovo personaggio</h2>}>
      {daZero && (
        <>
          <button onClick={daZero} className="mb-1 h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Crea da zero</button>
          <p className="mb-4 text-sm text-testo-2">L'app ti guida un passo alla volta. Oppure parti da un personaggio pronto qui sotto: si gioca subito, e lo puoi cambiare.</p>
        </>
      )}
      <h3 className="mb-2 text-base font-medium text-testo">Personaggi pronti</h3>
      {livelloFisso === undefined ? (
        <div role="radiogroup" aria-label="Livello" className="mb-3 grid grid-cols-5 gap-2">
          {Array.from({ length: LIVELLO_MASSIMO }, (_, i) => i + 1).map((l) => (
            <button key={l} role="radio" aria-checked={livello === l} onClick={() => setLivello(l)}
              className={`min-h-11 rounded-lg text-base ${livello === l ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}>{l}°</button>
          ))}
        </div>
      ) : <p className="mb-3 text-sm text-testo-2">Al {livelloFisso}° livello, come il tavolo.</p>}
      {elenco.length === 0 && <p className="text-sm text-testo-2">Nessun personaggio pronto rispetta le regole di questo tavolo.</p>}
      <ul className="space-y-3">
        {elenco.map((p) => {
          const proprio = immagine('predefiniti', `${p.id}-volto`);
          const src = proprio ?? immagine('classi', p.classe);
          return (
            <li key={p.id}>
              <button onClick={() => scegli(p, livello)} className="riquadro flex w-full gap-3 rounded-xl border bg-superficie p-3 text-left">
                {src
                  ? <img src={src} alt="" className="h-16 w-16 shrink-0 rounded-full border border-bordo object-cover" style={{ objectPosition: proprio ? '50% 50%' : '50% 25%' }} />
                  : <span className="h-16 w-16 shrink-0 rounded-full border border-bordo" />}
                <span className="min-w-0">
                  <span className="block text-base font-medium text-testo">{p.nome}</span>
                  <span className="block text-sm text-testo-2">{DATI.classi[p.classe].nome} · {DATI.specie[p.specie].nome} · {DATI.background[p.background].nome}</span>
                  <span className="mt-1 block text-sm italic text-testo">{p.frase}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </FoglioDalBasso>
  );
}

