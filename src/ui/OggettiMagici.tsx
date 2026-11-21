// Oggetti magici nello Zaino (21/11): il master ne dà uno, il giocatore lo aggiunge qui. Sintonia (massimo 3),
// cariche, pozioni da bere; i bonus entrano da soli nelle somme, con il nome dell'oggetto.
import { useState } from 'react';
import type { Bozza } from '../creazione/percorso';
import { DATI } from '../regole';
import { ARMI } from '../regole/dati/base';
import { OGGETTI_MAGICI, type OggettoMagico } from '../regole/dati/oggetti-magici';
import { MAX_SINTONIA, nomeOggetto, richiedeSintonia, sintonizzati } from '../regole/oggetti-magici';
import type { OggettoMagicoPosseduto } from '../regole/tipi';
import { FoglioDalBasso } from './SchedaIncantesimo';

const nuovoUid = () => `om-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function OggettiMagici({ bozza, cambia }: { bozza: Bozza; cambia?: (b: Bozza) => void }) {
  const lista = bozza.oggettiMagici ?? [];
  const [aggiungi, setAggiungi] = useState(false);
  const [aperto, setAperto] = useState<string | null>(null);
  const metti = (l: OggettoMagicoPosseduto[]) => cambia?.({ ...bozza, oggettiMagici: l });
  const aggiorna = (uid: string, o: Partial<OggettoMagicoPosseduto>) => metti(lista.map((x) => (x.uid === uid ? { ...x, ...o } : x)));
  const n = sintonizzati(lista);
  if (!lista.length && !cambia) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-medium text-testo">Oggetti magici</h3>
        {lista.some(richiedeSintonia) && <span className={`text-sm ${n > MAX_SINTONIA ? 'text-attenzione' : 'text-testo-2'}`}>Sintonia {n}/{MAX_SINTONIA}</span>}
      </div>
      {lista.length === 0 && <p className="text-sm text-testo-2">Quando il master ti dà un oggetto magico, aggiungilo qui: i suoi bonus entrano da soli nella scheda.</p>}
      <ul className="space-y-2">
        {lista.map((o) => {
          const def = OGGETTI_MAGICI[o.id];
          const serve = richiedeSintonia(o);
          const max = o.personalizzato?.cariche ?? def?.cariche?.massimo;
          const su = aperto === o.uid;
          return (
            <li key={o.uid} className={`rounded-xl border bg-superficie ${serve && !o.sintonizzato ? 'border-bordo' : 'border-oro'}`}>
              <button onClick={() => setAperto(su ? null : o.uid)} aria-expanded={su} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-testo">{(o.quantita ?? 1) > 1 ? `${o.quantita} × ` : ''}{nomeOggetto(o, DATI)}</span>
                  <span className="block text-xs text-testo-2">
                    {def ? `${def.categoria}, ${def.varianti?.find((v) => v.id === o.variante)?.rarita ?? def.rarita}` : 'Dal tuo manuale o dal master'}
                    {serve ? (o.sintonizzato ? ' · sintonizzato' : ' · richiede sintonia: non attivo') : ''}
                  </span>
                </span>
                <span aria-hidden className={`text-testo-2 transition-transform ${su ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {su && (
                <div className="anim-srotola space-y-3 border-t border-bordo px-3 pb-3 pt-2 text-sm">
                  <p className="text-testo">{o.personalizzato?.riga ?? def?.riga}{def && <span className="ml-1 text-xs text-testo-2">SRD p. {def.pagina}</span>}</p>
                  {o.nota && <p className="text-testo-2">{o.nota}</p>}
                  {serve && (
                    <label className="flex min-h-11 items-center justify-between gap-3 text-testo">
                      <span>Sintonizzato{typeof def?.sintonia === 'string' ? ` (solo ${def.sintonia})` : ''}<span className="block text-xs text-testo-2">Serve un riposo breve passato a concentrarsi sull'oggetto (SRD p. 102-103)</span></span>
                      <input type="checkbox" disabled={!cambia} checked={!!o.sintonizzato} onChange={(e) => aggiorna(o.uid, { sintonizzato: e.target.checked })} className="h-6 w-6 accent-[var(--accento)]" />
                    </label>
                  )}
                  {max !== undefined && (
                    <Contatore etichetta={`Cariche${def?.cariche ? ` (tornano: ${def.cariche.recupero})` : ''}`} valore={o.cariche ?? max} max={max}
                      cambia={cambia ? (v) => aggiorna(o.uid, { cariche: v }) : undefined} />
                  )}
                  {def?.consumabile && (
                    <Contatore etichetta="Quantità" valore={o.quantita ?? 1} max={99} cambia={cambia ? (v) => (v === 0 ? metti(lista.filter((x) => x.uid !== o.uid)) : aggiorna(o.uid, { quantita: v })) : undefined} />
                  )}
                  {cambia && (
                    <div className="flex justify-end">
                      <button onClick={() => window.confirm(`Togliere «${nomeOggetto(o, DATI)}»?`) && metti(lista.filter((x) => x.uid !== o.uid))} className="min-h-11 px-3 text-sm text-attenzione">Togli</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {cambia && (
        <button onClick={() => setAggiungi(true)} className="min-h-12 w-full rounded-xl border border-accento text-base text-accento">+ Aggiungi un oggetto magico</button>
      )}
      {aggiungi && cambia && <Aggiungi chiudi={() => setAggiungi(false)} aggiungi={(o) => { metti([...lista, o]); setAggiungi(false); }} />}
    </section>
  );
}

function Contatore({ etichetta, valore, max, cambia }: { etichetta: string; valore: number; max: number; cambia?: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-testo">
      <span>{etichetta}</span>
      <span className="flex items-center gap-2">
        <button disabled={!cambia || valore <= 0} onClick={() => cambia?.(valore - 1)} aria-label={`${etichetta}: meno uno`} className="h-11 w-11 rounded-full border border-bordo text-lg disabled:opacity-30">−</button>
        <span className="w-10 text-center text-base font-medium" aria-live="polite">{valore}{max < 99 ? `/${max}` : ''}</span>
        <button disabled={!cambia || valore >= max} onClick={() => cambia?.(valore + 1)} aria-label={`${etichetta}: più uno`} className="h-11 w-11 rounded-full border border-bordo text-lg disabled:opacity-30">+</button>
      </span>
    </div>
  );
}

// Il foglio per aggiungere: cerca tra gli oggetti dell'SRD, oppure scrivi il tuo
function Aggiungi({ chiudi, aggiungi }: { chiudi: () => void; aggiungi: (o: OggettoMagicoPosseduto) => void }) {
  const [cerca, setCerca] = useState('');
  const [scelto, setScelto] = useState<OggettoMagico | 'personalizzato' | null>(null);
  const [variante, setVariante] = useState('');
  const [base, setBase] = useState('');
  const [quantita, setQuantita] = useState(1);
  const [nota, setNota] = useState('');
  const [pers, setPers] = useState({ nome: '', sintonia: false, riga: '', ca: 0, ts: 0, att: 0, cd: 0, cariche: 0 });
  const q = cerca.trim().toLowerCase();
  const elenco = Object.values(OGGETTI_MAGICI).filter((o) => !q || o.nome.toLowerCase().includes(q) || o.nomeEn.toLowerCase().includes(q))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  const armi = Object.entries(ARMI).sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'it'));
  const armature = Object.values(DATI.oggetti).filter((o) => o.armatura && o.armatura.categoria !== 'scudo');
  const campo = 'h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo';
  const numero = (v: number, f: (n: number) => void, et: string) => (
    <label className="flex items-center justify-between gap-3 text-sm text-testo"><span>{et}</span>
      <input inputMode="numeric" value={v || ''} placeholder="0" onChange={(e) => f(Number(e.target.value.replace(/[^\d-]/g, '')) || 0)} className="h-11 w-20 rounded-lg border border-bordo bg-sfondo text-center text-base" />
    </label>
  );

  if (scelto === 'personalizzato') return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="text-lg font-medium text-testo">Un altro oggetto magico</h2>}>
      <div className="space-y-3">
        <p className="text-sm text-testo-2">Per un oggetto dell'SRD che non è in elenco, o di un altro manuale: copia dal manuale solo i bonus che servono ai calcoli.</p>
        <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Nome</span><input value={pers.nome} onChange={(e) => setPers({ ...pers, nome: e.target.value })} className={campo} /></label>
        <label className="flex min-h-11 items-center justify-between text-sm text-testo"><span>Richiede sintonia</span>
          <input type="checkbox" checked={pers.sintonia} onChange={(e) => setPers({ ...pers, sintonia: e.target.checked })} className="h-6 w-6 accent-[var(--accento)]" /></label>
        {numero(pers.ca, (n) => setPers({ ...pers, ca: n }), 'Bonus alla CA')}
        {numero(pers.ts, (n) => setPers({ ...pers, ts: n }), 'Bonus ai tiri salvezza')}
        {numero(pers.att, (n) => setPers({ ...pers, att: n }), 'Bonus all\'attacco con incantesimi')}
        {numero(pers.cd, (n) => setPers({ ...pers, cd: n }), 'Bonus alla CD degli incantesimi')}
        {numero(pers.cariche, (n) => setPers({ ...pers, cariche: n }), 'Cariche (0 se non ne ha)')}
        <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Cosa fa, in una riga (facoltativo)</span><input value={pers.riga} onChange={(e) => setPers({ ...pers, riga: e.target.value })} className={campo} /></label>
        <button disabled={!pers.nome.trim()} onClick={() => aggiungi({ uid: nuovoUid(), id: 'personalizzato', ...(pers.cariche ? { cariche: pers.cariche } : {}),
          personalizzato: { nome: pers.nome.trim(), sintonia: pers.sintonia, ...(pers.riga.trim() ? { riga: pers.riga.trim() } : {}), ...(pers.cariche ? { cariche: pers.cariche } : {}),
            bonus: { ...(pers.ca ? { ca: pers.ca } : {}), ...(pers.ts ? { ts: pers.ts } : {}), ...(pers.att ? { attaccoIncantesimi: pers.att } : {}), ...(pers.cd ? { cdIncantesimi: pers.cd } : {}) } } })}
          className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Aggiungi</button>
      </div>
    </FoglioDalBasso>
  );

  if (scelto) {
    const manca = (scelto.varianti && !variante) || (scelto.base === 'arma' && !base) || (scelto.base === 'armatura' && !base);
    return (
      <FoglioDalBasso chiudi={chiudi} titolo={<><h2 className="text-lg font-medium text-testo">{scelto.nome}</h2><p className="text-sm text-testo-2">{scelto.categoria}, {scelto.rarita}{scelto.sintonia ? ' · richiede sintonia' : ''}</p></>}>
        <div className="space-y-3">
          <p className="text-sm text-testo">{scelto.riga} <span className="text-xs text-testo-2">SRD p. {scelto.pagina}</span></p>
          {scelto.varianti && (
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Quale</span>
              <select value={variante} onChange={(e) => setVariante(e.target.value)} className={campo}>
                <option value="">Scegli…</option>
                {scelto.varianti.map((v) => <option key={v.id} value={v.id}>{v.nome || 'normale'} · {v.rarita}</option>)}
              </select></label>
          )}
          {scelto.base === 'arma' && (
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Che arma è</span>
              <select value={base} onChange={(e) => setBase(e.target.value)} className={campo}>
                <option value="">Scegli…</option>
                {armi.map(([id, a]) => <option key={id} value={id}>{a.nome}</option>)}
              </select></label>
          )}
          {scelto.base === 'armatura' && (
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Che armatura è</span>
              <select value={base} onChange={(e) => setBase(e.target.value)} className={campo}>
                <option value="">Scegli…</option>
                {armature.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select></label>
          )}
          {scelto.consumabile && (
            <label className="flex items-center justify-between text-sm text-testo"><span>Quante</span>
              <input inputMode="numeric" value={quantita} onChange={(e) => setQuantita(Math.max(1, Number(e.target.value) || 1))} className="h-11 w-20 rounded-lg border border-bordo bg-sfondo text-center text-base" /></label>
          )}
          {scelto.id === 'spell-scroll' && (
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Quale incantesimo contiene</span>
              <input value={nota} onChange={(e) => setNota(e.target.value)} className={campo} /></label>
          )}
          <button disabled={manca} onClick={() => aggiungi({ uid: nuovoUid(), id: scelto.id, ...(variante ? { variante } : {}), ...(base ? { base } : {}),
            ...(scelto.consumabile ? { quantita } : {}), ...(nota.trim() ? { nota: nota.trim() } : {}), ...(scelto.cariche ? { cariche: scelto.cariche.massimo } : {}) })}
            className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Aggiungi allo zaino</button>
          <button onClick={() => setScelto(null)} className="min-h-11 w-full text-sm text-accento">Scegli un altro oggetto</button>
        </div>
      </FoglioDalBasso>
    );
  }

  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<><h2 className="text-lg font-medium text-testo">Aggiungi un oggetto magico</h2><p className="text-sm text-testo-2">Quelli più comuni dell'SRD, oppure il tuo</p></>}>
      <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca (anche in inglese)" aria-label="Cerca un oggetto magico"
        className="mb-3 h-11 w-full rounded-lg border border-bordo bg-superficie px-3 text-base text-testo" />
      <ul className="divide-y divide-bordo">
        {elenco.map((o) => (
          <li key={o.id}>
            <button onClick={() => setScelto(o)} className="flex min-h-12 w-full items-center gap-3 py-1 text-left">
              <span className="min-w-0 flex-1"><span className="block text-base text-testo">{o.nome}</span>
                <span className="block text-xs text-testo-2">{o.categoria}, {o.rarita}{o.sintonia ? ' · sintonia' : ''}</span></span>
              <span aria-hidden className="text-testo-2">›</span>
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setScelto('personalizzato')} className="mt-3 min-h-12 w-full rounded-xl border border-accento text-base text-accento">Un altro oggetto (lo scrivi tu)</button>
    </FoglioDalBasso>
  );
}
