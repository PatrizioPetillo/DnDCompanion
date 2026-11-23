// Salire di livello in una schermata sola (23/11, richiesta di Patrizio): niente fogli né passi da riaprire.
// Dalla scheda salvata compaiono direttamente le capacità del livello nuovo, ognuna con le sue tendine,
// i PF e gli incantesimi in più. Le scelte stanno in una bozza di prova finché non si conferma.
import { DATI } from '../regole';
import type { Dati } from '../regole/dati';
import { ABILITA } from '../regole/dati/base';
import type { Id, MagiaCalcolata, Scheda } from '../regole/tipi';
import { calcolaScheda } from '../regole';
import { scelteDiClasse } from './classe';
import { tendineTalento } from './talento-livello';
import { LIVELLO_SUPPLICA, REQUISITO_SUPPLICA } from '../regole/dati/classi';
import { nomeOpzione } from './classe';
const NOME_SUPPLICA = (x: Id) => nomeOpzione(x);
import { capacitaDelLivello, prossimoLivello, regolaPf } from './livello';
import type { Opzione } from './opzioni';
import { comePersonaggio, type Bozza } from './percorso';

// Le tendine scelte, per chiave: 'scelta:<id>', 'trucchetti:<scelta>', 'preparati:<concessione>', 'libro'
export type Scelte = Record<string, string[]>;
// tipo 'aumento': i due pulsanti «+2 a una» / «+1 a due» (punteggi: quelli di prima); tipo 'testo': un nome scritto a mano
// tipo 'cambio' (facoltativo): «Togli» tra opzioni e «Al suo posto» tra opzioniNuove; i valori sono «dove|id» e il nuovo id
export interface Tendine { chiave: string; titolo: string; quante: number; opzioni: Opzione[]; tipo?: 'aumento' | 'testo' | 'cambio'; punteggi?: Record<string, number>;
  facoltativa?: boolean; opzioniNuove?: Opzione[]; nota?: string }
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
  // I cambi facoltativi (un incantesimo, un trucchetto, una supplica, lo stile), dopo le aggiunte: «dove|vecchio» → nuovo
  for (const [k, v] of Object.entries(scelte)) {
    if (!k.startsWith('cambio:') || !v[0] || !v[1]) continue;
    const [dove, vecchio] = v[0].split('|');
    const sostituisci = (l: string[]) => l.map((x) => (x === vecchio ? v[1] : x));
    if (dove.startsWith('prep:')) { const c = dove.slice(5); prep[c] = sostituisci(prep[c] ?? []); }
    else if (dove.startsWith('scelta:')) { const s = dove.slice(7); sc[s] = sostituisci(sc[s] ?? []); }
  }
  const tiriPf = tiro !== null ? { ...(b.tiriPf ?? {}), [n]: tiro } : b.tiriPf;
  return { ...b, livello: n, scelte: sc, incantesimi: { ...b.incantesimi, preparati: prep, ...(libro ? { libro } : {}) }, ...(tiriPf ? { tiriPf } : {}) };
}

const conNome = (ids: Id[], d: Dati): Opzione[] => ids.map((id) => ({ id, nome: d.incantesimi[id]?.nome ?? id, disattivata: false }));

const NOMI_VALORI: Record<string, string> = { 'sneak-attack': 'Attacco furtivo', 'martial-arts-die': 'Dado delle Arti marziali', 'rage-damage': 'Danni dell\'Ira' };

// Le capacità del livello nuovo con le loro tendine, più il blocco della magia
export function nuovoLivello(b: Bozza, scelte: Scelte, d: Dati = DATI): { livello: number; capacita: Capacita[]; magia: Tendine[]; cresce: string[]; cambi: Tendine[] } | null {
  const n = prossimoLivello(b);
  if (!n || !b.classe) return null;
  const prova = bozzaNuova(b, scelte, null);
  const pg = comePersonaggio(prova);
  const scheda = pg ? calcolaScheda(pg, d) : null;
  const classe = d.classi[b.classe];

  // Capacità della classe a quel livello, con le scelte (tranne la magia)
  const daClasse = scelteDiClasse(prova, d, n);
  const giaSuppliche = Object.entries(b.scelte).filter(([k]) => k.startsWith('warlock.suppliche')).flatMap(([, v]) => v);
  const giaPadroneggiate = Object.entries(b.scelte).filter(([k]) => /(maestria-armi|padronanza-\d+)$/.test(k)).flatMap(([, v]) => v);
  const capacita: Capacita[] = capacitaDelLivello(b, n, d).map((c, i) => {
    const f = classe.features.filter((x) => x.livello === n)[i];
    const tendine: Tendine[] = daClasse.filter((s) => s.feature === f.id).flatMap((s) => (/^talento-\d+$/.test(s.id) ? tendineTalento(prova, s.id, d)
      : [{ chiave: `scelta:${s.id}`, titolo: s.titolo, quante: s.quantita,
        // Padronanza d'armi in più (4° livello): le armi che padroneggi già restano spente
        opzioni: /\.padronanza-\d+$/.test(s.id) ? s.opzioni.map((o) => (giaPadroneggiate.includes(o.id) ? { ...o, disattivata: true, motivo: 'la padroneggi già' } : o))
          // Forme selvatiche in più (4° livello): quelle che conosci già restano spente
          // Suppliche in più: quelle già prese spente, e quelle che chiedono un patto che non hai
          : /^warlock\.suppliche-\d+$/.test(s.id) ? s.opzioni.map((o) => (giaSuppliche.includes(o.id) ? { ...o, disattivata: true, motivo: 'ce l\'hai già' }
            : REQUISITO_SUPPLICA[o.id] && !giaSuppliche.includes(REQUISITO_SUPPLICA[o.id]) ? { ...o, disattivata: true, motivo: REQUISITO_SUPPLICA[o.id] === 'pact-of-the-blade' ? 'serve il Patto della lama' : 'serve il Patto della catena' } : o))
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
    if (scheda.competenza !== s0.competenza) cresce.push(`Bonus di competenza: +${s0.competenza} → +${scheda.competenza}`);
    for (const r of scheda.risorse) {
      const r0 = s0.risorse.find((x) => x.id === r.id);
      if (r.usi !== (r0?.usi ?? 0)) cresce.push(`${r.nome}: ${r0?.usi ?? 0} → ${r.usi}`);
      if (r0?.dettaglio && r.dettaglio && r0.dettaglio !== r.dettaglio && /^\d*d\d+/.test(r.dettaglio)) cresce.push(`${r.nome}: ${r0.dettaglio.split(/[,;]/)[0]} → ${r.dettaglio.split(/[,;]/)[0]}`);
    }
    for (const [k, v] of Object.entries(scheda.valoriClasse)) if (s0.valoriClasse[k] && s0.valoriClasse[k] !== v) cresce.push(`${NOMI_VALORI[k] ?? k}: ${s0.valoriClasse[k]} → ${v}`);
    // incantesimi sempre preparati nuovi (sottoclasse, specie, Fido destriero)
    const sempre0 = new Set(s0.magia.flatMap((m) => m.semprePreparati));
    const nuovi = [...new Set(scheda.magia.flatMap((m) => m.semprePreparati))].filter((x) => !sempre0.has(x));
    if (nuovi.length) cresce.push(`Sempre preparati: ${nuovi.map((x) => d.incantesimi[x]?.nome ?? x).join(', ')}`);
    scheda.slot.normali.forEach((x, i) => { const v = s0.slot.normali[i] ?? 0; if (x !== v) cresce.push(`Slot di ${i + 1}° livello: ${v} → ${x}`); });
    const p0 = s0.slot.patto, p1 = scheda.slot.patto;
    if (p1 && (p0?.numero !== p1.numero || p0?.livello !== p1.livello)) cresce.push(`Slot del patto: ${p0 ? `${p0.numero} di ${p0.livello}°` : 'nessuno'} → ${p1.numero} di ${p1.livello}°`);
  }
  return { livello: n, capacita, magia, cresce, cambi: scheda && pg0 ? cambiDelLivello(b, scelte, calcolaScheda(pg0, d), scheda, n, d) : [] };
}

// Cosa si può cambiare salendo di livello (facoltativo; 23/11, richiesta di Patrizio): un incantesimo per bardo, stregone e warlock
// (p. 32, 65, 72), un trucchetto per bardo, chierico, druido, stregone e warlock (p. 31, 36, 42, 64, 71), un incantesimo
// di Iniziato alla magia dello stesso livello (p. 87), una supplica (p. 71), lo stile di combattimento del guerriero (p. 47)
function cambiDelLivello(b: Bozza, scelte: Scelte, s0: Scheda, s1: Scheda, n: number, d: Dati): Tendine[] {
  const out: Tendine[] = [];
  const noti = new Set(s1.magia.flatMap((m) => [...m.trucchetti.scelti, ...m.semprePreparati, ...(m.preparati?.scelti ?? [])]));
  const nome = (id: Id) => d.incantesimi[id]?.nome ?? id;
  const tolto = (chiave: string) => (scelte[chiave]?.[0] ?? '').split('|')[1];
  const nuovi = (ids: Id[], chiave: string): Opzione[] => ids.map((id) => {
    const motivo = noti.has(id) && id !== tolto(chiave) ? 'lo conosci già' : id === tolto(chiave) ? 'è quello che togli' : undefined;
    return { id, nome: nome(id), disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
  });
  const titoloFonte = (m: MagiaCalcolata) => (m.fonte.tipo === 'classe' ? '' : ` · ${m.nome.replace(/^\w+: /, '')}`);
  for (const m of s0.magia) {
    const m1 = s1.magia.find((x) => x.id === m.id) ?? m;
    const lista = m.lista ? Object.values(d.incantesimi).filter((i) => i.liste.includes(m.lista!)) : [];
    const fissi = m.trucchetti.fissi ?? [];
    if (m.cambioTrucchetti?.quando === 'livello' && m.scelte.trucchetti) {
      const chiave = `cambio:${m.id}:trucchetto`;
      out.push({ chiave, titolo: `Un trucchetto${titoloFonte(m)}`, quante: 2, tipo: 'cambio', facoltativa: true,
        opzioni: m.trucchetti.scelti.filter((t) => !fissi.includes(t)).map((t) => ({ id: `scelta:${m.scelte.trucchetti}|${t}`, nome: nome(t), disattivata: false })),
        opzioniNuove: nuovi(lista.filter((i) => i.livello === 0).map((i) => i.id), chiave) });
    }
    if (m.cambio?.quando !== 'livello') continue;
    const chiave = `cambio:${m.id}:incantesimo`;
    if (m.preparati) {
      out.push({ chiave, titolo: `Un incantesimo${titoloFonte(m)}`, quante: 2, tipo: 'cambio', facoltativa: true,
        opzioni: m.preparati.scelti.map((t) => ({ id: `prep:${m.id}|${t}`, nome: nome(t), disattivata: false })),
        opzioniNuove: nuovi(lista.filter((i) => i.livello >= 1 && i.livello <= m1.livelloMax).map((i) => i.id), chiave) });
    } else if (m.scelte.incantesimi) {
      // Iniziato alla magia: un incantesimo scelto con il talento, con uno dello stesso livello della stessa lista
      const via = [...(m.scelte.trucchetti ? m.trucchetti.scelti.filter((t) => !fissi.includes(t)).map((t) => ({ t, s: m.scelte.trucchetti! })) : []),
        ...(b.scelte[m.scelte.incantesimi] ?? []).map((t) => ({ t, s: m.scelte.incantesimi! }))];
      const livelloTolto = d.incantesimi[tolto(chiave) ?? '']?.livello;
      out.push({ chiave, titolo: `Un incantesimo${titoloFonte(m)}`, quante: 2, tipo: 'cambio', facoltativa: true, nota: 'Con uno dello stesso livello.',
        opzioni: via.map(({ t, s }) => ({ id: `scelta:${s}|${t}`, nome: nome(t), disattivata: false })),
        opzioniNuove: livelloTolto === undefined ? [] : nuovi(lista.filter((i) => i.livello === livelloTolto).map((i) => i.id), chiave) });
    }
  }
  // Suppliche: tranne i patti (cambiarli toglierebbe anche ciò che danno) e quelle richieste da un'altra
  const suppliche = Object.entries(b.scelte).filter(([k]) => k.startsWith('warlock.suppliche')).flatMap(([k, v]) => v.map((x) => ({ k, x })));
  if (suppliche.length) {
    const prese = suppliche.map((p) => p.x);
    const chiave = 'cambio:suppliche';
    const via = tolto(chiave);
    out.push({ chiave, titolo: 'Una supplica occulta', quante: 2, tipo: 'cambio', facoltativa: true,
      opzioni: suppliche.filter((p) => !p.x.startsWith('pact-of') && !prese.some((y) => REQUISITO_SUPPLICA[y] === p.x))
        .map((p) => ({ id: `scelta:${p.k}|${p.x}`, nome: NOME_SUPPLICA(p.x), disattivata: false })),
      opzioniNuove: Object.keys(LIVELLO_SUPPLICA).filter((x) => LIVELLO_SUPPLICA[x] <= n && !x.startsWith('pact-of')).map((x) => {
        const motivo = x === via ? 'è quella che togli' : prese.includes(x) || Object.values(scelte).some((v) => v.includes(x)) ? 'ce l\'hai già'
          : REQUISITO_SUPPLICA[x] && !prese.includes(REQUISITO_SUPPLICA[x]) ? (REQUISITO_SUPPLICA[x] === 'pact-of-the-blade' ? 'serve il Patto della lama' : 'serve il Patto della catena') : undefined;
        return { id: x, nome: NOME_SUPPLICA(x), disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
      }) });
  }
  // Guerriero: lo stile di combattimento con un altro talento di stile (p. 47)
  const stile = b.classe === 'fighter' ? (b.scelte['fighter.stile'] ?? [])[0] : undefined;
  if (stile) out.push({ chiave: 'cambio:stile', titolo: 'Lo stile di combattimento', quante: 2, tipo: 'cambio', facoltativa: true,
    opzioni: [{ id: `scelta:fighter.stile|${stile}`, nome: d.talenti[stile]?.nome ?? stile, disattivata: false }],
    opzioniNuove: Object.values(d.talenti).filter((t) => t.categoria === 'stileCombattimento').map((t) => {
      const motivo = t.id === stile ? 'è quello che togli' : s0.talenti.includes(t.id) ? 'ce l\'hai già' : undefined;
      return { id: t.id, nome: t.nome, disattivata: !!motivo, ...(motivo ? { motivo } : {}) };
    }) });
  return out.filter((t) => t.opzioni.length);
}

// Riempie le tendine con le scelte preferite e, dove non bastano, con la prima opzione valida (personaggi pronti, 23/11).
// Una scelta può farne comparire altre (Guerriero benedetto, il talento con le sue scelte): si ripete qualche giro.
export function riempi(b: Bozza, preferite: Scelte = {}, d: Dati = DATI): Scelte {
  let s: Scelte = {};
  for (let giro = 0; giro < 6; giro++) {
    const r = nuovoLivello(b, s, d);
    if (!r) return s;
    for (const t of [...r.capacita.flatMap((c) => c.tendine), ...r.magia]) {
      if ((s[t.chiave] ?? []).filter(Boolean).length === t.quante) continue;
      if (t.tipo === 'testo') { s = { ...s, [t.chiave]: preferite[t.chiave] ?? [] }; continue; }
      if (t.tipo === 'aumento') { s = { ...s, [t.chiave]: preferite[t.chiave] ?? [] }; continue; }
      const pref = (preferite[t.chiave] ?? []).filter((id) => t.opzioni.some((o) => o.id === id && !o.disattivata));
      const altre = t.opzioni.filter((o) => !o.disattivata && !pref.includes(o.id)).map((o) => o.id);
      s = { ...s, [t.chiave]: [...pref, ...altre].slice(0, t.quante) };
    }
    for (const [k, v] of Object.entries(preferite)) if (k.startsWith('cambio:') && !s[k]) s = { ...s, [k]: v };
  }
  return s;
}

// Tutte le tendine piene e, con la regola «tiro», il dado scritto
export function completo(b: Bozza, scelte: Scelte, tiro: number | null, usaTiro: boolean): boolean {
  const r = nuovoLivello(b, scelte);
  if (!r) return false;
  if ((regolaPf(b) === 'tiro' || usaTiro) && tiro === null) return false;
  return [...r.capacita.flatMap((c) => c.tendine), ...r.magia, ...r.cambi].every((t) => {
    const n = (scelte[t.chiave] ?? []).filter((v) => v.trim()).length;
    return n === t.quante || (t.facoltativa && n === 0);   // un cambio si fa per intero o non si fa
  });
}
