import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { aggiorna, aggiornaTavolo, apri as apriPersonaggio, attivo, duplica, eCopiaCompleta, elementi, elimina, eliminaBackground, eliminaSpecie, eliminaTavolo, esportaTutto, importaTutto, nuovo, nuovoTavolo, portaAlTavolo, salvaBackground, salvaSpecie, tavoli, unisciElementi, type Archivio } from './archivio/archivio';
import { elementiUsati, registra, unione, type Elementi } from './creazione/personalizzati';
import { bozzaVuota, cambiaBackground, cambiaClasse, cambiaSpecie, PASSI, prossimoPasso, statoPassi, type Bozza, type IdPasso, type StatoPasso } from './creazione/percorso';
import { importaJSON } from './creazione/riepilogo';
import { descriviTolte } from './creazione/testi';
import { leggiLink, leggiLinkTavolo } from './esporta/link';
import type { StatoPartita } from './partita/partita';
import { DATI } from './regole';
import type { Tavolo } from './regole/tipi';
import { ElencoTavoli, ModuloTavolo, TavoloRicevuto } from './ui/Tavoli';
import { Home } from './ui/Home';
import { Informazioni } from './ui/Informazioni';
import { PassoBackground } from './ui/PassoBackground';
import { PassoCaratteristiche } from './ui/PassoCaratteristiche';
import { PassoClasse } from './ui/PassoClasse';
import { PassoEquipaggiamento } from './ui/PassoEquipaggiamento';
import { PassoMagia } from './ui/PassoMagia';
import { PassoPersonaggio } from './ui/PassoPersonaggio';
import { PassoRiepilogo } from './ui/PassoRiepilogo';
import { PassoSpecie } from './ui/PassoSpecie';
import { Personaggi } from './ui/Personaggi';
import { chiediMemoriaPersistente, useArchivio, useTema } from './ui/salvataggio';

// Home → I miei personaggi → (indice e passi di un personaggio). Informazioni dalla Home.
type Vista = 'home' | 'personaggi' | 'informazioni' | 'tavoli' | 'tavolo' | 'indice' | IdPasso;
// Schermate senza la barra Indietro / Avanti in basso
const SENZA_BARRA: Vista[] = ['home', 'personaggi', 'informazioni', 'tavoli', 'tavolo'];

// Nomi italiani di classi e background, per i messaggi.
const NOMI = Object.fromEntries([...Object.values(DATI.classi), ...Object.values(DATI.background), ...Object.values(DATI.specie)].map((x) => [x.id, x.nome]));

export default function App() {
  const [archivio, setArchivio] = useArchivio();
  const [tema, setTema] = useTema();
  const [vista, setVistaGrezza] = useState<Vista>('home');
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const corrente = attivo(archivio);
  const bozza = corrente?.bozza ?? bozzaVuota();
  const partita = corrente?.partita;

  const [menu, setMenu] = useState(false);
  // Ogni cambio di schermata entra nella cronologia: il tasto Indietro del telefono torna alla schermata prima
  const setVista = (v: Vista) => {
    setVistaGrezza(v); setMessaggio(null); setMenu(false); window.scrollTo(0, 0);
    if (history.state?.vista !== v) history.pushState({ vista: v }, '');
  };
  useEffect(() => {
    if (!history.state?.vista) history.replaceState({ vista: 'home' }, '');
    const indietro = (e: PopStateEvent) => { setVistaGrezza((e.state?.vista as Vista) ?? 'home'); setMenu(false); setMessaggio(null); window.scrollTo(0, 0); };
    window.addEventListener('popstate', indietro);
    return () => window.removeEventListener('popstate', indietro);
  }, []);
  const modifica = (m: Partial<{ bozza: Bozza; partita: StatoPartita; ritratto: string | undefined }>) =>
    setArchivio((a: Archivio) => (a.attivo ? aggiorna(a, a.attivo, m) : a));
  const setBozza = (b: Bozza) => modifica({ bozza: b });

  // Un personaggio che si apre: se è pronto si va alla scheda, altrimenti al primo passo da fare
  const apri = (id: string, a: Archivio = archivio) => {
    const p = a.personaggi.find((x) => x.id === id);
    setArchivio(apriPersonaggio(a, id));
    setVista(p && prossimoPasso(p.bozza) === 'riepilogo' ? 'riepilogo' : p?.bozza.classe ? 'indice' : 'classe');
  };

  // Scheda arrivata con un link (#scheda=…): si guarda; «Aggiungi ai miei personaggi» la mette nella lista
  const [ricevuta, setRicevuta] = useState<Bozza | null>(null);
  const [elementiRicevuti, setElementiRicevuti] = useState<Elementi | undefined>(undefined);
  // Tavolo arrivato con il link del master (#tavolo=…): «Nuovo personaggio per questo tavolo» o «Usa un mio personaggio»
  const [tavoloRicevuto, setTavoloRicevuto] = useState<Tavolo | null>(null);
  const [tavoloAperto, setTavoloAperto] = useState<string | null>(null);   // il tavolo che il master sta preparando
  useEffect(() => {
    leggiLinkTavolo(location.hash).then((r) => {
      if (!r) return;
      history.replaceState(null, '', location.pathname + location.search);
      if ('errore' in r) setMessaggio(r.errore);
      else { setTavoloRicevuto(r.tavolo); window.scrollTo(0, 0); }
    });
    leggiLink(location.hash).then((r) => {
      if (!r) return;
      history.replaceState(null, '', location.pathname + location.search);
      if ('errore' in r) setMessaggio(r.errore);
      else { setRicevuta(r.bozza); setElementiRicevuti(r.elementi); window.scrollTo(0, 0); }
    });
  }, []);
  // I background inseriti dal proprio manuale entrano nei dati del motore (anche quelli di una scheda ricevuta)
  const mieiElementi = elementi(archivio);
  // e quelli del tavolo (del personaggio aperto o del link appena arrivato), anche se non sono tra i miei
  registra(unione(elementiRicevuti, tavoloRicevuto?.elementi, bozza.tavolo?.elementi, mieiElementi));
  const stati = useMemo(() => statoPassi(bozza), [bozza]);
  // Con almeno un personaggio salvato si chiede al browser di non cancellarlo da solo
  const haPersonaggi = archivio.personaggi.length > 0;
  useEffect(() => { if (haPersonaggi) void chiediMemoriaPersistente(); }, [haPersonaggi]);
  // Altezza della testata in una variabile CSS: le schede del Riepilogo restano fisse appena sotto
  const testata = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = testata.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--alto-testata', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const inPasso = PASSI.some((p) => p.id === vista);
  const numero = inPasso ? PASSI.findIndex((p) => p.id === vista) + 1 : 0;
  // Senza un personaggio aperto i passi non hanno senso: si torna alla lista
  const vistaReale: Vista = (inPasso || vista === 'indice') && !corrente ? 'personaggi' : vista;
  const avanti = () => {
    if (vistaReale === 'indice') setVista(prossimoPasso(bozza));
    else setVista(PASSI[numero]?.id ?? 'indice');
  };
  // Indietro dal passo 1 si torna alla lista dei personaggi
  const indietro = () => setVista(numero > 1 ? PASSI[numero - 2].id : 'personaggi');

  return (
    <div className="mx-auto flex min-h-dvh max-w-120 flex-col font-sans">
      <header ref={testata} className="sticky top-0 z-10 border-b border-bordo bg-sfondo/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <button onClick={() => { setRicevuta(null); setTavoloRicevuto(null); setVista('home'); }} aria-label="Home"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bordo text-testo-2">
            <IconaCasa />
          </button>
          <span className="flex-1 truncate text-center font-titolo text-lg text-accento">
            {corrente && (inPasso || vistaReale === 'indice') && !ricevuta ? (bozza.nome.trim() || 'Nuovo personaggio') : 'Companion B20'}
          </span>
          <button onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu} aria-haspopup="menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bordo text-testo-2">
            <IconaMenu />
          </button>
        </div>
        {inPasso && vistaReale === vista && !ricevuta && (
          <button onClick={() => setVista('indice')} className="mt-2 block w-full text-left" aria-label={`Passo ${numero} di ${PASSI.length}: apri tutti i passi`}>
            <span className="mb-1 flex justify-between text-xs text-testo-2"><span>Passo {numero} di {PASSI.length}: {PASSI[numero - 1].titolo}</span><span className="text-accento">Tutti i passi</span></span>
            <span className="block h-1 rounded-full bg-bordo">
              <span className="block h-1 rounded-full bg-oro transition-[width]" style={{ width: `${(numero / PASSI.length) * 100}%` }} />
            </span>
          </button>
        )}
        {menu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} aria-hidden="true" />
            <div role="menu" className="absolute right-4 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-bordo bg-superficie shadow-lg"
              onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
              <VoceMenu onClick={() => { setRicevuta(null); setTavoloRicevuto(null); setVista('home'); }}>Home</VoceMenu>
              <VoceMenu onClick={() => { setRicevuta(null); setVista('personaggi'); }}>I miei personaggi</VoceMenu>
              <VoceMenu onClick={() => { setRicevuta(null); setTavoloRicevuto(null); setVista('tavoli'); }}>I miei tavoli (master)</VoceMenu>
              {corrente && !ricevuta && <VoceMenu onClick={() => setVista('indice')}>Passi di {bozza.nome.trim() || 'questo personaggio'}</VoceMenu>}
              {corrente && !ricevuta && <VoceMenu onClick={() => setVista('riepilogo')}>Scheda (riepilogo)</VoceMenu>}
              <VoceMenu onClick={() => setTema(tema === 'notte' ? 'giorno' : 'notte')}>
                <span className="flex items-center justify-between">Tema {tema === 'notte' ? 'notte' : 'giorno'}
                  <span className="flex items-center gap-1 text-sm text-testo-2">{tema === 'notte' ? <IconaSole /> : <IconaLuna />}{tema === 'notte' ? 'Passa a giorno' : 'Passa a notte'}</span>
                </span>
              </VoceMenu>
              <VoceMenu onClick={() => { setRicevuta(null); setVista('informazioni'); }}>Informazioni</VoceMenu>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {messaggio && (
          <div role="status" className="mb-4 rounded-xl border border-attenzione/50 bg-superficie p-3 text-sm text-testo">
            {messaggio}
          </div>
        )}
        {ricevuta && (
          <>
            <div className="mb-4 rounded-xl border border-accento bg-superficie p-3 text-sm text-testo">
              Scheda ricevuta con un link. I tuoi personaggi non sono stati toccati.
            </div>
            <PassoRiepilogo bozza={ricevuta} cambia={() => {}} apri={() => {}} ricevuta />
          </>
        )}
        {tavoloRicevuto && !ricevuta && (
          <TavoloRicevuto tavolo={tavoloRicevuto} archivio={archivio}
            nuovo={() => {
              const t = tavoloRicevuto;
              setTavoloRicevuto(null);
              setArchivio(nuovo(unisciElementi(archivio, t.elementi), { ...bozzaVuota(), tavolo: t }).archivio);
              setVista('classe');
            }}
            usa={(id) => { const t = tavoloRicevuto; setTavoloRicevuto(null); apri(id, portaAlTavolo(archivio, id, t)); }}
            rifiuta={() => { setTavoloRicevuto(null); setVista('home'); }}
          />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'home' && (
          <Home personaggi={archivio.personaggi.length} apriPersonaggi={() => setVista('personaggi')} apriTavoli={() => setVista('tavoli')} apriInformazioni={() => setVista('informazioni')} />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'tavoli' && (
          <ElencoTavoli archivio={archivio}
            apri={(id) => { setTavoloAperto(id); setVista('tavolo'); }}
            crea={() => { const r = nuovoTavolo(archivio); setArchivio(r.archivio); setTavoloAperto(r.id); setVista('tavolo'); }} />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'tavolo' && (() => {
          const tv = tavoli(archivio).find((x) => x.id === tavoloAperto);
          if (!tv) return <ElencoTavoli archivio={archivio} apri={(id) => setTavoloAperto(id)} crea={() => { const r = nuovoTavolo(archivio); setArchivio(r.archivio); setTavoloAperto(r.id); }} />;
          return <ModuloTavolo tavolo={tv.tavolo} mieiElementi={mieiElementi}
            cambia={(t) => setArchivio((a: Archivio) => aggiornaTavolo(a, tv.id, t))}
            elimina={() => { setArchivio(eliminaTavolo(archivio, tv.id)); setVista('tavoli'); }} />;
        })()}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'informazioni' && <Informazioni />}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'personaggi' && (
          <Personaggi
            archivio={archivio}
            apri={(id) => apri(id)}
            crea={() => { setArchivio(nuovo(archivio).archivio); setVista('classe'); }}
            duplica={(id) => setArchivio(duplica(archivio, id).archivio)}
            elimina={(id) => setArchivio(elimina(archivio, id))}
            scaricaCopia={() => {
              const { testo, archivio: conData } = esportaTutto(archivio);
              const url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
              const a = document.createElement('a');
              a.href = url; a.download = `companion-b20-personaggi-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setArchivio(conData);
            }}
            importa={(testo) => {
              if (eCopiaCompleta(testo)) {
                const c = importaTutto(archivio, testo);
                if ('errore' in c) { setMessaggio(c.errore); return; }
                setArchivio(c.archivio);
                setMessaggio(`Copia ripristinata: ${c.aggiunti} ${c.aggiunti === 1 ? 'personaggio aggiunto' : 'personaggi aggiunti'}`
                  + (c.gia ? `, ${c.gia} già presenti` : '') + (c.scartati ? `, ${c.scartati} non leggibili` : '') + '.');
                return;
              }
              const r = importaJSON(testo);
              if ('errore' in r) { setMessaggio(r.errore); return; }
              setArchivio(nuovo(unisciElementi(archivio, r.elementi), r.bozza, new Date(), r.ritratto).archivio);
              setMessaggio(`Scheda importata: ${r.bozza.nome || 'senza nome'}. È in cima alla lista.`);
            }}
          />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'indice' && (
          <Indice nome={bozza.nome} stati={stati} apri={setVista} tavolo={bozza.tavolo}
            togliTavolo={() => corrente && window.confirm(`Togliere ${bozza.nome.trim() || 'il personaggio'} dal tavolo «${bozza.tavolo?.nome}»? Le sue scelte restano, spariscono le regole del master.`)
              && setArchivio(portaAlTavolo(archivio, corrente.id, undefined))} />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'classe' && (
          <PassoClasse
            bozza={bozza}
            cambia={setBozza}
            scegli={(id) => {
              const { bozza: nuova, tolte } = cambiaClasse(bozza, id);
              setBozza(nuova);
              setMessaggio(tolte.length ? `Hai cambiato classe: ho tolto le scelte che non valgono più (${descriviTolte(tolte, NOMI)}).` : null);
            }}
          />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'background' && (
          <PassoBackground
            bozza={bozza}
            cambia={setBozza}
            salvaBackground={(bg) => setArchivio((a: Archivio) => salvaBackground(a, bg))}
            eliminaBackground={(id) => {
              const r = eliminaBackground(archivio, id);
              if (r.usatoDa.length) return `Non lo elimino: lo usa ${r.usatoDa.join(', ')}. Cambia prima il background di quel personaggio.`;
              setArchivio(r.archivio);
              return null;
            }}
            scegli={(id) => {
              const { bozza: nuova, tolte } = cambiaBackground(bozza, id);
              setBozza(nuova);
              setMessaggio(tolte.length ? `Hai cambiato background: ho tolto le scelte che non valgono più (${descriviTolte(tolte, NOMI)}).` : null);
            }}
          />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'specie' && (
          <PassoSpecie
            bozza={bozza}
            cambia={setBozza}
            salvaSpecie={(sp) => setArchivio((a: Archivio) => salvaSpecie(a, sp))}
            eliminaSpecie={(id) => {
              const r = eliminaSpecie(archivio, id);
              if (r.usatoDa.length) return `Non la elimino: la usa ${r.usatoDa.join(', ')}. Cambia prima la specie di quel personaggio.`;
              setArchivio(r.archivio);
              return null;
            }}
            scegli={(id) => {
              const { bozza: nuova, tolte } = cambiaSpecie(bozza, id);
              setBozza(nuova);
              setMessaggio(tolte.length ? `Hai cambiato specie: ho tolto le scelte che non valgono più (${descriviTolte(tolte, NOMI)}).` : null);
            }}
          />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'caratteristiche' && <PassoCaratteristiche bozza={bozza} cambia={setBozza} />}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'magia' && <PassoMagia bozza={bozza} cambia={setBozza} />}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'equipaggiamento' && <PassoEquipaggiamento bozza={bozza} cambia={setBozza} />}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'personaggio' && (
          <PassoPersonaggio bozza={bozza} cambia={setBozza} ritratto={corrente?.ritratto} cambiaRitratto={(r) => modifica({ ritratto: r })} />
        )}
        {!ricevuta && !tavoloRicevuto && vistaReale === 'riepilogo' && partita && (
          <PassoRiepilogo bozza={bozza} cambia={setBozza} apri={(p) => setVista(p)} partita={partita}
            cambiaPartita={(s) => modifica({ partita: s })} ritratto={corrente?.ritratto} elementi={elementiUsati(bozza, mieiElementi)} />
        )}
      </main>

      {!tavoloRicevuto && !(!ricevuta && SENZA_BARRA.includes(vistaReale)) && <nav className="fixed inset-x-0 bottom-0 border-t border-bordo bg-sfondo/95 backdrop-blur">
        <div className="mx-auto flex max-w-120 gap-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {ricevuta ? (
            <>
              <button onClick={() => { setRicevuta(null); setElementiRicevuti(undefined); }} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">Chiudi</button>
              <button
                onClick={() => {
                  const r = nuovo(unisciElementi(archivio, elementiRicevuti), ricevuta);
                  setRicevuta(null);
                  setElementiRicevuti(undefined);
                  apri(r.id, r.archivio);
                }}
                className="h-12 flex-2 rounded-xl bg-accento text-base font-medium text-su-accento"
              >
                Aggiungi ai miei personaggi
              </button>
            </>
          ) : SENZA_BARRA.includes(vistaReale) ? null : vistaReale === 'indice' ? (
            <>
              <button onClick={() => setVista('personaggi')} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">I miei personaggi</button>
              <button onClick={avanti} className="h-12 flex-1 rounded-xl bg-accento text-base font-medium text-su-accento">Continua</button>
            </>
          ) : (
            <>
              <button onClick={indietro} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">Indietro</button>
              {vistaReale === 'riepilogo'
                ? <button onClick={() => setVista('personaggi')} className="h-12 flex-2 rounded-xl bg-accento text-base font-medium text-su-accento">I miei personaggi</button>
                : <BottoneAvanti mancanti={stati[vistaReale as IdPasso]?.mancanti ?? 0} avanti={avanti} />}
            </>
          )}
        </div>
      </nav>}
    </div>
  );
}

const ETICHETTA: Record<StatoPasso, string> = { fatto: 'Fatto', 'da-fare': 'Da fare', avviso: 'Da controllare', 'non-serve': 'Non serve' };
const COLORE: Record<StatoPasso, string> = {
  fatto: 'text-ok', 'da-fare': 'text-testo-2', avviso: 'text-attenzione', 'non-serve': 'text-testo-2',
};

const attivi = (a: { accettato?: boolean; livello: string }[]) => a.filter((x) => !x.accettato && x.livello !== 'info').length;

function Indice({ nome, stati, apri, tavolo, togliTavolo }: { nome: string; stati: ReturnType<typeof statoPassi>; apri: (v: Vista) => void; tavolo?: Tavolo; togliTavolo: () => void }) {
  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">{nome.trim() || 'Il tuo personaggio'}</h1>
      {tavolo && (
        <p className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-bordo bg-superficie px-3 text-sm text-testo">
          <span className="py-2">Tavolo: <strong>{tavolo.nome || 'senza nome'}</strong></span>
          <button onClick={togliTavolo} className="min-h-11 shrink-0 px-2 text-sm text-accento">Togli</button>
        </p>
      )}
      <p className="mb-4 text-sm text-testo-2">Tocca un passo per aprirlo. Puoi tornarci quando vuoi.</p>
      <ol className="overflow-hidden rounded-xl border border-bordo bg-superficie">
        {PASSI.map((p, i) => {
          const s = stati[p.id];
          return (
            <li key={p.id} className="border-b border-bordo last:border-b-0">
              <button onClick={() => apri(p.id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
                <span className="w-6 text-sm text-testo-2">{i + 1}</span>
                <span className="flex-1 text-base text-testo">{p.titolo}</span>
                <span className={`text-sm ${COLORE[s.stato]}`}>
                  {ETICHETTA[s.stato]}
                  {s.stato === 'avviso' && ` (${attivi(p.id === 'riepilogo' ? Object.values(stati).flatMap((v) => v.avvisi) : s.avvisi)})`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Avanti si tocca solo a passo completo; finché manca qualcosa dice quante cose (scelta di Patrizio, 18/11).
// Gli avvisi da controllare non bloccano: quelli li decide il master (principio 3, «avvisa, non vieta»).
function BottoneAvanti({ mancanti, avanti }: { mancanti: number; avanti: () => void }) {
  return (
    <button onClick={avanti} disabled={mancanti > 0}
      className="h-12 flex-2 rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo-2">
      {mancanti > 0 ? `Avanti (${mancanti} da fare)` : 'Avanti'}
    </button>
  );
}

function VoceMenu({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button role="menuitem" onClick={onClick} className="block min-h-12 w-full border-b border-bordo px-4 text-left text-base text-testo last:border-b-0">{children}</button>;
}
const IconaCasa = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);
const IconaMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const IconaLuna = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);
const IconaSole = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
