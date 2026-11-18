// Passo 5: Caratteristiche (sezione 5.2). Point buy, serie standard o tiri (SRD p. 21), quelli ammessi dal tavolo; il bonus scelto nel Background
// è già applicato; sotto ogni caratteristica le abilità che ne dipendono.
import { useEffect, useState } from 'react';
import { assegna, metodiAmmessi, metodoIniziale, contatoreAbilitaClasse, contatoreMaestria, daCompletare, scegliMaestria, NON_ASSEGNATO, opzioniPunteggio, punteggiIniziali, scegliAbilitaClasse, spesaPointBuy, statoAbilita, type StatoAbilita } from '../creazione/caratteristiche';
import { comePersonaggio, type Bozza } from '../creazione/percorso';
import { DATI, modificatore } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import type { Car, MetodoPunteggi } from '../regole/tipi';

const ETICHETTA_METODO: Record<MetodoPunteggi, string> = { pointBuy27: 'Point buy', serieStandard: 'Serie standard', tiri: 'Tiri' };

const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function PassoCaratteristiche({ bozza, cambia }: { bozza: Bozza; cambia: (b: Bozza) => void }) {
  const p = bozza.punteggi;
  const classe = bozza.classe ? DATI.classi[bozza.classe] : undefined;
  const pronto = !!comePersonaggio(bozza);                       // classe, background e specie scelti
  const abilita = p ? statoAbilita(bozza) : [];
  const conta = contatoreAbilitaClasse(bozza);
  const maestria = contatoreMaestria(bozza);
  const [aperti, setAperti] = useState<Partial<Record<Car, boolean>>>({});   // scelta a mano: vince sul default

  const metodo = (m: MetodoPunteggi) => cambia({ ...bozza, punteggi: punteggiIniziali(m, bozza.classe) });
  const metodi = metodiAmmessi(bozza.tavolo);
  // Si parte dal point buy (scelta di Patrizio, 18/11), o dal primo metodo del tavolo: niente schermata vuota. Si cambia con un tocco.
  useEffect(() => {
    if (!bozza.punteggi) cambia({ ...bozza, punteggi: punteggiIniziali(metodoIniziale(bozza.tavolo), bozza.classe) });
  }, [bozza, cambia]);

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Caratteristiche</h1>
      <p className="mb-4 text-sm text-testo-2">Quanto è forte, agile, resistente, sveglio, saggio e affascinante il tuo personaggio.</p>

      {metodi.length > 1 && <div className={`mb-3 grid gap-2 ${metodi.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {metodi.map((m) => [m, ETICHETTA_METODO[m]] as const).map(([m, nome]) => (
          <button
            key={m}
            onClick={() => metodo(m)}
            aria-pressed={p?.metodo === m}
            className={`min-h-11 rounded-lg px-2 text-base ${p?.metodo === m ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}
          >
            {nome}
          </button>
        ))}
      </div>}
      {metodi.length === 1 && <p className="mb-3 text-sm text-testo-2">Il tavolo «{bozza.tavolo?.nome || 'del master'}» usa: <strong className="text-testo">{ETICHETTA_METODO[metodi[0]]}</strong>.</p>}


      {p && (() => {
        const { spesi } = spesaPointBuy(p.base);
        const ok = (p.metodo !== 'pointBuy27' || spesi === 27) && conta.scelte === conta.quante && maestria.scelte === maestria.quante;
        return (
          <p className={`mb-3 flex justify-between gap-2 rounded-lg border bg-superficie px-4 py-3 text-base text-testo ${ok ? 'border-bordo' : 'border-attenzione'}`}>
            {p.metodo === 'pointBuy27' ? <span>Punti <strong>{spesi}/27</strong></span> : <span>{ETICHETTA_METODO[p.metodo]}</span>}
            {conta.quante > 0 && <span>Abilità <strong>{conta.scelte}/{conta.quante}</strong></span>}
            {maestria.quante > 0 && <span>Maestria <strong>{maestria.scelte}/{maestria.quante}</strong></span>}
          </p>
        );
      })()}
      {p?.metodo === 'tiri' && (
        <p className="mb-3 text-sm text-testo-2">
          Tira 4d6 e tieni i tre dadi più alti: fallo sei volte e scrivi ogni risultato dove vuoi (SRD p. 21). Tira con il master se lo chiede.
        </p>
      )}
      {p?.metodo === 'serieStandard' && (
        <p className="mb-3 text-sm text-testo-2">
          {classe ? `Ho messo la serie consigliata per il ${classe.nome.toLowerCase()} (SRD). ` : ''}
          Scegli un valore già usato per scambiarlo.
        </p>
      )}

      {p && Object.keys(bozza.bonusBackground).length === 0 && (
        <p className="mb-3 text-sm text-testo-2">Il bonus del background (+2/+1) lo scegli nel passo Background.</p>
      )}

      {p && pronto && (
        <p className="mb-2 text-sm text-testo-2">
          Tocca le abilità <span className="font-medium text-accento">evidenziate</span> per sceglierle con la classe. ✓ = già tua.{maestria.quante > 0 ? ' Tocca ☆ per la Maestria: competenza doppia.' : ''}
        </p>
      )}
      {p && !pronto && <p className="mb-2 text-sm text-testo-2">Scegli classe, background e specie per vedere e scegliere le abilità.</p>}
      {p && (
        <div className="grid grid-cols-2 items-start gap-2">
          {COLONNE.map((colonna, i) => (
          <ul key={i} className={`flex flex-col gap-2 ${i === 0 ? SFALSAMENTO : ''}`}>
          {colonna.map((c) => {
            const base = p.base[c];
            const bonus = bozza.bonusBackground[c] ?? 0;
            const totale = base === NON_ASSEGNATO ? undefined : base + bonus;
            const sue = abilita.filter((a) => a.car === c).sort((x, y) => x.nome.localeCompare(y.nome, 'it'));
            const evidenzia = pronto && daCompletare(bozza, c);
            const aperto = aperti[c] ?? evidenzia;
            const visibili = aperto ? sue : sue.filter((a) => a.stato === 'data' || a.stato === 'scelta');
            return (
              <li key={c} className={`rounded-xl border bg-superficie p-2 ${evidenzia ? 'border-attenzione' : 'border-bordo'}`}>
                <div className="flex items-baseline justify-between gap-1 px-1">
                  <span className="truncate text-sm font-medium text-testo">{NOME_CAR[c]}</span>
                  <span className="shrink-0 text-base text-testo">
                    {totale === undefined ? '—' : <><strong>{totale}</strong> <span className="text-sm text-testo-2">({segno(modificatore(totale))})</span></>}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <select
                    aria-label={`Punteggio di ${NOME_CAR[c]}`}
                    value={base === NON_ASSEGNATO ? '' : base}
                    onChange={(e) => cambia({ ...bozza, punteggi: assegna(p, c, Number(e.target.value)) })}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-bordo bg-sfondo px-1 text-base text-testo"
                  >
                    {base === NON_ASSEGNATO && <option value="">—</option>}
                    {opzioniPunteggio(p, c).map((o) => (
                      <option key={o.valore} value={o.valore} disabled={o.disattivato}>{o.etichetta}</option>
                    ))}
                  </select>
                  {bonus > 0 && <span className="w-7 text-center text-sm text-oro" title="Bonus del background">+{bonus}</span>}
                </div>
                {pronto && sue.length > 0 && (
                  <div className="mt-1">
                    {visibili.map((a) => {
                      const tua = a.stato === 'data' || a.stato === 'scelta';
                      return (
                        <div key={a.id} className="flex items-center">
                          <button
                            onClick={() => cambia(scegliAbilitaClasse(bozza, a.id))}
                            disabled={!CLICCABILE.includes(a.stato)}
                            aria-pressed={tua}
                            title={a.fonte}
                            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left text-sm ${STILE[a.stato]}`}
                          >
                            <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${ICONA[a.stato]}`}>
                              {tua ? '✓' : ''}
                            </span>
                            <span className="min-w-0 flex-1 leading-tight break-words hyphens-auto">{a.nome}</span>
                            <span className="w-7 shrink-0 text-right">{a.totale !== undefined ? segno(a.totale) : ''}</span>
                          </button>
                          {maestria.quante > 0 && tua && (
                            <button
                              onClick={() => cambia(scegliMaestria(bozza, a.id))}
                              disabled={!a.maestria && maestria.scelte >= maestria.quante}
                              aria-pressed={a.maestria}
                              aria-label={`Maestria in ${a.nome}`}
                              className={`min-h-11 w-7 shrink-0 text-base ${a.maestria ? 'text-accento' : 'text-testo-2 opacity-60'} disabled:opacity-20`}
                            >
                              {a.maestria ? '★' : '☆'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setAperti({ ...aperti, [c]: !aperto })}
                      aria-expanded={aperto}
                      className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg text-sm text-testo-2"
                    >
                      {aperto ? 'Chiudi ▴' : `Tutte (${sue.length}) ▾`}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          </ul>
          ))}
        </div>
      )}
    </section>
  );
}

// Due colonne indipendenti, come la scheda di carta: ogni riquadro alto quanto il suo contenuto.
const COLONNE: Car[][] = [['FOR', 'DES', 'COS'], ['INT', 'SAG', 'CAR']];
const SFALSAMENTO = 'pt-6';   // la colonna di sinistra parte un po' più in basso: da regolare a occhio
const CLICCABILE: StatoAbilita[] = ['scelta', 'sceglibile'];
const STILE: Record<StatoAbilita, string> = {
  data: 'text-testo',                                   // già tua (background, specie, talento): non si tocca
  scelta: 'font-medium text-accento',
  sceglibile: 'font-medium text-accento',               // dalla lista della classe: evidenziata
  piena: 'text-testo-2',
  no: 'text-testo-2 opacity-60',
};
const ICONA: Record<StatoAbilita, string> = {
  data: 'border-testo-2 bg-testo-2 text-sfondo',
  scelta: 'border-accento bg-accento text-su-accento',
  sceglibile: 'border-2 border-accento',
  piena: 'border-bordo',
  no: 'border-bordo opacity-50',                        // il cerchio c'è, ma non si può toccare
};
