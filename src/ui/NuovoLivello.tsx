// Sali di livello in una schermata (23/11, richiesta di Patrizio): in cima alla scheda, direttamente le capacità nuove
// con le loro tendine, i PF e gli incantesimi in più. Niente fogli, niente passi da riaprire.
import { useEffect, useRef, useState } from 'react';
import { bozzaNuova, completo, nuovoLivello, type Scelte, type Tendine } from '../creazione/nuovo-livello';
import { regolaPf } from '../creazione/livello';
import { comePersonaggio, type Bozza } from '../creazione/percorso';
import { calcolaScheda, DATI } from '../regole';
import { SceltaPf } from './SaliDiLivello';
import { Tendina } from './Tendina';

// L'Aumento dei punteggi (p. 87), come il bonus del background: due pulsanti e le tendine; le caratteristiche a 20 restano spente
function Aumento({ t, valori, cambia }: { t: Tendine; valori: string[]; cambia: (v: string[]) => void }) {
  const [modo, setModo] = useState<'due' | 'uno'>(valori.length === 2 && valori[0] && valori[0] !== valori[1] ? 'uno' : 'due');
  const p = t.punteggi ?? {};
  const opz = (max: number, altra?: string) => t.opzioni.map((o) => (p[o.id] > max ? { ...o, disattivata: true, motivo: p[o.id] >= 20 ? 'è già a 20' : 'supererebbe 20' }
    : o.id === altra ? { ...o, disattivata: true, motivo: 'già scelta' } : { ...o, disattivata: false, motivo: undefined }));
  return (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="Aumento dei punteggi" className="grid grid-cols-2 gap-2">
        {(['due', 'uno'] as const).map((m) => (
          <button key={m} role="radio" aria-checked={modo === m} onClick={() => { setModo(m); cambia([]); }}
            className={`min-h-11 rounded-lg text-base ${modo === m ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}>
            {m === 'due' ? '+2 a una' : '+1 a due'}</button>
        ))}
      </div>
      {modo === 'due'
        ? <Tendina etichetta="+2" valore={valori[0] ?? ''} opzioni={opz(18)} cambia={(id) => cambia(id ? [id, id] : [])} />
        : [0, 1].map((i) => (
          <Tendina key={i} etichetta={`+1 (${i + 1} di 2)`} valore={valori[i] ?? ''} opzioni={opz(19, valori[1 - i])}
            cambia={(id) => { const v = [valori[0] ?? '', valori[1] ?? '']; v[i] = id; cambia(v); }} />
        ))}
    </div>
  );
}

// Un cambio facoltativo: «Togli» e «Al suo posto»; togliendo la prima scelta il cambio si annulla
function Cambio({ t, valori, cambia }: { t: Tendine; valori: string[]; cambia: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-testo">{t.titolo}{t.nota ? <span className="font-normal text-testo-2"> · {t.nota}</span> : null}</p>
      <Tendina etichetta="Togli" valore={valori[0] ?? ''} opzioni={t.opzioni} cambia={(id) => cambia(id ? [id, ''] : [])} facoltativa />
      {valori[0] && <Tendina etichetta="Al suo posto" valore={valori[1] ?? ''} opzioni={t.opzioniNuove ?? []} cambia={(id) => cambia([valori[0], id])} />}
    </div>
  );
}

export function Gruppo({ t, valori, cambia }: { t: Tendine; valori: string[]; cambia: (v: string[]) => void }) {
  if (t.tipo === 'cambio') return <Cambio t={t} valori={valori} cambia={cambia} />;
  if (t.tipo === 'aumento') return <Aumento t={t} valori={valori} cambia={cambia} />;
  if (t.tipo === 'testo') return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-testo">{t.titolo}</span>
      <input value={valori[0] ?? ''} onChange={(e) => cambia([e.target.value])} placeholder="Come si chiama sul manuale"
        className={`h-12 w-full rounded-lg border px-3 text-base text-testo ${valori[0]?.trim() ? 'border-bordo bg-sfondo' : 'border-attenzione bg-attenzione/10'}`} />
      <span className="mt-1 block text-sm text-testo-2">Non è nell'SRD: l'app non ne calcola gli effetti, li segni tu. Il master lo vedrà tra gli avvisi.</span>
    </label>
  );
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
  // Solo le scelte delle tendine visibili: se cambi talento, quelle del talento di prima non restano nella scheda
  const chiavi = new Set([...r.capacita.flatMap((c) => c.tendine), ...r.magia, ...r.cambi].map((t) => t.chiave));
  const valide = Object.fromEntries(Object.entries(scelte).filter(([k]) => chiavi.has(k)));
  const pronto = completo(bozza, valide, tiro, usaTiro);
  return (
    <section ref={cima} tabIndex={-1} aria-labelledby="titolo-livello" className="mb-4 scroll-mt-28 space-y-4 rounded-2xl border-2 border-accento bg-superficie p-4">
      <h2 id="titolo-livello" className="font-titolo text-xl text-accento">{r.livello}° livello</h2>
      <SceltaPf livello={r.livello} dadoVita={classe.dadoVita} cos={cos} regola={regolaPf(bozza)} tiro={tiro}
        cambia={(t, usa) => { setTiro(t); setUsaTiro(usa); }} />
      {r.cresce.length > 0 && (
        <div className="border-t border-bordo pt-3">
          <p className="text-base font-medium text-testo">Cresce da solo</p>
          <ul className="mt-1 space-y-0.5 text-sm text-testo">{r.cresce.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
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
      {r.cambi.length > 0 && (
        <details className="border-t border-bordo pt-3">
          <summary className="min-h-11 cursor-pointer text-base font-medium text-testo">Puoi anche cambiare (facoltativo)</summary>
          <p className="mb-3 text-sm text-testo-2">Salendo di livello le regole ti permettono di cambiare una scelta di prima. Se non tocchi niente, resta tutto com'è.</p>
          <div className="space-y-4">{r.cambi.map((t) => <Gruppo key={t.chiave} t={t} valori={scelte[t.chiave] ?? []} cambia={(v) => metti(t.chiave, v)} />)}</div>
        </details>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-2 pt-1">
        <button onClick={annulla} className="h-12 rounded-xl border border-bordo text-base text-testo">Annulla</button>
        <button disabled={!pronto} onClick={() => conferma(bozzaNuova(bozza, valide, usaTiro || regolaPf(bozza) === 'tiro' ? tiro : null))}
          className="h-12 rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">
          {pronto ? `Passa al ${r.livello}° livello` : 'Completa le scelte'}</button>
      </div>
    </section>
  );
}
