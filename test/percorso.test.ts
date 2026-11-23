// Test del percorso di creazione (sezione 5.2 del contesto): lo stato degli 8 passi,
// il passo successivo e cosa succede quando si cambia classe.
import { describe, expect, it } from 'vitest';
import { bozzaVuota, cambiaBackground, cambiaClasse, cambiaSpecie, PASSI, prossimoPasso, statoPassi, type Bozza } from '../src/creazione/percorso';
import * as P from './personaggi';

const stati = (b: Bozza) => Object.fromEntries(Object.entries(statoPassi(b)).map(([k, v]) => [k, v.stato]));

describe('Percorso di creazione', () => {
  it('ha 8 passi nell\'ordine della sezione 5.2', () => {
    expect(PASSI.map((p) => p.id)).toEqual([
      'classe', 'background', 'specie', 'caratteristiche', 'magia', 'equipaggiamento', 'personaggio', 'riepilogo',
    ]);
  });

  it('una bozza vuota parte dalla classe, e tutto è da fare', () => {
    const b = bozzaVuota();
    expect(prossimoPasso(b)).toBe('classe');
    expect(new Set(Object.values(stati(b)))).toEqual(new Set(['da-fare']));
  });

  it('dopo la classe si va al background', () => {
    const b: Bozza = { ...bozzaVuota(), idea: 'Mago dell\'Accademia', classe: 'wizard' };
    expect(stati(b).classe).toBe('fatto');
    expect(prossimoPasso(b)).toBe('background');
  });

  it('Travis completo: tutto fatto, l\'equipaggiamento ha gli avvisi dell\'incenso e della perla (si comprano lì)', () => {
    const s = stati(P.TRAVIS);
    expect(s).toEqual({
      classe: 'fatto', background: 'fatto', specie: 'fatto', caratteristiche: 'fatto',
      magia: 'fatto', equipaggiamento: 'avviso', personaggio: 'fatto', riepilogo: 'avviso',
    });
    expect(statoPassi(P.TRAVIS).equipaggiamento.avvisi.map((a) => a.id).sort()).toEqual(['materiale:find-familiar', 'materiale:identify']);
    expect(prossimoPasso(P.TRAVIS)).toBe('riepilogo');
  });

  it('il barbaro non lancia incantesimi: il passo della magia non serve', () => {
    expect(stati(P.BARBARO).magia).toBe('non-serve');
  });

  it('un avviso accettato non blocca più il passo', () => {
    expect(stati(P.CHIERICO).magia).toBe('avviso');
    expect(stati({ ...P.CHIERICO, avvisiAccettati: ['doppione-trucchetto:guidance'] }).magia).toBe('fatto');
  });

  it('una scelta della specie che manca riapre il passo della specie', () => {
    const { 'human.abile': _tolta, ...scelte } = P.TRAVIS.scelte;
    const b = { ...P.TRAVIS, scelte };
    expect(stati(b).specie).toBe('da-fare');
    expect(prossimoPasso(b)).toBe('specie');
  });

  it('i punti del point buy non spesi tengono aperto il passo delle caratteristiche', () => {
    const b = { ...P.TRAVIS, punteggi: { metodo: 'pointBuy27' as const, base: { FOR: 8, DES: 8, COS: 8, INT: 8, SAG: 8, CAR: 8 } } };
    expect(stati(b).caratteristiche).toBe('da-fare');
  });

  it('un errore sulle caratteristiche le mette in avviso', () => {
    const b = { ...P.TRAVIS, punteggi: { ...P.TRAVIS.punteggi, base: { ...P.TRAVIS.punteggi.base, INT: 16 } } };   // oltre 15 nel point buy
    expect(stati(b).caratteristiche).toBe('avviso');
  });

  it('cambiare classe toglie le scelte della vecchia classe e dice quali', () => {
    const { bozza, tolte } = cambiaClasse(P.TRAVIS, 'fighter');
    expect(bozza.classe).toBe('fighter');
    expect(tolte.sort()).toEqual(['equipaggiamento', 'incantesimi preparati (wizard)', 'libro degli incantesimi', 'wizard.abilita', 'wizard.trucchetti']);
    expect(bozza.scelte['human.abile']).toEqual(['medicine']);                       // la specie resta
    expect(bozza.scelte['magic-initiate.trucchetti']).toEqual(['guidance', 'light']); // il talento resta
    expect(stati(bozza).classe).toBe('da-fare');                                      // manca lo stile di combattimento
    expect(stati(bozza).caratteristiche).toBe('da-fare');   // le abilità del guerriero
    expect(stati(bozza).classe).toBe('da-fare');            // stile e Padronanza d'armi
  });
});

describe('Cambio di background', () => {
  it('Accolito → Saggio: Iniziato passa dalla lista del chierico a quella del mago (p. 83)', () => {
    const { bozza, tolte } = cambiaBackground(P.TRAVIS, 'sage');
    expect(bozza.background).toBe('sage');
    // trucchetti e incantesimo erano della lista del chierico: non valgono più
    expect(tolte.sort()).toEqual(['magic-initiate.incantesimo1', 'magic-initiate.trucchetti']);
    expect(bozza.scelte['magic-initiate.caratteristica']).toEqual(['INT']);   // il talento resta, la caratteristica pure
    expect(bozza.bonusBackground).toEqual({ INT: 2, SAG: 1 });               // INT e SAG ci sono anche nel Saggio
    expect(stati(bozza).magia).toBe('da-fare');
  });

  it('Accolito → Criminale: il bonus su SAG non vale più e Allerta arriva due volte', () => {
    const { bozza, tolte } = cambiaBackground(P.TRAVIS, 'criminal');
    expect(tolte.sort()).toEqual([
      'bonus del background', 'magic-initiate.caratteristica', 'magic-initiate.incantesimo1', 'magic-initiate.trucchetti',
    ]);
    expect(bozza.bonusBackground).toEqual({});
    expect(stati(bozza).specie).toBe('avviso');            // Versatile ha già preso Allerta (p. 87)
    expect(stati(bozza).background).toBe('da-fare');       // i bonus si scelgono nel background
    expect(stati(bozza).caratteristiche).toBe('fatto');
  });

  it('il Soldato fa scegliere un gioco tra quelli dell\'SRD (p. 83, p. 94)', () => {
    const { bozza } = cambiaBackground(P.BARBARO, 'soldier');
    expect(stati(bozza).background).toBe('fatto');
    const senzaGioco = { ...P.BARBARO, scelte: { ...P.BARBARO.scelte, 'soldier.gioco': [] } };
    expect(stati(senzaGioco).background).toBe('da-fare');
    const giocoSbagliato = { ...P.BARBARO, scelte: { ...P.BARBARO.scelte, 'soldier.gioco': ['scacchi'] } };
    expect(stati(giocoSbagliato).background).toBe('avviso');
  });

  it('lasciare il Soldato toglie la scelta del gioco', () => {
    const { tolte } = cambiaBackground(P.BARBARO, 'criminal');
    expect(tolte).toContain('soldier.gioco');
  });
});

describe('Specie e lingue', () => {
  it('senza lingue il passo del background resta da fare (le lingue stanno lì)', () => {
    const { 'origine.lingue': _l, ...scelte } = P.TRAVIS.scelte;
    const s = stati({ ...P.TRAVIS, scelte });
    expect(s.background).toBe('da-fare');
    expect(s.specie).toBe('fatto');
  });

  it('umano → elfo: tolte Abile e Versatile, mancano stirpe, caratteristica e sensi acuti', () => {
    const { bozza, tolte } = cambiaSpecie(P.TRAVIS, 'elf');
    expect(tolte.sort()).toEqual(['human.abile', 'human.versatile']);
    expect(bozza.scelte['origine.lingue']).toEqual(['undercommon', 'elvish']);   // le lingue restano
    expect(stati(bozza).specie).toBe('da-fare');
    expect(prossimoPasso(bozza)).toBe('specie');
  });

  it('se Versatile aveva dato Skilled, se ne vanno anche le sue 3 abilità', () => {
    const b = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'human.versatile': ['skilled'], 'skilled.competenze': ['athletics', 'stealth', 'survival'] } };
    const { tolte } = cambiaSpecie(b, 'dwarf');
    expect(tolte.sort()).toEqual(['human.abile', 'human.versatile', 'skilled.competenze']);
  });

  it('tiefling: eredità e caratteristica da scegliere (p. 86)', () => {
    const { bozza } = cambiaSpecie(P.WARLOCK, 'tiefling');
    expect(stati(bozza).specie).toBe('fatto');
    const { 'tiefling.eredita': _e, ...scelte } = P.WARLOCK.scelte;
    expect(stati({ ...P.WARLOCK, scelte }).specie).toBe('da-fare');
  });
});

describe('Personaggio e allineamento', () => {
  it('nome senza allineamento: passo da fare', () => {
    const { allineamento: _a, ...b } = P.TRAVIS;
    expect(stati(b).personaggio).toBe('da-fare');
  });
  it('nome e allineamento: fatto', () => {
    expect(stati(P.TRAVIS).personaggio).toBe('fatto');
  });
  it('allineamento malvagio non accettato: avviso; accettato: fatto', () => {
    const b = { ...P.TRAVIS, allineamento: 'neutral-evil' };
    expect(stati(b).personaggio).toBe('avviso');
    expect(stati({ ...b, avvisiAccettati: [...b.avvisiAccettati, 'allineamento-malvagio'] }).personaggio).toBe('fatto');
  });
});

describe('Bonus e lingue nel Background (come Character Keep)', () => {
  it('senza bonus il background resta da fare; le caratteristiche no', () => {
    const s = stati({ ...P.TRAVIS, bonusBackground: {} });
    expect(s.background).toBe('da-fare');
    expect(s.caratteristiche).toBe('fatto');
  });
  it('bonus su una caratteristica che il background non dà: avviso nel background', () => {
    const s = stati({ ...P.TRAVIS, bonusBackground: { FOR: 2, SAG: 1 } });
    expect(s.background).toBe('avviso');
  });
  it('lingua doppia: avviso nel background', () => {
    const s = stati({ ...P.LADRO, scelte: { ...P.LADRO.scelte, 'rogue.lingua': ['dwarvish'] } });
    expect(s.background).toBe('avviso');
  });
  it('prima di scegliere la specie: background fatto solo con bonus e lingue', () => {
    const base: Bozza = { ...bozzaVuota(), classe: 'wizard', background: 'acolyte' };
    expect(stati(base).background).toBe('da-fare');
    const ok = { ...base, bonusBackground: { INT: 2, SAG: 1 }, scelte: { 'origine.lingue': ['elvish', 'dwarvish'] } };
    expect(stati(ok).background).toBe('fatto');
    expect(prossimoPasso(ok)).toBe('specie');
  });
});

describe('Iniziato alla Magia da Versatile', () => {
  it('cambiare specie toglie l\'Iniziato di Versatile ma non quello dell\'Accolito', () => {
    const MI2 = 'magic-initiate@human-versatile';
    const b = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte, 'human.versatile': ['magic-initiate'], [`${MI2}.lista`]: ['wizard'], [`${MI2}.trucchetti`]: ['light'] } };
    const { bozza, tolte } = cambiaSpecie(b, 'elf');
    expect(tolte.sort()).toEqual(['human.abile', 'human.versatile', `${MI2}.lista`, `${MI2}.trucchetti`].sort());
    expect(bozza.scelte['magic-initiate.trucchetti']).toEqual(['guidance', 'light']);
  });
});

describe('Personaggio (con l\'idea dentro)', () => {
  it('l\'idea è facoltativa: bastano nome e allineamento', () => {
    const { idea: _i, ...b } = P.TRAVIS;
    expect(stati(b).personaggio).toBe('fatto');
  });
  it('senza nome il passo è da fare', () => {
    expect(stati({ ...P.TRAVIS, nome: '' }).personaggio).toBe('da-fare');
  });
});

describe('Avanti (N da fare)', () => {
  it('classe scelta ma senza le sue scelte: il passo resta da fare, con il conto', () => {
    const b: Bozza = { ...bozzaVuota(), classe: 'rogue' };
    const s = statoPassi(b);
    expect(s.classe.stato).toBe('da-fare');
    expect(s.classe.mancanti).toBe(3);            // Gergo ladresco + 2 Padronanze d'armi: una per tendina
  });
  it('background: mancano bonus e lingue', () => {
    const b: Bozza = { ...bozzaVuota(), classe: 'wizard', background: 'sage' };
    expect(statoPassi(b).background.mancanti).toBe(2);
  });
  it('personaggio: nome e allineamento contano 2, non 3', () => {
    expect(statoPassi({ ...P.TRAVIS, nome: '', allineamento: undefined }).personaggio.mancanti).toBe(2);
  });
  it('un passo fatto non ha niente da fare', () => {
    expect(statoPassi(P.TRAVIS).classe.mancanti).toBe(0);
    expect(statoPassi(P.TRAVIS).equipaggiamento.mancanti).toBe(0);   // ha avvisi, ma non bloccano
  });
});

describe('Cosa manca, in parole', () => {
  it('Travis senza la caratteristica di Iniziato: il passo Magia dice cosa scegliere e da quale fonte', () => {
    const { ['magic-initiate.caratteristica']: _tolta, ...scelte } = P.TRAVIS_SAGGIO.scelte;
    void _tolta;
    const v = statoPassi({ ...P.TRAVIS_SAGGIO, scelte }).magia;
    expect(v.stato).toBe('da-fare');
    expect(v.cosaManca).toEqual(['Talento: Iniziato alla magia: scegli la caratteristica per gli incantesimi (0 su 1)']);
  });
  it('classe e background: le cose da fare con il loro nome', () => {
    const b: Bozza = { ...bozzaVuota(), classe: 'rogue', background: 'sage' };
    const s = statoPassi(b);
    expect(s.classe.cosaManca.length).toBeGreaterThan(0);
    expect(s.classe.cosaManca.every((x) => /: manca|: mancano/.test(x))).toBe(true);
    expect(s.background.cosaManca).toEqual(['Scegli i bonus alle caratteristiche (+2 e +1, oppure +1 a tutte e tre)', 'Scegli le lingue: 0 su 2']);
  });
  it('personaggio: nome e allineamento', () => {
    expect(statoPassi({ ...P.TRAVIS, nome: '', allineamento: undefined }).personaggio.cosaManca).toEqual(['Scrivi il nome', "Scegli l'allineamento"]);
  });
  it('la caratteristica di Iniziato si sceglie anche nel passo Magia', async () => {
    const { blocchiMagia } = await import('../src/creazione/magia');
    const blocco = blocchiMagia(P.TRAVIS_SAGGIO).find((x) => x.id === 'magic-initiate')!;
    expect(blocco.caratteristica).toEqual({ scelta: 'magic-initiate.caratteristica', valore: P.TRAVIS_SAGGIO.scelte['magic-initiate.caratteristica'][0] });
  });
});

describe('Titoli delle scelte di classe (20/11)', () => {
  it('gli strumenti del bardo e del monaco non si chiamano «Incantesimi»', async () => {
    const { scelteDiClasse } = await import('../src/creazione/classe');
    const { bozzaVuota, cambiaClasse } = await import('../src/creazione/percorso');
    const bardo = scelteDiClasse(cambiaClasse(bozzaVuota(), 'bard').bozza).find((s) => s.id === 'bard.strumenti');
    expect(bardo?.titolo).toBe('Strumento musicale');
    const monaco = scelteDiClasse(cambiaClasse(bozzaVuota(), 'monk').bozza).find((s) => s.id === 'monk.strumento');
    expect(monaco?.titolo).toBe('Strumento');
  });
});

describe('bonus del background completi (giro delle 12 classi, 23/11)', () => {
  it('con il solo +2 il passo Background non è fatto', async () => {
    const { bonusCompleto, statoPassi: stato } = await import('../src/creazione/percorso');
    const base = { ...P.TRAVIS, scelte: { ...P.TRAVIS.scelte } } as never as Parameters<typeof stato>[0];
    expect(bonusCompleto({ ...base, bonusBackground: { INT: 2, SAG: 1 } })).toBe(true);
    expect(bonusCompleto({ ...base, bonusBackground: { INT: 1, SAG: 1, CAR: 1 } })).toBe(true);
    expect(bonusCompleto({ ...base, bonusBackground: { INT: 2 } })).toBe(false);
    expect(bonusCompleto({ ...base, bonusBackground: { INT: 2, FOR: 1 } })).toBe(true);    // FOR non è dell'Accolito: lo dice l'avviso, non blocca
    expect(stato({ ...base, bonusBackground: { INT: 2 } }).background.stato).not.toBe('fatto');
  });
});
