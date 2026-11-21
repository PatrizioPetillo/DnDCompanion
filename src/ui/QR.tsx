// QR di riserva per lo sblocco al tavolo (21/11): il master lo mostra, il giocatore lo inquadra dentro l'app.
import { useEffect, useRef, useState } from 'react';
import { renderSVG } from 'uqr';
import { FoglioDalBasso } from './SchedaIncantesimo';

export function MostraQR({ testo }: { testo: string }) {
  const svg = renderSVG(testo, { border: 2, whiteColor: '#ffffff', blackColor: '#000000' });
  return <div className="mx-auto w-56 overflow-hidden rounded-lg bg-white p-1" role="img" aria-label="QR dello sblocco" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface Rilevatore { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

export function ScannerQR({ chiudi, letto }: { chiudi: () => void; letto: (testo: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const avvisa = useRef(letto);
  useEffect(() => { avvisa.current = letto; }, [letto]);
  useEffect(() => {
    let flusso: MediaStream | null = null, fermo = false, giro = 0;
    const tela = document.createElement('canvas');
    (async () => {
      try {
        flusso = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        setErrore('Non riesco ad aprire la fotocamera: controlla il permesso nelle impostazioni del browser.');
        return;
      }
      const v = video.current!;
      v.srcObject = flusso; await v.play().catch(() => {});
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Rilevatore }).BarcodeDetector;
      const rilevatore = BD ? new BD({ formats: ['qr_code'] }) : null;
      const jsQR = rilevatore ? null : (await import('jsqr')).default;
      const passo = async () => {
        if (fermo) return;
        if (v.readyState >= 2) {
          let t: string | undefined;
          if (rilevatore) t = (await rilevatore.detect(v).catch(() => []))[0]?.rawValue;
          else if (jsQR) {
            tela.width = v.videoWidth; tela.height = v.videoHeight;
            const c = tela.getContext('2d', { willReadFrequently: true })!;
            c.drawImage(v, 0, 0);
            t = jsQR(c.getImageData(0, 0, tela.width, tela.height).data, tela.width, tela.height)?.data;
          }
          if (t) { fermo = true; avvisa.current(t); return; }
        }
        giro = requestAnimationFrame(() => void passo());
      };
      void passo();
    })();
    return () => { fermo = true; cancelAnimationFrame(giro); flusso?.getTracks().forEach((t) => t.stop()); };
  }, []);
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<><h2 className="text-lg font-medium text-testo">Inquadra il QR del master</h2><p className="text-sm text-testo-2">Il master lo apre dall'oggetto, nel suo tavolo</p></>}>
      {errore ? <p role="alert" className="text-base text-attenzione">{errore}</p>
        : <video ref={video} playsInline muted className="aspect-square w-full rounded-xl bg-black object-cover" />}
    </FoglioDalBasso>
  );
}
