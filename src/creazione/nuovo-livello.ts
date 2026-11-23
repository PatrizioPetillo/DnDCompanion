// Salire di livello in una schermata sola (23/11, richiesta di Patrizio): niente fogli né passi da riaprire.
// Dalla scheda salvata compaiono direttamente le capacità del livello nuovo, ognuna con le sue tendine,
// i PF e gli incantesimi in più. Le scelte stanno in una bozza di prova finché non si conferma.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { ABILITA } from '../regole/dati/base';
import type { Id, MagiaCalcolata } from '../regole/tipi';
import { calcolaScheda } from '../regole';
import { scelteDiClasse } from './classe';
import { capacitaDelLivello, prossimoLivello, regolaPf } from './livello';
import type { Opzione } from './opzioni';
import { comePersonaggio, type Bozza } from './percorso';

// Le tendine scelte, per chiave: 'scelta:<id>', 'trucchetti:<scelta>', 'preparati:<concessione>', 'libro'
export type Scelte = Record<string, string[]>;
export interface Tendine { chiave: string; titolo: string; quante: number; opzioni: Opzione[] }
export interface Capacita { id: Id; nome: string; testo?: string; pagina?: number; tendine: Tendine[] }

// La bozza al livello nuovo, con le scelte fatte finora
export function bozzaNuova(b: Bozza, scelte: Scelte, tiro: number | null): Bozza {
  const n = prossimoLivello(b) ?? b.livello ?? 1;
  const sc = { ...b.scelte };
  const prep = { ...b.incantesimi.preparati };
  let libro = b.incantesimi.libro;
  for (const [k, v] of Object.entries(scelte)) {
    const val = v.filter(Boolean);
    if (k.startsWith('scelta:')) sc[k.slice(7)] = val;
    else if (k.startsWith('trucchetti:')) { const id = k.slice(11); sc[id] = [...(b.scelte[id] ?? []), ...val]; }
    else if (k.startsWith('preparati:')) { const id = k.slice(10); prep[id] = [...(b.incantesimi.preparati[id] ?? []), ...val]; }
    else if (k === 'libro') libro = [...(b.incantesimi.libro ?? []), ...val];
  }
  const tiriPf = tiro !== null ? { ...(b.tiriPf ?? {}), [n]: tiro } : b.tiriPf;
  return { ...b, livello: n, scelte: sc, incantesimi: { ...b.incantesimi, preparati: prep, ...(libro ? { libro } : {}) }, ...(tiriPf ? { tiriPf } : {}) };
}

const conNome = (ids: Id[], d: Dati): Opzione[] => ids.map((id) => ({ id, nome: d.incantesimi[id]?.nome ?? id, disattivata: false }));

// Le capacità del livello nuovo con le loro tendine, più il blocco della magia
export function nuovoLivello(b: Bozza, scelte: Scelte, d: Dati = DATI): { livello: number; capacita: Capacita[]; magia: Tendine[] } | null {
  const n = prossimoLivello(b);
  if (!n || !b.classe) return null;
  const prova = bozzaNuova(b, scelte, null);
  const pg = comePersonaggio(prova);
  const scheda = pg ? calcolaScheda(pg, d) : null;
  const classe = d.classi[b.classe];

  // Capacità della classe a quel livello, con le scelte (tranne la magia)
  const daClasse = scelteDiClasse(prova, d, n);
  const capacita: Capacita[] = capacitaDelLivello(b, n, d).map((c, i) => {
    const f = classe.features.filter((x) => x.livello === n)[i];
    const tendine: Tendine[] = daClasse.filter((s) => s.feature === f.id).map((s) => ({ chiave: `scelta:${s.id}`, titolo: s.titolo, quante: s.quantita, opzioni: s.opzioni }));
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
        if (nuoviL > 0) magia.push({ chiave: 'libro', titolo: 'Incantesimo nuovo nel libro', quante: nuoviL,
          opzioni: conNome(lista.filter((i) => i.livello >= 1 && i.livello <= m.livelloMax).map((i) => i.id), d)
            .map((o) => p0.libro!.scelti.includes(o.id) ? { ...o, disattivata: true, motivo: 'è già nel libro' } : o) });
      }
      // incantesimi preparati in più (dalla lista, o dal libro per il mago)
      if (m.preparati && p0?.preparati) {
        const nuoviP = m.preparati.limite - p0.preparati.scelti.length;
        const fonte = m.preparatiDa === 'libro' ? (prova.incantesimi.libro ?? []) : lista.filter((i) => i.livello >= 1 && i.livello <= m.livelloMax).map((i) => i.id);
        if (nuoviP > 0) magia.push({ chiave: `preparati:${m.id}`, titolo: m.preparatiDa === 'libro' ? 'Incantesimo preparato in più (dal libro)' : 'Incantesimo preparato in più', quante: nuoviP,
          opzioni: conNome(fonte, d).map((o) => p0.preparati!.scelti.includes(o.id) || p0.semprePreparati.includes(o.id) ? { ...o, disattivata: true, motivo: 'già preparato' } : o) });
      }
    }
  }
  return { livello: n, capacita, magia };
}

// Tutte le tendine piene e, con la regola «tiro», il dado scritto
export function completo(b: Bozza, scelte: Scelte, tiro: number | null, usaTiro: boolean): boolean {
  const r = nuovoLivello(b, scelte);
  if (!r) return false;
  if ((regolaPf(b) === 'tiro' || usaTiro) && tiro === null) return false;
  return [...r.capacita.flatMap((c) => c.tendine), ...r.magia].every((t) => (scelte[t.chiave] ?? []).filter(Boolean).length === t.quante);
}
