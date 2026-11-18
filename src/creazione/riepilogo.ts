// Passo 8: Riepilogo (sezione 5.2 e 5.4). La scheda completa divisa in 5 schede (Combattimento, Abilità, Magia,
// Zaino, Chi è), gli avvisi da accettare e l'esportazione in JSON. TypeScript puro: l'interfaccia lo mostra e basta.
import { comePersonaggio, PASSI, statoPassi, type Bozza, type IdPasso } from './percorso';
import { quanti, type Elementi } from './personalizzati';
import { calcolaScheda } from '../regole/motore';
import { DATI, type Dati } from '../regole/dati';
import { ABILITA, ALLINEAMENTI, NOME_CAR, NOME_LINGUA } from '../regole/dati/base';
import { metri } from '../regole/misure';
import { DADI_INCANTESIMI, testoDadi } from '../regole/dati/dadi-incantesimi';
import { CARATTERISTICHE, type Avviso, type Car, type Effetto, type Id, type Numero, type Risorsa, type Scheda } from '../regole/tipi';

const segno = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`);
const ORDINALE = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°'];

export function recupero(r: Risorsa['recupero']): string {
  const breve = r.find((x) => x.riposo === 'breve');
  if (breve) return breve.quanti === 'tutti' ? 'tornano con il riposo breve o lungo' : `${breve.quanti} torna con il riposo breve, tutti con il lungo`;
  return 'tornano con il riposo lungo';
}

export interface Riepilogo {
  testata: { nome: string; descrizione: string };                 // «Travis Whippletorn» · «Mago 1 · Umano · Accolito · Neutrale buono»
  combattimento: {
    numeri: { id: string; etichetta: string; valore: string; somma?: Numero }[];
    tiriSalvezza: { car: Car; nome: string; valore: string; competente: boolean }[];
    attacchi: Scheda['attacchi'];
    trucchetti: { id: Id; nome: string; fonte: string; tiro: string; dadi: string; nota?: string }[];   // trucchetti che fanno danni
    risorse: { nome: string; usi: number; recupero: string; dettaglio?: string }[];
    altro: string[];                                               // resistenze, valori di classe, CD speciali
  };
  abilita: { car: Car; nome: string; punteggio: number; mod: string; voci: { id: Id; nome: string; valore: string; competente: boolean; maestria: boolean }[] }[];
  magia: {
    fonti: { id: Id; nome: string; cd: number | null; attacco: string | null; trucchetti: string[]; incantesimi: string[]; lanciGratuiti?: string; note: string[] }[];
    slot: string[];
  };
  zaino: { monete: Numero; inventario: Scheda['inventario'] };
  chiE: { righe: { etichetta: string; valore: string }[]; privilegi: string[] };
}

export function riepilogo(b: Bozza, d: Dati = DATI): Riepilogo | null {
  const pg = comePersonaggio(b);
  if (!pg) return null;
  const s = calcolaScheda(pg, d);
  const classe = d.classi[pg.classe], specie = d.specie[pg.specie], bg = d.background[pg.background];
  const lignaggio = specie.lignaggi?.opzioni.find((o) => o.id === pg.scelte[specie.lignaggi!.scelta]?.[0]);
  const nomeSpecie = lignaggio ? lignaggio.nome : specie.nome;
  const nomeInc = (id: Id) => d.incantesimi[id]?.nome ?? id;
  const ca = s.ca.formule.find((f) => f.id === s.ca.migliore)!;

  const altro: string[] = [
    ...s.resistenze.map((r) => `Resistenza: ${r}`),
    ...Object.entries(s.valoriClasse).map(([id, v]) => `${classe.features.flatMap((f) => f.effetti).find((e): e is Extract<Effetto, { tipo: 'valoreClasse' }> => e.tipo === 'valoreClasse' && e.id === id)?.nome ?? id}: ${v}`),
    ...s.cdSpeciali.map((c) => `${c.nome}: CD ${c.cd.totale}`),
  ];

  return {
    testata: {
      nome: pg.nome.trim() || 'Senza nome',
      descrizione: [`${classe.nome} ${pg.livello}`, nomeSpecie, bg.nome, pg.allineamento ? ALLINEAMENTI[pg.allineamento]?.nome : undefined].filter(Boolean).join(' · '),
    },
    combattimento: {
      numeri: [
        { id: 'ca', etichetta: 'Classe Armatura', valore: String(ca.valore.totale), somma: ca.valore },
        { id: 'pf', etichetta: 'Punti ferita', valore: String(s.pf.totale), somma: s.pf },
        { id: 'iniziativa', etichetta: 'Iniziativa', valore: segno(s.iniziativa.totale), somma: s.iniziativa },
        { id: 'velocita', etichetta: 'Velocità', valore: metri(s.velocita) },
        { id: 'competenza', etichetta: 'Competenza', valore: segno(s.competenza) },
        { id: 'percezione', etichetta: 'Percezione passiva', valore: String(s.percezionePassiva) },
      ],
      tiriSalvezza: CARATTERISTICHE.map((c) => ({ car: c, nome: NOME_CAR[c], valore: segno(s.tiriSalvezza[c].totale), competente: s.tiriSalvezza[c].competente })),
      attacchi: s.attacchi,
      trucchetti: s.magia.flatMap((m) => m.trucchetti.scelti.filter((t) => DADI_INCANTESIMI[t]).map((t) => {
        const i = d.incantesimi[t];
        const modCar = m.caratteristica ? s.modificatori[m.caratteristica] : 0;
        const tiro = i.tiro?.tipo === 'attacco' ? `${segno(m.attacco?.totale ?? 0)} per colpire`
          : i.tiro?.tipo === 'ts' ? `TS ${NOME_CAR[i.tiro.car]} CD ${m.cd?.totale}` : 'colpisce sempre';
        return { id: `${m.id}:${t}`, nome: i.nome, fonte: m.nome, tiro, dadi: testoDadi(t, modCar)!, ...(DADI_INCANTESIMI[t].nota ? { nota: DADI_INCANTESIMI[t].nota } : {}) };
      })),
      risorse: s.risorse.map((r) => ({ nome: r.nome, usi: r.usi, recupero: recupero(r.recupero), ...(r.dettaglio ? { dettaglio: r.dettaglio } : {}) })),
      altro,
    },
    abilita: CARATTERISTICHE.map((c) => ({
      car: c, nome: NOME_CAR[c], punteggio: s.punteggi[c].totale, mod: segno(s.modificatori[c]),
      voci: Object.entries(ABILITA).filter(([, a]) => a.car === c).map(([id, a]) => ({
        id, nome: a.nome, valore: segno(s.abilita[id].totale), competente: s.abilita[id].competente, maestria: s.abilita[id].maestria,
      })),
    })),
    magia: {
      fonti: [...s.magia].sort((a, b) => Number(b.fonte.tipo === 'classe') - Number(a.fonte.tipo === 'classe')).map((m) => {   // la classe per prima
        const preparati = m.preparati?.scelti ?? [];
        const incantesimi = [...new Set([...m.semprePreparati, ...preparati])].map((id) => `${nomeInc(id)}${m.semprePreparati.includes(id) ? ' (sempre preparato)' : ''}`);
        const note: string[] = [];
        if (m.libro) note.push(`Nel libro: ${m.libro.scelti.map(nomeInc).join(', ')}`);
        if (m.slot === 'patto') note.push('Usa lo slot del patto');
        if (m.slot === 'qualsiasi') note.push('Si lancia anche con qualsiasi slot');
        if (m.cdCondizionali.length) note.push(...m.cdCondizionali.map((x) => `${x.etichetta}: CD ${x.totale}`));
        return {
          id: m.id, nome: m.nome, cd: m.cd?.totale ?? null, attacco: m.attacco ? segno(m.attacco.totale) : null,
          trucchetti: m.trucchetti.scelti.map(nomeInc), incantesimi,
          ...(m.lanciGratuiti ? { lanciGratuiti: `${m.lanciGratuiti.incantesimi.map(nomeInc).join(', ')}: ${m.lanciGratuiti.usi} ${m.lanciGratuiti.usi === 1 ? 'volta' : 'volte'} senza slot, per riposo ${m.lanciGratuiti.recupero}` } : {}),
          note,
        };
      }),
      slot: [
        ...s.slot.normali.map((n, i) => (n > 0 ? `${n} slot di ${ORDINALE[i]} livello` : '')).filter(Boolean),
        ...(s.slot.patto ? [`${s.slot.patto.numero} slot del patto di ${ORDINALE[s.slot.patto.livello - 1]} livello (tornano con il riposo breve)`] : []),
      ],
    },
    zaino: { monete: s.monete, inventario: s.inventario },
    chiE: {
      righe: [
        ...(pg.idea?.trim() ? [{ etichetta: 'In una frase', valore: pg.idea.trim() }] : []),
        ...(bg.personalizzato ? [{ etichetta: 'Background', valore: `${bg.nome}: inserito dal giocatore${bg.rimando ? ` (${bg.rimando})` : ''}` }] : []),
        { etichetta: 'Lingue', valore: s.lingue.map((l) => NOME_LINGUA[l] ?? l).join(', ') },
        { etichetta: 'Armi', valore: s.addestramentoArmi.map((a) => ({ semplici: 'semplici', marziali: 'da guerra', marzialiLeggere: 'da guerra leggere', marzialiAccurateOLeggere: 'da guerra accurate o leggere' } as Record<string, string>)[a] ?? a).join(', ') },
        { etichetta: 'Armature', valore: s.addestramentoArmature.length ? s.addestramentoArmature.map((a) => (a === 'scudo' ? 'scudo' : a === 'leggera' ? 'leggere' : a === 'media' ? 'medie' : 'pesanti')).join(', ') : 'nessuna' },
        ...(s.strumenti.length ? [{ etichetta: 'Strumenti', valore: s.strumenti.map((t) => d.oggetti[t]?.nome ?? t).join(', ') }] : []),
        ...(pg.ruolo?.aspetto ? [{ etichetta: 'Aspetto', valore: pg.ruolo.aspetto }] : []),
        ...(pg.ruolo?.trattoVisibile ? [{ etichetta: 'Si nota subito', valore: pg.ruolo.trattoVisibile }] : []),
        ...(pg.ruolo?.oggetto ? [{ etichetta: 'L\'oggetto che lo identifica', valore: pg.ruolo.oggetto }] : []),
        ...(pg.ruolo?.segreto ? [{ etichetta: 'Il segreto', valore: pg.ruolo.segreto }] : []),
      ],
      privilegi: [
        ...classe.features.filter((f) => f.livello <= pg.livello).map((f) => `${f.nome} (${classe.nome})`),
        ...specie.tratti.map((t) => `${t.nome} (${specie.nome})`),
        ...(lignaggio ? [`${lignaggio.nome} (${specie.nome})`] : []),
        ...(bg.talentoLibero ? [`Talento: ${bg.talentoLibero.nome} (personalizzato: ${bg.talentoLibero.nota})`] : []),
        // Il talento che dà magia prende il nome della sua fonte: «Iniziato alla magia (Chierico)»
        ...s.talenti.map((t, i) => {
          const volta = s.talenti.slice(0, i).filter((x) => x === t).length;
          const fonte = s.magia.filter((m) => m.id.split('@')[0] === t)[volta];
          return fonte ? fonte.nome : `Talento: ${d.talenti[t]?.nome ?? t}`;
        }),
      ],
    },
  };
}

// ───────── Avvisi di tutto il personaggio, con il passo dove si sistemano ─────────
export interface AvvisoRiepilogo extends Avviso { passo: IdPasso; titoloPasso: string; accettabile: boolean }
export function avvisiRiepilogo(b: Bozza, d: Dati = DATI): AvvisoRiepilogo[] {
  const stati = statoPassi(b, d);
  return PASSI.flatMap((p) => stati[p.id].avvisi.map((a) => ({
    ...a, passo: p.id, titoloPasso: p.titolo,
    accettabile: a.livello !== 'info',                    // «manca una scelta» non si accetta: si sceglie
  })));
}

// Il master può accettare un'eccezione (principio 3: avvisa, non vieta)
export function accettaAvviso(b: Bozza, id: Id, accetta = true): Bozza {
  const resto = b.avvisiAccettati.filter((x) => x !== id);
  return { ...b, avvisiAccettati: accetta ? [...resto, id] : resto };
}

// La scheda è pronta quando non mancano scelte e ogni avviso è risolto o accettato
export function pronta(b: Bozza, d: Dati = DATI): boolean {
  const stati = statoPassi(b, d);
  return PASSI.every((p) => p.id === 'riepilogo' || stati[p.id].stato === 'fatto' || stati[p.id].stato === 'non-serve');
}

// ───────── Esportazione JSON (sezione 5.4): copia di sicurezza, da reimportare ─────────
const FORMATO = 'companion-b20';
// Gli elementi personalizzati che la scheda usa (un background dal proprio manuale) viaggiano con lei
export function esportaJSON(b: Bozza, ritratto?: string, elementi?: Elementi): string {
  const usati = elementi && quanti(elementi) ? { elementi } : {};
  return JSON.stringify({ formato: FORMATO, versione: 1, personaggio: b, ...(ritratto ? { ritratto } : {}), ...usati }, null, 2);
}

export function importaJSON(testo: string, d: Dati = DATI): { bozza: Bozza; ritratto?: string; elementi?: Elementi } | { errore: string } {
  let dati: unknown;
  try { dati = JSON.parse(testo); } catch { return { errore: 'Il file non è un JSON valido.' }; }
  const x = dati as { formato?: string; versione?: number; personaggio?: Bozza; ritratto?: unknown; elementi?: Elementi };
  if (x?.formato !== FORMATO || !x.personaggio) return { errore: 'Questo file non è una scheda di Companion B20.' };
  if (x.versione !== 1 || x.personaggio.schema !== 1) return { errore: 'La scheda è di una versione dell\'app che questa non conosce.' };
  const p = x.personaggio;
  // Solo elementi personalizzati ben formati, e mai sopra uno dell'SRD (anche quelli del tavolo dentro la scheda)
  const buoni = <T extends { personalizzato?: boolean; srd?: unknown }>(r: Record<string, T> | undefined, srd: Record<string, T>) => Object.fromEntries(
    Object.entries(r ?? {}).filter(([id, v]) => v && typeof v === 'object' && v.personalizzato === true && id.startsWith('pers-') && !srd[id]?.srd));
  const specieBuone = buoni({ ...p.tavolo?.elementi?.specie, ...x.elementi?.specie }, d.specie);
  const elementi: Elementi = {
    background: buoni({ ...p.tavolo?.elementi?.background, ...x.elementi?.background }, d.background),
    ...(Object.keys(specieBuone).length ? { specie: specieBuone } : {}),
  };
  const background = { ...d.background, ...elementi.background };
  const specie = { ...d.specie, ...elementi.specie };
  for (const [campo, archivio] of [[p.classe, d.classi], [p.specie, specie], [p.background, background]] as const)
    if (campo && !archivio[campo]) return { errore: `La scheda usa «${campo}», che qui non c'è (forse un elemento personalizzato di un altro tavolo).` };
  const ritratto = typeof x.ritratto === 'string' && x.ritratto.startsWith('data:image/') ? x.ritratto : undefined;
  return { bozza: { ...p, scelte: p.scelte ?? {}, avvisiAccettati: p.avvisiAccettati ?? [], incantesimi: p.incantesimi ?? { preparati: {} } },
    ...(ritratto ? { ritratto } : {}), ...(quanti(elementi) ? { elementi } : {}) };
}

export const nomeFile = (b: Bozza) => `${(b.nome.trim() || 'personaggio').toLowerCase().replace(/[^a-z0-9àèéìòù]+/g, '-').replace(/^-|-$/g, '')}.json`;
