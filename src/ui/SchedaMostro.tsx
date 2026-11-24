// La scheda completa di un mostro dell'SRD (23/11, scelta di Patrizio): come nel manuale, testo dell'SRD 5.2.1 italiano.
// Si apre dal foglio dell'incontro, sopra di esso; i testi si scaricano solo la prima volta che serve.
import { useEffect, useState } from 'react';
import { caricaMostri, caricaTestiMostri, type Mostro, type TestoMostro } from '../creazione/mostri';
import { Finestra } from './SchedaIncantesimo';

const CAR = [['FOR', 'For'], ['DES', 'Des'], ['COS', 'Cos'], ['INT', 'Int'], ['SAG', 'Sag'], ['CAR', 'Car']] as const;

export function SchedaMostro({ id, chiudi }: { id: string; chiudi: () => void }) {
  const [dati, setDati] = useState<{ m?: Mostro; t?: TestoMostro } | null>(null);
  useEffect(() => {
    let vivo = true;
    void Promise.all([caricaMostri(), caricaTestiMostri()])
      .then(([tutti, testi]) => { if (vivo) setDati({ m: tutti.find((x) => x.id === id), t: testi[id] }); })
      .catch(() => { if (vivo) setDati({}); });
    return () => { vivo = false; };
  }, [id]);
  const m = dati?.m, t = dati?.t;
  return (
    <Finestra chiudi={chiudi} titolo={<div><h2 className="font-titolo text-lg text-accento">{m?.nome ?? 'Mostro'}</h2>{m && <p className="text-sm italic text-testo-2">{m.tipo}</p>}</div>}>
      {!dati ? <p className="text-sm text-testo-2">Apro la scheda…</p>
        : !m || !t ? <p className="text-sm text-testo-2">Non trovo la scheda di questo mostro. Riprova con la connessione attiva.</p>
        : (
          <div className="space-y-4 text-sm text-testo">
            <dl className="grid grid-cols-3 gap-1 text-center">
              {[['CA', m.ca], ['PF', `${m.pf}`], ['Iniziativa', m.iniziativa >= 0 ? `+${m.iniziativa}` : `−${-m.iniziativa}`]].map(([e, v]) => (
                <div key={e} className="rounded-lg bg-superficie py-1"><dd className="text-base">{v}</dd><dt className="text-xs text-testo-2">{e}</dt></div>
              ))}
            </dl>
            <p><span className="text-testo-2">PF </span>{m.pf} ({m.dadiPf}){t.velocita && <><span className="text-testo-2"> · Velocità </span>{t.velocita}</>}</p>
            <table className="w-full text-center text-sm">
              <caption className="sr-only">Caratteristiche: punteggio, modificatore, tiro salvezza</caption>
              <thead><tr className="text-xs text-testo-2"><th scope="col" className="text-left font-normal" /><th scope="col" className="font-normal">Punt.</th><th scope="col" className="font-normal">Mod</th><th scope="col" className="font-normal">Salv</th></tr></thead>
              <tbody>
                {CAR.map(([k, n]) => (
                  <tr key={k} className="border-t border-bordo">
                    <th scope="row" className="py-1 text-left font-medium">{n}</th>
                    <td>{t.car[k][0]}</td><td>{t.car[k][1]}</td>
                    <td className={t.car[k][2] !== t.car[k][1] ? 'font-medium text-accento' : ''}>{t.car[k][2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="space-y-1">
              {t.righe.map(([e, v]) => <div key={e}><dt className="inline font-medium">{e} </dt><dd className="inline">{v}</dd></div>)}
            </dl>
            {t.sezioni.map((s) => (
              <section key={s.titolo}>
                <h3 className="mb-1 border-b border-accento font-titolo text-base text-accento">{s.titolo}</h3>
                {s.intro && <p className="mb-2 italic text-testo-2">{s.intro}</p>}
                <div className="space-y-2">
                  {s.voci.map((v, i) => (
                    <div key={i}>
                      {v.testo.split(/\n+/).map((riga, k) => (
                        <p key={k} className={k > 0 ? 'mt-1' : ''}>
                          {k === 0 && <strong className="font-semibold italic">{v.nome}. </strong>}{riga}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <p className="text-xs text-testo-2">
              Dall'SRD 5.2.1 italiano{m.srd?.pagina ? ` (nell'SRD 5.2 inglese a p. ${m.srd.pagina}${m.nomeEn ? `, «${m.nomeEn}»` : ''})` : ''}. Licenza CC-BY-4.0: vedi Informazioni.
            </p>
          </div>
        )}
    </Finestra>
  );
}
