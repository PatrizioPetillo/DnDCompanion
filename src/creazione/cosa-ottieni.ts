// «Cosa ottieni al livello 1» nella scheda della classe (richiesta di Patrizio, 19/11): chi inizia vede cosa gli dà
// ogni classe prima di sceglierla. Competenze e magia vengono dai dati; i privilegi hanno una riga scritta da noi,
// verificata sull'SRD 5.2 (pagina accanto). Al livello 1 le classi non danno bonus alle caratteristiche
// (li dà il background) né talenti, tranne lo Stile di combattimento del guerriero.
import { DATI, type Dati } from '../regole/dati';
import { ABILITA, NOME_CAR } from '../regole/dati/base';
import type { ConcessioneMagia, Id } from '../regole/tipi';

export interface Privilegio { nome: string; riga: string; pagina: number }

// Le righe dei privilegi di livello 1, dall'SRD 5.2 (la magia è descritta a parte, dai dati)
export const PRIVILEGI_LIVELLO_1: Record<Id, Privilegio[]> = {
  barbarian: [
    { nome: 'Ira', pagina: 28, riga: 'Azione bonus, senza armatura pesante: resisti ai danni contundenti, perforanti e taglienti, +2 ai danni con la Forza, vantaggio alle prove e ai tiri salvezza di Forza; niente incantesimi. 2 volte: una torna con il riposo breve, tutte con il lungo.' },
    { nome: 'Difesa senza armatura', pagina: 29, riga: 'Senza armatura la tua CA è 10 + Destrezza + Costituzione, anche con lo scudo.' },
    { nome: 'Padronanza d\'armi', pagina: 29, riga: 'Usi le proprietà speciali (padronanza) di 2 tipi di armi da mischia a scelta.' },
  ],
  bard: [
    { nome: 'Ispirazione bardica', pagina: 31, riga: 'Azione bonus: dai un d6 a un alleato entro 18 m; nell\'ora seguente lo aggiunge a un d20 fallito. Tante volte quanto il tuo modificatore di Carisma (minimo 1), tornano con il riposo lungo.' },
  ],
  cleric: [
    { nome: 'Ordine divino', pagina: 37, riga: 'Scegli: Protettore (armi da guerra e armature pesanti) o Taumaturgo (un trucchetto in più e un bonus ad Arcano e Religione pari alla tua Saggezza).' },
  ],
  druid: [
    { nome: 'Druidico', pagina: 42, riga: 'Conosci il Druidico, la lingua segreta dei druidi, e hai sempre preparato Parlare con gli animali.' },
    { nome: 'Ordine primordiale', pagina: 42, riga: 'Scegli: Mago (un trucchetto in più e un bonus ad Arcano e Natura pari alla tua Saggezza) o Custode (armi da guerra e armature medie).' },
  ],
  fighter: [
    { nome: 'Stile di combattimento', pagina: 47, riga: 'Un talento di stile a scelta: Difesa (+1 alla CA con l\'armatura, consigliato), Tiro, Combattere con armi possenti o con due armi.' },
    { nome: 'Recuperare energie', pagina: 48, riga: 'Azione bonus: recuperi 1d10 + 1 PF. 2 volte: una torna con il riposo breve, tutte con il lungo.' },
    { nome: 'Padronanza d\'armi', pagina: 48, riga: 'Usi le proprietà speciali (padronanza) di 3 tipi di armi a scelta.' },
  ],
  monk: [
    { nome: 'Arti marziali', pagina: 50, riga: 'Senza armatura né scudo, a mani nude o con armi da monaco: un colpo senz\'armi come azione bonus, un d6 al posto del danno normale e la Destrezza al posto della Forza.' },
    { nome: 'Difesa senza armatura', pagina: 50, riga: 'Senza armatura né scudo la tua CA è 10 + Destrezza + Saggezza.' },
  ],
  paladin: [
    { nome: 'Imposizione delle mani', pagina: 53, riga: 'Una riserva di 5 PF da curare con un tocco (azione bonus); con 5 punti togli invece la condizione Avvelenato. Torna con il riposo lungo.' },
    { nome: 'Padronanza d\'armi', pagina: 54, riga: 'Usi le proprietà speciali (padronanza) di 2 tipi di armi a scelta.' },
  ],
  ranger: [
    { nome: 'Nemico prescelto', pagina: 58, riga: 'Hai sempre preparato Marchio del cacciatore e lo lanci 2 volte senza slot; tornano con il riposo lungo.' },
    { nome: 'Padronanza d\'armi', pagina: 58, riga: 'Usi le proprietà speciali (padronanza) di 2 tipi di armi a scelta.' },
  ],
  rogue: [
    { nome: 'Maestria', pagina: 61, riga: 'Raddoppi il bonus di competenza in 2 abilità che hai (consigliate Rapidità di mano e Furtività).' },
    { nome: 'Attacco furtivo', pagina: 61, riga: 'Una volta per turno +1d6 ai danni con un\'arma accurata o a distanza, se hai vantaggio o se un alleato è accanto al bersaglio.' },
    { nome: 'Gergo ladresco', pagina: 62, riga: 'Conosci il gergo dei ladri e una lingua in più a scelta.' },
    { nome: 'Padronanza d\'armi', pagina: 62, riga: 'Usi le proprietà speciali (padronanza) di 2 tipi di armi a scelta.' },
  ],
  sorcerer: [
    { nome: 'Stregoneria innata', pagina: 65, riga: 'Azione bonus, per 1 minuto: +1 alla CD dei tuoi incantesimi da stregone e vantaggio ai loro tiri per colpire. 2 volte, tornano con il riposo lungo.' },
  ],
  warlock: [
    { nome: 'Suppliche occulte', pagina: 70, riga: 'Un potere occulto a scelta, per esempio il Patto del tomo o l\'Armatura delle ombre.' },
  ],
  wizard: [
    { nome: 'Adepto dei rituali', pagina: 78, riga: 'Lanci come rituale gli incantesimi rituali del tuo libro, anche senza averli preparati.' },
    { nome: 'Recupero arcano', pagina: 78, riga: 'Dopo un riposo breve recuperi uno slot di 1° livello; una volta per riposo lungo.' },
  ],
};

const PAGINA_INCANTESIMI: Record<Id, number> = { bard: 32, cleric: 36, druid: 41, paladin: 54, ranger: 57, sorcerer: 64, warlock: 71, wizard: 77 };
const CON_ARTICOLO: Record<string, string> = { Intelligenza: "l'Intelligenza", Saggezza: 'la Saggezza', Carisma: 'il Carisma' };
const NOME_ARMI: Record<string, string> = { semplici: 'semplici', marziali: 'da guerra', marzialiLeggere: 'da guerra leggere', marzialiAccurateOLeggere: 'da guerra accurate o leggere' };
const NOME_ARMATURE: Record<string, string> = { leggera: 'leggere', media: 'medie', pesante: 'pesanti', scudo: 'scudo' };

export interface CosaOttieni {
  tiriSalvezza: string;
  armature: string;
  armi: string;
  abilita: string;
  magia?: Privilegio;
  privilegi: Privilegio[];
}

export function cosaOttieni(classeId: Id, d: Dati = DATI): CosaOttieni {
  const c = d.classi[classeId];
  const qa = c.abilita.quantita;
  const tutte = (c.abilita.opzioni?.length ?? 0) >= Object.keys(ABILITA).length;
  const abilita = tutte ? `${qa} a scelta, tra tutte` : `${qa} a scelta tra ${(c.abilita.opzioni ?? []).map((a) => ABILITA[a]?.nome ?? a).sort((x, y) => x.localeCompare(y, 'it')).join(', ')}`;
  // La magia della classe, dalla sua concessione (non quella delle suppliche)
  const conc = c.features.flatMap((f) => f.effetti).find((e): e is { tipo: 'magia'; concessione: ConcessioneMagia } =>
    e.tipo === 'magia' && e.concessione.id === classeId)?.concessione;
  let magia: Privilegio | undefined;
  if (conc) {
    const car = typeof conc.caratteristica === 'string' ? NOME_CAR[conc.caratteristica] : 'a scelta';
    const parti: string[] = [];
    const t = typeof conc.trucchetti?.quantita === 'number' ? conc.trucchetti.quantita : 0;
    if (t) parti.push(`${t} trucchetti`);
    if (conc.libro) parti.push(`un libro con ${conc.libro.iniziali} incantesimi`);
    const p = conc.preparati?.numero;
    if (typeof p === 'number') parti.push(`${p} incantesimi preparati`);
    if (c.patto?.[1]) parti.push(`${c.patto[1].numero} slot del patto, che torna anche con il riposo breve`);
    else if (c.slot?.[1]) parti.push(`${c.slot[1][0]} slot di 1° livello`);
    magia = { nome: classeId === 'warlock' ? 'Magia del patto' : 'Incantesimi', pagina: PAGINA_INCANTESIMI[classeId] ?? 0,
      riga: `Usi la magia con ${CON_ARTICOLO[car] ?? 'una caratteristica a scelta'}: ${parti.join(', ')}.` };
  }
  return {
    tiriSalvezza: c.tiriSalvezza.map((x) => NOME_CAR[x]).join(' e '),
    armature: c.addestramentoArmature.length ? c.addestramentoArmature.map((a) => NOME_ARMATURE[a] ?? a).join(', ') : 'nessuna',
    armi: c.addestramentoArmi.map((a) => NOME_ARMI[a] ?? a).join(', '),
    abilita, magia, privilegi: PRIVILEGI_LIVELLO_1[classeId] ?? [],
  };
}
