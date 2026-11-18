import { useEffect, useMemo, useRef, useState } from 'react';
import { aggiorna, apri as apriPersonaggio, attivo, duplica, elementi, elimina, eliminaBackground, nuovo, salvaBackground, unisciElementi, type Archivio } from './archivio/archivio';
import { elementiUsati, registra, type Elementi } from './creazione/personalizzati';
import { bozzaVuota, cambiaBackground, cambiaClasse, cambiaSpecie, PASSI, prossimoPasso, statoPassi, type Bozza, type IdPasso, type StatoPasso } from './creazione/percorso';
import { importaJSON } from './creazione/riepilogo';
import { descriviTolte } from './creazione/testi';
import { leggiLink } from './esporta/link';
import type { StatoPartita } from './partita/partita';
import { DATI } from './regole';
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
import { useArchivio, useTema } from './ui/salvataggio';

// Home → I miei personaggi → (indice e passi di un personaggio). Informazioni dalla Home.
type Vista = 'home' | 'personaggi' | 'informazioni' | 'indice' | IdPasso;

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

  const setVista = (v: Vista) => { setVistaGrezza(v); setMessaggio(null); window.scrollTo(0, 0); };
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
  useEffect(() => {
    leggiLink(location.hash).then((r) => {
      if (!r) return;
      history.replaceState(null, '', location.pathname + location.search);
      if ('errore' in r) setMessaggio(r.errore);
      else { setRicevuta(r.bozza); setElementiRicevuti(r.elementi); window.scrollTo(0, 0); }
    });
  }, []);
  // I background inseriti dal proprio manuale entrano nei dati del motore (anche quelli di una scheda ricevuta)
  const mieiElementi = elementi(archivio);
  registra(elementiRicevuti ? { background: { ...elementiRicevuti.background, ...mieiElementi.background } } : mieiElementi);
  const stati = useMemo(() => statoPassi(bozza), [bozza]);
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-120 flex-col font-sans">
      <header ref={testata} className="sticky top-0 z-10 border-b border-bordo bg-sfondo/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => { setRicevuta(null); setVista('home'); }} className="font-titolo text-lg text-accento" aria-label="Vai alla Home">
            Companion B20
          </button>
          <button
            onClick={() => setTema(tema === 'notte' ? 'giorno' : 'notte')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-bordo text-testo-2"
            aria-label={tema === 'notte' ? 'Passa al tema giorno' : 'Passa al tema notte'}
          >
            {tema === 'notte' ? <IconaSole /> : <IconaLuna />}
          </button>
        </div>
        {inPasso && vistaReale === vista && !ricevuta && (
          <div className="mt-2">
            <div className="mb-1 text-xs text-testo-2">Passo {numero} di {PASSI.length}</div>
            <div className="h-1 rounded-full bg-bordo">
              <div className="h-1 rounded-full bg-oro transition-[width]" style={{ width: `${(numero / PASSI.length) * 100}%` }} />
            </div>
          </div>
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
        {!ricevuta && vistaReale === 'home' && (
          <Home personaggi={archivio.personaggi.length} apriPersonaggi={() => setVista('personaggi')} apriInformazioni={() => setVista('informazioni')} />
        )}
        {!ricevuta && vistaReale === 'informazioni' && <Informazioni />}
        {!ricevuta && vistaReale === 'personaggi' && (
          <Personaggi
            archivio={archivio}
            apri={(id) => apri(id)}
            crea={() => { setArchivio(nuovo(archivio).archivio); setVista('classe'); }}
            duplica={(id) => setArchivio(duplica(archivio, id).archivio)}
            elimina={(id) => setArchivio(elimina(archivio, id))}
            importa={(testo) => {
              const r = importaJSON(testo);
              if ('errore' in r) { setMessaggio(r.errore); return; }
              setArchivio(nuovo(unisciElementi(archivio, r.elementi), r.bozza, new Date(), r.ritratto).archivio);
              setMessaggio(`Scheda importata: ${r.bozza.nome || 'senza nome'}. È in cima alla lista.`);
            }}
          />
        )}
        {!ricevuta && vistaReale === 'indice' && <Indice nome={bozza.nome} stati={stati} apri={setVista} />}
        {!ricevuta && vistaReale === 'classe' && (
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
        {!ricevuta && vistaReale === 'background' && (
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
        {!ricevuta && vistaReale === 'specie' && (
          <PassoSpecie
            bozza={bozza}
            cambia={setBozza}
            scegli={(id) => {
              const { bozza: nuova, tolte } = cambiaSpecie(bozza, id);
              setBozza(nuova);
              setMessaggio(tolte.length ? `Hai cambiato specie: ho tolto le scelte che non valgono più (${descriviTolte(tolte, NOMI)}).` : null);
            }}
          />
        )}
        {!ricevuta && vistaReale === 'caratteristiche' && <PassoCaratteristiche bozza={bozza} cambia={setBozza} />}
        {!ricevuta && vistaReale === 'magia' && <PassoMagia bozza={bozza} cambia={setBozza} />}
        {!ricevuta && vistaReale === 'equipaggiamento' && <PassoEquipaggiamento bozza={bozza} cambia={setBozza} />}
        {!ricevuta && vistaReale === 'personaggio' && (
          <PassoPersonaggio bozza={bozza} cambia={setBozza} ritratto={corrente?.ritratto} cambiaRitratto={(r) => modifica({ ritratto: r })} />
        )}
        {!ricevuta && vistaReale === 'riepilogo' && partita && (
          <PassoRiepilogo bozza={bozza} cambia={setBozza} apri={(p) => setVista(p)} partita={partita}
            cambiaPartita={(s) => modifica({ partita: s })} ritratto={corrente?.ritratto} elementi={elementiUsati(bozza, mieiElementi)} />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-bordo bg-sfondo/95 backdrop-blur">
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
          ) : vistaReale === 'home' ? null : vistaReale === 'personaggi' || vistaReale === 'informazioni' ? (
            <button onClick={() => setVista('home')} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">Home</button>
          ) : vistaReale === 'indice' ? (
            <>
              <button onClick={() => setVista('personaggi')} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">I miei personaggi</button>
              <button onClick={avanti} className="h-12 flex-1 rounded-xl bg-accento text-base font-medium text-su-accento">Continua</button>
            </>
          ) : (
            <>
              <button onClick={() => setVista('indice')} className="h-12 flex-1 rounded-xl border border-bordo text-base text-testo">Indice</button>
              {vistaReale === 'riepilogo'
                ? <button onClick={() => setVista('personaggi')} className="h-12 flex-2 rounded-xl bg-accento text-base font-medium text-su-accento">I miei personaggi</button>
                : <button onClick={avanti} className="h-12 flex-2 rounded-xl bg-accento text-base font-medium text-su-accento">Avanti</button>}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

const ETICHETTA: Record<StatoPasso, string> = { fatto: 'Fatto', 'da-fare': 'Da fare', avviso: 'Da controllare', 'non-serve': 'Non serve' };
const COLORE: Record<StatoPasso, string> = {
  fatto: 'text-ok', 'da-fare': 'text-testo-2', avviso: 'text-attenzione', 'non-serve': 'text-testo-2',
};

const attivi = (a: { accettato?: boolean; livello: string }[]) => a.filter((x) => !x.accettato && x.livello !== 'info').length;

function Indice({ nome, stati, apri }: { nome: string; stati: ReturnType<typeof statoPassi>; apri: (v: Vista) => void }) {
  return (
    <section>
      <h1 className="mb-1 font-titolo text-2xl text-accento">{nome.trim() || 'Il tuo personaggio'}</h1>
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
