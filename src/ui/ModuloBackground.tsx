// Modulo guidato per inserire un background dal proprio manuale (sezione 4): l'app non contiene i dati,
// li scrive chi ha il libro. Tendine per tutto, tranne nome, pagina e le righe libere.
import { useState } from 'react';
import { controllaModulo, creaBackground, regolaSrd, GIOCHI, type ModuloBackground as Modulo, type StrumentoModulo } from '../creazione/personalizzati';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR, STRUMENTI_ARTIGIANO, STRUMENTI_MUSICALI } from '../regole/dati/base';
import { CARATTERISTICHE, type Background, type Car } from '../regole/tipi';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { Tendina } from './Tendina';

const base = 'rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo placeholder:text-testo-2/70';
const campo = `w-full ${base}`;
const STRUMENTI_FISSI = [...Object.keys(STRUMENTI_ARTIGIANO), ...Object.keys(STRUMENTI_MUSICALI), ...GIOCHI, 'thieves-tools', 'herbalism-kit',
  'disguise-kit', 'forgery-kit', 'navigators-tools', 'poisoners-kit'];
const ORIGINE = Object.values(DATI.talenti).filter((t) => t.categoria === 'origine');
// Oggetti che si possono mettere nel pacchetto A: tutto il catalogo con un prezzo (armi, armature, strumenti, dotazioni…)
const CATALOGO = Object.values(DATI.oggetti).filter((o) => o.costoMo !== undefined).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));

export function ModuloBackground({ iniziale, chiudi, salva }: { iniziale: Modulo; chiudi: () => void; salva: (bg: Background) => void }) {
  const [m, setM] = useState<Modulo>(iniziale);
  const [provato, setProvato] = useState(false);
  const [nuovoOggetto, setNuovoOggetto] = useState('');
  const errori = controllaModulo(m);
  const errore = (c: string) => (provato ? errori.find((e) => e.campo === c)?.messaggio : undefined);
  const metti = (k: number, v: string, chiave: 'caratteristiche' | 'abilita') => {
    const a = [...m[chiave]];
    a[k] = v as Car;
    setM({ ...m, [chiave]: a });
  };
  const valoreStrumento = !m.strumento ? '' : m.strumento.tipo === 'fisso' ? m.strumento.id : `scelta:${m.strumento.famiglia}`;
  const valoreTalento = !m.talento ? '' : m.talento.tipo === 'libero' ? 'libero' : m.talento.id;

  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="text-lg font-medium text-testo">{m.id ? 'Modifica il background' : m.daManuale ? 'Inserisci un background' : 'Crea un background'}</h2>
      <p className="text-sm text-testo-2">{m.daManuale ? 'Copia i dati dal tuo manuale: restano nel tuo telefono e nelle tue schede.' : 'Da un altro manuale o inventato da te, con la regola dell\'SRD.'}</p>
    </>}>
      <div className="space-y-4">
        {/* La regola ufficiale per creare un background (SRD p. 192-193, 21/11) */}
        <details className="rounded-xl border border-bordo bg-superficie p-3 text-sm text-testo" open={!m.daManuale && !m.id}>
          <summary className="cursor-pointer font-medium">La regola dell'SRD (p. 192-193)</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-testo-2">
            <li>Tre caratteristiche adatte al passato del personaggio (Forza o Destrezza per i lavori fisici, Costituzione per la resistenza, Intelligenza o Saggezza per lo studio e lo spirito, Carisma per il pubblico e la società).</li>
            <li>Un talento della categoria Origini.</li>
            <li>Due abilità: non serve che siano legate alle caratteristiche.</li>
            <li>Uno strumento usato in quel mestiere.</li>
            <li>Un equipaggiamento che vale 50 mo in tutto, monete comprese, senza armi da guerra né armature (arrivano dalla classe).</li>
          </ol>
        </details>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-testo">Nome</span>
          <input value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} autoComplete="off" className={`${campo} h-12`} />
          {errore('nome') && <span className="text-sm text-attenzione">{errore('nome')}</span>}
          {m.daManuale && <span className="block text-xs text-testo-2">Il nome italiano è da verificare: correggilo come sul tuo manuale.</span>}
        </label>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Manuale</span>
            <input value={m.fonte} onChange={(e) => setM({ ...m, fonte: e.target.value })} placeholder="Manuale del Giocatore 2024" className={`${campo} h-12`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Pagina</span>
            <input value={m.pagina} onChange={(e) => setM({ ...m, pagina: e.target.value })} inputMode="numeric" className={`${campo} h-12`} />
          </label>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-testo">Caratteristiche dei bonus</legend>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((k) => (
              <select key={k} value={m.caratteristiche[k]} onChange={(e) => metti(k, e.target.value, 'caratteristiche')} aria-label={`Caratteristica ${k + 1}`}
                className={`h-12 rounded-lg border px-2 text-base text-testo ${m.caratteristiche[k] ? 'border-bordo bg-sfondo' : 'border-attenzione bg-attenzione/10'}`}>
                <option value="">Scegli…</option>
                {CARATTERISTICHE.map((c) => <option key={c} value={c} disabled={m.caratteristiche.includes(c) && m.caratteristiche[k] !== c}>{NOME_CAR[c]}</option>)}
              </select>
            ))}
          </div>
          {errore('caratteristiche') && <span className="text-sm text-attenzione">{errore('caratteristiche')}</span>}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-testo">Abilità</legend>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((k) => (
              <select key={k} value={m.abilita[k]} onChange={(e) => metti(k, e.target.value, 'abilita')} aria-label={`Abilità ${k + 1}`}
                className={`h-12 rounded-lg border px-2 text-base text-testo ${m.abilita[k] ? 'border-bordo bg-sfondo' : 'border-attenzione bg-attenzione/10'}`}>
                <option value="">Scegli…</option>
                {Object.entries(ABILITA).sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'it')).map(([id, a]) =>
                  <option key={id} value={id} disabled={m.abilita.includes(id) && m.abilita[k] !== id}>{a.nome}</option>)}
              </select>
            ))}
          </div>
          {errore('abilita') && <span className="text-sm text-attenzione">{errore('abilita')}</span>}
        </fieldset>

        <div>
          <Tendina
            etichetta="Strumento"
            valore={valoreStrumento}
            gruppi={[
              { titolo: 'A scelta del giocatore', opzioni: [
                { id: 'scelta:artigiano', nome: 'Uno strumento da artigiano a scelta', disattivata: false },
                { id: 'scelta:musicale', nome: 'Uno strumento musicale a scelta', disattivata: false },
                { id: 'scelta:gioco', nome: 'Un gioco a scelta', disattivata: false },
              ] },
              { titolo: 'Uno preciso', opzioni: STRUMENTI_FISSI.map((id) => ({ id, nome: DATI.oggetti[id]?.nome ?? id, disattivata: false })).sort((a, b) => a.nome.localeCompare(b.nome, 'it')) },
            ]}
            opzioni={[]}
            cambia={(v) => setM({ ...m, strumento: !v ? null : v.startsWith('scelta:') ? { tipo: 'scelta', famiglia: v.slice(7) } as StrumentoModulo : { tipo: 'fisso', id: v } })}
          />
          {errore('strumento') && <span className="text-sm text-attenzione">{errore('strumento')}</span>}
        </div>

        <div className="space-y-2">
          <Tendina
            etichetta="Talento d'origine"
            valore={valoreTalento}
            gruppi={[
              { titolo: 'Dall\'SRD (calcolati)', opzioni: ORIGINE.map((t) => ({ id: t.id, nome: t.nome, disattivata: false })) },
              { titolo: 'Fuori dall\'SRD', opzioni: [{ id: 'libero', nome: 'Un altro talento (lo scrivi tu, non si calcola)', disattivata: false }] },
            ]}
            opzioni={[]}
            cambia={(v) => setM({ ...m, talento: !v ? null : v === 'libero' ? { tipo: 'libero', nome: '', nota: '' } : { tipo: 'srd', id: v } })}
          />
          {m.talento?.tipo === 'srd' && m.talento.id === 'magic-initiate' && (
            <Tendina etichetta="Lista di Iniziato alla magia" valore={m.talento.lista ?? ''}
              opzioni={[{ id: 'cleric', nome: 'Chierico', disattivata: false }, { id: 'druid', nome: 'Druido', disattivata: false }, { id: 'wizard', nome: 'Mago', disattivata: false }]}
              cambia={(v) => setM({ ...m, talento: { tipo: 'srd', id: 'magic-initiate', ...(v ? { lista: v as 'cleric' | 'druid' | 'wizard' } : {}) } })} />
          )}
          {m.talento?.tipo === 'libero' && (
            <>
              <input value={m.talento.nome} onChange={(e) => setM({ ...m, talento: { ...(m.talento as { tipo: 'libero'; nome: string; nota: string }), nome: e.target.value } })}
                placeholder="Nome del talento" aria-label="Nome del talento" className={`${campo} h-12`} />
              <input value={m.talento.nota} onChange={(e) => setM({ ...m, talento: { ...(m.talento as { tipo: 'libero'; nome: string; nota: string }), nota: e.target.value } })}
                placeholder="Cosa fa, in una riga tua" aria-label="Cosa fa il talento" className={`${campo} h-12`} />
              <p className="text-xs text-testo-2">L'app non ne calcola gli effetti: nella scheda resta un avviso da controllare.</p>
            </>
          )}
          {errore('talento') && <span className="text-sm text-attenzione">{errore('talento')}</span>}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-testo">Equipaggiamento, opzione A</legend>
          <ul className="space-y-1">
            {m.oggettiA.map((o, i) => (
              <li key={o.oggetto} className="flex items-center gap-2">
                <input value={o.quantita} inputMode="numeric" aria-label={`Quantità di ${DATI.oggetti[o.oggetto]?.nome}`}
                  onChange={(e) => setM({ ...m, oggettiA: m.oggettiA.map((x, k) => (k === i ? { ...x, quantita: Math.max(0, Number(e.target.value) || 0) } : x)) })}
                  className={`${base} h-11 w-16 px-1 text-center`} />
                <span className="flex-1 text-base text-testo">{DATI.oggetti[o.oggetto]?.nome ?? o.oggetto}</span>
                <button onClick={() => setM({ ...m, oggettiA: m.oggettiA.filter((_, k) => k !== i) })} className="min-h-11 px-2 text-sm text-accento">Togli</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <select value={nuovoOggetto} onChange={(e) => setNuovoOggetto(e.target.value)} aria-label="Oggetto da aggiungere"
              className="h-12 min-w-0 flex-1 rounded-lg border border-bordo bg-sfondo px-2 text-base text-testo">
              <option value="">Aggiungi un oggetto…</option>
              {CATALOGO.filter((o) => !m.oggettiA.some((x) => x.oggetto === o.id)).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            <button disabled={!nuovoOggetto} onClick={() => { setM({ ...m, oggettiA: [...m.oggettiA, { oggetto: nuovoOggetto, quantita: 1 }] }); setNuovoOggetto(''); }}
              className="h-12 rounded-lg border border-accento px-4 text-base text-accento disabled:border-bordo disabled:text-testo-2/50">Aggiungi</button>
          </div>
          <label className="flex items-center gap-2">
            <input value={m.moA} inputMode="decimal" onChange={(e) => setM({ ...m, moA: Number(e.target.value.replace(',', '.')) || 0 })} aria-label="Monete d'oro dell'opzione A"
              className={`${base} h-11 w-20 px-1 text-center`} />
            <span className="text-base text-testo">mo</span>
          </label>
          <p className="text-xs text-testo-2">Un oggetto che non trovi nell'elenco aggiungilo dopo, nel passo Equipaggiamento, come oggetto personalizzato. L'opzione B è sempre 50 mo (SRD p. 83).</p>
          {errore('equipaggiamento') && <span className="text-sm text-attenzione">{errore('equipaggiamento')}</span>}
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-testo">In una riga, con parole tue (facoltativo)</span>
          <input value={m.descrizione} onChange={(e) => setM({ ...m, descrizione: e.target.value })} className={`${campo} h-12`} />
        </label>

        <button onClick={() => { setProvato(true); if (!errori.length) salva(creaBackground(m)); }}
          className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Salva il background</button>
        {provato && errori.length > 0 && <p className="text-sm text-attenzione">Manca ancora qualcosa: lo trovi segnato sopra.</p>}
        {regolaSrd(m).length > 0 && (
          <ul className="space-y-1 rounded-xl border border-attenzione/50 p-3 text-sm text-testo">
            {regolaSrd(m).map((a) => <li key={a}><span aria-hidden className="text-attenzione">● </span>{a}</li>)}
            <li className="text-xs text-testo-2">Sono avvisi: puoi salvare lo stesso, se il tuo manuale o il master dicono diversamente.</li>
          </ul>
        )}
      </div>
    </FoglioDalBasso>
  );
}
