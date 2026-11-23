// Passo 7: Personaggio (sezione 5.2). Chi è, in parole tue: l'idea, il nome, l'allineamento (SRD p. 21) e i dettagli
// per interpretarlo. Obbligatori solo il nome e l'allineamento.
import type { Bozza } from '../creazione/percorso';
import { ALLINEAMENTI } from '../regole/dati/base';
import { Tendina } from './Tendina';
import { Avatar, riduciRitratto } from './Avatar';
import { iniziali } from '../archivio/archivio';
import { useState } from 'react';

type Ruolo = NonNullable<Bozza['ruolo']>;
const CAMPI: { chiave: keyof Ruolo; etichetta: string; esempio: string }[] = [
  { chiave: 'aspetto', etichetta: 'Aspetto', esempio: 'Alto, magro, occhiali tondi, tunica sempre stirata' },
  { chiave: 'trattoVisibile', etichetta: 'Il tratto che si nota subito', esempio: 'Prende appunti su tutto' },
  { chiave: 'oggetto', etichetta: 'L\'oggetto che lo identifica', esempio: 'Il diploma dell\'Accademia, sempre con sé' },
  { chiave: 'segreto', etichetta: 'Il segreto', esempio: 'Non ha mai lanciato un incantesimo fuori dall\'aula' },
];

const campo = 'w-full rounded-lg border border-bordo bg-superficie px-3 text-base text-testo placeholder:text-testo-2';

export function PassoPersonaggio({ bozza, cambia, ritratto, cambiaRitratto }: {
  bozza: Bozza; cambia: (b: Bozza) => void; ritratto?: string; cambiaRitratto: (r: string | undefined) => void;
}) {
  const [erroreFoto, setErroreFoto] = useState(false);
  const ruolo = bozza.ruolo ?? {};
  const malvagio = bozza.allineamento ? ALLINEAMENTI[bozza.allineamento]?.malvagio : false;
  return (
    <section className="space-y-4">
      <div>
        <h1 className="mb-1 font-titolo text-2xl text-accento">Il personaggio</h1>
        <p className="text-sm text-testo-2">Chi è, in parole tue. Servono solo il nome e l'allineamento; il resto aiuta a interpretarlo.</p>
      </div>

      <div className="flex items-center gap-3">
        <Avatar ritratto={ritratto} classe={bozza.classe} iniziali={iniziali(bozza.nome || 'Senza nome')} dim={72} />
        <div className="flex flex-1 flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-bordo px-3 text-sm text-testo">
            {ritratto ? 'Cambia il ritratto' : 'Scegli un ritratto'}
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try { cambiaRitratto(await riduciRitratto(f)); setErroreFoto(false); } catch { setErroreFoto(true); }
            }} />
          </label>
          {ritratto && <button onClick={() => cambiaRitratto(undefined)} className="min-h-11 rounded-lg px-3 text-sm text-accento">Togli il ritratto</button>}
        </div>
      </div>
      {erroreFoto && <p className="text-sm text-attenzione">Non riesco a leggere questa immagine: prova con un'altra foto.</p>}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-testo">In una frase, chi è?</span>
        <textarea
          rows={2}
          value={bozza.idea ?? ''}
          onChange={(e) => cambia({ ...bozza, idea: e.target.value })}
          placeholder="Mago appena uscito dall'Accademia, «pronto per il mondo»"
          className={`${campo} py-2`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-testo">Nome</span>
        <input
          value={bozza.nome}
          onChange={(e) => cambia({ ...bozza, nome: e.target.value })}
          autoComplete="off"
          className={`${campo} h-12 ${bozza.nome.trim() ? '' : 'border-attenzione bg-attenzione/10'}`}
        />
      </label>

      <div>
        <Tendina
          etichetta="Allineamento"
          valore={bozza.allineamento ?? ''}
          opzioni={Object.entries(ALLINEAMENTI).map(([id, a]) => ({ id, nome: a.nome, disattivata: false, ...(a.malvagio ? { motivo: 'chiedi al master' } : {}) }))}
          cambia={(v) => cambia({ ...bozza, allineamento: v || undefined })}
        />
        {malvagio && <p className="mt-1 text-sm text-attenzione">Il gioco presume personaggi non malvagi: chiedi al master prima (SRD p. 21).</p>}
      </div>

      {CAMPI.map((c) => (
        <label key={c.chiave} className="block">
          <span className="mb-1 block text-sm font-medium text-testo">{c.etichetta}</span>
          <input
            value={ruolo[c.chiave] ?? ''}
            onChange={(e) => cambia({ ...bozza, ruolo: { ...ruolo, [c.chiave]: e.target.value } })}
            placeholder={c.esempio}
            autoComplete="off"
            className={`${campo} h-12`}
          />
        </label>
      ))}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-testo">La sua storia</span>
        <span className="mb-1 block text-xs text-testo-2">Da dove viene, la famiglia, cosa lo ha portato all'avventura. Facoltativa, lunga quanto vuoi.</span>
        <textarea
          value={ruolo.storia ?? ''}
          onChange={(e) => cambia({ ...bozza, ruolo: { ...ruolo, storia: e.target.value } })}
          placeholder="Figlio di un rilegatore e di una maga di corte, è stato il primo della famiglia a entrare all'Accademia…"
          rows={6}
          className={`${campo} resize-y py-2 leading-relaxed`}
        />
      </label>
    </section>
  );
}
