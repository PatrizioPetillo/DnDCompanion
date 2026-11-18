// Iniziato alla Magia scelto dove nasce: nel Background (Accolito, Saggio) o nella Specie (umano con Versatile).
// Lista (se non è fissata dal background), caratteristica, trucchetti e incantesimo di 1°. Gli stessi dati si
// vedono e si cambiano anche nella schermata Magia (SRD p. 83, 87).
import { blocchiMagia } from '../creazione/magia';
import type { Bozza } from '../creazione/percorso';
import { DATI } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import { NOME_LISTA } from '../regole/dati';
import type { Car, Id } from '../regole/tipi';
import { BloccoMagia } from './PassoMagia';

const LISTE = ['cleric', 'druid', 'wizard'];
const CARATTERISTICHE: Car[] = ['INT', 'SAG', 'CAR'];

export function RiquadroIniziato({ bozza, cambia, istanza }: { bozza: Bozza; cambia: (b: Bozza) => void; istanza: Id }) {
  const bg = bozza.background ? DATI.background[bozza.background] : undefined;
  const fissata = istanza === 'magic-initiate' ? bg?.talento.parametri?.['magic-initiate.lista'] : undefined;
  const altra = istanza !== 'magic-initiate' ? (bg?.talento.parametri?.['magic-initiate.lista'] ?? bozza.scelte['magic-initiate.lista']?.[0]) : undefined;
  const lista = fissata ?? bozza.scelte[`${istanza}.lista`]?.[0];
  const car = bozza.scelte[`${istanza}.caratteristica`]?.[0];
  const blocco = blocchiMagia(bozza).find((b) => b.id === istanza);
  const incompleto = !lista || !car || (blocco?.contatori.some((c) => c.scelti < c.attesi) ?? true);

  const scegliLista = (l: Id) => {
    const scelte = { ...bozza.scelte, [`${istanza}.lista`]: [l] };
    delete scelte[`${istanza}.trucchetti`];                    // cambiata la lista, i vecchi incantesimi non valgono più
    delete scelte[`${istanza}.incantesimo1`];
    cambia({ ...bozza, scelte });
  };

  return (
    <fieldset className={`mt-2 rounded-xl border bg-superficie p-4 ${incompleto ? 'border-attenzione' : 'border-bordo'}`}>
      <legend className="px-1 text-sm font-medium text-testo">
        Iniziato alla Magia{lista ? ` (${NOME_LISTA[lista]})` : ''}
      </legend>
      <p className="mb-3 text-sm text-testo-2">
        2 trucchetti e 1 incantesimo di 1° sempre preparato: lo lanci gratis 1 volta per riposo lungo, e anche con gli slot.
      </p>

      <p className="mb-1 text-sm font-medium text-testo">Lista</p>
      {fissata ? (
        <p className="mb-3 text-base text-testo">{NOME_LISTA[fissata]} <span className="text-sm text-testo-2">(data dal {bg?.nome})</span></p>
      ) : (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {LISTE.map((l) => (
            <button
              key={l}
              onClick={() => scegliLista(l)}
              disabled={l === altra}
              aria-pressed={lista === l}
              title={l === altra ? 'Già presa con l\'altro Iniziato: serve una lista diversa (p. 87)' : undefined}
              className={`min-h-11 rounded-lg text-sm ${lista === l ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'} disabled:opacity-40`}
            >
              {NOME_LISTA[l]}
            </button>
          ))}
        </div>
      )}
      {altra && !fissata && <p className="-mt-2 mb-3 text-xs text-testo-2">{NOME_LISTA[altra]} è già presa con l'altro Iniziato: il talento si ripete solo con una lista diversa.</p>}

      <p className="mb-1 text-sm font-medium text-testo">Caratteristica per lanciarli</p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {CARATTERISTICHE.map((c) => (
          <button
            key={c}
            onClick={() => cambia({ ...bozza, scelte: { ...bozza.scelte, [`${istanza}.caratteristica`]: [c] } })}
            aria-pressed={car === c}
            className={`min-h-11 rounded-lg text-sm ${car === c ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}
          >
            {NOME_CAR[c]}
          </button>
        ))}
      </div>
      {car && blocco?.cd && (
        <p className="mb-3 text-sm text-testo-2">
          {bozza.punteggi ? <>CD <strong className="text-testo">{blocco.cd.totale}</strong> · attacco <strong className="text-testo">+{blocco.attacco?.totale}</strong></> : 'CD e attacco li vedi dopo aver scelto le Caratteristiche.'}
        </p>
      )}

      {lista && blocco && <BloccoMagia blocco={blocco} bozza={bozza} cambia={cambia} soloScelte />}
    </fieldset>
  );
}

// Quale istanza di Iniziato dà Versatile: la seconda se il background dà già Iniziato, altrimenti la prima.
export const istanzaVersatile = (b: Bozza): Id =>
  b.background && DATI.background[b.background]?.talento.talento === 'magic-initiate' ? 'magic-initiate@human-versatile' : 'magic-initiate';
