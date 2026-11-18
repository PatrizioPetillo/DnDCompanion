// Passo 3: Background (sezione 5.2). Abilità, strumento, talento d'origine, bonus alle caratteristiche (SRD p. 83) e lingue (p. 20).
// In cima i 4 dell'SRD; sotto quelli inseriti dal proprio manuale (sezione 4): l'app ne conosce solo il nome e il rimando.
import { useState } from 'react';
import { visibile, type Bozza } from '../creazione/percorso';
import { DAL_MANUALE, moduloDa, moduloVuoto, type ModuloBackground as Modulo } from '../creazione/personalizzati';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import { NOME_LISTA } from '../regole/dati';
import type { Background } from '../regole/tipi';
import { Fascia } from './Illustrazione';
import { ModuloBackground } from './ModuloBackground';
import { RiquadroIniziato } from './RiquadroIniziato';
import { Separatore } from './PassoMagia';
import { BonusBackground, SceltaLingue } from './SceltaOrigine';
import { semplici, Tendina } from './Tendina';

const nomeOggetto = (id: string) => DATI.oggetti[id]?.nome ?? id;

export function PassoBackground({ bozza, scegli, cambia, salvaBackground, eliminaBackground }: {
  bozza: Bozza;
  scegli: (id: string) => void;
  cambia: (b: Bozza) => void;
  salvaBackground: (bg: Background) => void;
  eliminaBackground: (id: string) => string | null;          // null se eliminato, altrimenti il motivo
}) {
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);
  // Lingue che la classe dà già (Druidico, Gergo ladresco): spente nelle tendine
  const lingueDiClasse = (bozza.classe ? DATI.classi[bozza.classe].features : [])
    .flatMap((f) => f.effetti).flatMap((e) => (e.tipo === 'lingua' ? e.ids : []));
  const tutti = Object.values(DATI.background).filter((b) => visibile(bozza, b.id, bozza.background));
  const srd = tutti.filter((b) => !b.personalizzato);
  const miei = tutti.filter((b) => b.personalizzato);
  const daInserire = DAL_MANUALE.filter((x) => !miei.some((b) => b.id === `pers-${x.id}`));

  const scheda = (bg: Background) => {
    const scelto = bozza.background === bg.id;
    const t = bg.talentoLibero ? { nome: `${bg.talentoLibero.nome} (non calcolato)` } : DATI.talenti[bg.talento.talento];
    const lista = bg.talento.parametri?.['magic-initiate.lista'];
    const strumento = typeof bg.strumento === 'string' ? nomeOggetto(bg.strumento)
      : (bg.strumento.opzioni ?? []).includes('dice') ? 'Un gioco a scelta' : (bg.strumento.opzioni ?? []).includes('lute') ? 'Uno strumento musicale a scelta' : 'Uno strumento da artigiano a scelta';
    return (
      <li key={bg.id}>
        <button
          onClick={() => scegli(bg.id)}
          aria-pressed={scelto}
          className={`w-full rounded-xl bg-superficie p-4 text-left ${scelto ? 'border-2 border-accento' : 'border border-bordo'}`}
        >
          <span className="-mx-4 -mt-4 mb-2 block"><Fascia gruppo="background" id={bg.id} /></span>
          <span className="text-lg font-medium text-testo">{bg.nome}</span>
          {bg.personalizzato && <span className="block text-xs italic text-testo-2">{bg.rimando ?? 'Inserito da te'}</span>}
          {bg.descrizione && <span className="mt-1 block text-sm text-testo-2">{bg.descrizione}</span>}
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-testo-2">Talento</dt>
            <dd className="text-testo">{t?.nome ?? '—'}{lista ? ` (${NOME_LISTA[lista]})` : ''}</dd>
            <dt className="text-testo-2">Abilità</dt>
            <dd className="text-testo">{bg.abilita.map((a) => ABILITA[a]?.nome ?? a).join(', ')}</dd>
            <dt className="text-testo-2">Strumento</dt>
            <dd className="text-testo">{strumento}</dd>
            <dt className="text-testo-2">Bonus a</dt>
            <dd className="text-testo">{bg.caratteristiche.map((c) => NOME_CAR[c]).join(', ')}</dd>
          </dl>
        </button>
        {bg.personalizzato && (
          <div className="mt-1 flex justify-end gap-2">
            <button onClick={() => setModulo(moduloDa(bg))} className="min-h-11 px-3 text-sm text-accento">Modifica</button>
            <button onClick={() => {
              if (!window.confirm(`Eliminare «${bg.nome}» dai tuoi elementi?`)) return;
              setAvviso(eliminaBackground(bg.id));
            }} className="min-h-11 px-3 text-sm text-attenzione">Elimina</button>
          </div>
        )}
        {scelto && (
          <>
            {typeof bg.strumento !== 'string' && (
              <div className="mt-2 rounded-xl border border-bordo bg-superficie p-4">
                <Tendina
                  etichetta={strumento.replace('Un ', '').replace('Uno ', '').replace(' a scelta', '').replace(/^\w/, (c) => c.toUpperCase())}
                  valore={bozza.scelte[bg.strumento.id]?.[0] ?? ''}
                  opzioni={semplici((bg.strumento.opzioni ?? []).map((g) => ({ id: g, nome: nomeOggetto(g) })))}
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
            {bg.talento.talento === 'skilled' && <SceltaAbile bozza={bozza} cambia={cambia} />}
          </>
        )}
      </li>
    );
  };

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Scegli il background</h1>
      <p className="mb-4 text-sm text-testo-2">Cosa faceva il tuo personaggio prima di partire all'avventura.</p>
      <ul className="space-y-3">{srd.map(scheda)}</ul>

      {bozza.tavolo ? (
        // Al tavolo i background extra li sceglie il master: qui solo i suoi, niente «Inseriscilo»
        miei.length > 0 && <>
          <Separatore titolo={`Dal master: ${bozza.tavolo.nome || 'il tavolo'}`} />
          <ul className="mb-3 space-y-3">{miei.map(scheda)}</ul>
        </>
      ) : <>
      <Separatore titolo="Dal tuo manuale" />
      {avviso && <p role="status" className="mb-3 rounded-xl border border-attenzione/50 bg-superficie p-3 text-sm text-testo">{avviso}</p>}
      {miei.length > 0 && <ul className="mb-3 space-y-3">{miei.map(scheda)}</ul>}
      <p className="mb-2 text-sm text-testo-2">
        Il Manuale del Giocatore 2024 ha altri 12 background, che non sono nell'SRD: l'app non può contenerli. Se hai il manuale, inseriscili tu: restano nel tuo telefono e nelle tue schede.
      </p>
      <ul className="overflow-hidden rounded-xl border border-bordo bg-superficie">
        {daInserire.map((x) => (
          <li key={x.id} className="flex items-center justify-between gap-2 border-b border-bordo px-3 last:border-b-0">
            <span className="py-2 text-base text-testo">{x.nome}<span className="block text-xs text-testo-2">Manuale del Giocatore 2024</span></span>
            <button onClick={() => setModulo(moduloVuoto(x.id))} className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-accento">Inseriscilo</button>
          </li>
        ))}
        <li className="flex items-center justify-between gap-2 px-3">
          <span className="py-2 text-base text-testo">Un altro background<span className="block text-xs text-testo-2">da un altro manuale, o inventato</span></span>
          <button onClick={() => setModulo(moduloVuoto())} className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-accento">Inseriscilo</button>
        </li>
      </ul>
      </>}

      {modulo && (
        <ModuloBackground iniziale={modulo} chiudi={() => setModulo(null)}
          salva={(bg) => { salvaBackground(bg); setModulo(null); setAvviso(null); if (!bozza.background || bozza.background === bg.id) scegli(bg.id); }} />
      )}
    </section>
  );
}

// Abile dato dal background (SRD p. 87): 3 abilità a scelta
function SceltaAbile({ bozza, cambia }: { bozza: Bozza; cambia: (b: Bozza) => void }) {
  const presi = bozza.scelte['skilled.competenze'] ?? [];
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-bordo bg-superficie p-4">
      {[0, 1, 2].map((k) => (
        <Tendina key={k} etichetta={`Abile: abilità ${k + 1} di 3`} valore={presi[k] ?? ''}
          opzioni={Object.entries(ABILITA).map(([id, a]) => ({ id, nome: a.nome, disattivata: presi.includes(id) && presi[k] !== id, ...(presi.includes(id) && presi[k] !== id ? { motivo: 'già scelta' } : {}) }))}
          cambia={(v) => { const n = [0, 1, 2].map((i) => (i === k ? v : presi[i] ?? '')); cambia({ ...bozza, scelte: { ...bozza.scelte, 'skilled.competenze': n.filter(Boolean) } }); }} />
      ))}
    </div>
  );
}
