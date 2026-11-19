// Passo 2: Classe (sezione 5.2). La scheda della classe e, dentro lo stesso riquadro, le sue scelte di livello 1
// (Padronanza d'armi, strumenti, ordini, stile, supplica, lingua del ladro), come in Character Keep.
import { scelteDiClasse } from '../creazione/classe';
import { visibile, type Bozza } from '../creazione/percorso';
import { cosaOttieni, type Privilegio } from '../creazione/cosa-ottieni';
import { SCHEDE_CLASSE } from '../creazione/testi';
import { DATI } from '../regole';
import { Tendina } from './Tendina';
import { Fascia } from './Illustrazione';

const DIFFICOLTA = { facile: 'facile', media: 'media', impegnativa: 'impegnativa' };

export function PassoClasse({ bozza, scegli, cambia }: { bozza: Bozza; scegli: (id: string) => void; cambia: (b: Bozza) => void }) {
  const scelte = scelteDiClasse(bozza);
  // Una tendina per ogni scelta da fare (3 strumenti = 3 tendine); il valore già preso in un'altra è spento
  const imposta = (id: string, i: number, quantita: number, v: string) => {
    const valori = Array.from({ length: quantita }, (_, k) => bozza.scelte[id]?.[k] ?? '');
    valori[i] = v;
    cambia({ ...bozza, scelte: { ...bozza.scelte, [id]: valori.filter(Boolean) } });
  };

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Scegli la classe</h1>
      <p className="mb-4 text-sm text-testo-2">È il mestiere del tuo personaggio: decide come combatte e se usa la magia.</p>
      <ul className="space-y-3">
        {Object.values(DATI.classi).filter((c) => visibile(bozza, c.id, bozza.classe)).map((c) => {
          const t = SCHEDE_CLASSE[c.id];
          const scelta = bozza.classe === c.id;
          return (
            <li
              key={c.id}
              ref={scelta ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : undefined}
              className={`rounded-xl bg-superficie ${scelta ? 'border-2 border-accento' : 'border border-bordo'}`}
            >
              <Fascia gruppo="classi" id={c.id} />
              <button onClick={() => scegli(c.id)} aria-pressed={scelta} aria-expanded={scelta} className="w-full p-4 text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-medium text-testo">{c.nome}</span>
                  <span className="text-xs text-testo-2">d{c.dadoVita} · {t.principali}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-testo-2">{t.alTavolo}</p>
                <p className="mt-2 text-xs text-testo-2">Per chi inizia: {DIFFICOLTA[t.difficolta]}</p>
              </button>

              {scelta && <CosaOttieni classeId={c.id} />}

              {scelta && scelte.length > 0 && (
                <div className="space-y-3 border-t border-bordo px-4 pb-4 pt-3">
                  <h3 className="text-sm font-medium text-testo">Le tue scelte</h3>
                  {scelte.map((s) => Array.from({ length: s.quantita }, (_, i) => {
                    const presi = bozza.scelte[s.id] ?? [];
                    const valore = presi[i] ?? '';
                    const altri = presi.filter((_, k) => k !== i);
                    return (
                      <Tendina
                        key={`${s.id}-${i}`}
                        etichetta={s.quantita > 1 ? `${s.titolo} (${i + 1} di ${s.quantita})` : s.titolo}
                        valore={valore}
                        opzioni={s.opzioni.map((o) => (altri.includes(o.id) ? { ...o, disattivata: true, motivo: 'già scelta' } : o))}
                        cambia={(v) => imposta(s.id, i, s.quantita, v)}
                      />
                    );
                  }))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Cosa dà la classe al livello 1: si apre sotto la scheda scelta (richiesta di Patrizio, 19/11)
function CosaOttieni({ classeId }: { classeId: string }) {
  const c = cosaOttieni(classeId);
  const voce = (p: Privilegio) => (
    <li key={p.nome}>
      <span className="font-medium text-testo">{p.nome}.</span> <span className="text-testo-2">{p.riga}</span>
      <span className="ml-1 whitespace-nowrap text-xs text-testo-2/80">SRD p. {p.pagina}</span>
    </li>
  );
  return (
    <div className="border-t border-bordo px-4 pb-4 pt-3">
      <h3 className="mb-2 text-sm font-medium text-testo">Cosa ottieni al livello 1</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-testo-2">Tiri salvezza</dt><dd className="text-testo">{c.tiriSalvezza}</dd>
        <dt className="text-testo-2">Armature</dt><dd className="text-testo">{c.armature}</dd>
        <dt className="text-testo-2">Armi</dt><dd className="text-testo">{c.armi}</dd>
        <dt className="text-testo-2">Abilità</dt><dd className="text-testo">{c.abilita}</dd>
      </dl>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {c.magia && voce(c.magia)}
        {c.privilegi.map(voce)}
      </ul>
    </div>
  );
}
