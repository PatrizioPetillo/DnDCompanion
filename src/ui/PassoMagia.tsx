// Passo 7: Magia (sezione 6). Un blocco per fonte, separato da una linea sottile con il nome della fonte al centro.
// Ogni blocco: CD e attacco con la somma, focus, lanci gratuiti, capacità, contatori che aprono la scelta.
import { useState } from 'react';
import { NOME_CAR } from '../regole/dati/base';
import { Tendina } from './Tendina';
import { blocchiMagia, type Blocco, type TipoScelta } from '../creazione/magia';
import type { Bozza } from '../creazione/percorso';
import { DATI } from '../regole';
import { NOME_LISTA } from '../regole/dati';
import type { Id, Numero } from '../regole/tipi';
import { SchedaIncantesimo } from './SchedaIncantesimo';
import { SelettoreIncantesimi } from './SelettoreIncantesimi';

const somma = (n: Numero, finale: string) =>
  `${n.termini.map((t, i) => `${i ? (t.valore < 0 ? ' − ' : ' + ') : ''}${t.etichetta === 'Base' ? '' : `${t.etichetta} `}${Math.abs(t.valore)}`).join('')} = ${finale}`;

export function Separatore({ titolo }: { titolo: string }) {
  return (
    <div className="my-4 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-bordo" />
      <span className="text-center text-sm font-medium text-testo-2">{titolo}</span>
      <span className="h-px flex-1 bg-bordo" />
    </div>
  );
}

export function PassoMagia({ bozza, cambia }: { bozza: Bozza; cambia: (b: Bozza) => void }) {
  const blocchi = blocchiMagia(bozza);
  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Magia</h1>
      <p className="mb-2 text-sm text-testo-2">Ogni fonte di magia ha la sua lista, la sua CD e le sue regole. Tocca un numero per vedere da dove viene.</p>
      {blocchi.length === 0 && <p className="mt-4 text-base text-testo">Il tuo personaggio non lancia incantesimi: puoi andare avanti.</p>}
      {blocchi.map((b) => (
        <div key={b.id}>
          <Separatore titolo={b.nome} />
          <BloccoMagia blocco={b} bozza={bozza} cambia={cambia} />
        </div>
      ))}
    </section>
  );
}

export function BloccoMagia({ blocco: b, bozza, cambia, soloScelte }: {
  blocco: Blocco; bozza: Bozza; cambia: (b: Bozza) => void; soloScelte?: boolean;
}) {
  const [aperto, setAperto] = useState<TipoScelta | null>(null);
  const [spiega, setSpiega] = useState<'cd' | 'attacco' | null>(null);
  const [scheda, setScheda] = useState<Id | null>(null);
  const contatore = aperto ? b.contatori.find((c) => c.tipo === aperto) : undefined;
  return (
    <div className="space-y-3">
      {b.listaDaScegliere && !soloScelte && <SceltaListaIniziato blocco={b} bozza={bozza} cambia={cambia} />}
      {b.caratteristica && !soloScelte && (
        // La caratteristica di un talento o di una specie si sceglie anche qui; nel riquadro di Iniziato ci sono già i pulsanti (23/11: era doppia)
        <Tendina etichetta="Caratteristica per questi incantesimi" valore={b.caratteristica.valore}
          opzioni={(['INT', 'SAG', 'CAR'] as const).map((c) => ({ id: c, nome: NOME_CAR[c], disattivata: false }))}
          cambia={(v) => cambia({ ...bozza, scelte: { ...bozza.scelte, [b.caratteristica!.scelta]: v ? [v] : [] } })} />
      )}
      {!soloScelte && b.cd && b.attacco && (
        <div className="grid grid-cols-2 gap-2">
          {(['cd', 'attacco'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSpiega(spiega === k ? null : k)}
              aria-expanded={spiega === k}
              className="rounded-xl border border-bordo bg-superficie p-3 text-left"
            >
              <span className="block text-sm text-testo-2">{k === 'cd' ? 'CD dei tiri salvezza' : 'Attacco con incantesimo'}</span>
              <span className="block text-2xl font-medium text-testo">{k === 'cd' ? b.cd!.totale : `+${b.attacco!.totale}`}</span>
            </button>
          ))}
        </div>
      )}
      {!soloScelte && spiega && b.cd && b.attacco && (
        <p className="rounded-lg bg-superficie px-3 py-2 text-sm text-testo">
          {spiega === 'cd'
            ? `${somma(b.cd, String(b.cd.totale))}. Chi subisce il tuo incantesimo tira contro questo numero.`
            : `${somma(b.attacco, `+${b.attacco.totale}`)}. Tiri un d20 e aggiungi questo.`}
        </p>
      )}
      {!soloScelte && (b.focus || b.lanci) && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {b.focus && <><dt className="text-testo-2">Focus</dt><dd className="text-testo">{b.focus} (o una borsa per componenti)</dd></>}
          {b.lanci && <><dt className="text-testo-2">Gratis</dt><dd className="text-testo">{b.lanci}</dd></>}
        </dl>
      )}

      {b.contatori.map((c) => {
        const lista = c.voci;
        return (
          <button
            key={c.tipo}
            onClick={() => setAperto(c.tipo)}
            disabled={!!b.listaDaScegliere}
            className={`w-full rounded-xl border bg-superficie p-3 text-left disabled:opacity-50 ${c.scelti < c.attesi ? 'border-attenzione' : 'border-bordo'}`}
          >
            <span className="flex items-baseline justify-between">
              <span className="text-base font-medium text-testo">{c.etichetta}</span>
              <span className={`text-base ${c.scelti < c.attesi ? 'text-attenzione' : 'text-testo'}`}>{c.scelti}/{c.attesi} ›</span>
            </span>
            {lista.length > 0 && (
              <span className="mt-1 block text-sm text-testo-2">{lista.map((i) => DATI.incantesimi[i]?.nome ?? i).join(' · ')}</span>
            )}
          </button>
        );
      })}

      {!soloScelte && b.semprePreparati.length > 0 && (
        <p className="text-sm text-testo">
          <span className="text-testo-2">Sempre preparati: </span>
          {b.semprePreparati.map((i, n) => (
            <span key={i}>{n > 0 && ' · '}<button onClick={() => setScheda(i)} className="underline decoration-bordo underline-offset-4">{DATI.incantesimi[i]?.nome ?? i}</button></span>
          ))}
        </p>
      )}
      {!soloScelte && b.capacita.length > 0 && (
        <ul className="space-y-1 text-sm">
          {b.capacita.map((c) => <li key={c.nome}><strong className="text-testo">{c.nome}.</strong> <span className="text-testo-2">{c.testo}</span></li>)}
        </ul>
      )}

      {aperto && contatore && (
        <SelettoreIncantesimi
          bozza={bozza} cambia={cambia} magiaId={b.id} tipo={aperto}
          titolo={`${b.nome} · ${contatore.etichetta}`} attesi={contatore.attesi} chiudi={() => setAperto(null)}
        />
      )}
      {scheda && <SchedaIncantesimo id={scheda} chiudi={() => setScheda(null)} />}
    </div>
  );
}


// Iniziato alla magia senza lista (dato da Pluriabilità): la lista si sceglie anche qui, prima degli incantesimi (SRD p. 87)
function SceltaListaIniziato({ blocco: b, bozza, cambia }: { blocco: Blocco; bozza: Bozza; cambia: (b: Bozza) => void }) {
  const altre = Object.entries(bozza.scelte).filter(([k]) => k.endsWith('.lista') && k !== b.listaDaScegliere).flatMap(([, v]) => v);
  const bgLista = bozza.background ? DATI.background[bozza.background]?.talento.parametri?.['magic-initiate.lista'] : undefined;
  if (bgLista) altre.push(bgLista);
  const scegli = (l: string) => {
    const base = b.listaDaScegliere!.replace(/\.lista$/, '');
    const scelte = { ...bozza.scelte, [b.listaDaScegliere!]: [l] };
    delete scelte[`${base}.trucchetti`];
    delete scelte[`${base}.incantesimo1`];
    cambia({ ...bozza, scelte });
  };
  return (
    <div className="rounded-xl border border-attenzione bg-superficie p-3">
      <p className="mb-2 text-sm font-medium text-testo">Prima scegli la lista</p>
      <div className="grid grid-cols-3 gap-2">
        {(['cleric', 'druid', 'wizard'] as const).map((l) => (
          <button key={l} onClick={() => scegli(l)} disabled={altre.includes(l)} title={altre.includes(l) ? 'Già presa con l\'altro Iniziato: serve una lista diversa (p. 87)' : undefined}
            className="min-h-11 rounded-lg border border-bordo text-sm text-testo disabled:opacity-40">{NOME_LISTA[l]}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-testo-2">Trucchetti e incantesimo di 1° vengono da questa lista.</p>
    </div>
  );
}
