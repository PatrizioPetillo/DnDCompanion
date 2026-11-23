// I personaggi di prova ai livelli successivi (23/11): scelte del test approvate da Patrizio nei file «Valori attesi».
import { calcolaScheda } from '../src/regole';
import type { Personaggio } from '../src/regole/tipi';
import * as P from './personaggi';

export const sali = (pg: Personaggio, livello: number, scelte: Record<string, string[]> = {}, preparati: Record<string, string[]> = {}, libro?: string[]): Personaggio => ({
  ...pg, livello, scelte: { ...pg.scelte, ...scelte },
  incantesimi: { ...pg.incantesimi, ...(libro ? { libro } : {}), preparati: { ...pg.incantesimi.preparati, ...preparati } },
});
const al2 = (pg: Personaggio, scelte: Record<string, string[]> = {}, preparati: Record<string, string[]> = {}, libro?: string[]) => sali(pg, 2, scelte, preparati, libro);
export const errori = (pg: Personaggio) => calcolaScheda(pg).avvisi.filter((a) => !a.accettato).filter((a) => a.livello === 'errore' || (a.livello === 'info' && /^(scelta-mancante|preparati-mancanti|libro-incompleto)/.test(a.id)));
export const risorsa = (pg: Personaggio, id: string) => calcolaScheda(pg).risorse.find((r) => r.id === id);
export const magia = (pg: Personaggio, id: string) => calcolaScheda(pg).magia.find((m) => m.id === id)!;
const prep = (pg: Personaggio, c: string, ...ids: string[]) => ({ [c]: [...(pg.incantesimi.preparati[c] ?? []), ...ids] });

// ───── 2° livello ─────
export const L2_BARBARO = al2(P.BARBARO);
export const L2_BARDO = al2(P.BARDO, { 'bard.maestria': ['performance', 'persuasion'] }, { bard: [...P.BARDO.incantesimi.preparati.bard, 'thunderwave'] });
export const L2_CHIERICO = al2(P.CHIERICO, {}, { cleric: [...P.CHIERICO.incantesimi.preparati.cleric, 'command'] });
export const L2_DRUIDO = al2(P.DRUIDO, { 'druid.forme': ['rat', 'riding-horse', 'spider', 'wolf'] }, { druid: [...P.DRUIDO.incantesimi.preparati.druid, 'healing-word'] });
export const L2_GUERRIERO = al2(P.GUERRIERO);
export const L2_MONACO = al2(P.MONACO);
export const L2_PALADINO = al2(P.PALADINO, { 'paladin.stile': ['blessed-warrior'], 'paladin.guerriero-benedetto': ['guidance', 'sacred-flame'] },
  { paladin: [...P.PALADINO.incantesimi.preparati.paladin, 'shield-of-faith'] });
export const L2_RANGER = al2(P.RANGER, { 'ranger.maestria': ['stealth'], 'ranger.lingue': ['draconic', 'dwarvish'], 'ranger.stile': ['archery'] },
  { ranger: [...P.RANGER.incantesimi.preparati.ranger, 'ensnaring-strike'] });
export const L2_LADRO = al2(P.LADRO);
export const L2_STREGONE = al2(P.STREGONE, { 'sorcerer.metamagia': ['quickened-spell', 'twinned-spell'] },
  { sorcerer: [...P.STREGONE.incantesimi.preparati.sorcerer, 'magic-missile', 'chromatic-orb'] });
export const L2_WARLOCK = al2(P.WARLOCK, { 'warlock.suppliche-2': ['agonizing-blast', 'devils-sight'] }, { warlock: [...P.WARLOCK.incantesimi.preparati.warlock, 'hellish-rebuke'] });
export const L2_TRAVIS = al2(P.TRAVIS, { 'wizard.studioso': ['arcana'] }, { wizard: [...P.TRAVIS.incantesimi.preparati.wizard, 'magic-missile'] },
  [...P.TRAVIS.incantesimi.libro!, 'magic-missile', 'sleep']);
export const L2_TRAVIS_SAGGIO = al2(P.TRAVIS_SAGGIO, { 'wizard.studioso': ['arcana'] }, { wizard: [...(P.TRAVIS_SAGGIO.incantesimi.preparati.wizard ?? []), 'magic-missile'] },
  [...(P.TRAVIS_SAGGIO.incantesimi.libro ?? []), 'magic-missile', 'sleep']);


// ───── 3° livello (file «Valori attesi 3° livello», approvato il 23/11) ─────
export const L3_BARBARO = sali(L2_BARBARO, 3, { 'barbarian.conoscenza': ['nature'] });
export const L3_BARDO = sali(L2_BARDO, 3, { 'bard.competenze-bonus': ['arcana', 'insight', 'deception'] }, prep(L2_BARDO, 'bard', 'shatter'));
export const L3_CHIERICO = sali(L2_CHIERICO, 3, {}, prep(L2_CHIERICO, 'cleric', 'spiritual-weapon'));
export const L3_DRUIDO = sali(L2_DRUIDO, 3, { 'druid.terra': ['temperate'] }, prep(L2_DRUIDO, 'druid', 'moonbeam'));
export const L3_GUERRIERO = sali(L2_GUERRIERO, 3);
export const L3_MONACO = sali(L2_MONACO, 3);
export const L3_PALADINO = sali(L2_PALADINO, 3, {}, prep(L2_PALADINO, 'paladin', 'bless'));
export const L3_RANGER = sali(L2_RANGER, 3, { 'ranger.preda': ['colossus-slayer'] }, prep(L2_RANGER, 'ranger', 'cure-wounds'));
export const L3_LADRO = sali(L2_LADRO, 3);
export const L3_STREGONE = sali(L2_STREGONE, 3, {}, prep(L2_STREGONE, 'sorcerer', 'scorching-ray', 'misty-step'));
export const L3_WARLOCK = sali(L2_WARLOCK, 3, {}, prep(L2_WARLOCK, 'warlock', 'misty-step'));
export const L3_TRAVIS = sali(L2_TRAVIS, 3, {}, prep(L2_TRAVIS, 'wizard', 'scorching-ray'), [...L2_TRAVIS.incantesimi.libro!, 'misty-step', 'web', 'scorching-ray', 'shatter']);
export const L3_TRAVIS_SAGGIO = sali(L2_TRAVIS_SAGGIO, 3, {}, prep(L2_TRAVIS_SAGGIO, 'wizard', 'scorching-ray'), [...L2_TRAVIS_SAGGIO.incantesimi.libro!, 'misty-step', 'web', 'scorching-ray', 'shatter']);

// ───── 4° livello (file «Valori attesi 4° livello», approvato il 23/11) ─────
const asi = (...c: string[]) => ({ 'talento-4': ['ability-score-improvement'], 'ability-score-improvement.aumento': c });
const tr = (pg: Personaggio, id: string, ...ids: string[]) => ({ [id]: [...(pg.scelte[id] ?? []), ...ids] });
export const L4_BARBARO = sali(L3_BARBARO, 4, { ...asi('FOR', 'COS'), 'barbarian.padronanza-4': ['javelin'] });
export const L4_BARDO = sali(L3_BARDO, 4, { ...asi('CAR', 'DES'), ...tr(L3_BARDO, 'bard.trucchetti', 'mage-hand') }, prep(L3_BARDO, 'bard', 'invisibility'));
export const L4_CHIERICO = sali(L3_CHIERICO, 4, { ...asi('SAG', 'COS'), ...tr(L3_CHIERICO, 'cleric.trucchetti', 'spare-the-dying') }, prep(L3_CHIERICO, 'cleric', 'prayer-of-healing'));
export const L4_DRUIDO = sali(L3_DRUIDO, 4, { ...asi('SAG', 'COS'), 'druid.forme-4': ['black-bear', 'ape'], ...tr(L3_DRUIDO, 'druid.trucchetti', 'resistance') }, prep(L3_DRUIDO, 'druid', 'barkskin'));
export const L4_GUERRIERO = sali(L3_GUERRIERO, 4, { 'talento-4': ['grappler'], 'grappler.caratteristica': ['FOR'], 'fighter.padronanza-4': ['longsword'] });
export const L4_MONACO = sali(L3_MONACO, 4, asi('DES', 'SAG'));
export const L4_PALADINO = sali(L3_PALADINO, 4, asi('FOR', 'CAR'), prep(L3_PALADINO, 'paladin', 'command'));
export const L4_RANGER = sali(L3_RANGER, 4, { 'talento-4': ['alert'] }, prep(L3_RANGER, 'ranger', 'goodberry'));
export const L4_LADRO = sali(L3_LADRO, 4, asi('DES', 'INT'));
export const L4_STREGONE = sali(L3_STREGONE, 4, { ...asi('CAR', 'CAR'), ...tr(L3_STREGONE, 'sorcerer.trucchetti', 'mage-hand') }, prep(L3_STREGONE, 'sorcerer', 'shatter'));
export const L4_WARLOCK = sali(L3_WARLOCK, 4, { ...asi('CAR', 'COS'), ...tr(L3_WARLOCK, 'warlock.trucchetti', 'mage-hand') }, prep(L3_WARLOCK, 'warlock', 'hold-person'));
export const L4_TRAVIS = sali(L3_TRAVIS, 4, { ...asi('INT', 'COS'), ...tr(L3_TRAVIS, 'wizard.trucchetti', 'prestidigitation') }, prep(L3_TRAVIS, 'wizard', 'shatter'),
  [...L3_TRAVIS.incantesimi.libro!, 'invisibility', 'hold-person']);
export const L4_TRAVIS_SAGGIO = sali(L3_TRAVIS_SAGGIO, 4, { ...asi('INT', 'COS'), ...tr(L3_TRAVIS_SAGGIO, 'wizard.trucchetti', 'prestidigitation') }, prep(L3_TRAVIS_SAGGIO, 'wizard', 'shatter'),
  [...L3_TRAVIS_SAGGIO.incantesimi.libro!, 'invisibility', 'hold-person']);
