// Modulo guidato per inserire una specie dal proprio manuale (sezione 4): Eberron, Ravenloft, altri manuali o inventata.
// L'app non contiene i dati: li copia chi ha il libro. Versione completa (scelta di Patrizio, 18/11).
import { useState } from 'react';
import { controllaSpecie, creaSpecie, TIPI_DANNO, type ListaSpecie, type MagiaModulo, type ModuloSpecie as Modulo, type TrattoModulo } from '../creazione/specie-personalizzate';
import { DATI } from '../regole';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import type { Car, Specie } from '../regole/tipi';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { Tendina } from './Tendina';

const base = 'rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo placeholder:text-testo-2/70';
const campo = `w-full ${base}`;
const ORIGINE = Object.values(DATI.talenti).filter((t) => t.categoria === 'origine');
const ABILITA_ORD = Object.entries(ABILITA).sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'it'));
const TRUCCHETTI = Object.values(DATI.incantesimi).filter((i) => i.livello === 0).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
const PRIMO = Object.values(DATI.incantesimi).filter((i) => i.livello === 1).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
const LISTE: { id: ListaSpecie; nome: string }[] = [{ id: 'cleric', nome: 'Chierico' }, { id: 'druid', nome: 'Druido' }, { id: 'wizard', nome: 'Mago' }];
const VELOCITA = ['6', '7,5', '9', '10,5', '12'];
const magiaVuota = (): MagiaModulo => ({ caratteristica: 'scelta', trucchettiFissi: [], trucchettiScelti: null, incantesimo1: '' });

// Pulsante a gettone, acceso o spento
function Gettone({ si, onClick, children }: { si: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={si}
      className={`min-h-11 rounded-full px-3 text-sm ${si ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo-2'}`}>{children}</button>
  );
}
const alterna = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

export function ModuloSpecie({ iniziale, chiudi, salva }: { iniziale: Modulo; chiudi: () => void; salva: (sp: Specie) => void }) {
  const [m, setM] = useState<Modulo>(iniziale);
  const [provato, setProvato] = useState(false);
  const errori = controllaSpecie(m);
  const errore = (c: string) => (provato ? errori.find((e) => e.campo === c)?.messaggio : undefined);
  const Errore = ({ c }: { c: string }) => (errore(c) ? <span className="block text-sm text-attenzione">{errore(c)}</span> : null);
  const g = m.magia;
  const metti = (x: Partial<MagiaModulo>) => setM({ ...m, magia: { ...(g ?? magiaVuota()), ...x } });
  const tratto = (i: number, x: Partial<TrattoModulo>) => setM({ ...m, tratti: m.tratti.map((t, k) => (k === i ? { ...t, ...x } : t)) });
  const titolo = (t: string) => <h3 className="mb-2 text-sm font-medium text-testo">{t}</h3>;

  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<>
      <h2 className="text-lg font-medium text-testo">{m.id ? 'Modifica la specie' : 'Inserisci una specie'}</h2>
      <p className="text-sm text-testo-2">Copia i dati dal tuo manuale: restano nel tuo telefono e nelle tue schede. Una specie con più varianti (stirpi, eredità) va inserita una volta per variante.</p>
    </>}>
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-testo">Nome</span>
          <input value={m.nome} onChange={(e) => setM({ ...m, nome: e.target.value })} autoComplete="off" className={`${campo} h-12`} />
          <Errore c="nome" />
        </label>
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Manuale</span>
            <input value={m.fonte} onChange={(e) => setM({ ...m, fonte: e.target.value })} placeholder="Es. Eberron" className={`${campo} h-12`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Pagina</span>
            <input value={m.pagina} onChange={(e) => setM({ ...m, pagina: e.target.value })} inputMode="numeric" className={`${campo} h-12`} />
          </label>
        </div>

        <div>
          {titolo('Taglia')}
          <div className="grid grid-cols-3 gap-2">
            {([['media'], ['piccola'], ['media', 'piccola']] as ('media' | 'piccola')[][]).map((t) => {
              const si = t.join() === m.taglie.join();
              return <button key={t.join()} type="button" onClick={() => setM({ ...m, taglie: t })} aria-pressed={si}
                className={`min-h-11 rounded-lg px-1 text-sm ${si ? 'border-2 border-accento text-accento' : 'border border-bordo text-testo'}`}>
                {t.length === 2 ? 'Media o piccola' : t[0] === 'media' ? 'Media' : 'Piccola'}</button>;
            })}
          </div>
          <Errore c="taglia" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Tendina etichetta="Velocità" valore={m.velocitaMetri} opzioni={VELOCITA.map((v) => ({ id: v, nome: `${v} metri`, disattivata: false }))}
            cambia={(v) => v && setM({ ...m, velocitaMetri: v })} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-testo">Scurovisione</span>
            <select value={m.scurovisione} onChange={(e) => setM({ ...m, scurovisione: Number(e.target.value) as Modulo['scurovisione'] })}
              className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo">
              <option value={0}>Nessuna</option><option value={18}>18 metri</option><option value={36}>36 metri</option>
            </select>
          </label>
        </div>
        <Errore c="velocita" />

        <div>
          {titolo('Resistenze ai danni')}
          <div className="flex flex-wrap gap-2">
            {TIPI_DANNO.map((t) => <Gettone key={t} si={m.resistenze.includes(t)} onClick={() => setM({ ...m, resistenze: alterna(m.resistenze, t) })}>{t}</Gettone>)}
          </div>
        </div>

        <div>
          {titolo('Abilità con competenza (date dalla specie)')}
          <div className="flex flex-wrap gap-2">
            {ABILITA_ORD.map(([id, a]) => <Gettone key={id} si={m.abilitaFisse.includes(id)} onClick={() => setM({ ...m, abilitaFisse: alterna(m.abilitaFisse, id) })}>{a.nome}</Gettone>)}
          </div>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-base text-testo">
            <input type="checkbox" checked={!!m.sceltaAbilita} onChange={(e) => setM({ ...m, sceltaAbilita: e.target.checked ? { quantita: 1, opzioni: [] } : null })} className="h-5 w-5" />
            Il giocatore sceglie anche delle abilità
          </label>
          {m.sceltaAbilita && (
            <div className="mt-2 space-y-2 rounded-xl border border-bordo p-3">
              <Tendina etichetta="Quante" valore={String(m.sceltaAbilita.quantita)} opzioni={['1', '2', '3'].map((n) => ({ id: n, nome: n, disattivata: false }))}
                cambia={(v) => v && setM({ ...m, sceltaAbilita: { ...m.sceltaAbilita!, quantita: Number(v) } })} />
              <p className="text-sm text-testo-2">Tra quali? Nessuna accesa = tutte.</p>
              <div className="flex flex-wrap gap-2">
                {ABILITA_ORD.map(([id, a]) => <Gettone key={id} si={m.sceltaAbilita!.opzioni.includes(id)}
                  onClick={() => setM({ ...m, sceltaAbilita: { ...m.sceltaAbilita!, opzioni: alterna(m.sceltaAbilita!.opzioni, id) } })}>{a.nome}</Gettone>)}
              </div>
            </div>
          )}
          <Errore c="abilita" />
        </div>

        <div className="space-y-2">
          <Tendina etichetta="Talento d'origine" valore={m.talento.tipo === 'fisso' ? m.talento.id : m.talento.tipo}
            opzioni={[{ id: 'nessuno', nome: 'Nessuno', disattivata: false }, { id: 'scelta', nome: 'A scelta del giocatore (come Versatile)', disattivata: false }]}
            gruppi={[{ titolo: 'Un talento preciso dell\'SRD', opzioni: ORIGINE.map((t) => ({ id: t.id, nome: t.nome, disattivata: false })) }]}
            cambia={(v) => setM({ ...m, talento: !v || v === 'nessuno' ? { tipo: 'nessuno' } : v === 'scelta' ? { tipo: 'scelta' } : { tipo: 'fisso', id: v } })} />
          {m.talento.tipo === 'fisso' && m.talento.id === 'magic-initiate' && (
            <Tendina etichetta="Lista di Iniziato alla magia" valore={m.talento.lista ?? ''} opzioni={LISTE.map((l) => ({ ...l, disattivata: false }))}
              cambia={(v) => setM({ ...m, talento: { tipo: 'fisso', id: 'magic-initiate', ...(v ? { lista: v as ListaSpecie } : {}) } })} />
          )}
          <p className="text-xs text-testo-2">Un talento fuori dall'SRD scrivilo come tratto, qui sotto.</p>
          <Errore c="talento" />
        </div>

        <label className="flex min-h-11 items-center gap-3 text-base text-testo">
          <input type="checkbox" checked={m.pfExtra} onChange={(e) => setM({ ...m, pfExtra: e.target.checked })} className="h-5 w-5" />
          +1 punto ferita per livello
        </label>

        <div>
          <label className="flex min-h-11 items-center gap-3 text-base font-medium text-testo">
            <input type="checkbox" checked={!!g} onChange={(e) => setM({ ...m, magia: e.target.checked ? magiaVuota() : null })} className="h-5 w-5" />
            Dà incantesimi
          </label>
          {g && (
            <div className="mt-2 space-y-3 rounded-xl border border-bordo p-3">
              <Tendina etichetta="Caratteristica per gli incantesimi" valore={g.caratteristica}
                opzioni={[{ id: 'scelta', nome: 'A scelta tra Intelligenza, Saggezza, Carisma', disattivata: false },
                  ...(['INT', 'SAG', 'CAR'] as Car[]).map((c) => ({ id: c, nome: NOME_CAR[c], disattivata: false }))]}
                cambia={(v) => v && metti({ caratteristica: v as MagiaModulo['caratteristica'] })} />
              <div>
                <span className="mb-1 block text-sm font-medium text-testo">Trucchetti che dà</span>
                {g.trucchettiFissi.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-2">
                    {g.trucchettiFissi.map((t) => (
                      <li key={t}><button type="button" onClick={() => metti({ trucchettiFissi: g.trucchettiFissi.filter((x) => x !== t) })}
                        className="min-h-11 rounded-full border-2 border-accento px-3 text-sm text-accento" aria-label={`Togli ${DATI.incantesimi[t]?.nome}`}>
                        {DATI.incantesimi[t]?.nome} ✕</button></li>
                    ))}
                  </ul>
                )}
                <select value="" onChange={(e) => e.target.value && metti({ trucchettiFissi: [...g.trucchettiFissi, e.target.value] })} aria-label="Aggiungi un trucchetto"
                  className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo">
                  <option value="">Aggiungi un trucchetto…</option>
                  {TRUCCHETTI.filter((t) => !g.trucchettiFissi.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Tendina etichetta="Trucchetti a scelta" valore={String(g.trucchettiScelti?.quantita ?? 0)}
                  opzioni={['0', '1', '2', '3'].map((n) => ({ id: n, nome: n === '0' ? 'Nessuno' : n, disattivata: false }))}
                  cambia={(v) => metti({ trucchettiScelti: !v || v === '0' ? null : { quantita: Number(v), lista: g.trucchettiScelti?.lista ?? 'wizard' } })} />
                {g.trucchettiScelti && (
                  <Tendina etichetta="Dalla lista" valore={g.trucchettiScelti.lista} opzioni={LISTE.map((l) => ({ ...l, disattivata: false }))}
                    cambia={(v) => v && metti({ trucchettiScelti: { ...g.trucchettiScelti!, lista: v as ListaSpecie } })} />
                )}
              </div>
              <Tendina etichetta="Incantesimo di 1° livello (facoltativo)" valore={g.incantesimo1 || 'nessuno'}
                opzioni={[{ id: 'nessuno', nome: 'Nessuno', disattivata: false }, ...PRIMO.map((i) => ({ id: i.id, nome: i.nome, disattivata: false }))]}
                cambia={(v) => metti({ incantesimo1: !v || v === 'nessuno' ? '' : v })} />
              {g.incantesimo1 && <p className="text-xs text-testo-2">Sempre preparato: una volta gratis per riposo lungo, poi con gli slot se ne hai.</p>}
              <p className="text-xs text-testo-2">Gli incantesimi che arrivano ai livelli 3 e 5 non servono: l'app crea personaggi di livello 1.</p>
              <Errore c="magia" />
            </div>
          )}
        </div>

        <div>
          {titolo('Altri tratti')}
          <p className="mb-2 text-xs text-testo-2">Quelli che non stanno sopra: un nome e cosa fa, in parole tue. Se si usa un numero di volte, l'app mette i pallini nella scheda.</p>
          <ul className="space-y-3">
            {m.tratti.map((t, i) => (
              <li key={i} className="space-y-2 rounded-xl border border-bordo p-3">
                <input value={t.nome} onChange={(e) => tratto(i, { nome: e.target.value })} placeholder="Nome del tratto" aria-label="Nome del tratto" className={`${campo} h-12`} />
                <input value={t.testo} onChange={(e) => tratto(i, { testo: e.target.value })} placeholder="Cosa fa, in una riga" aria-label="Cosa fa il tratto" className={`${campo} h-12`} />
                <div className="grid grid-cols-2 gap-2">
                  <Tendina etichetta="Usi" valore={t.usi} cambia={(v) => v && tratto(i, { usi: v as TrattoModulo['usi'] })}
                    opzioni={[{ id: 'sempre', nome: 'Sempre attivo', disattivata: false }, { id: 'uno', nome: '1 volta', disattivata: false },
                      { id: 'competenza', nome: 'Quanto la competenza', disattivata: false }]} />
                  {t.usi !== 'sempre' && (
                    <Tendina etichetta="Tornano con" valore={t.riposo} cambia={(v) => v && tratto(i, { riposo: v as 'lungo' | 'breve' })}
                      opzioni={[{ id: 'lungo', nome: 'Riposo lungo', disattivata: false }, { id: 'breve', nome: 'Riposo breve', disattivata: false }]} />
                  )}
                </div>
                <button type="button" onClick={() => setM({ ...m, tratti: m.tratti.filter((_, k) => k !== i) })} className="min-h-11 text-sm text-attenzione">Togli il tratto</button>
                <Errore c={`tratto-${i}`} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setM({ ...m, tratti: [...m.tratti, { nome: '', testo: '', usi: 'sempre', riposo: 'lungo' }] })}
            className="mt-2 h-12 w-full rounded-xl border border-accento text-base text-accento">Aggiungi un tratto</button>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-testo">In una riga, con parole tue (facoltativo)</span>
          <input value={m.descrizione} onChange={(e) => setM({ ...m, descrizione: e.target.value })} className={`${campo} h-12`} />
        </label>

        <button onClick={() => { setProvato(true); if (!errori.length) salva(creaSpecie(m)); }}
          className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento">Salva la specie</button>
        {provato && errori.length > 0 && <p className="text-sm text-attenzione">Manca ancora qualcosa: lo trovi segnato sopra.</p>}
      </div>
    </FoglioDalBasso>
  );
}
