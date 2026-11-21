// «Cosa ottieni» della specie (richiesta di Patrizio, 21/11): come per la classe, toccando una specie si apre
// la descrizione dei suoi tratti. Righe scritte da noi dall'SRD 5.2 (p. 84-86, verificate il 21/11), in metri.
// Le specie personalizzate mostrano i loro tratti con la nota che l'utente ha scritto.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import type { Id } from '../regole/tipi';

export interface RigaTratto { nome: string; testo: string; pagina?: number }

const SCURO = (m: string) => `Entro ${m} vedi nella luce fioca come in piena luce e nel buio come in luce fioca, ma senza distinguere i colori.`;

// Una riga per tratto, per id (gli id della Scurovisione cambiano per specie: la distanza è diversa)
const TRATTI: Record<Id, string> = {
  'breath-weapon': 'Quando fai l\'azione Attacco puoi sostituire un attacco con un soffio: un cono di 4,5 m o una linea di 9 m (larga 1,5 m), a tua scelta. Chi è nell\'area fa un tiro salvezza su Destrezza (CD 8 + Costituzione + competenza): subisce 1d10 danni del tipo del tuo antenato, la metà se lo supera. Usi pari alla competenza, tornano con un riposo lungo.',
  'dragonborn-darkvision': SCURO('18 m'),
  'dwarf-darkvision': SCURO('36 m'),
  'dwarven-resilience': 'Resistenza ai danni da veleno, e vantaggio ai tiri salvezza per evitare o far finire la condizione Avvelenato.',
  'dwarven-toughness': '+1 ai PF massimi, e un altro +1 ogni volta che sali di livello.',
  'stonecunning': 'Con un\'azione bonus ottieni percezione tellurica entro 18 m per 10 minuti, se stai toccando della pietra (naturale o lavorata): senti le creature che si muovono a contatto con il suolo. Usi pari alla competenza, tornano con un riposo lungo.',
  'elf-darkvision': SCURO('18 m'),
  'elven-lineage': 'Scegli la stirpe: drow (scurovisione fino a 36 m e il trucchetto Luci danzanti), elfo alto (Prestidigitazione, che dopo ogni riposo lungo puoi cambiare con un altro trucchetto del mago) o elfo dei boschi (velocità 10,5 m e Artificio druidico). Scegli anche la caratteristica per questi incantesimi: Intelligenza, Saggezza o Carisma. Ai livelli 3 e 5 la stirpe ti dà un incantesimo in più.',
  'fey-ancestry': 'Vantaggio ai tiri salvezza per evitare o far finire la condizione Affascinato.',
  'keen-senses': 'Competenza in un\'abilità a scelta tra Intuizione, Percezione e Sopravvivenza.',
  'trance': 'Non hai bisogno di dormire e la magia non può addormentarti. Completi un riposo lungo in 4 ore di meditazione, restando cosciente.',
  'gnome-darkvision': SCURO('18 m'),
  'gnomish-cunning': 'Vantaggio ai tiri salvezza su Intelligenza, Saggezza e Carisma: resisti bene a molti incantesimi che colpiscono la mente.',
  'gnomish-lineage': 'Scegli la stirpe: gnomo delle foreste (il trucchetto Illusione minore e Parlare con gli animali sempre preparato, gratis tante volte quanto la tua competenza per riposo lungo) o gnomo delle rocce (Riparare e Prestidigitazione; in 10 minuti costruisci un piccolo congegno a molla che riproduce un effetto di Prestidigitazione, fino a tre alla volta, che durano 8 ore). La caratteristica per questi incantesimi è a scelta: Intelligenza, Saggezza o Carisma.',
  'powerful-build': 'Vantaggio alle prove per liberarti dalla condizione Afferrato, e per il carico che puoi portare conti come una taglia più grande.',
  'brave': 'Vantaggio ai tiri salvezza per evitare o far finire la condizione Spaventato.',
  'halfling-nimbleness': 'Puoi attraversare lo spazio di una creatura più grande di te, ma non fermarti lì.',
  'luck': 'Quando tiri un 1 sul d20 di una prova, di un tiro per colpire o di un tiro salvezza, puoi ritirare il dado: devi tenere il nuovo risultato.',
  'naturally-stealthy': 'Puoi fare l\'azione Nascondersi anche quando ti copre solo una creatura più grande di te.',
  'resourceful': 'Ottieni l\'Ispirazione eroica alla fine di ogni riposo lungo: un dado da ritirare ogni giorno.',
  'skillful': 'Competenza in un\'abilità a tua scelta.',
  'versatile': 'Un talento Origini a tua scelta (l\'SRD consiglia Abile: tre competenze in più).',
  'adrenaline-rush': 'Puoi fare l\'azione Scatto come azione bonus; quando lo fai ottieni PF temporanei pari alla tua competenza. Usi pari alla competenza, tornano con un riposo breve o lungo.',
  'orc-darkvision': SCURO('36 m'),
  'relentless-endurance': 'Quando scendi a 0 PF senza morire sul colpo, puoi restare a 1 PF. Una volta per riposo lungo.',
  'tiefling-darkvision': SCURO('18 m'),
  'fiendish-legacy': 'Scegli il retaggio: abissale (resistenza ai danni da veleno e il trucchetto Spruzzo velenoso), ctonio (resistenza ai danni necrotici e Tocco gelido) o infernale (resistenza ai danni da fuoco e Dardo di fuoco). Scegli anche la caratteristica per questi incantesimi: Intelligenza, Saggezza o Carisma. Ai livelli 3 e 5 il retaggio ti dà un incantesimo in più.',
};

// Le scelte che nei dati stanno nei «lignaggi» e non hanno un tratto con lo stesso nome
const LIGNAGGI: Record<Id, RigaTratto> = {
  dragonborn: { nome: 'Discendenza draconica', pagina: 84, testo: 'Scegli il drago da cui discendi: il colore decide il tipo di danno del Soffio e ti dà resistenza a quel danno (per esempio rosso, oro e ottone: fuoco; blu e bronzo: fulmine; bianco e argento: freddo).' },
  goliath: { nome: 'Discendenza gigantica', pagina: 85, testo: 'Scegli un dono dei giganti, da usare tante volte quanto la tua competenza per riposo lungo. Salta-nuvole: con un\'azione bonus ti teletrasporti fino a 9 m. Fuoco bruciante: +1d10 danni da fuoco quando colpisci. Brivido gelante: +1d6 danni da freddo quando colpisci, e il bersaglio perde 3 m di velocità. Forza della collina: quando colpisci una creatura Grande o più piccola, la fai cadere prona. Resistenza della pietra: con la reazione riduci i danni subiti di 1d12 + Costituzione. Tuono tempestoso: con la reazione infliggi 1d8 danni da tuono a chi ti ha ferito entro 18 m.' },
};

const EXTRA: Record<Id, RigaTratto[]> = {
  tiefling: [{ nome: 'Presenza ultraterrena', pagina: 86, testo: 'Conosci il trucchetto Taumaturgia, con la stessa caratteristica del Retaggio immondo.' }],
};

export function cosaOttieniSpecie(specieId: Id, d: Dati = DATI): RigaTratto[] {
  const sp = d.specie[specieId];
  if (!sp) return [];
  const righe: RigaTratto[] = [];
  if (LIGNAGGI[specieId]) righe.push(LIGNAGGI[specieId]);
  for (const t of sp.tratti) {
    const nota = t.effetti?.find((e) => e.tipo === 'nota') as { testo?: string } | undefined;
    const testo = TRATTI[t.id] ?? nota?.testo;
    if (testo) righe.push({ nome: t.nome, testo, pagina: sp.personalizzato ? undefined : t.srd?.pagina });
  }
  righe.push(...(EXTRA[specieId] ?? []));
  return righe;
}

export const TRATTI_DESCRITTI = Object.keys(TRATTI);
