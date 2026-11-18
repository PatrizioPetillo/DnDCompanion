// La scheda di un incantesimo, dal basso, sopra la lista (sezione 6.3). Il testo completo (SRD 5.2.1 in italiano)
// si carica solo quando la si apre: è un file a parte, pesante.
import { useEffect, useState } from 'react';
import { DATI } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import type { Id } from '../regole/tipi';

export const SCUOLA: Record<string, string> = {
  abjuration: 'abiurazione', conjuration: 'evocazione', divination: 'divinazione', enchantment: 'ammaliamento',
  evocation: 'invocazione', illusion: 'illusione', necromancy: 'necromanzia', transmutation: 'trasmutazione',
};

type Testi = Record<Id, { testo: string; superiori?: string; potenziato?: string }>;
let cache: Testi | null = null;

export function FoglioDalBasso({ titolo, chiudi, children }: { titolo: React.ReactNode; chiudi: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && chiudi();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [chiudi]);
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40" onClick={chiudi}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex max-h-[88vh] w-full max-w-120 flex-col rounded-t-2xl border-t border-bordo bg-sfondo pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-start justify-between gap-2 border-b border-bordo px-4 py-3">
          <div className="min-w-0">{titolo}</div>
          <button onClick={chiudi} className="min-h-11 shrink-0 rounded-lg px-3 text-base text-accento">Chiudi</button>
        </div>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export function etichetteIncantesimo(id: Id): string[] {
  const i = DATI.incantesimi[id];
  if (!i) return [];
  const e: string[] = [];
  if (i.concentrazione) e.push('Concentrazione');
  if (i.rituale) e.push('Rituale');
  if (i.componenti.M?.costoMo) e.push(`Materiale ${i.componenti.M.costoMo} mo${i.componenti.M.consumato ? ', si consuma' : ''}`);
  return e;
}

export function SchedaIncantesimo({ id, chiudi }: { id: Id; chiudi: () => void }) {
  const i = DATI.incantesimi[id];
  const [testi, setTesti] = useState<Testi | null>(cache);
  useEffect(() => {
    if (!cache) import('../regole/dati/incantesimi-testi.json').then((m) => { cache = m.default as Testi; setTesti(cache); });
  }, []);
  if (!i) return null;
  const t = testi?.[id];
  const tipo = i.livello === 0 ? `Trucchetto di ${SCUOLA[i.scuola]}` : `${i.livello}° livello, ${SCUOLA[i.scuola]}`;
  return (
    <FoglioDalBasso
      chiudi={chiudi}
      titolo={<>
        <p className="font-titolo text-xl text-accento">{i.nome}</p>
        <p className="text-sm text-testo-2">{tipo} · {i.nomeEn}</p>
      </>}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-testo-2">Tempo</dt><dd className="text-testo">{i.it?.tempo ?? i.tempo.testo}</dd>
        <dt className="text-testo-2">Gittata</dt><dd className="text-testo">{i.it?.gittata ?? i.gittata}</dd>
        <dt className="text-testo-2">Componenti</dt><dd className="text-testo">{i.it?.componenti}</dd>
        <dt className="text-testo-2">Durata</dt><dd className="text-testo">{i.it?.durata ?? i.durata}</dd>
        {i.tiro && <><dt className="text-testo-2">Tiro</dt><dd className="text-testo">{i.tiro.tipo === 'attacco' ? 'Attacco con incantesimo' : `Tiro salvezza su ${NOME_CAR[i.tiro.car]}`}</dd></>}
        {i.danni && <><dt className="text-testo-2">Danni</dt><dd className="text-testo">{i.danni.join(', ')}</dd></>}
      </dl>
      {etichetteIncantesimo(id).length > 0 && (
        <p className="mt-2 flex flex-wrap gap-1">
          {etichetteIncantesimo(id).map((e) => <span key={e} className="rounded-full border border-bordo px-2 py-0.5 text-xs text-testo">{e}</span>)}
        </p>
      )}
      <div className="mt-3 space-y-2 text-base leading-relaxed text-testo">
        {!testi && <p className="text-testo-2">Carico il testo…</p>}
        {testi && !t?.testo && <p className="text-testo-2">Testo non disponibile: vedi l'SRD{i.srd ? `, p. ${i.srd.pagina}` : ''}.</p>}
        {t?.testo && <p>{t.testo}</p>}
        {t?.potenziato && <p><strong>Trucchetto potenziato.</strong> {t.potenziato}</p>}
        {t?.superiori && <p><strong>Con uno slot di livello superiore.</strong> {t.superiori}</p>}
      </div>
      <p className="mt-4 text-xs text-testo-2">Testo dall'SRD 5.2.1 in italiano, licenza CC-BY-4.0.</p>
    </FoglioDalBasso>
  );
}
