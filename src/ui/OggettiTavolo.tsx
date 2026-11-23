// Gli oggetti del master (21/11): li crea nel suo tavolo, li dà con un link, sblocca l'identificazione quando vuole.
// Il giocatore vede com'è fatto; cosa fa si scopre con lo sblocco (dal servizio, o dal QR al tavolo).
// La maledizione resta qui: non entra mai nel link (anche un riposo breve non la rivela, SRD p. 102).
import { useState } from 'react';
import { semplici, Tendina } from './Tendina';
import { daOggettoSrd, OGGETTI_SRD_PER_MASTER } from '../creazione/oggetti-master';
import { OGGETTI_MAGICI } from '../regole/dati/oggetti-magici';
import type { OggettoDelMaster, VoceElenco } from '../archivio/archivio';
import type { Velo } from '../regole/tipi';
import { Avatar } from './Avatar';
import { creaLinkOggetto } from '../esporta/link';
import { nuoveChiavi, testoQR } from '../sblocchi/cifra';
import { pubblicaSblocco, servizioAttivo } from '../sblocchi/servizio';
import { FoglioDalBasso } from './SchedaIncantesimo';
import { MostraQR } from './QR';

export function OggettiTavolo({ oggetti, nomeTavolo, salva, togli }: {
  oggetti: OggettoDelMaster[]; nomeTavolo: string; salva: (o: OggettoDelMaster) => void; togli: (uid: string) => void;
}) {
  const [modifica, setModifica] = useState<OggettoDelMaster | 'nuovo' | null>(null);
  const [qr, setQr] = useState<OggettoDelMaster | null>(null);
  const [stato, setStato] = useState<Record<string, string>>({});
  const di = (uid: string, t: string) => setStato((s) => ({ ...s, [uid]: t }));

  const dai = async (o: OggettoDelMaster) => {
    const url = await creaLinkOggetto(o, location.href, nomeTavolo);
    try {
      if (navigator.share) await navigator.share({ title: o.apparente, text: `Hai trovato: ${o.apparente}`, url });
      else { await navigator.clipboard.writeText(url); di(o.uid, 'Link copiato: mandalo al giocatore.'); }
      salva({ ...o, datoIl: o.datoIl ?? new Date().toISOString() });
    } catch { /* annullato */ }
  };
  const sblocca = async (o: OggettoDelMaster) => {
    if (!servizioAttivo()) { setQr(o); return; }
    di(o.uid, 'Sblocco…');
    if (await pubblicaSblocco(o.id, o.segreto, o.chiave)) {
      salva({ ...o, sbloccatoIl: new Date().toISOString() });
      di(o.uid, 'Sbloccato: il giocatore lo scopre appena ha l\'app aperta e la connessione.');
    } else di(o.uid, 'Non riesco a raggiungere il servizio: fagli inquadrare il QR.');
  };

  return (
    <section className="mt-6">
      <h2 className="text-base font-medium text-testo">Oggetti del tavolo</h2>
      <p className="mb-2 text-xs text-testo-2">Crei un oggetto, lo dai a un giocatore: vede com'è fatto, non cosa fa. Quando lo identifica (riposo breve o Identificare), tocca «Sblocca».</p>
      {oggetti.length > 0 && (
        <ul className="mb-2 space-y-2">
          {oggetti.map((o) => (
            <li key={o.uid} className="rounded-xl border border-bordo bg-superficie p-3">
              <p className="text-base text-testo">{o.svelato.nome}</p>
              <p className="text-xs text-testo-2">Appare come «{o.apparente}» · {o.sbloccatoIl ? 'sbloccato' : o.datoIl ? 'dato, da identificare' : 'non ancora dato'}{o.maledizione ? ' · maledetto' : ''}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => void dai(o)} className="min-h-11 rounded-lg border border-accento text-sm text-accento">Dai a un giocatore</button>
                {o.sbloccatoIl
                  ? <button onClick={() => setQr(o)} className="min-h-11 rounded-lg border border-bordo text-sm text-testo">Mostra il QR</button>
                  : <button onClick={() => void sblocca(o)} className="min-h-11 rounded-lg bg-accento text-sm font-medium text-su-accento">Sblocca</button>}
                <button onClick={() => setModifica(o)} className="min-h-11 rounded-lg border border-bordo text-sm text-testo">Modifica</button>
                <button onClick={() => window.confirm(`Eliminare «${o.svelato.nome}»? Chi l'ha già ricevuto lo tiene.`) && togli(o.uid)} className="min-h-11 rounded-lg text-sm text-attenzione">Elimina</button>
              </div>
              {stato[o.uid] && <p role="status" className="mt-2 text-sm text-testo">{stato[o.uid]}</p>}
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => setModifica('nuovo')} className="min-h-12 w-full rounded-xl border border-accento text-base text-accento">+ Crea un oggetto</button>
      {modifica && <Modulo iniziale={modifica === 'nuovo' ? null : modifica} chiudi={() => setModifica(null)} salva={(o) => { salva(o); setModifica(null); }} />}
      {qr && (
        <FoglioDalBasso chiudi={() => setQr(null)} titolo={<><h2 className="text-lg font-medium text-testo">Sblocco di «{qr.apparente}»</h2><p className="text-sm text-testo-2">Il giocatore apre l'oggetto nello Zaino e tocca «Inquadra il QR del master»</p></>}>
          <MostraQR testo={testoQR(qr.id, qr.chiave)} />
          <p className="mt-3 text-xs text-testo-2">Mostralo solo quando il personaggio l'ha identificato: chi lo inquadra scopre cosa fa l'oggetto.</p>
        </FoglioDalBasso>
      )}
    </section>
  );
}

function Modulo({ iniziale, chiudi, salva }: { iniziale: OggettoDelMaster | null; chiudi: () => void; salva: (o: OggettoDelMaster) => void }) {
  const s = iniziale?.svelato;
  const [f, setF] = useState({
    nome: s?.nome ?? '', apparente: iniziale?.apparente ?? '', aspetto: iniziale?.aspetto ?? '', descrizione: s?.descrizione ?? '',
    sintonia: s?.sintonia ?? false, ca: s?.bonus.ca ?? 0, ts: s?.bonus.ts ?? 0, att: s?.bonus.attaccoIncantesimi ?? 0, cd: s?.bonus.cdIncantesimi ?? 0,
    cariche: s?.cariche ?? 0, maledizione: iniziale?.maledizione ?? '',
  });
  const campo = 'w-full rounded-lg border border-bordo bg-sfondo px-3 text-base text-testo';
  const [srd, setSrd] = useState('');
  const [variante, setVariante] = useState('');
  const daSrd = (id: string, v?: string) => {
    setSrd(id); setVariante(v ?? '');
    const p = id ? daOggettoSrd(id, v) : null;
    if (!p) return;
    setF((x) => ({ ...x, nome: p.nome, descrizione: p.descrizione, sintonia: p.sintonia, cariche: p.cariche,
      ca: p.bonus.ca ?? 0, ts: p.bonus.ts ?? 0, att: p.bonus.attaccoIncantesimi ?? 0, cd: p.bonus.cdIncantesimi ?? 0 }));
  };
  const varianti = srd ? OGGETTI_MAGICI[srd]?.varianti ?? [] : [];
  const testo = (k: 'nome' | 'apparente', et: string, aiuto?: string) => (
    <label className="block"><span className="mb-1 block text-sm font-medium text-testo">{et}</span>
      {aiuto && <span className="mb-1 block text-xs text-testo-2">{aiuto}</span>}
      <input value={f[k]} maxLength={100} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`h-12 ${campo}`} /></label>
  );
  const area = (k: 'aspetto' | 'descrizione' | 'maledizione', et: string, aiuto: string) => (
    <label className="block"><span className="mb-1 block text-sm font-medium text-testo">{et}</span>
      <span className="mb-1 block text-xs text-testo-2">{aiuto}</span>
      <textarea value={f[k]} rows={3} maxLength={1500} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`py-2 ${campo}`} /></label>
  );
  const numero = (k: 'ca' | 'ts' | 'att' | 'cd' | 'cariche', et: string) => (
    <label className="flex items-center justify-between gap-3 text-sm text-testo"><span>{et}</span>
      <input inputMode="numeric" value={f[k] || ''} placeholder="0" onChange={(e) => setF({ ...f, [k]: Number(e.target.value.replace(/[^\d-]/g, '')) || 0 })}
        className="h-11 w-20 rounded-lg border border-bordo bg-sfondo text-center text-base" /></label>
  );
  const conferma = async () => {
    const chiavi = iniziale ?? await nuoveChiavi();
    salva({
      uid: iniziale?.uid ?? `mo-${Date.now().toString(36)}`, segreto: chiavi.segreto, id: chiavi.id, chiave: chiavi.chiave,
      ...(iniziale?.datoIl ? { datoIl: iniziale.datoIl } : {}), ...(iniziale?.sbloccatoIl ? { sbloccatoIl: iniziale.sbloccatoIl } : {}),
      apparente: f.apparente.trim() || f.nome.trim(), ...(f.aspetto.trim() ? { aspetto: f.aspetto.trim() } : {}),
      ...(f.maledizione.trim() ? { maledizione: f.maledizione.trim() } : {}),
      svelato: { nome: f.nome.trim(), sintonia: f.sintonia, ...(f.descrizione.trim() ? { descrizione: f.descrizione.trim() } : {}), ...(f.cariche ? { cariche: f.cariche } : {}),
        bonus: { ...(f.ca ? { ca: f.ca } : {}), ...(f.ts ? { ts: f.ts } : {}), ...(f.att ? { attaccoIncantesimi: f.att } : {}), ...(f.cd ? { cdIncantesimi: f.cd } : {}) } },
    });
  };
  return (
    <FoglioDalBasso chiudi={chiudi} titolo={<h2 className="text-lg font-medium text-testo">{iniziale ? 'Modifica l\'oggetto' : 'Un oggetto per il tavolo'}</h2>}>
      <div className="space-y-3">
        {iniziale?.datoIl && <p className="rounded-lg border border-attenzione p-2 text-sm text-testo">L'hai già dato: se cambi qualcosa, rimanda il link al giocatore.</p>}
        {!iniziale && (
          <div className="space-y-2 rounded-xl border border-bordo bg-sfondo p-3">
            <Tendina etichetta="Parti da un oggetto dell'SRD (facoltativo)" valore={srd}
              opzioni={semplici(OGGETTI_SRD_PER_MASTER().map((o) => ({ id: o.id, nome: o.nome })))}
              cambia={(id) => daSrd(id)} />
            {varianti.length > 0 && (
              <Tendina etichetta="Quale" valore={variante || varianti[0].id} opzioni={semplici(varianti.map((v) => ({ id: v.id, nome: `${v.nome} · ${v.rarita}` })))}
                cambia={(v) => daSrd(srd, v)} />
            )}
            <p className="text-xs text-testo-2">Riempie nome, effetto, sintonia, cariche e bonus. Poi scrivi come appare: è quello che il giocatore vede subito.</p>
          </div>
        )}
        {testo('nome', 'Nome vero', 'Lo vede il giocatore dopo l\'identificazione')}
        {testo('apparente', 'Come appare', 'Quello che il giocatore vede subito, per esempio «Anello d\'osso inciso»')}
        {area('aspetto', 'Aspetto', 'Com\'è fatto: lo vede subito')}
        {area('descrizione', 'Cosa fa', 'Nascosto finché non sblocchi')}
        <label className="flex min-h-11 items-center justify-between text-sm text-testo"><span>Richiede sintonia</span>
          <input type="checkbox" checked={f.sintonia} onChange={(e) => setF({ ...f, sintonia: e.target.checked })} className="h-6 w-6 accent-[var(--accento)]" /></label>
        <p className="text-xs text-testo-2">I bonus entrano nella scheda dopo lo sblocco (e la sintonia, se serve).</p>
        {numero('ca', 'Bonus alla CA')}
        {numero('ts', 'Bonus ai tiri salvezza')}
        {numero('att', 'Bonus all\'attacco con incantesimi')}
        {numero('cd', 'Bonus alla CD degli incantesimi')}
        {numero('cariche', 'Cariche (0 se non ne ha)')}
        {area('maledizione', 'Maledizione (facoltativa)', 'Solo per te: non va nel link e non si scopre con lo sblocco')}
        <button disabled={!f.nome.trim()} onClick={() => void conferma()} className="h-12 w-full rounded-xl bg-accento text-base font-medium text-su-accento disabled:bg-bordo disabled:text-testo">Salva l'oggetto</button>
      </div>
    </FoglioDalBasso>
  );
}

// Il giocatore apre il link dell'oggetto: sceglie a quale personaggio darlo
export function OggettoRicevuto({ velo, voci, dai, rifiuta }: {
  velo: Velo; voci: VoceElenco[]; dai: (pgId: string) => void; rifiuta: () => void;
}) {
  return (
    <section>
      <p className="text-sm text-testo-2">{velo.tavolo ? `Dal master del tavolo «${velo.tavolo}»` : 'Dal tuo master'}</p>
      <h1 className="mb-3 font-titolo text-2xl text-accento">{velo.apparente}</h1>
      {velo.aspetto && <p className="mb-3 rounded-xl border border-oro bg-superficie p-4 text-base italic text-testo">{velo.aspetto}</p>}
      <p className="mb-4 text-sm text-testo-2">Non sai ancora cosa fa: va identificato, con un riposo breve passato a studiarlo o con l'incantesimo Identificare (SRD p. 102). Poi il master lo sblocca.</p>
      {voci.length ? (
        <>
          <h2 className="mb-2 text-base font-medium text-testo">A chi lo dai?</h2>
          <ul className="overflow-hidden rounded-xl border border-bordo">
            {voci.map((v) => (
              <li key={v.id} className="border-b border-bordo last:border-b-0">
                <button onClick={() => dai(v.id)} className="flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left">
                  <Avatar ritratto={v.ritratto} classe={v.classeId} iniziali={v.iniziali} />
                  <span className="min-w-0"><span className="block truncate text-base text-testo">{v.nome}</span>
                    <span className="block truncate text-sm text-testo-2">{v.specie} · {v.classe}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="text-base text-testo">Prima crea il tuo personaggio, poi riapri il link.</p>}
      <button onClick={rifiuta} className="mt-3 h-12 w-full rounded-xl border border-bordo text-base text-testo">Non ora</button>
    </section>
  );
}
