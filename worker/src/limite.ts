// Limite delle richieste (24/11, numeri scelti da Patrizio): per ogni tavolo, canale o oggetto
// al massimo 60 richieste al minuto e 3.000 al giorno. Un tavolo vero ne fa 2-3 al minuto;
// il limite ferma solo un tavolo impazzito (errore o abuso) prima che consumi la quota gratuita di Cloudflare
// (100.000 richieste e 100.000 scritture al giorno per tutti; oltre, il servizio si ferma fino a mezzanotte UTC).
// Il conto del minuto sta in memoria; quello del giorno si salva ogni 20 richieste (una scrittura in più ogni 20).
export const PER_MINUTO = 60;
export const PER_GIORNO = 3000;

interface Memoria { get<T>(k: string): Promise<T | undefined>; put<T>(k: string, v: T): Promise<void> }

export class Limite {
  private minuto = 0;
  private inizioMinuto = 0;
  private giorno = '';
  private oggi = 0;
  private caricato = false;
  constructor(private memoria: Memoria, private adesso: () => number = Date.now) {}

  // null = passa; altrimenti i secondi da aspettare
  async attesa(): Promise<number | null> {
    const ora = this.adesso();
    const g = new Date(ora).toISOString().slice(0, 10);
    if (!this.caricato) {
      const x = await this.memoria.get<{ g: string; n: number }>('limite');
      if (x?.g === g) { this.giorno = g; this.oggi = x.n; }
      this.caricato = true;
    }
    if (this.giorno !== g) { this.giorno = g; this.oggi = 0; }
    if (ora - this.inizioMinuto >= 60_000) { this.inizioMinuto = ora; this.minuto = 0; }
    if (this.oggi >= PER_GIORNO) return Math.ceil((Date.parse(`${g}T00:00:00Z`) + 86_400_000 - ora) / 1000);
    if (this.minuto >= PER_MINUTO) return Math.max(1, Math.ceil((this.inizioMinuto + 60_000 - ora) / 1000));
    this.minuto++;
    this.oggi++;
    if (this.oggi % 20 === 0) await this.memoria.put('limite', { g, n: this.oggi });
    return null;
  }
}
