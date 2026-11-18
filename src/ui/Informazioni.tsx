// Informazioni (sezione 4): attribuzione obbligatoria dell'SRD, copiata esatta dalla p. 1, e dove stanno i dati.
import { ATTRIBUZIONE_SRD_52, ATTRIBUZIONE_SRD_521_IT, CREDITI } from '../licenza';

export function Informazioni() {
  return (
    <section className="space-y-4">
      <h1 className="font-titolo text-2xl text-accento">Informazioni</h1>
      <p className="text-base text-testo">{CREDITI}. Gratuita, senza account: i personaggi restano nel tuo telefono.</p>
      <div>
        <h2 className="mb-1 text-base font-medium text-testo">I tuoi dati</h2>
        <p className="text-sm text-testo">Niente server e niente account. Se cancelli i dati del browser perdi i personaggi: scarica una copia JSON dal riepilogo di ognuno.</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-medium text-testo">Licenza</h2>
        <p className="text-sm text-testo-2">{ATTRIBUZIONE_SRD_52}</p>
        <p className="mt-2 text-sm text-testo-2">{ATTRIBUZIONE_SRD_521_IT}</p>
      </div>
    </section>
  );
}
