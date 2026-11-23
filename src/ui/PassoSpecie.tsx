// Passo 4: Specie (sezione 5.2) con le scelte interne (SRD p. 84-86). Le lingue stanno nel Background.
import { useState } from 'react';
import { visibile, type Bozza } from '../creazione/percorso';
import { moduloDaSpecie, moduloSpecieVuoto, type ModuloSpecie as Modulo } from '../creazione/specie-personalizzate';
import { ModuloSpecie } from './ModuloSpecie';
import { Separatore } from './PassoMagia';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import { metri } from '../regole/misure';
import { Fascia } from './Illustrazione';
import { cosaOttieniSpecie } from '../creazione/cosa-ottieni-specie';
import type { Scelta, Specie } from '../regole/tipi';
import { istanzaVersatile, RiquadroIniziato } from './RiquadroIniziato';
import { Tendina } from './Tendina';
import { etichettaLignaggio } from '../creazione/opzioni';

const TAGLIA: Record<string, string> = { media: 'Media', piccola: 'Piccola' };

// Nome leggibile di un'opzione, a seconda del tipo di scelta.
function nomeOpzione(s: Scelta, o: string): string {
  if (s.tipo === 'caratteristica') return NOME_CAR[o as keyof typeof NOME_CAR] ?? o;
  if (s.tipo === 'abilita') return ABILITA[o]?.nome ?? o;
  if (s.tipo === 'talento') return DATI.talenti[o]?.nome ?? o;
  return o;
}

const TITOLO: Record<string, string> = {
  caratteristica: 'Caratteristica per gli incantesimi della specie', abilita: 'Abilità', talento: 'Talento Origini',
};

export function PassoSpecie({ bozza, scegli, cambia, salvaSpecie, eliminaSpecie }: {
  bozza: Bozza;
  scegli: (id: string) => void;
  cambia: (b: Bozza) => void;
  salvaSpecie: (sp: Specie) => void;
  eliminaSpecie: (id: string) => string | null;          // null se eliminata, altrimenti il motivo
}) {
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);
  const imposta = (id: string, valori: string[]) => cambia({ ...bozza, scelte: { ...bozza.scelte, [id]: valori } });
  const specie = bozza.specie ? DATI.specie[bozza.specie] : undefined;
  const talentoBg = bozza.background ? DATI.talenti[DATI.background[bozza.background]?.talento.talento] : undefined;

  // Scelte interne della specie scelta: stirpe/eredità, poi quelle dei tratti.
  const scelte: { scelta: Scelta; titolo: string; opzioni: { id: string; nome: string }[] }[] = [];
  if (specie?.lignaggi) {
    const L = specie.lignaggi;
    scelte.push({
      scelta: { id: L.scelta, tipo: 'opzione', quantita: 1, srd: L.srd },
      titolo: specie.id === 'tiefling' ? 'Retaggio' : specie.id === 'dragonborn' ? 'Antenato draconico' : specie.id === 'goliath' ? 'Discendenza gigantica' : 'Lignaggio',
      opzioni: L.opzioni.map((o) => ({ id: o.id, nome: etichettaLignaggio(o) })),
    });
  }
  for (const t of specie?.tratti ?? []) for (const e of t.effetti) {
    if (e.tipo !== 'scelta') continue;
    const s = e.scelta;
    if (s.tipo === 'trucchetto' || s.tipo === 'incantesimo') continue;   // si scelgono nel passo Magia
    const ids = s.opzioni ?? (s.filtro && 'categoriaTalento' in s.filtro
      ? Object.values(DATI.talenti).filter((x) => x.categoria === (s.filtro as { categoriaTalento: string }).categoriaTalento).map((x) => x.id)
      : []);
    scelte.push({ scelta: s, titolo: specie?.personalizzato ? TITOLO[s.tipo] ?? t.nome : `${t.nome}: ${TITOLO[s.tipo] ?? 'scelta'}`, opzioni: ids.map((o) => ({ id: o, nome: nomeOpzione(s, o) })) });
  }

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Scegli la specie</h1>
      <p className="mb-4 text-sm text-testo-2">Da dove viene il tuo personaggio: ti dà taglia, velocità e alcuni tratti.</p>
      <ul className="space-y-3">
        {Object.values(DATI.specie).filter((sp) => visibile(bozza, sp.id, bozza.specie))
          .sort((a, b) => Number(!!a.personalizzato) - Number(!!b.personalizzato)).map((sp) => {
          const scelta = bozza.specie === sp.id;
          return (
            <li
              key={sp.id}
              ref={scelta ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : undefined}
              className={`rounded-xl bg-superficie ${scelta ? 'border-2 border-accento' : 'border border-bordo'}`}
            >
              <Fascia gruppo="specie" id={sp.id} alto={120} sfuma={60} />
              <button onClick={() => scegli(sp.id)} aria-pressed={scelta} aria-expanded={scelta} className="w-full p-4 text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-medium text-testo">{sp.nome}
                    {sp.personalizzato && <span className="block text-xs font-normal italic text-testo-2">{sp.rimando ?? (bozza.tavolo ? 'Dal master' : 'Inserita da te')}</span>}
                  </span>
                  <span className="text-xs text-testo-2">{sp.taglie.map((t) => TAGLIA[t]).join(' o ')} · {metri(sp.velocita)}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-testo-2">{sp.tratti.map((t) => t.nome).join(' · ')}</p>
                {sp.descrizione && <p className="mt-1 text-sm text-testo-2">{sp.descrizione}</p>}
              </button>
              {sp.personalizzato && !bozza.tavolo && (
                <div className="flex justify-end gap-2 px-2">
                  <button onClick={() => setModulo(moduloDaSpecie(sp))} className="min-h-11 px-3 text-sm text-accento">Modifica</button>
                  <button onClick={() => window.confirm(`Eliminare «${sp.nome}» dai tuoi elementi?`) && setAvviso(eliminaSpecie(sp.id))} className="min-h-11 px-3 text-sm text-attenzione">Elimina</button>
                </div>
              )}

              {/* Come per la classe (21/11): toccando la specie si aprono i suoi tratti, poi le scelte */}
              {scelta && <TrattiSpecie specieId={sp.id} />}

              {/* Le scelte della specie stanno nello stesso riquadro, sotto i tratti */}
              {scelta && scelte.length > 0 && (
                <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
                  <h3 className="text-sm font-medium text-testo">Le tue scelte</h3>
                  {scelte.map(({ scelta: s, titolo, opzioni }) => Array.from({ length: Math.max(1, s.quantita) }, (_, k) => {
                    // Una tendina per ogni scelta (2 abilità = 2 tendine); quella già presa nell'altra è spenta
                    const valori = Array.from({ length: s.quantita }, (_, i) => bozza.scelte[s.id]?.[i] ?? '');
                    return (
                      <Tendina
                        key={`${s.id}-${k}`}
                        etichetta={s.quantita > 1 ? `${titolo} (${k + 1} di ${s.quantita})` : titolo}
                        valore={valori[k]}
                        opzioni={opzioni.map((o) => {
                          // un talento non ripetibile già dato dal background si spegne, con il motivo (SRD p. 87)
                          const dalBg = s.tipo === 'talento' && talentoBg?.id === o.id && !talentoBg.ripetibile;
                          const gia = valori.includes(o.id) && valori[k] !== o.id;
                          return { ...o, disattivata: gia || dalBg, ...(dalBg ? { motivo: `già dal ${DATI.background[bozza.background!]?.nome}` } : {}) };
                        })}
                        cambia={(v) => { const n = [...valori]; n[k] = v; imposta(s.id, n.filter(Boolean)); }}
                      />
                    );
                  }))}
                  {bozza.scelte['human.versatile']?.[0] === 'magic-initiate' && (
                    <RiquadroIniziato bozza={bozza} cambia={cambia} istanza={istanzaVersatile(bozza)} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!bozza.tavolo && (
        <>
          <Separatore titolo="Dal tuo manuale" />
          {avviso && <p role="status" className="mb-3 rounded-xl border border-attenzione/50 bg-superficie p-3 text-sm text-testo">{avviso}</p>}
          <p className="mb-2 text-sm text-testo-2">
            Le specie di Eberron, Ravenloft o di altri manuali non sono nell'SRD: l'app non può contenerle. Se hai il manuale, inseriscila tu: resta nel tuo telefono e nelle tue schede.
          </p>
          <button onClick={() => setModulo(moduloSpecieVuoto())} className="h-12 w-full rounded-xl border border-accento text-base text-accento">Inserisci una specie</button>
        </>
      )}

      {modulo && (
        <ModuloSpecie iniziale={modulo} chiudi={() => setModulo(null)}
          salva={(sp) => { salvaSpecie(sp); setModulo(null); setAvviso(null); if (!bozza.specie) scegli(sp.id); }} />
      )}
    </section>
  );
}

function TrattiSpecie({ specieId }: { specieId: string }) {
  const righe = cosaOttieniSpecie(specieId);
  if (!righe.length) return null;
  return (
    <div className="anim-srotola border-t border-bordo px-4 pb-4 pt-3">
      <h3 className="mb-2 text-sm font-medium text-testo">Cosa ottieni</h3>
      <ul className="space-y-2 text-sm leading-relaxed">
        {righe.map((t) => (
          <li key={t.nome}>
            <span className="font-medium text-testo">{t.nome}.</span> <span className="text-testo-2">{t.testo}</span>
            {t.pagina && <span className="ml-1 whitespace-nowrap text-xs text-testo-2">SRD p. {t.pagina}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
