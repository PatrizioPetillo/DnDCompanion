// Tavolo collegato (23/11).
// Giocatore: ogni personaggio legato a un tavolo con il canale manda da solo la sua scheda (anche mentre la crea), cifrata.
// Master: i suoi tavoli ricevono le schede e le mettono nel gruppo, con un avviso quando arriva qualcuno di nuovo.
import { useEffect, useRef } from 'react';
import { aggiungiAlGruppo, statoDelMembro, tavoli, togliPgDalGruppo, type Archivio } from '../archivio/archivio';
import { daPartita, statoValido } from '../partita/al-tavolo';
import { elementiUsati, type Elementi } from '../creazione/personalizzati';
import { creaLink, leggiLink } from '../esporta/link';
import { DATI } from '../regole/dati';
import { nuoveChiavi } from '../sblocchi/cifra';
import { ascoltaTavolo, inviaScheda, leggiSchede, nuovoToken, tavoliAttivi, testoScheda, type SchedaArrivata } from '../sblocchi/tavolo-canale';

const CHIAVE_INVIATI = 'companion-b20:inviati-al-tavolo';
const inviati = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(CHIAVE_INVIATI) ?? '{}'); } catch { return {}; } };
const segna = (id: string, firma: string) => { try { localStorage.setItem(CHIAVE_INVIATI, JSON.stringify({ ...inviati(), [id]: firma })); } catch { /* niente */ } };

// ───────── Giocatore ─────────
export function useInvioTavolo(archivio: Archivio, setArchivio: (f: (a: Archivio) => Archivio) => void, mieiElementi: Elementi) {
  const ultimo = useRef(archivio);
  ultimo.current = archivio;
  const collegati = archivio.personaggi.filter((p) => p.bozza.tavolo?.canale);
  // firma leggera per capire quando ricontrollare: cambia se cambia una scheda collegata
  const firma = collegati.map((p) => `${p.id}:${p.aggiornato}:${p.invio ? 1 : 0}:${p.canale ? 1 : 0}`).join('|');

  useEffect(() => {
    if (!firma || !tavoliAttivi()) return;
    let annullato = false;
    let riprova: ReturnType<typeof setTimeout> | undefined;
    const invia = async () => {
      let fallito = false;
      for (const p of ultimo.current.personaggi.filter((x) => x.bozza.tavolo?.canale)) {
        if (annullato) return;
        // la prima volta: il token per il tavolo e il segreto per gli eventi dal master
        if (!p.invio || !p.canale) {
          const token = p.invio?.token ?? await nuovoToken();
          const canale = p.canale ?? await (async () => { const k = await nuoveChiavi(); return { segreto: k.segreto, id: k.id }; })();
          setArchivio((a) => ({ ...a, personaggi: a.personaggi.map((x) => (x.id === p.id ? { ...x, invio: { token }, canale } : x)) }));
          return;   // si riparte con i dati salvati
        }
        const url = await creaLink(p.bozza, 'https://x/', elementiUsati(p.bozza, mieiElementi), p.canale.segreto);
        const testo = url.slice(url.indexOf('#'));
        const stato = daPartita(p.partita);          // PF, condizioni e iniziativa per il master (23/11)
        const firmaInvio = `${testo}|${JSON.stringify(stato)}`;
        const chiave = `${p.id}@${p.bozza.tavolo!.canale!.id}`;
        if (inviati()[chiave] === firmaInvio) continue;
        if (await inviaScheda(p.bozza.tavolo!.canale!, p.id, p.invio.token, testo, stato)) segna(chiave, firmaInvio);
        else fallito = true;
      }
      // 24/11: se il servizio dice «troppe richieste» (o la rete cade) si riprova da soli tra 30 secondi
      if (fallito && !annullato) { clearTimeout(riprova); riprova = setTimeout(() => void invia(), 30_000); }
    };
    const t = setTimeout(() => void invia(), 1000);   // aspetta che il giocatore smetta di toccare
    const online = () => void invia();
    window.addEventListener('online', online);
    return () => { annullato = true; clearTimeout(t); clearTimeout(riprova); window.removeEventListener('online', online); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);
}

// ───────── Master ─────────
export function useTavoliCollegati(archivio: Archivio, setArchivio: (f: (a: Archivio) => Archivio) => void, avvisa: (testo: string) => void) {
  const ultimo = useRef(archivio);
  ultimo.current = archivio;
  const miei = tavoli(archivio).filter((t) => t.tavolo.canale?.segreto);
  const chiavi = miei.map((t) => `${t.id}:${t.tavolo.canale!.id}`).sort().join(',');

  useEffect(() => {
    if (!chiavi || !tavoliAttivi()) return;
    const arriva = async (tavoloId: string, s: SchedaArrivata) => {
      const t = tavoli(ultimo.current).find((x) => x.id === tavoloId);
      if (!t?.tavolo.canale) return;
      const membro = (t.gruppo ?? []).find((m) => m.pg === s.pg);
      if (s.via) {
        if (!membro) return;
        setArchivio((a) => togliPgDalGruppo(a, tavoloId, s.pg));
        avvisa(`${membro.bozza.nome.trim() || 'Un personaggio'} ha lasciato «${t.tavolo.nome || 'il tavolo'}».`);
        return;
      }
      if (membro?.il === s.il) return;
      const arrivato = await testoScheda(s, t.tavolo.canale.chiave);
      const r = arrivato ? await leggiLink(arrivato.testo) : null;
      if (!r || 'errore' in r) return;
      const stato = statoValido(arrivato!.stato) ?? undefined;
      setArchivio((a) => statoDelMembro(aggiungiAlGruppo(a, tavoloId, r.bozza, r.elementi, new Date(), r.canale, { pg: s.pg, il: s.il }).archivio, tavoloId, s.pg, stato));
      if (!membro) {
        const classe = r.bozza.classe ? DATI.classi[r.bozza.classe]?.nome : undefined;
        avvisa(`${r.bozza.nome.trim() || 'Un nuovo personaggio'}${classe ? ` (${classe})` : ''} si è unito a «${t.tavolo.nome || 'il tuo tavolo'}».`);
      }
    };
    const controlla = () => {
      for (const t of tavoli(ultimo.current).filter((x) => x.tavolo.canale?.segreto)) {
        void leggiSchede(t.tavolo.canale!.id, t.tavolo.canale!.segreto!).then(async (lista) => {
          for (const s of lista ?? []) await arriva(t.id, s);
        });
      }
    };
    controlla();
    const visibile = () => { if (document.visibilityState === 'visible') controlla(); };
    window.addEventListener('online', controlla);
    document.addEventListener('visibilitychange', visibile);
    const stop = miei.map((t) => ascoltaTavolo(t.tavolo.canale!.id, t.tavolo.canale!.segreto!, (s) => void arriva(t.id, s)));
    return () => { window.removeEventListener('online', controlla); document.removeEventListener('visibilitychange', visibile); stop.forEach((f) => f()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiavi]);
}
