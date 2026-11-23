// La piccola scheda del famiglio (23/11, richiesta di Patrizio): forma a tendina tra quelle ammesse, nome, natura,
// i numeri della forma dall'SRD e cosa può fare (Trova famiglio, SRD 5.2 p. 130; Patto della catena p. 73).
import { useEffect, useState } from 'react';
import { formeFamiglio, haPatto, natureAmmesse } from '../creazione/famiglio';
import { caricaMostri, caricaTestiMostri, type Mostro, type TestoMostro } from '../creazione/mostri';
import type { Bozza } from '../creazione/percorso';
import { SchedaMostro } from './SchedaMostro';
import { semplici, Tendina } from './Tendina';

const NATURA = { celestiale: 'Celestiale', folletto: 'Folletto', immondo: 'Immondo' } as const;

export function Famiglio({ bozza, cambia }: { bozza: Bozza; cambia?: (b: Bozza) => void }) {
  const f = bozza.famiglio;
  const forme = formeFamiglio(bozza);
  const nature = natureAmmesse(bozza);
  const [dati, setDati] = useState<{ m?: Mostro; t?: TestoMostro } | null>(null);
  const [scheda, setScheda] = useState(false);
  useEffect(() => {
    if (!f?.forma) return;
    let vivo = true;
    void Promise.all([caricaMostri(), caricaTestiMostri()]).then(([tutti, testi]) => { if (vivo) setDati({ m: tutti.find((x) => x.id === f.forma), t: testi[f.forma] }); }).catch(() => {});
    return () => { vivo = false; };
  }, [f?.forma]);
  const metti = (o: Partial<NonNullable<Bozza['famiglio']>>) => cambia?.({ ...bozza, famiglio: { forma: f?.forma ?? '', ...f, ...o } });
  const m = f?.forma && dati?.m?.id === f.forma ? dati.m : undefined;
  const t = m ? dati?.t : undefined;
  const sensi = t?.righe.find(([e]) => e === 'Sensi')?.[1];
  return (
    <section aria-labelledby="titolo-famiglio" className="mt-4 space-y-3 rounded-2xl border border-bordo bg-superficie p-4">
      <h3 id="titolo-famiglio" className="font-titolo text-lg text-accento">Famiglio{f?.nome ? `: ${f.nome}` : ''}</h3>
      {cambia ? (
        <>
          <Tendina etichetta="Forma" valore={f?.forma ?? ''} opzioni={semplici(forme.normali)}
            gruppi={forme.patto.length ? [{ titolo: 'Patto della catena', opzioni: semplici(forme.patto) }] : undefined}
            cambia={(id) => metti({ forma: id })} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Nome</span>
            <input value={f?.nome ?? ''} onChange={(e) => metti({ nome: e.target.value.slice(0, 40) })} placeholder="Facoltativo"
              className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" />
          </label>
          {nature.length > 1
            ? <Tendina etichetta="Natura (al posto di bestia)" valore={f?.natura ?? ''} opzioni={semplici(nature.map((n) => ({ id: n, nome: NATURA[n] })))} cambia={(id) => metti({ natura: id as never })} />
            : <p className="text-sm text-testo-2">Natura: folletto (Compagno selvatico).</p>}
        </>
      ) : f?.forma && <p className="text-base text-testo">{m?.nome ?? f.forma}{f.natura ? ` · ${NATURA[f.natura]}` : ''}</p>}
      {m && t && (
        <>
          <dl className="grid grid-cols-3 gap-1 text-center">
            {[['CA', m.ca], ['PF', `${m.pf}`], ['Velocità', t.velocita ?? '—']].map(([e, v]) => (
              <div key={e} className="rounded-lg bg-sfondo py-1"><dd className="text-sm text-testo">{v}</dd><dt className="text-xs text-testo-2">{e}</dt></div>
            ))}
          </dl>
          {sensi && <p className="text-sm text-testo"><span className="text-testo-2">Sensi </span>{sensi}</p>}
          <button onClick={() => setScheda(true)} className="min-h-11 text-sm text-accento underline">Scheda completa del {m.nome.toLowerCase()}</button>
        </>
      )}
      <ul className="list-disc space-y-1 pl-5 text-sm text-testo">
        <li>Telepatia con te entro 30 m; con un'azione bonus vedi e senti attraverso i suoi sensi fino al tuo turno successivo.</li>
        <li>Può consegnare i tuoi incantesimi a contatto, entro 30 m, usando la sua reazione.</li>
        <li>{haPatto(bozza) ? 'Quando fai l\'azione Attacco, puoi rinunciare a un tuo attacco perché lui ne faccia uno con la sua reazione.' : 'Non può attaccare, ma fa le altre azioni; tira la sua iniziativa.'}</li>
        <li>A 0 PF sparisce: ricompare lanciando di nuovo Trova famiglio.</li>
      </ul>
      <p className="text-xs text-testo-2">Trova famiglio, SRD 5.2 p. 130{haPatto(bozza) ? '; Patto della catena p. 73' : ''}.</p>
      {scheda && m && <SchedaMostro id={m.id} chiudi={() => setScheda(false)} />}
    </section>
  );
}
