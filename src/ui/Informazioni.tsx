// Informazioni e note legali (sezione 4). Attribuzioni copiate esatte dalla p. 1 dell'SRD 5.2 e dell'SRD 5.2.1 italiano.
// L'SRD chiede di non aggiungere altre attribuzioni a Wizards oltre a quella prevista: per questo la nota «non ufficiale»
// non la nomina. Si può dire «compatibile con la quinta edizione» (SRD p. 1).
import { ATTRIBUZIONE_SRD_52, ATTRIBUZIONE_SRD_521_IT, CREDITI, SEGNALAZIONI_URL } from '../licenza';

export function Informazioni() {
  const titolo = 'mb-1 text-base font-medium text-testo';
  return (
    <section className="space-y-5">
      <h1 className="font-titolo text-2xl text-accento">Informazioni</h1>
      <div>
        <h2 className={titolo}>Crediti</h2>
        <p className="text-sm text-testo">{CREDITI}. App gratuita, per chiunque, compatibile con la quinta edizione.</p>
        <p className="mt-1 text-sm text-testo-2">Illustrazioni, icona e logo DomusDraconis: DomusDraconis. Logo B20 GDR: B20 GDR.</p>
      </div>
      <div>
        <h2 className={titolo}>App non ufficiale</h2>
        <p className="text-sm text-testo">
          È un progetto indipendente e non ufficiale: non è approvato, sponsorizzato né collegato agli editori del gioco.
          Le regole vengono dal System Reference Document con licenza Creative Commons (vedi sotto); i contenuti dei manuali che non sono nell'SRD l'app non li contiene: li inserisce chi possiede il manuale, e restano nel suo telefono.
        </p>
      </div>
      <div>
        <h2 className={titolo}>Modifiche al materiale dell'SRD</h2>
        <p className="text-sm text-testo">Le regole sono riassunte, adattate e in parte riscritte con parole nostre (per esempio le spiegazioni di una riga dei privilegi); i nomi italiani vengono dall'SRD 5.2.1 italiano.</p>
      </div>
      {SEGNALAZIONI_URL && (
        <div>
          <h2 className={titolo}>Segnala un problema</h2>
          <p className="text-sm text-testo">Un calcolo che non torna, una regola sbagliata, un'idea: <a href={SEGNALAZIONI_URL} target="_blank" rel="noopener noreferrer" className="text-accento underline underline-offset-4">scrivila nel modulo</a>. Le leggiamo tutte, ma non possiamo rispondere a ognuna.</p>
        </div>
      )}
      <div>
        <h2 className={titolo}>Privacy: i tuoi dati</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-testo">
          <li><strong>Niente account, niente pubblicità, niente tracciamento</strong>: l'app non usa cookie né strumenti di statistica.</li>
          <li><strong>Nel tuo telefono:</strong> personaggi, tavoli, ritratti e stato della partita restano nella memoria del browser. Non li vediamo. Se cancelli i dati del browser li perdi: scarica la copia di sicurezza da «I miei personaggi».</li>
          <li><strong>Quando li mandi tu:</strong> i link della scheda, del tavolo, degli oggetti e del bottino contengono i dati nel link stesso; li riceve solo chi glieli mandi.</li>
          <li><strong>Il servizio per il tavolo</strong> (solo se usi il tavolo collegato, gli eventi del master o gli oggetti da identificare) passa da Cloudflare, in Europa o altrove. Conserva: le schede del tavolo collegato <strong>cifrate</strong> (la chiave è nel link, il servizio non le legge), per 90 giorni senza uso; gli ultimi 50 eventi del master (danni, cure, condizioni, una nota), per 30 giorni; la chiave di un oggetto sbloccato, per un anno. Nessun nome di persona, nessun indirizzo email.</li>
          <li><strong>Il sito</strong> è ospitato da Vercel, che come ogni hosting registra i dati tecnici delle visite (indirizzo IP, browser) per sicurezza.</li>
        </ul>
      </div>
      <div>
        <h2 className={titolo}>Nessuna garanzia</h2>
        <p className="text-sm text-testo">L'app è fornita così com'è. I calcoli seguono l'SRD, ma l'ultima parola al tavolo spetta al master.</p>
      </div>
      <div>
        <h2 className={titolo}>Licenza dell'SRD</h2>
        <p className="text-sm text-testo-2">{ATTRIBUZIONE_SRD_52}</p>
        <p className="mt-2 text-sm text-testo-2">{ATTRIBUZIONE_SRD_521_IT}</p>
      </div>
    </section>
  );
}
