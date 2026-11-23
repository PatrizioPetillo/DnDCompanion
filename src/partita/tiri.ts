// Cosa si tira, dalla scheda (idea 6, 23/11): un tiro con il d20 (per colpire, prova, tiro salvezza, iniziativa)
// e/o i danni o le cure. La finestra dei dadi (ui/Tiro.tsx) mostra e tira; qui solo i dati, per i test.
import { DATI } from '../regole';
import { NOME_CAR } from '../regole/dati/base';
import { dadiAlLivello, raggi } from '../regole/dati/dadi-incantesimi';
import type { Attacco, Car, Id, MagiaCalcolata } from '../regole/tipi';
import type { GenereTiro } from './condizioni';
import { conSlot, leggi, scrivi, type Espressione } from './dadi';

export interface Danni { etichetta: string; espressione: Espressione; tipo?: string; ripeti?: number; cura?: boolean; temporanei?: boolean }
export interface RichiestaTiro {
  titolo: string;
  sottotitolo?: string;
  d20?: { bonus: number; genere: GenereTiro; attacco: boolean; etichetta: string; svantaggio?: string };   // svantaggio dalla scheda (armatura e Furtività)
  cd?: { valore: number; car: Car };      // l'incantesimo chiede un tiro salvezza al bersaglio: tira il master o il bersaglio
  danni: Danni[];                         // più di una voce: per esempio un'arma versatile a una o a due mani
  nota?: string;
}

const conMod = (dadi: string, mod: number) => leggi(`${dadi}${mod ? (mod > 0 ? ` + ${mod}` : ` - ${-mod}`) : ''}`);
const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);

export function daAttacco(a: Attacco): RichiestaTiro {
  const danni: Danni[] = [];
  const e = conMod(a.danni.dadi, a.danni.mod);
  if (e) danni.push({ etichetta: a.danni.dadiDueMani ? 'A una mano' : 'Danni', espressione: e, tipo: a.danni.tipo });
  const e2 = a.danni.dadiDueMani ? conMod(a.danni.dadiDueMani, a.danni.mod) : null;
  if (e2) danni.push({ etichetta: 'A due mani', espressione: e2, tipo: a.danni.tipo });
  return {
    titolo: a.nome, sottotitolo: a.gittata ? 'Attacco a distanza' : 'Attacco in mischia',
    d20: { bonus: a.colpire.totale, genere: 'attacco', attacco: true, etichetta: `Tiro per colpire ${segno(a.colpire.totale)}` },
    danni, ...(a.note.length ? { nota: a.note.join(' ') } : {}),
  };
}

// Un incantesimo con i suoi dadi: trucchetto o di 1° con lo slot scelto (livelloSlot ≥ livello dell'incantesimo)
// bonusDanni: aggiunte ai danni di un trucchetto (Deflagrazione agonizzante, 23/11)
// livelloPg: livello del personaggio, per il Trucchetto potenziato (5°, 11°, 17°)
export function daIncantesimo(id: Id, m: MagiaCalcolata, modCar: number, livelloSlot?: number, bonusDanni = 0, livelloPg = 1): RichiestaTiro | null {
  const i = DATI.incantesimi[id];
  const d = dadiAlLivello(id, livelloPg);
  if (!i || !d) return null;
  const sopra = Math.max(0, (livelloSlot ?? i.livello) - i.livello);
  const danni: Danni[] = [];
  let nota = d.nota;
  // Deflagrazione occulta: un tiro per colpire per raggio (2 raggi dal 5° livello)
  if (id === 'scorching-ray') nota = `${3 + sopra} raggi: questo è un raggio, tira di nuovo per ognuno degli altri (anche su bersagli diversi).`;
  if (raggi(id, livelloPg) > 1) nota = `${raggi(id, livelloPg)} raggi: questo è un raggio, tira di nuovo per ognuno degli altri (anche su bersagli diversi).`;
  if (id === 'magic-missile') {
    // Ogni dardo fa 1d4 + 1; uno in più per ogni livello di slot sopra il 1° (SRD 5.2)
    danni.push({ etichetta: 'Ogni dardo', espressione: leggi('1d4 + 1')!, tipo: d.tipo, ripeti: 3 + sopra });
    nota = 'I dardi colpiscono tutti insieme, anche creature diverse.';
  } else {
    const base = conSlot(d.dadi, id === 'ice-knife' ? undefined : d.perSlot, sopra);
    if (base) {
      const e = { ...base, piu: base.piu + (d.piuMod ? modCar : 0) + bonusDanni };
      danni.push({ etichetta: d.cura ? 'Cura' : d.temporanei ? 'PF temporanei' : 'Danni', espressione: e, ...(d.tipo ? { tipo: d.tipo } : {}),
        ...(d.cura ? { cura: true } : {}), ...(d.temporanei ? { temporanei: true } : {}) });
    }
    if (id === 'ice-knife') danni.push({ etichetta: 'Esplosione di freddo', espressione: conSlot('2d6', '+1d6', sopra)!, tipo: 'freddo' });
  }
  if (!danni.length) return null;
  const attacco = i.tiro?.tipo === 'attacco' && m.attacco;
  const ts = i.tiro?.tipo === 'ts' && m.cd ? { valore: m.cd.totale, car: i.tiro.car as Car } : undefined;
  return {
    titolo: i.nome, sottotitolo: i.livello === 0 ? 'Trucchetto' : livelloSlot ? `Slot di ${livelloSlot}°` : `${i.livello}° livello, senza slot`,
    ...(attacco ? { d20: { bonus: m.attacco!.totale, genere: 'attacco' as const, attacco: true, etichetta: `Attacco con incantesimo ${segno(m.attacco!.totale)}` } } : {}),
    ...(ts ? { cd: ts } : {}), danni, ...(nota ? { nota } : {}),
  };
}

export const daProva = (nome: string, bonus: number, svantaggio?: string): RichiestaTiro =>
  ({ titolo: nome, sottotitolo: 'Prova', d20: { bonus, genere: 'prova', attacco: false, etichetta: `${nome} ${segno(bonus)}`, ...(svantaggio ? { svantaggio } : {}) }, danni: [] });
export const daTiroSalvezza = (car: Car, bonus: number): RichiestaTiro =>
  ({ titolo: `Tiro salvezza su ${NOME_CAR[car]}`, d20: { bonus, genere: { ts: car }, attacco: false, etichetta: `${NOME_CAR[car]} ${segno(bonus)}` }, danni: [] });
export const daIniziativa = (bonus: number): RichiestaTiro =>
  ({ titolo: 'Iniziativa', sottotitolo: 'Prova di Destrezza (SRD p. 13)', d20: { bonus, genere: 'iniziativa', attacco: false, etichetta: `Iniziativa ${segno(bonus)}` }, danni: [] });

export const testoEspressione = scrivi;
