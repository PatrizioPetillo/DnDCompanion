// Tiene d'occhio gli oggetti da identificare di tutti i personaggi: quando il master sblocca, il testo si scopre da solo.
import { useEffect, useRef } from 'react';
import { oggettiVelati, sostituisciOggetto, type Archivio } from '../archivio/archivio';
import { svela } from '../regole/oggetti-magici';
import { ascoltaSblocco, cercaSblocco, servizioAttivo, svelaVelo } from '../sblocchi/servizio';

// Applica una chiave (dal servizio o dal QR): vero se ha scoperto almeno un oggetto
export async function applicaChiave(a: Archivio, id: string, chiave: string): Promise<{ archivio: Archivio; nomi: string[] }> {
  let archivio = a; const nomi: string[] = [];
  for (const v of oggettiVelati(a).filter((x) => x.velo.sblocco === id)) {
    const s = await svelaVelo(v.velo, chiave);
    if (!s) continue;
    const o = archivio.personaggi.find((p) => p.id === v.pgId)?.bozza.oggettiMagici?.find((x) => x.uid === v.uid);
    if (!o) continue;
    archivio = sostituisciOggetto(archivio, v.pgId, svela(o, s));
    nomi.push(s.nome);
  }
  return { archivio, nomi };
}

export function useSblocchi(archivio: Archivio, setArchivio: (f: (a: Archivio) => Archivio) => void, avvisa: (testo: string) => void) {
  const ultimo = useRef(archivio);
  ultimo.current = archivio;
  const velati = oggettiVelati(archivio);
  const ids = [...new Set(velati.map((v) => v.velo.sblocco))].sort().join(',');

  useEffect(() => {
    if (!ids || !servizioAttivo()) return;
    const lista = ids.split(',');
    const arrivata = async (id: string, chiave: string) => {
      const r = await applicaChiave(ultimo.current, id, chiave);
      if (!r.nomi.length) return;
      setArchivio(() => r.archivio);
      avvisa(`Identificato: ${r.nomi.join(', ')}. Lo trovi nello Zaino.`);
    };
    const controlla = () => lista.forEach((id) => void cercaSblocco(id).then((k) => { if (k) void arrivata(id, k); }));
    controlla();
    const visibile = () => { if (document.visibilityState === 'visible') controlla(); };
    window.addEventListener('online', controlla);
    document.addEventListener('visibilitychange', visibile);
    const stop = lista.map((id) => ascoltaSblocco(id, (k) => void arrivata(id, k)));
    return () => { window.removeEventListener('online', controlla); document.removeEventListener('visibilitychange', visibile); stop.forEach((f) => f()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}

