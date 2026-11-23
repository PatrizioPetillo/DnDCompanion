// Sali di livello in una schermata (23/11, richiesta di Patrizio): in cima alla scheda, direttamente le capacità nuove
// con le loro tendine, i PF e gli incantesimi in più. Niente fogli, niente passi da riaprire.
import { useEffect, useRef, useState } from 'react';
import { bozzaNuova, completo, nuovoLivello, type Scelte, type Tendine } from '../creazione/nuovo-livello';
import { regolaPf } from '../creazione/livello';
import { comePersonaggio, type Bozza } from '../creazione/percorso';
import { calcolaScheda, DATI } from '../regole';
import { SceltaPf } from './SaliDiLivello';
import { Tendina } from './Tendina';

function Gruppo({ t, valori, cambia }: { t: Tendine; valori: string[]; cambia: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: t.quante }, (_, i) => (
        <Tendina key={i} etichetta={t.quante > 1 ? `${t.titolo} (${i + 1} di ${t.quante})` : t.titolo} valore={valori[i] ?? ''}
          opzioni={t.opzioni.map((o) => (!o.disattivata && valori.some((v, j) => j !== i && v === o.id) ? { ...o, disattivata: true, motivo: 'già scelto' } : o))}
          cambia={(id) => { const v = [...valori]; v[i] = id; cambia(Array.from({ length: t.quante }, (_, k) => v[k] ?? '')); }} />
      ))}
    </div>
  );
}

export function NuovoLivello({ bozza, conferma, annulla }: { bozza: Bozza; conferma: (b: Bozza) => void; annulla: () => void }) {
  const [scelte, setScelte] = useState<Scelte>({});
  const [tiro, setTiro] = useState<number | null>(null);
  const [usaTiro, setUsaTiro] = useState(regolaPf(bozza) === 'tiro');
  const cima = useRef<HTMLElement>(null);
  useEffect(() => { cima.current?.scrollIntoView({ block: 'start' }); cima.current?.focus(); }, []);
  const r = nuovoLivello(bozza, scelte);
  if (!r) return null;
  const classe = DATI.classi[bozza.classe!];
  const pg = comePersonaggio(bozza);
  const cos = pg ? calcolaScheda(pg).modificatori.COS : 0;
  const metti = (k: string, v: string[]) => setScelte((s) => ({ ...s, [k]: v }));
  const pronto = completo(bozza, scelte, tiro, usaTiro);
  return (
    <section ref={cima} tabIndex={-1} aria-labelledby="titolo-livello" className="mb-4 scroll-mt-28 space-y-4 rounded-2xl border-2 border-accento bg-superficie p-4">
      <h2 id="titolo-livello" className="font-titolo text-xl text-accento">{r.livello}° livello</h2>
      <SceltaPf livello={r.livello} dadoVita={classe.dadoVita} cos={cos} regola={regolaPf(bozza)} tiro={tiro}
        cambia={(t, usa) => { setTiro(t); setUsaTiro(usa); }} />
      {r.capacita.map((c) => (
        <div key={c.id} className="space-y-2 border-t border-bordo pt-3">
          <p className="text-base text-testo"><strong>{c.nome}.</strong> {c.testo}{c.pagina ? <span className="text-xs text-testo-2"> SRD p. {c.pagina}</span> : null}</p>
          {c.tendine.map((t) => <Gruppo key={t.chiave} t={t} valori={scelte[t.chiave] ?? []} cambia={(v) => metti(t.chiave, v)} />)}
        </div>
      ))}
      {r.magia.length > 0 && (
        <div className="space-y-3 border-t border-bordo pt-3">
          <p className="text-base font-medium text-testo">Magia</p>
          {r.magia.map((t) => <Gruppo key={t.chiave} t={t} valori={scelte[t.chiave] ?? []} cambia={(v) => metti(t.chiave, v)} />)}
        </div>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-2 pt-1">
        <button onClick={annulla} className="h-12 rounded-xl border border-bordo text-base text-testo">Annulla</button>
        <button disabled={!pronto} onClick={() => conferma(bozzaNuova(bozza, scelte, usaTiro || regolaPf(bozza) === 'tiro' ? tiro : null))}
          className="h-12 rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">
          {pronto ? `Passa al ${r.livello}° livello` : 'Completa le scelte'}</button>
      </div>
    </section>
  );
}
