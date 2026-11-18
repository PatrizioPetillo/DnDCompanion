// Passo 3: Background (sezione 5.2). Abilità, strumento, talento d'origine e le tre caratteristiche dei bonus (SRD p. 83).
import type { Bozza } from '../creazione/percorso';
import { NOMI_STRUMENTI } from '../creazione/testi';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import { NOME_LISTA } from '../regole/dati';
import { BonusBackground, SceltaLingue } from './SceltaOrigine';
import { semplici, Tendina } from './Tendina';
import { RiquadroIniziato } from './RiquadroIniziato';
import { Fascia } from './Illustrazione';

export function PassoBackground({ bozza, scegli, cambia }: {
  bozza: Bozza;
  scegli: (id: string) => void;
  cambia: (b: Bozza) => void;
}) {
      // Lingue che la classe dà già (Druidico, Gergo ladresco): spente nelle tendine
  const lingueDiClasse = (bozza.classe ? DATI.classi[bozza.classe].features : [])
    .flatMap((f) => f.effetti).flatMap((e) => (e.tipo === 'lingua' ? e.ids : []));
  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Scegli il background</h1>
      <p className="mb-4 text-sm text-testo-2">Cosa faceva il tuo personaggio prima di partire all'avventura.</p>
      <ul className="space-y-3">
        {Object.values(DATI.background).map((bg) => {
          const scelto = bozza.background === bg.id;
          const t = DATI.talenti[bg.talento.talento];
          const lista = bg.talento.parametri?.['magic-initiate.lista'];
          const strumento = typeof bg.strumento === 'string' ? NOMI_STRUMENTI[bg.strumento] ?? bg.strumento : 'Un gioco a scelta';
          return (
            <li key={bg.id}>
              <button
                onClick={() => scegli(bg.id)}
                aria-pressed={scelto}
                className={`w-full rounded-xl bg-superficie p-4 text-left ${scelto ? 'border-2 border-accento' : 'border border-bordo'}`}
              >
                <span className="-mx-4 -mt-4 mb-2 block"><Fascia gruppo="background" id={bg.id} /></span>
                <span className="text-lg font-medium text-testo">{bg.nome}</span>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-testo-2">Talento</dt>
                  <dd className="text-testo">{t.nome}{lista ? ` (${NOME_LISTA[lista]})` : ''}</dd>
                  <dt className="text-testo-2">Abilità</dt>
                  <dd className="text-testo">{bg.abilita.map((a) => ABILITA[a].nome).join(', ')}</dd>
                  <dt className="text-testo-2">Strumento</dt>
                  <dd className="text-testo">{strumento}</dd>
                  <dt className="text-testo-2">Bonus a</dt>
                  <dd className="text-testo">{bg.caratteristiche.map((c) => NOME_CAR[c]).join(', ')}</dd>
                </dl>
              </button>
                            {scelto && (
                <>
                  {typeof bg.strumento !== 'string' && (
                    <div className="mt-2 rounded-xl border border-bordo bg-superficie p-4">
                      <Tendina
                        etichetta="Gioco"
                        valore={bozza.scelte[bg.strumento.id]?.[0] ?? ''}
                        opzioni={semplici((bg.strumento.opzioni ?? []).map((g) => ({ id: g, nome: NOMI_STRUMENTI[g] ?? g })))}
                        cambia={(g) => cambia({ ...bozza, scelte: { ...bozza.scelte, [(bg.strumento as { id: string }).id]: g ? [g] : [] } })}
                      />
                    </div>
                  )}
                  <SceltaLingue
                    lingue={bozza.scelte['origine.lingue'] ?? []}
                    giaConosciute={lingueDiClasse}
                    imposta={(l) => cambia({ ...bozza, scelte: { ...bozza.scelte, 'origine.lingue': l } })}
                  />
                  <BonusBackground car={bg.caratteristiche} bonus={bozza.bonusBackground} imposta={(bonusBackground) => cambia({ ...bozza, bonusBackground })} />
                  {bg.talento.talento === 'magic-initiate' && <RiquadroIniziato bozza={bozza} cambia={cambia} istanza="magic-initiate" />}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}