// Monete durante il gioco (21/11): il master manda il bottino con un link, il giocatore registra quello che riceve e spende.
import { useState } from 'react';
import type { Bozza } from '../creazione/percorso';
import { prezzo } from '../creazione/equipaggiamento';
import { creaLinkBottino, dividi, type Bottino } from '../esporta/link';
import type { MovimentoMonete } from '../regole/tipi';
import type { VoceElenco } from '../archivio/archivio';
import { Avatar } from './Avatar';
import { FoglioDalBasso } from './SchedaIncantesimo';

// «12,5» o «12.5» → 12,5 mo; niente di strano
const leggiMo = (t: string) => { const n = Number(t.replace(',', '.').replace(/[^\d.]/g, '')); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
const nuovoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ───────── Lato giocatore: nello Zaino ─────────
export function Monete({ bozza, totale, cambia }: { bozza: Bozza; totale: number; cambia?: (b: Bozza) => void }) {
  const [aperto, setAperto] = useState(false);
  const [importo, setImporto] = useState('');
  const [nota, setNota] = useState('');
  const lista = bozza.movimenti ?? [];
  const aggiungi = (segno: 1 | -1) => {
    const mo = leggiMo(importo);
    if (!mo || !cambia) return;
    const m: MovimentoMonete = { id: nuovoId(), mo: segno * mo, il: new Date().toISOString(), ...(nota.trim() ? { nota: nota.trim() } : {}) };
    cambia({ ...bozza, movimenti: [...lista, m] });
    setImporto(''); setNota('');
  };
  const mostra = (n: number) => (n < 0 ? `−${prezzo(-n)}` : prezzo(n));
  return (
    <>
      <button onClick={() => setAperto(true)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-bordo bg-superficie px-3 text-left">
        <span className="text-base text-testo">Monete: <span className="font-medium">{mostra(totale)}</span></span>
        <span className="text-sm text-accento">{cambia ? 'Ricevi o spendi ›' : 'Movimenti ›'}</span>
      </button>
      {aperto && (
        <FoglioDalBasso chiudi={() => setAperto(false)} titolo={<><h2 className="text-lg font-medium text-testo">Monete: {mostra(totale)}</h2><p className="text-sm text-testo-2">1 mo = 10 ma = 100 mr</p></>}>
          {cambia && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1"><span className="mb-1 block text-sm font-medium text-testo">Monete d'oro</span>
                  <input inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="Es. 12 o 0,5" className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" /></label>
                <label className="flex-[2]"><span className="mb-1 block text-sm font-medium text-testo">Per cosa (facoltativo)</span>
                  <input value={nota} maxLength={80} onChange={(e) => setNota(e.target.value)} placeholder="Es. Stanza alla locanda" className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button disabled={!leggiMo(importo)} onClick={() => aggiungi(1)} className="h-12 rounded-xl border border-accento text-base text-accento disabled:opacity-40">Ricevi</button>
                <button disabled={!leggiMo(importo)} onClick={() => aggiungi(-1)} className="h-12 rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Spendi</button>
              </div>
            </div>
          )}
          <h3 className="mb-1 mt-4 text-base font-medium text-testo">Durante il gioco</h3>
          {lista.length === 0 ? <p className="text-sm text-testo-2">Ancora niente. Il bottino del master arriva qui da solo quando apri il suo link.</p> : (
            <ul className="divide-y divide-bordo">
              {[...lista].reverse().map((m) => (
                <li key={m.id} className="flex min-h-12 items-center gap-2 py-1">
                  <span className="min-w-0 flex-1 text-sm text-testo">{m.nota ?? (m.mo > 0 ? 'Ricevute' : 'Spese')}
                    <span className="block text-xs text-testo-2">{new Date(m.il).toLocaleDateString('it-IT')}</span></span>
                  <span className={`text-base ${m.mo < 0 ? 'text-testo' : 'text-accento'}`}>{m.mo > 0 ? '+' : ''}{mostra(m.mo)}</span>
                  {cambia && <button onClick={() => cambia({ ...bozza, movimenti: lista.filter((x) => x.id !== m.id) })} aria-label="Togli questo movimento" className="h-11 w-11 text-lg text-attenzione">×</button>}
                </li>
              ))}
            </ul>
          )}
        </FoglioDalBasso>
      )}
    </>
  );
}

// ───────── Lato master: nel tavolo ─────────
// Manda il link del bottino (anche dalle ricompense di un incontro, 25/11): null se annullato, altrimenti cosa dire al master
export async function mandaBottino(aTesta: number, nota: string, nomeTavolo: string): Promise<string | null> {
  const b: Bottino = { id: nuovoId(), mo: aTesta, ...(nota.trim() ? { nota: nota.trim() } : {}), ...(nomeTavolo.trim() ? { tavolo: nomeTavolo.trim() } : {}) };
  const url = await creaLinkBottino(b, location.href);
  try {
    if (navigator.share) { await navigator.share({ title: 'Bottino', text: `Bottino: ${prezzo(aTesta)} a testa`, url }); return 'Link del bottino mandato.'; }
    await navigator.clipboard.writeText(url); return 'Link copiato: mandalo al gruppo. Ognuno lo apre e prende la sua parte.';
  } catch { return null; }
}

export function DaiBottino({ nomeTavolo, inGruppo }: { nomeTavolo: string; inGruppo: number }) {
  const [aperto, setAperto] = useState(false);
  const [importo, setImporto] = useState('');
  const [parti, setParti] = useState(String(inGruppo || 4));
  const [nota, setNota] = useState('');
  const [stato, setStato] = useState<string | null>(null);
  const mo = leggiMo(importo), n = Math.max(1, Number(parti) || 1);
  const { aTesta, resto } = dividi(mo, n);
  const manda = async () => { const m = await mandaBottino(aTesta, nota, nomeTavolo); if (m && !navigator.share) setStato(m); };
  return (
    <>
      <button onClick={() => setAperto(true)} className="mt-2 min-h-12 w-full rounded-xl border border-accento text-base text-accento">Dai monete al gruppo</button>
      {aperto && (
        <FoglioDalBasso chiudi={() => setAperto(false)} titolo={<><h2 className="text-lg font-medium text-testo">Bottino</h2><p className="text-sm text-testo-2">Un link solo: ognuno lo apre e prende la sua parte</p></>}>
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Totale in monete d'oro</span>
              <input inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="Es. 150" className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" /></label>
            <label className="flex items-center justify-between text-sm text-testo"><span>Da dividere tra</span>
              <input inputMode="numeric" value={parti} onChange={(e) => setParti(e.target.value.replace(/\D/g, ''))} className="h-11 w-16 rounded-lg border border-bordo bg-sfondo text-center text-base" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-testo">Da dove viene (facoltativo)</span>
              <input value={nota} maxLength={80} onChange={(e) => setNota(e.target.value)} placeholder="Es. Il forziere del capo bandito" className="h-12 w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo" /></label>
            {mo > 0 && <p className="text-base text-testo" aria-live="polite">A testa: <span className="font-medium">{prezzo(aTesta)}</span>{resto > 0 ? ` · avanzano ${prezzo(resto)}` : ''}</p>}
            <button disabled={!aTesta} onClick={() => void manda()} className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Manda il link</button>
            {stato && <p role="status" className="text-sm text-testo">{stato}</p>}
            <p className="text-xs text-testo-2">Lo stesso link non dà monete due volte allo stesso personaggio. Chi non è al tavolo non dovrebbe aprirlo: il link non sa quanti siete.</p>
          </div>
        </FoglioDalBasso>
      )}
    </>
  );
}

// Il giocatore apre il link del bottino: sceglie a quale personaggio vanno le monete
export function BottinoRicevuto({ bottino, voci, dai, rifiuta }: { bottino: Bottino; voci: VoceElenco[]; dai: (pgId: string) => void; rifiuta: () => void }) {
  return (
    <section>
      <p className="text-sm text-testo-2">{bottino.tavolo ? `Dal master del tavolo «${bottino.tavolo}»` : 'Dal tuo master'}</p>
      <h1 className="mb-1 font-titolo text-2xl text-accento">{prezzo(bottino.mo)} a testa</h1>
      {bottino.nota && <p className="mb-3 text-base italic text-testo">{bottino.nota}</p>}
      {voci.length ? (
        <>
          <h2 className="mb-2 mt-4 text-base font-medium text-testo">A chi vanno?</h2>
          <ul className="overflow-hidden rounded-xl border border-bordo">
            {voci.map((v) => (
              <li key={v.id} className="border-b border-bordo last:border-b-0">
                <button onClick={() => dai(v.id)} className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left">
                  <Avatar ritratto={v.ritratto} classe={v.classeId} iniziali={v.iniziali} />
                  <span className="min-w-0"><span className="block truncate text-base text-testo">{v.nome}</span>
                    <span className="block truncate text-sm text-testo-2">{v.specie} · {v.classe}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="mt-3 text-base text-testo">Prima crea il tuo personaggio, poi riapri il link.</p>}
      <button onClick={rifiuta} className="mt-3 h-12 w-full rounded-xl border border-bordo text-base text-testo">Non ora</button>
    </section>
  );
}
