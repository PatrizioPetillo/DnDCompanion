// Passo 6: Equipaggiamento (SRD p. 23). Pacchetto della classe e del background, monete, CA e attacchi calcolati,
// un negozio ridotto per spendere le monete (armi, armature, focus, dotazioni, strumenti, munizioni, materiali)
// e gli oggetti personalizzati con prezzo scritto a mano.
import { useEffect, useState } from 'react';
import { aggiungiPersonalizzato, compra, negozio, opzioniPacchetto, prezzo, scegliPacchetto, togli, type OpzionePacchetto } from '../creazione/equipaggiamento';
import { comePersonaggio, statoPassi, type Bozza } from '../creazione/percorso';
import { calcolaScheda, DATI } from '../regole';
import { metri } from '../regole/misure';
import type { Numero } from '../regole/tipi';
import { Separatore } from './PassoMagia';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { Tendina } from './Tendina';

// «Forza −1 + Competenza 2 = +1»: il segno sta sul valore, così una caratteristica negativa si legge bene
const somma = (n: Numero, finale: string) =>
  `${n.termini.map((t) => `${t.etichetta} ${t.valore < 0 ? `−${-t.valore}` : t.valore}`).join(' + ')} = ${finale}`;
const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function PassoEquipaggiamento({ bozza, cambia }: { bozza: Bozza; cambia: (b: Bozza) => void }) {
  const [negozioAperto, setNegozioAperto] = useState(false);
  const [spiega, setSpiega] = useState<'monete' | 'ca' | null>(null);
  const pg = comePersonaggio(bozza);
    // Il pacchetto A è già segnato come scelto: entrando nel passo diventa una scelta salvata (si cambia con un tocco)
  useEffect(() => {
    if (pg && !bozza.equipaggiamento) cambia({ ...bozza, equipaggiamento: { classe: 'A', background: 'A' } });
  }, [pg, bozza, cambia]);
  
  if (!pg) return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Equipaggiamento</h1>
      <p className="text-sm text-testo-2">Prima scegli classe, background e specie: l'equipaggiamento dipende da loro.</p>
    </section>
  );
  const s = calcolaScheda(pg);
  const classe = DATI.classi[pg.classe];
  const bg = DATI.background[pg.background];
  const ca = s.ca.formule.find((f) => f.id === s.ca.migliore)!;
  const avvisi = statoPassi(bozza).equipaggiamento.avvisi.filter((a) => !a.accettato);
  const extra = pg.equipaggiamento.extra ?? [];
  // Oggetti «a scelta» da decidere qui (lo strumento musicale del bardo)
  const daScegliere = [...(classe.equipaggiamento[pg.equipaggiamento.classe]?.oggetti ?? []), ...(bg.equipaggiamento[pg.equipaggiamento.background]?.oggetti ?? [])]
    .map((x) => DATI.oggetti[x.oggetto]).filter((o) => o?.daScelta && o.opzioni);

  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">Equipaggiamento</h1>
      <p className="mb-2 text-sm text-testo-2">Classe e background ti danno un pacchetto di oggetti o solo monete. Con le monete puoi comprare subito quello che ti serve.</p>

      <Separatore titolo={`Dalla classe: ${classe.nome}`} />
      <SceltaPacchetto opzioni={opzioniPacchetto(bozza, 'classe')} scelta={pg.equipaggiamento.classe}
        scegli={(id) => cambia(scegliPacchetto(bozza, 'classe', id))} />
      {daScegliere.map((o) => (
        <div key={o!.id} className="mt-3">
          <Tendina
            etichetta={o!.nome}
            valore={bozza.scelte[o!.daScelta!]?.[0] ?? ''}
            opzioni={o!.opzioni!.map((id) => ({ id, nome: DATI.oggetti[id]?.nome ?? id, disattivata: false }))}
            cambia={(v) => cambia({ ...bozza, scelte: { ...bozza.scelte, [o!.daScelta!]: v ? [v] : [] } })}
          />
        </div>
      ))}

      <Separatore titolo={`Dal background: ${bg.nome}`} />
      <SceltaPacchetto opzioni={opzioniPacchetto(bozza, 'background')} scelta={pg.equipaggiamento.background}
        scegli={(id) => cambia(scegliPacchetto(bozza, 'background', id))} />

      <Separatore titolo="Calcolati in automatico" />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSpiega(spiega === 'monete' ? null : 'monete')} aria-expanded={spiega === 'monete'}
          className={`rounded-xl border bg-superficie p-3 text-left ${s.monete.totale < 0 ? 'border-attenzione' : 'border-bordo'}`}>
          <span className="block text-sm text-testo-2">Monete rimaste</span>
          <span className="block text-2xl font-medium text-testo">{s.monete.totale < 0 ? `−${prezzo(-s.monete.totale)}` : prezzo(s.monete.totale)}</span>
        </button>
        <button onClick={() => setSpiega(spiega === 'ca' ? null : 'ca')} aria-expanded={spiega === 'ca'}
          className="rounded-xl border border-bordo bg-superficie p-3 text-left">
          <span className="block text-sm text-testo-2">Classe Armatura</span>
          <span className="block text-2xl font-medium text-testo">{ca.valore.totale}</span>
        </button>
      </div>
      {spiega === 'monete' && <p className="mt-2 text-sm text-testo-2">{somma(s.monete, prezzo(Math.abs(s.monete.totale)))}</p>}
      {spiega === 'ca' && (
        <div className="mt-2 space-y-1 text-sm text-testo-2">
          <p>{ca.nome}: {somma(ca.valore, String(ca.valore.totale))}</p>
          {s.ca.formule.filter((f) => f.id !== ca.id).map((f) => <p key={f.id}>{f.nome}: {f.valore.totale}</p>)}
        </div>
      )}

      {avvisi.length > 0 && (
        <ul className="mt-3 space-y-2">
          {avvisi.map((a) => (
            <li key={a.id} className={`rounded-xl border bg-superficie p-3 text-sm text-testo ${a.livello === 'errore' ? 'border-attenzione' : 'border-attenzione/50'}`}>
              {a.messaggio}{a.srd?.pagina ? <span className="text-testo-2"> (SRD p. {a.srd.pagina})</span> : null}
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => setNegozioAperto(true)} className="mt-3 h-12 w-full rounded-xl border border-accento text-base font-medium text-accento">
        Compra con le monete
      </button>

      <Separatore titolo="Attacchi" />
      <ul className="space-y-2">
        {s.attacchi.map((a) => (
          <li key={a.id} className="rounded-xl border border-bordo bg-superficie p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-medium text-testo">{a.nome}{a.quantita > 1 ? ` × ${a.quantita}` : ''}</span>
              <span className="text-base text-testo">{segno(a.colpire.totale)} per colpire</span>
            </div>
            <p className="text-sm text-testo">{a.danni.testo}{a.danni.testoDueMani ? ` · a due mani ${a.danni.testoDueMani}` : ''}</p>
            <p className="text-xs text-testo-2">
              {somma(a.colpire, segno(a.colpire.totale))}
              {a.gittata ? ` · gittata ${metri(a.gittata[0]).replace(' metri', '')}/${metri(a.gittata[1])}` : ''}
              {a.padronanza ? ` · Padronanza: ${a.padronanza}` : ''}
            </p>
            {a.note.map((n) => <p key={n} className="text-xs text-attenzione">{n}</p>)}
          </li>
        ))}
      </ul>

      <Separatore titolo="Inventario" />
      <ul className="overflow-hidden rounded-xl border border-bordo bg-superficie">
        {s.inventario.map((v) => (
          <li key={v.oggetto} className="border-b border-bordo px-3 py-2 last:border-b-0">
            {v.contenuto ? (
              <details>
                <summary className="min-h-8 cursor-pointer text-base text-testo">{v.quantita > 1 ? `${v.quantita} × ` : ''}{v.nome}</summary>
                <p className="mt-1 text-sm text-testo-2">{v.contenuto.map((c) => `${c.quantita > 1 ? `${c.quantita} × ` : ''}${c.nome}`).join(', ')}</p>
              </details>
            ) : (
              <span className="text-base text-testo">{v.quantita > 1 ? `${v.quantita} × ` : ''}{v.nome}</span>
            )}
            <span className="block text-xs text-testo-2">{v.fonti.join(', ')}</span>
          </li>
        ))}
        {s.inventario.length === 0 && <li className="px-3 py-3 text-sm text-testo-2">Ancora niente: compra qualcosa con le monete.</li>}
      </ul>

      {extra.length > 0 && (
        <>
          <Separatore titolo="I tuoi acquisti" />
          <ul className="space-y-2">
            {extra.map((x) => {
              const nome = s.inventario.find((v) => v.oggetto === x.oggetto)?.nome ?? x.nome ?? x.oggetto;
              return (
                <li key={x.oggetto} className="flex items-center gap-2 rounded-xl border border-bordo bg-superficie px-3 py-2">
                  <span className="flex-1 text-base text-testo">{x.quantita > 1 ? `${x.quantita} × ` : ''}{nome}</span>
                  <button onClick={() => cambia(togli(bozza, x.oggetto))} className="min-h-11 rounded-lg px-3 text-sm text-accento" aria-label={`Togli ${nome}`}>Togli</button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Personalizzato aggiungi={(nome, mo) => cambia(aggiungiPersonalizzato(bozza, nome, mo))} />

      {negozioAperto && <Negozio bozza={bozza} cambia={cambia} chiudi={() => setNegozioAperto(false)} />}
    </section>
  );
}

function SceltaPacchetto({ opzioni, scelta, scegli }: { opzioni: OpzionePacchetto[]; scelta: string; scegli: (id: string) => void }) {
  return (
    <div className="space-y-2" role="radiogroup">
      {opzioni.map((o) => {
        const attiva = o.id === scelta;
        return (
          <button key={o.id} role="radio" aria-checked={attiva} onClick={() => scegli(o.id)}
            className={`w-full rounded-xl bg-superficie p-3 text-left ${attiva ? 'border-2 border-accento' : 'border border-bordo'}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-medium text-testo">Opzione {o.id}</span>
              <span className="text-sm text-testo">{o.mo} mo</span>
            </div>
            <p className="mt-1 text-sm text-testo-2">{o.voci.length ? o.voci.join(', ') : 'Solo monete: compri tu quello che ti serve'}</p>
          </button>
        );
      })}
    </div>
  );
}

function Negozio({ bozza, cambia, chiudi }: { bozza: Bozza; cambia: (b: Bozza) => void; chiudi: () => void }) {
  const pg = comePersonaggio(bozza)!;
  const monete = calcolaScheda(pg).monete.totale;
  const [aperto, setAperto] = useState<string | null>(null);
  const reparti = negozio(bozza);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={
      <div>
        <h2 className="text-lg font-medium text-testo">Negozio</h2>
        <p className={`text-sm ${monete < 0 ? 'text-attenzione' : 'text-testo-2'}`}>Monete rimaste: {monete < 0 ? `−${prezzo(-monete)}` : prezzo(monete)}</p>
      </div>
    }>
      <div className="space-y-2">
        {reparti.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-xl border border-bordo bg-superficie">
            <button onClick={() => setAperto(aperto === r.id ? null : r.id)} aria-expanded={aperto === r.id || r.id === 'materiali'}
              className="flex min-h-12 w-full items-center justify-between px-3 text-left text-base font-medium text-testo">
              {r.titolo}
              <span className="text-sm text-testo-2">{r.articoli.reduce((t, a) => t + (a.comprati ? 1 : 0), 0) || ''}</span>
            </button>
            {(aperto === r.id || r.id === 'materiali') && (
              <ul className="border-t border-bordo">
                {r.articoli.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 border-b border-bordo px-3 py-2 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <span className="block text-base text-testo">{a.nome}</span>
                      <span className="block text-xs text-testo-2">{a.etichettaPrezzo}{a.nota ? <span className="text-attenzione"> · {a.nota}</span> : null}</span>
                    </div>
                    {a.comprati > 0 && (
                      <>
                        <button onClick={() => cambia(togli(bozza, a.id))} className="h-11 w-11 rounded-lg border border-bordo text-lg text-testo" aria-label={`Togli ${a.nome}`}>−</button>
                        <span className="w-6 text-center text-base text-testo">{a.comprati}</span>
                      </>
                    )}
                    <button onClick={() => cambia(compra(bozza, a.id))} disabled={a.troppoCaro}
                      className="h-11 w-11 rounded-lg border border-accento text-lg text-accento disabled:border-bordo disabled:text-testo-2/50"
                      aria-label={a.troppoCaro ? `${a.nome}: non bastano le monete` : `Compra ${a.nome}`}>+</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-testo-2">Prezzi dell'SRD 5.2 (p. 89-98). Corde, tende e simili: aggiungili come oggetto personalizzato.</p>
    </FoglioDalBasso>
  );
}

function Personalizzato({ aggiungi }: { aggiungi: (nome: string, mo: number) => void }) {
  const [nome, setNome] = useState('');
  const [mo, setMo] = useState('');
  const valido = nome.trim().length > 0 && !Number.isNaN(Number(mo.replace(',', '.') || '0'));
  return (
    <>
      <Separatore titolo="Oggetto personalizzato" />
      <div className="flex gap-2">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (es. corda di seta)" autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-lg border border-bordo bg-superficie px-3 text-base text-testo placeholder:text-testo-2/70" />
        <input value={mo} onChange={(e) => setMo(e.target.value)} inputMode="decimal" placeholder="mo" aria-label="Prezzo in monete d'oro"
          className="h-12 w-20 rounded-lg border border-bordo bg-superficie px-3 text-base text-testo placeholder:text-testo-2/70" />
      </div>
      <button disabled={!valido} onClick={() => { aggiungi(nome, Number(mo.replace(',', '.') || '0')); setNome(''); setMo(''); }}
        className="mt-2 h-12 w-full rounded-xl border border-bordo text-base text-testo disabled:text-testo-2/50">
        Aggiungi oggetto
      </button>
    </>
  );
}
