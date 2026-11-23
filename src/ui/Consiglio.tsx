// «Non sai cosa scegliere?» (idea 2, 23/11): un riquadro chiuso, si apre solo se serve. Consigli nostri, non regole.
import type { ReactNode } from 'react';

export function Consiglio({ children, titolo = 'Non sai cosa scegliere?' }: { children: ReactNode; titolo?: string }) {
  return (
    <details className="mb-4 rounded-xl border border-oro/60 bg-superficie">
      <summary className="min-h-11 cursor-pointer px-3 py-2.5 text-sm font-medium text-testo">{titolo}</summary>
      <div className="space-y-2 border-t border-bordo px-3 pb-3 pt-2 text-sm text-testo">
        {children}
        <p className="text-xs text-testo-2">Sono consigli per chi inizia, non regole: ogni scelta dell'SRD va bene.</p>
      </div>
    </details>
  );
}
