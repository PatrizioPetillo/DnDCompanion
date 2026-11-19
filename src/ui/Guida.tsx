// Le guide della Home (19/11): un foglio dal basso con i capitoli che si aprono uno alla volta.
import { useState } from 'react';
import type { Guida } from '../guide/guide';
import { FoglioDalBasso } from './SchedaIncantesimo';

// Un'icona per guida (19/11): libro con stella per la magia, spade incrociate per il combattimento, clessidra per condizioni e riposi
const DISEGNI: Record<Guida['id'], React.ReactNode> = {
  magia: <>
    <path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z" />
    <path d="M12 6v13" />
    <path d="M16.5 8.5l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" />
  </>,
  combattimento: <>
    <path d="M4 4l11 11M20 4L9 15" />
    <path d="M12.5 16.5l4-4M11.5 16.5l-4-4" />
    <path d="M15.5 15.5l3 3M8.5 15.5l-3 3" />
    <circle cx="19.2" cy="19.2" r="1" /><circle cx="4.8" cy="19.2" r="1" />
  </>,
  condizioni: <>
    <path d="M6 3h12M6 21h12" />
    <path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
    <path d="M9.5 18.5h5l-2.5-2z" />
  </>,
};

export function IconaGuida({ id, dim = 28 }: { id: Guida['id']; dim?: number }) {
  return (
    <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {DISEGNI[id]}
    </svg>
  );
}

export function FoglioGuida({ guida, chiudi }: { guida: Guida; chiudi: () => void }) {
  const [aperto, setAperto] = useState<string | null>(null);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="font-titolo text-lg text-accento">{guida.titolo}</h2>
      <p className="text-sm text-testo-2">{guida.sottotitolo}</p>
    </>}>
      {guida.sezioni.map((s, i) => (
        <section key={i} className={i > 0 ? 'mt-5' : ''}>
          {s.titolo && <h3 className="mb-2 font-titolo text-base text-accento">{s.titolo}</h3>}
          <ul className="space-y-2">
            {s.capitoli.map((c) => {
              const su = aperto === c.id;
              return (
                <li key={c.id} className="rounded-xl border border-bordo bg-superficie">
                  <button onClick={() => setAperto(su ? null : c.id)} aria-expanded={su}
                    className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left">
                    <span className="flex-1 text-base text-testo">{c.titolo}</span>
                    <span aria-hidden className={`text-testo-2 transition-transform ${su ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {su && (
                    <div className="border-t border-bordo px-3 pb-3 pt-2">
                      <ul className="space-y-1.5 text-sm text-testo">
                        {c.righe.map((r) => <li key={r} className="flex gap-2"><span aria-hidden className="text-oro">•</span><span>{r}</span></li>)}
                      </ul>
                      {c.esempio && <p className="mt-2 rounded-lg bg-sfondo px-3 py-2 text-sm text-testo"><span className="text-testo-2">Esempio: </span>{c.esempio}</p>}
                      <p className="mt-2 text-xs text-testo-2">{c.pagina}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </FoglioDalBasso>
  );
}
