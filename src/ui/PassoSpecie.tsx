// Passo 4: Specie (sezione 5.2) con le scelte interne e le lingue (SRD p. 20-21, 84-86).
import type { Bozza } from '../creazione/percorso';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import { metri } from '../regole/misure';
import type { Scelta } from '../regole/tipi';
import { istanzaVersatile, RiquadroIniziato } from './RiquadroIniziato';
import { semplici, Tendina } from './Tendina';
import { etichettaLignaggio } from '../creazione/opzioni';
import { Fascia } from './Illustrazione';

const TAGLIA: Record<string, string> = { media: 'Media', piccola: 'Piccola' };

function nomeOpzione(s: Scelta, o: string): string {
  if (s.tipo === 'caratteristica') return NOME_CAR[o as keyof typeof NOME_CAR] ?? o;
  if (s.tipo === 'abilita') return ABILITA[o]?.nome ?? o;
  if (s.tipo === 'talento') return DATI.talenti[o]?.nome ?? o;
  return o;
}

const TITOLO: Record<string, string> = {
  caratteristica: 'Caratteristica per gli incantesimi della specie', abilita: 'Abilità', talento: 'Talento d\'origine',
};

export function PassoSpecie({ bozza, scegli, cambia }: {
  bozza: Bozza;
  scegli: (id: string) => void;
  cambia: (b: Bozza) => void;
}) {
  const imposta = (id: string, valori: string[]) => cambia({ ...bozza, scelte: { ...bozza.scelte, [id]: valori } });
  const specie = bozza.specie ? DATI.specie[bozza.specie] : undefined;

  const scelte: { scelta: Scelta; titolo: string; opzioni: { id: string; nome: string }[] }[] = [];
  if (specie?.lignaggi) {
    const L = specie.lignaggi;
    scelte.push({
      scelta: { id: L.scelta, tipo: 'opzione', quantita: 1, srd: L.srd },
      titolo: specie.id === 'tiefling' ? 'Eredità' : specie.id === 'dragonborn' || specie.id === 'goliath' ? 'Antenato' : 'Stirpe',
        opzioni: L.opzioni.map((o) => ({ id: o.id, nome: etichettaLignaggio(o) })),
    });
  }
  for (const t of specie?.tratti ?? []) for (const e of t.effetti) {
    if (e.tipo !== 'scelta') continue;
    const s = e.scelta;
    const ids = s.opzioni ?? (s.filtro && 'categoriaTalento' in s.filtro
      ? Object.values(DATI.talenti).filter((x) => x.categoria === (s.filtro as { categoriaTalento: string }).categoriaTalento).map((x) => x.id)
      : []);
    scelte.push({ scelta: s, titolo: `${t.nome}: ${TITOLO[s.tipo] ?? 'scelta'}`, opzioni: ids.map((o) => ({ id: o, nome: nomeOpzione(s, o) })) });
  }

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Scegli la specie</h1>
      <p className="mb-4 text-sm text-testo-2">Da dove viene il tuo personaggio: ti dà taglia, velocità e alcuni tratti.</p>
      <ul className="space-y-3">
        {Object.values(DATI.specie).map((sp) => {
          const scelta = bozza.specie === sp.id;
          return (
                        <li
              key={sp.id}
              ref={scelta ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : undefined}
              className={`rounded-xl bg-superficie ${scelta ? 'border-2 border-accento' : 'border border-bordo'}`}
            >
            <Fascia gruppo="specie" id={sp.id} />
              <button onClick={() => scegli(sp.id)} aria-pressed={scelta} aria-expanded={scelta} className="w-full p-4 text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-medium text-testo">{sp.nome}</span>
                  <span className="text-xs text-testo-2">{sp.taglie.map((t) => TAGLIA[t]).join(' o ')} · {metri(sp.velocita)}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-testo-2">{sp.tratti.map((t) => t.nome).join(' · ')}</p>
              </button>

              {/* Le scelte della specie stanno nello stesso riquadro, sotto i tratti */}
              {scelta && scelte.length > 0 && (
                <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
                  {scelte.map(({ scelta: s, titolo, opzioni }) => (
                    <Tendina
                      key={s.id}
                      etichetta={titolo}
                      valore={bozza.scelte[s.id]?.[0] ?? ''}
                      opzioni={semplici(opzioni)}
                      cambia={(v) => imposta(s.id, v ? [v] : [])}
                    />
                  ))}
                  {bozza.scelte['human.versatile']?.[0] === 'magic-initiate' && (
                    <RiquadroIniziato bozza={bozza} cambia={cambia} istanza={istanzaVersatile(bozza)} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}