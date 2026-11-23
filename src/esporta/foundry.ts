// Esportazione verso Foundry VTT (22/11): un file JSON da importare con «Import Data» su un personaggio (tasto destro sull'attore).
// Modello: i documenti ufficiali del sistema D&D5e (pacchetti SRD 5.2 «modern»), presi con scripts/foundry-dati.py.
// Classe, specie, background, talenti, incantesimi ed equipaggiamento sono copie dei documenti del compendio, con la loro provenienza
// (così i moduli di traduzione li riconoscono); i numeri del personaggio vengono dalla nostra scheda.
// Gli avanzamenti sono segnati come già fatti per il 1° livello, perché Foundry non li rifà all'importazione.
// Non verificato su Foundry da noi: va provato su un mondo vero prima di dirlo «pronto».
import type { Bozza } from '../creazione/percorso';
import { calcolaScheda } from '../regole';
import { OGGETTI_MAGICI } from '../regole/dati/oggetti-magici';
import { ALLINEAMENTI, ARMI as DATI_ARMI } from '../regole/dati/base';
import { oggettiAttivi, richiedeSintonia } from '../regole/oggetti-magici';
import { DATI } from '../regole/dati';
import type { Personaggio, Scheda } from '../regole/tipi';

type Doc = { _id: string; name: string; type: string; system: Record<string, unknown> & { advancement?: unknown }; [k: string]: unknown };
export interface DatiFoundry {
  sistema: string; foundry: { minimum: string; verified: string };
  indice: {
    classe: Record<string, string>; specie: Record<string, string>; background: Record<string, string>; talento: Record<string, string>;
    incantesimo: Record<string, string>; oggetto: Record<string, { doc: string; nome?: string }>; strumento: Record<string, string>; magico: Record<string, string>;
  };
  documenti: Record<string, Doc>;
}

export const caricaDatiFoundry = async (): Promise<DatiFoundry> => (await import('./foundry/dati.json')).default as unknown as DatiFoundry;

const CAR: Record<string, string> = { FOR: 'str', DES: 'dex', COS: 'con', INT: 'int', SAG: 'wis', CAR: 'cha' };
const ABILITA: Record<string, string> = {
  acrobatics: 'acr', 'animal-handling': 'ani', arcana: 'arc', athletics: 'ath', deception: 'dec', history: 'his', insight: 'ins',
  intimidation: 'itm', investigation: 'inv', medicine: 'med', nature: 'nat', perception: 'prc', performance: 'prf', persuasion: 'per',
  religion: 'rel', 'sleight-of-hand': 'slt', stealth: 'ste', survival: 'sur',
};
const LINGUA: Record<string, string> = { 'common-sign-language': 'sign', 'deep-speech': 'deep', 'thieves-cant': 'cant' };
const STANDARD = new Set(['common', 'sign', 'draconic', 'dwarvish', 'elvish', 'giant', 'gnomish', 'goblin', 'halfling', 'orc']);
const ARMI: Record<string, string> = { semplici: 'sim', marziali: 'mar' };
const ARMATURE: Record<string, string> = { leggera: 'lgt', media: 'med', pesante: 'hvy', scudo: 'shl' };

// Id come quelli di Foundry: 16 caratteri alfanumerici
const nuovoId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[b % 62]).join('');
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const uuidDi = (d: Doc) => (d._stats as { compendiumSource: string }).compendiumSource;
const avanzamenti = (d: Doc) => {
  const a = d.system.advancement as Record<string, Avanz> | Avanz[] | undefined;
  return a ? (Array.isArray(a) ? a : Object.values(a)) : [];
};
interface Avanz { _id: string; type: string; level?: number; classRestriction?: string; configuration: Record<string, unknown>; value?: Record<string, unknown> }

export function attoreFoundry(pg: Bozza, dati: DatiFoundry, opzioni: { ora?: Date } = {}) {
  const s: Scheda = calcolaScheda(pg as Personaggio);
  const ix = dati.indice;
  const oggetti: Doc[] = [];
  const giaDentro = new Set<string>();   // uuid del compendio già messi (per non duplicare)
  const avvisi: string[] = [];

  const metti = (id: string | undefined, modifica?: (d: Doc) => void): Doc | null => {
    const orig = id ? dati.documenti[id] : undefined;
    if (!orig) return null;
    const d = copia(orig);
    d._id = nuovoId();
    modifica?.(d);
    oggetti.push(d);
    giaDentro.add(uuidDi(d));
    return d;
  };
  const perUuid = (u: string) => dati.documenti[u.split('.').pop()!];

  // Le competenze del personaggio, nel formato dei «Trait» di Foundry: servono a segnare le scelte degli avanzamenti
  const tratti = new Set<string>([
    ...Object.entries(s.abilita).filter(([, v]) => v.competente).map(([k]) => `skills:${ABILITA[k]}`),
    ...Object.entries(s.tiriSalvezza).filter(([, v]) => v.competente).map(([k]) => `saves:${CAR[k]}`),
    ...s.lingue.map((l) => LINGUA[l] ?? l).map((l) => `languages:${STANDARD.has(l) ? 'standard' : 'exotic'}:${l}`),
    ...s.strumenti.map((t) => ix.strumento[t]).filter(Boolean).map((t) => `tool:${t}`),
  ]);
  // Padronanza delle armi (2024): chiavi «weapon:sim:dagger», id di Foundry senza trattini
  const armaFoundry = (id: string) => id.replace(/-/g, '');
  const padronanze = (pg.classe ? pg.scelte?.[`${pg.classe}.maestria-armi`] ?? [] : []).filter((id) => DATI_ARMI[id]);
  const tratiPadronanza = padronanze.map((id) => `weapon:${DATI_ARMI[id].categoria === 'semplice' ? 'sim' : 'mar'}:${armaFoundry(id)}`);
  const usati = new Set<string>();
  const combacia = (pool: string, t: string) => pool === t || (pool.endsWith('*') && t.startsWith(pool.slice(0, -1))) || t.endsWith(`:${pool.split(':').pop()}`) && pool.startsWith('tool:') && t.startsWith('tool:');
  const scegliDa = (pool: string[], quanti: number, preferiti: string[] = []) => {
    const presi: string[] = [];
    for (const t of [...preferiti, ...tratti]) {
      if (presi.length >= quanti) break;
      if (usati.has(t) || presi.includes(t) || !tratti.has(t)) continue;
      if (pool.some((p) => combacia(p, t))) presi.push(t);
    }
    presi.forEach((t) => usati.add(t));
    return presi;
  };

  // Segna gli avanzamenti come fatti: punti ferita, competenze, privilegi concessi (che diventano oggetti dell'attore)
  const avanza = (d: Doc, livello: number, scelteClasse: string[] = []) => {
    for (const a of avanzamenti(d)) {
      if (a.level !== undefined && a.level !== null && a.level > livello) continue;
      if (a.classRestriction === 'secondary') continue;
      const c = a.configuration;
      // PF: massimo al 1° livello; dopo, il tiro scritto o il valore medio (= il fisso dell'SRD, p. 23)
      if (a.type === 'HitPoints') a.value = Object.fromEntries(Array.from({ length: livello }, (_, i) => [i + 1, i === 0 ? 'max' : (pg.tiriPf?.[i + 1] ?? 'avg')]));
      else if (a.type === 'Trait') {
        const grants = (c.grants as string[]) ?? [];
        grants.forEach((g) => usati.add(g));
        const scelti = c.mode === 'mastery'
          ? ((c.choices as { count: number; pool: string[] }[]) ?? []).flatMap((ch) => tratiPadronanza.filter((t) => !usati.has(t) && ch.pool.some((p) => combacia(p, t) || p === 'weapon:*')).slice(0, ch.count).map((t) => (usati.add(t), t)))
          : ((c.choices as { count: number; pool: string[] }[]) ?? []).flatMap((ch) => scegliDa(ch.pool, ch.count, scelteClasse));
        a.value = { chosen: [...grants, ...scelti] };
      } else if (a.type === 'ItemGrant') {
        const added: Record<string, string> = {};
        for (const it of (c.items as { uuid: string; optional?: boolean }[]) ?? []) {
          if (it.optional) continue;
          const o = perUuid(it.uuid);
          if (!o || giaDentro.has(uuidDi(o))) continue;
          const n = metti(o._id, (x) => { x.flags = { ...(x.flags as object), dnd5e: { advancementOrigin: `${d._id}.${a._id}`, sourceId: uuidDi(o) } }; });
          if (n) { added[n._id] = uuidDi(o); avanza(n, livello); }   // anche i privilegi concessi hanno i loro avanzamenti (Abile, Padronanza delle armi)
        }
        a.value = { added };
      } else if (a.type === 'Size') {
        const t = (c.sizes as string[]) ?? ['med'];
        a.value = { size: t.includes('med') ? 'med' : t[0] };
      }
    }
  };

  for (const [k, v] of [['classe', pg.classe], ['specie', pg.specie], ['background', pg.background]] as const)
    if (v && !ix[k][v]) avvisi.push(`${k} non dell'SRD (${v}): in Foundry va aggiunto a mano`);
  // Classe (1° livello)
  const livelloPg = pg.livello ?? 1;
  const classe = pg.classe ? metti(ix.classe[pg.classe], (d) => { d.system.levels = livelloPg; }) : null;
  if (classe) avanza(classe, livelloPg, (pg.scelte?.[`${pg.classe}.abilita`] ?? []).map((k) => `skills:${ABILITA[k]}`));
  // Background: aumento delle caratteristiche già nei punteggi; il talento d'origine arriva dal suo avanzamento
  const bg = pg.background ? metti(ix.background[pg.background]) : null;
  if (bg) {
    avanza(bg, 0);
    for (const a of avanzamenti(bg)) if (a.type === 'AbilityScoreImprovement')
      a.value = { type: 'asi', assignments: Object.fromEntries(Object.entries(pg.bonusBackground ?? {}).map(([k, v]) => [CAR[k], v])) };
  }
  const specie = pg.specie ? metti(ix.specie[pg.specie]) : null;
  if (specie) avanza(specie, 0);
  // Talenti scelti (umano versatile, stili di combattimento): quelli non già arrivati dal background
  for (const t of s.talenti) {
    const id = ix.talento[t];
    if (id && !giaDentro.has(uuidDi(dati.documenti[id]))) { const n = metti(id); if (n) avanza(n, 0); }
  }

  // Incantesimi: della classe (preparati o no), sempre preparati, gratuiti dei talenti e della specie
  const caratteristicaClasse = CAR[(s.magia.find((m) => m.fonte.tipo === 'classe')?.caratteristica as string) ?? ''] ?? '';
  const incantesimi = new Map<string, { preparato: boolean; modo: string; car: string; usi?: boolean }>();
  for (const m of s.magia) {
    const car = CAR[m.caratteristica as string] ?? '';
    const classeMagia = m.fonte.tipo === 'classe';
    for (const id of m.trucchetti?.scelti ?? []) incantesimi.set(id, { preparato: true, modo: classeMagia ? 'prepared' : 'innate', car });
    for (const id of m.libro?.scelti ?? []) if (!incantesimi.has(id)) incantesimi.set(id, { preparato: false, modo: 'prepared', car });
    for (const id of m.preparati?.scelti ?? []) incantesimi.set(id, { preparato: true, modo: pg.classe === 'warlock' && classeMagia ? 'pact' : 'prepared', car });
    for (const id of m.semprePreparati ?? []) incantesimi.set(id, { preparato: true, modo: 'always', car, usi: !!m.lanciGratuiti?.incantesimi.includes(id) });
  }
  for (const [id, x] of incantesimi) {
    const doc = metti(ix.incantesimo[id], (d) => {
      d.system.preparation = { mode: x.modo, prepared: x.preparato };
      if (x.car && x.car !== caratteristicaClasse) d.system.ability = x.car;   // incantesimi di talenti e specie con un'altra caratteristica
      if (x.usi) d.system.uses = { max: '1', spent: 0, recovery: [{ period: 'lr', type: 'recoverAll' }] };
    });
    if (!doc) avvisi.push(`Incantesimo senza documento: ${id}`);
  }

  // Equipaggiamento: indossato secondo «Cosa indossi»
  const armatura = s.ca.indossata, scudo = s.ca.scudo;
  for (const v of s.inventario) {
    const rif = ix.oggetto[v.oggetto];
    if (!rif) { oggetti.push({ _id: nuovoId(), name: v.nome, type: 'loot', system: { quantity: v.quantita, description: { value: '<p>Dalla scheda di Companion B20</p>' } } } as Doc); continue; }
    metti(rif.doc, (d) => {
      if (rif.nome) d.name = rif.nome;
      d.system.quantity = v.quantita;
      if (d.type === 'weapon') d.system.equipped = true;
      if (d.type === 'equipment' && (v.oggetto === armatura || (v.oggetto === 'shield' && scudo))) d.system.equipped = true;
    });
  }

  // Oggetti magici: quelli dell'SRD con il loro documento, armi e armature +N come oggetto base con il bonus; gli altri come bottino
  for (const o of pg.oggettiMagici ?? []) {
    const def = OGGETTI_MAGICI[o.id];
    const attivo = oggettiAttivi([o], DATI).length > 0;
    const sintonia = richiedeSintonia(o);
    const comune = (d: Doc) => { d.system.equipped = attivo; if (sintonia) d.system.attuned = !!o.sintonizzato; if (o.quantita) d.system.quantity = o.quantita; };
    if (o.velato) {
      oggetti.push({ _id: nuovoId(), name: o.velato.apparente, type: 'loot', system: { description: { value: `<p>${o.velato.aspetto ?? ''}</p><p><em>Da identificare.</em></p>` }, identified: false } } as Doc);
    } else if (o.personalizzato) {
      const p = o.personalizzato;
      oggetti.push({ _id: nuovoId(), name: p.nome, type: 'loot', system: { description: { value: `<p>${p.descrizione ?? p.riga ?? ''}</p>` }, ...(p.sintonia ? { attunement: 'required', attuned: !!o.sintonizzato } : {}) } } as Doc);
    } else if (def?.base && o.base) {
      const piu = Number((o.variante ?? '+1').replace('+', '')) || 1;
      const base = ix.oggetto[o.base];
      const d = metti(base?.doc, (x) => {
        x.name = `${x.name} +${piu}`; comune(x);
        x.system.magicalBonus = piu;
        x.system.properties = [...new Set([...((x.system.properties as string[]) ?? []), 'mgc'])];
        if (x.type === 'equipment') x.system.equipped = attivo;
      });
      if (!d) avvisi.push(`Oggetto magico senza base: ${o.id}`);
    } else if (o.id === 'shield-plus') {
      metti(ix.oggetto.shield?.doc, (x) => { const piu = Number((o.variante ?? '+1').replace('+', '')) || 1; x.name = `${x.name} +${piu}`; x.system.magicalBonus = piu; comune(x); });
    } else {
      const id = ix.magico[o.variante ? `${o.id}:${o.variante}` : o.id] ?? ix.magico[o.id];
      const d = metti(id, (x) => { comune(x); if (o.cariche !== undefined) x.system.uses = { ...((x.system.uses as object) ?? {}), spent: Math.max(0, (def?.cariche?.massimo ?? o.cariche) - o.cariche) }; if (o.nota) x.name = `${x.name} (${o.nota})`; });
      if (!d) avvisi.push(`Oggetto magico senza documento: ${o.id}`);
    }
  }

  // L'attore
  const mo = Math.max(0, s.monete.totale), cp = Math.round(mo * 100);
  const ali = pg.allineamento ? ALLINEAMENTI[pg.allineamento]?.nome ?? '' : '';
  const storia = [pg.idea, pg.ruolo?.storia].filter(Boolean).map((t) => `<p>${String(t).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)}</p>`).join('');
  const strumenti = Object.fromEntries(s.strumenti.map((t) => [ix.strumento[t], { value: 1 }]).filter(([k]) => k));
  const attore = {
    name: pg.nome?.trim() || 'Senza nome',
    type: 'character',
    img: 'icons/svg/mystery-man.svg',
    system: {
      abilities: Object.fromEntries(Object.entries(CAR).map(([it, en]) => [en, { value: s.punteggi[it as keyof typeof s.punteggi].totale, proficient: s.tiriSalvezza[it as keyof typeof s.tiriSalvezza].competente ? 1 : 0 }])),
      attributes: { hp: { value: s.pf.totale }, ac: { calc: 'default' } },
      details: {
        alignment: ali, biography: { value: storia, public: '' }, xp: { value: 0 },
        ...(specie ? { race: specie._id } : {}), ...(bg ? { background: bg._id } : {}), ...(classe ? { originalClass: classe._id } : {}),
        appearance: pg.ruolo?.aspetto ?? '',
      },
      traits: {
        size: 'med',
        languages: { value: s.lingue.map((l) => LINGUA[l] ?? l), custom: '' },
        weaponProf: { value: s.addestramentoArmi.map((a) => ARMI[a]).filter(Boolean), custom: '', mastery: { value: padronanze.map(armaFoundry), bonus: [] } },
        armorProf: { value: s.addestramentoArmature.map((a) => ARMATURE[a]).filter(Boolean), custom: '' },
      },
      skills: Object.fromEntries(Object.entries(s.abilita).map(([k, v]) => [ABILITA[k], { value: v.maestria ? 2 : v.competente ? 1 : 0 }])),
      tools: strumenti,
      currency: { pp: 0, gp: Math.floor(cp / 100), ep: 0, sp: Math.floor((cp % 100) / 10), cp: cp % 10 },
    },
    prototypeToken: { name: pg.nome?.trim() || 'Senza nome', actorLink: true, disposition: 1, sight: { enabled: true } },
    items: oggetti,
    effects: [],
    flags: { 'companion-b20': { esportatoIl: (opzioni.ora ?? new Date()).toISOString(), app: 'Companion B20' } },
    _stats: { systemId: 'dnd5e', systemVersion: dati.sistema, coreVersion: dati.foundry.minimum },
  };
  return { attore, avvisi };
}

export async function fileFoundry(pg: Bozza) {
  const dati = await caricaDatiFoundry();
  const { attore, avvisi } = attoreFoundry(pg, dati);
  const nome = `fvtt-Actor-${(attore.name || 'personaggio').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.json`;
  return { nome, testo: JSON.stringify(attore, null, 2), avvisi };
}
