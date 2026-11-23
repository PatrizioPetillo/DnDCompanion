// Salire di livello in una schermata sola (23/11, richiesta di Patrizio): niente fogli né passi da riaprire.
// Dalla scheda salvata compaiono direttamente le capacità del livello nuovo, ognuna con le sue tendine,
// i PF e gli incantesimi in più. Le scelte stanno in una bozza di prova finché non si conferma.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { ABILITA } from '../regole/dati/base';
import type { Id, MagiaCalcolata } from '../regole/tipi';
import { calcolaScheda } from '../regole';
import { scelteDiClasse } from './classe';
import { tendineTalento } from './talento-livello';
import { capacitaDelLivello, prossimoLivello, regolaPf } from './livello';
import type { Opzione } from './opzioni';
import { comePersonaggio, type Bozza } from './percorso';

// Le tendine scelte, per chiave: 'scelta:<id>', 'trucchetti:<scelta>', 'preparati:<concessione>', 'libro'
export type Scelte = Record<string, string[]>;
// tipo 'aumento': i due pulsanti «+2 a una» / «+1 a due» (punteggi: quelli di prima); tipo 'testo': un nome scritto a mano
export interface Tendine { chiave: string; titolo: string; quante: number; opzioni: Opzione[]; tipo?: 'aumento' | 'testo'; punteggi?: Record<string, number> }
export interface Capacita { id: Id; nome: string; testo?: string; pagina?: number; tendine: Tendine[] }

// La bozza al livello nuovo, con le scelte fatte finora
export function bozzaNuova(b: Bozza, scelte: Scelte, tiro: number | null): Bozza {
  const n = prossimoLivello(b) ?? b.livello ?? 1;
  const sc = { ...b.scelte };
  const prep = { ...b.incantesimi.preparati };
  let libro = b.incantesimi.libro;
  for (const [k, v] of Object.entries(scelte)) {
    const val = v.filter(Boolean);
    if (k.startsWith('scelta:')) sc[k.slice(7)] = val;   // «+1 a due» con una sola scelta fatta resta incompleta: lo dice completo()
    else if (k.startsWith('trucchetti:')) { const id = k.slice(11); sc[id] = [...(b.scelte[id] ?? []), ...val]; }
    else if (k.startsWith('preparati:')) { const id = k.slice(10); prep[id] = [...(b.incantesimi.preparati[id] ?? []), ...val]; }
    else if (k === 'libro') libro = [...(b.incantesimi.libro ?? []), ...val];
  }
  const tiriPf = tiro !== null ? { ...(b.tiriPf ?? {}), [n]: tiro } : b.tiriPf;
  return { ...b, livello: n, scelte: sc, incantesimi: { ...b.incantesimi, preparati: prep, ...(libro ? { libro } : {}) }, ...(tiriPf ? { tiriPf } : {}) };
}

const conNome = (ids: Id[], d: Dati): Opzione[] => ids.map((id) => ({ id, nome: d.incantesimi[id]?.nome ?? id, disattivata: false }));

// Le capacità del livello nuovo con le loro tendine, più il blocco della magia
export function nuovoLivello(b: Bozza, scelte: Scelte, d: Dati = DATI): { livello: number; capacita: Capacita[]; magia: Tendine[]; cresce: string[] } | null {
  const n = prossimoLivello(b);
  if (!n || !b.classe) return null;
  const prova = bozzaNuova(b, scelte, null);
  const pg = comePersonaggio(prova);
  const scheda = pg ? calcolaScheda(pg, d) : null;
  const classe = d.classi[b.classe];

  // Capacità della classe a quel livello, con le scelte (tranne la magia)
  const daClasse = scelteDiClasse(prova, d, n);
  const giaPadroneggiate = Object.entries(b.scelte).filter(([k]) => /(maestria-armi|padronanza-\d+)$/.test(k)).flatMap(([, v]) => v);
  const capacita: Capacita[] = capacitaDelLivello(b, n, d).map((c, i) => {
    const f = classe.features.filter((x) => x.livello === n)[i];
    const tendine: Tendine[] = daClasse.filter((s) => s.feature === f.id).flatMap((s) => (/^talento-\d+$/.test(s.id) ? tendineTalento(prova, s.id, d)
      : [{ chiave: `scelta:${s.id}`, titolo: s.titolo, quante: s.quantita,
        // Padronanza d'armi in più (4° livello): le armi che padroneggi già restano spente
        opzioni: /\.padronanza-\d+$/.test(s.id) ? s.opzioni.map((o) => (giaPadroneggiate.includes(o.id) ? { ...o, disattivata: true, motivo: 'la padroneggi già' } : o))
          // Forme selvatiche in più (4° livello): quelle che conosci già restano spente
          : /^druid\.forme-\d+$/.test(s.id) ? s.opzioni.map((o) => ((b.scelte['druid.forme'] ?? []).includes(o.id) ? { ...o, disattivata: true, motivo: 'la conosci già' } : o))
          : s.opzioni }]));
    // Abilità nuove (Conoscenza primordiale, Competenze bonus): quelle in cui non hai già la competenza
    for (const e of f.effetti) if (e.tipo === 'scelta' && e.scelta.tipo === 'abilita' && scheda) {
      const mie = scelte[`scelta:${e.scelta.id}`] ?? [];
      const ids = e.scelta.opzioni ?? Object.keys(ABILITA);
      tendine.push({ chiave: `scelta:${e.scelta.id}`, titolo: 'Abilità', quante: e.scelta.quantita, opzioni: ids.map((a) => {
        const motivo = scheda.abilita[a]?.competente && !mie.includes(a) ? 'hai già la competenza' : undefined;
        return { id: a, nome: ABILITA[a].nome, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
      }) });
    }
    // Maestria (bardo, ranger, mago): tra le abilità in cui hai competenza (e, per lo Studioso, solo tra le sue 6)
    for (const e of f.effetti) if (e.tipo === 'scelta' && e.scelta.tipo === 'maestria' && scheda) {
      const giaMaestria = Object.entries(scheda.abilita).filter(([a, x]) => x.maestria && !(scelte[`scelta:${e.scelta.id}`] ?? []).includes(a)).map(([a]) => a);
      const ids = Object.keys(ABILITA).filter((a) => !e.scelta.opzioni || e.scelta.opzioni.includes(a));
      tendine.push({ chiave: `scelta:${e.scelta.id}`, titolo: 'Maestria', quante: e.scelta.quantita, opzioni: ids.map((a) => {
        const motivo = !scheda.abilita[a]?.competente ? 'serve la competenza' : giaMaestria.includes(a) ? 'hai già la Maestria' : undefined;
        return { id: a, nome: ABILITA[a].nome, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
      }) });
    }
    return { id: f.id, ...c, tendine };
  });

  // Magia: solo quello che manca al livello nuovo (trucchetti, preparati, libro), per ogni fonte
  const magia: Tendine[] = [];
  const conosciuti = (m: MagiaCalcolata[]) => new Set(m.flatMap((x) => [...x.trucchetti.scelti, ...x.semprePreparati, ...(x.preparati?.scelti ?? [])]));
  if (scheda) {
    const prima = comePersonaggio(b) ? calcolaScheda(comePersonaggio(b)!, d).magia : [];
    const giaNoti = conosciuti(prima);
    for (const m of scheda.magia) {
      const p0 = prima.find((x) => x.id === m.id);
      const lista = m.lista ? Object.values(d.incantesimi).filter((i) => i.liste.includes(m.lista!)) : [];
      // trucchetti in più (anche quelli di una fonte nuova, come Guerriero benedetto)
      const nuoviT = m.trucchetti.attesi - (p0?.trucchetti.scelti.length ?? 0) - (m.trucchetti.fissi?.length ?? 0) + (p0?.trucchetti.fissi?.length ?? 0);
      if (m.scelte.trucchetti && nuoviT > 0) magia.push({ chiave: `trucchetti:${m.scelte.trucchetti}`, titolo: m.fonte.tipo === 'classe' && m.id !== b.classe ? `Trucchetto: ${m.nome.replace(/^Classe: /, '')}` : 'Trucchetto nuovo', quante: nuoviT,
        opzioni: conNome(lista.filter((i) => i.livello === 0).map((i) => i.id), d).map((o) => giaNoti.has(o.id) ? { ...o, disattivata: true, motivo: 'lo conosci già' } : o) });
      // libro del mago: gli incantesimi nuovi da scrivere
      if (m.libro && p0?.libro) {
        const nuoviL = m.libro.iniziali - p0.libro.scelti.length;
        const gratis = classe.features.filter((x) => x.livello === n).flatMap((x) => x.effetti).find((e) => e.tipo === 'libroExtra');
        if (nuoviL > 0) magia.push({ chiave: 'libro', titolo: gratis && gratis.tipo === 'libroExtra' ? `Incantesimo nuovo nel libro (${gratis.quanti} di invocazione gratis)` : 'Incantesimo nuovo nel libro', quante: nuoviL,
          opzioni: conNome(lista.filter((i) => i.livello >= 1 && i.livello <= m.livelloMax).map((i) => i.id), d)
            .map((o) => p0.libro!.scelti.includes(o.id) ? { ...o, disattivata: true, motivo: 'è già nel libro' } : o) });
      }
      // incantesimi preparati in più (dalla lista, o dal libro per il mago)
      if (m.preparati && p0?.preparati) {
        const nuoviP = m.preparati.limite - p0.preparati.scelti.length;
        const fonte = m.preparatiDa === 'libro' ? (prova.incantesimi.libro ?? []) : lista.filter((i) => i.livello >= 1 && i.livello <= m.livelloMax).map((i) => i.id);
        if (nuoviP > 0) magia.push({ chiave: `preparati:${m.id}`, titolo: m.preparatiDa === 'libro' ? 'Incantesimo preparato in più (dal libro)' : 'Incantesimo preparato in più', quante: nuoviP,
          opzioni: conNome(fonte, d).map((o) => p0.preparati!.scelti.includes(o.id) ? { ...o, disattivata: true, motivo: 'già preparato' }
            : scheda.magia.some((x) => x.semprePreparati.includes(o.id)) ? { ...o, disattivata: true, motivo: 'sempre preparato' } : o) });
      }
    }
  }
  // Quello che cresce da solo: usi delle risorse, valori della classe, slot (una riga ciascuno: «Ira: 2 → 3»)
  const cresce: string[] = [];
  const pg0 = comePersonaggio(b);
  if (scheda && pg0) {
    const s0 = calcolaScheda(pg0, d);
    for (const r of scheda.risorse) { const v = s0.risorse.find((x) => x.id === r.id)?.usi ?? 0; if (r.usi !== v) cresce.push(`${r.nome}: ${v} → ${r.usi}`); }
    for (const [k, v] of Object.entries(scheda.valoriClasse)) if (s0.valoriClasse[k] && s0.valoriClasse[k] !== v) cresce.push(`${k === 'sneak-attack' ? 'Attacco furtivo' : k}: ${s0.valoriClasse[k]} → ${v}`);
    scheda.slot.normali.forEach((x, i) => { const v = s0.slot.normali[i] ?? 0; if (x !== v) cresce.push(`Slot di ${i + 1}° livello: ${v} → ${x}`); });
    const p0 = s0.slot.patto, p1 = scheda.slot.patto;
    if (p1 && (p0?.numero !== p1.numero || p0?.livello !== p1.livello)) cresce.push(`Slot del patto: ${p0 ? `${p0.numero} di ${p0.livello}°` : 'nessuno'} → ${p1.numero} di ${p1.livello}°`);
  }
  return { livello: n, capacita, magia, cresce };
}

// Tutte le tendine piene e, con la regola «tiro», il dado scritto
export function completo(b: Bozza, scelte: Scelte, tiro: number | null, usaTiro: boolean): boolean {
  const r = nuovoLivello(b, scelte);
  if (!r) return false;
  if ((regolaPf(b) === 'tiro' || usaTiro) && tiro === null) return false;
  return [...r.capacita.flatMap((c) => c.tendine), ...r.magia].every((t) => (scelte[t.chiave] ?? []).filter((v) => v.trim()).length === t.quante);
}
