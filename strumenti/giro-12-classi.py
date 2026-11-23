# Prova dall'interfaccia (23/11; dal blocco 36 anche i livelli fino al 5°, --livello=N): crea un personaggio per ognuna delle 12 classi passando da tutti i passi, come un giocatore.
# Serve l'app avviata con «npx vite preview --port 4173» e Playwright per Python. Uso: python3 strumenti/giro-12-classi.py [Classe ...]
# Giro delle 12 classi dall'interfaccia: ogni passo si riempie come farebbe un giocatore, poi si salva.
import asyncio, json, re, sys
from playwright.async_api import async_playwright

PG = [('Barbaro','Soldato','Nano'), ('Bardo','Criminale','Halfling'), ('Chierico','Accolito','Dragonide'), ('Druido','Sapiente','Elfo'),
      ('Guerriero','Soldato','Orco'), ('Monaco','Criminale','Umano'), ('Paladino','Soldato','Tiefling'), ('Ranger','Soldato','Gnomo'),
      ('Ladro','Criminale','Halfling'), ('Stregone','Sapiente','Dragonide'), ('Warlock','Accolito','Tiefling'), ('Mago','Accolito','Umano')]
if [a for a in sys.argv[1:] if not a.startswith('--')]: PG = [x for x in PG if x[0] in sys.argv[1:]]

async def da_fare(pg):
    t = await pg.locator('button:has-text("Avanti"), button:has-text("Salva il personaggio")').last.inner_text()
    m = re.search(r'(\d+) da fare', t)
    return int(m.group(1)) if m else 0, t

async def riempi(pg, log):
    for giro in range(60):
        n, t = await da_fare(pg)
        if n == 0: return True
        main = pg.locator('main')
        # 1. una tendina vuota con opzioni valide
        sels = main.locator('select')
        fatto = False
        for k in range(await sels.count()):
            s = sels.nth(k)
            if not await s.is_visible() or await s.input_value() != '': continue
            opz = await s.evaluate("e=>[...e.options].filter(o=>o.value&&!o.disabled).map(o=>o.value)")
            if opz:
                await s.select_option(opz[0]); fatto = True; log.append(f'tendina {await s.evaluate("e=>e.labels[0]?.innerText||e.getAttribute(\'aria-label\')||\'\'")!r} → {opz[0]}'); break
        if fatto: continue
        # 2. un contatore di incantesimi incompleto: apri e scegli
        cont = main.locator('button:not([disabled])', has_text=re.compile(r'(\d+)/(\d+) ›'))
        for k in range(await cont.count()):
            b = cont.nth(k)
            m = re.search(r'(\d+)/(\d+) ›', await b.inner_text())
            if m and int(m.group(1)) < int(m.group(2)):
                await b.tap(); await pg.wait_for_timeout(250)
                dlg = pg.locator('[role=dialog]').last
                for _ in range(int(m.group(2)) - int(m.group(1))):
                    v = dlg.locator('ul button[aria-pressed="false"]:not([disabled])').first
                    if await v.count(): await v.tap(); await pg.wait_for_timeout(80)
                await dlg.get_by_role('button', name='Chiudi').first.tap(); await pg.wait_for_timeout(200)
                log.append(f'incantesimi {m.group(0)}'); fatto = True; break
        if fatto: continue
        lista = main.locator('div:has(> p:text-is("Prima scegli la lista")) button:not([disabled])')
        if await lista.count():
            await lista.first.tap(); log.append('lista Iniziato (Magia)'); continue
        # 3. Iniziato alla magia: caratteristica con i pulsanti
        fs = main.locator('fieldset:has(legend:has-text("Iniziato alla magia"))')
        for k in range(await fs.count()):
            car = fs.nth(k).locator('button:has-text("Intelligenza"), button:has-text("Saggezza"), button:has-text("Carisma")')
            if await car.count() and not await fs.nth(k).locator('button[aria-pressed="true"]:has-text("Intelligenza"), button[aria-pressed="true"]:has-text("Saggezza"), button[aria-pressed="true"]:has-text("Carisma")').count():
                await car.nth(1).tap(); fatto = True; log.append('Iniziato: Saggezza'); break
            liste = fs.nth(k).locator('button:has-text("Chierico"), button:has-text("Druido"), button:has-text("Mago")')
            if await liste.count() and not await fs.nth(k).locator('button[aria-pressed="true"]').count():
                await liste.first.tap(); fatto = True; log.append('Iniziato: lista'); break
        if fatto: continue
        # 4. abilità della classe nella griglia
        ab = main.locator('button[aria-pressed="false"]:not([disabled]):has(span.h-5.w-5)')
        if await ab.count():
            await ab.first.tap(); log.append('abilità'); continue
        mae = main.locator('button[aria-label^="Maestria"][aria-pressed="false"]:not([disabled])')
        if await mae.count():
            await mae.first.tap(); log.append('maestria'); continue
        # 5. il nome
        nome = main.locator('input:not([type=file])').first
        if await nome.count() and await nome.input_value() == '':
            await nome.fill('Prova'); log.append('nome'); continue
        # 6. bonus del background
        bon = main.locator('button:has-text("+2 e +1")[aria-pressed="false"]')
        if await bon.count():
            await bon.first.tap(); log.append('bonus'); continue
        # 7. un riquadro chiuso «Tutte (n)» può nascondere abilità da scegliere
        tutte = main.locator('button', has_text=re.compile(r'^Tutte \(\d+\)'))
        if await tutte.count():
            await tutte.first.tap(); log.append('apri tutte'); continue
        log.append(f'BLOCCATO: {t}')
        return False
    return False

LIVELLO_FINALE = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--livello=')), '5'))

async def riempi_tendine(sez):
    for _ in range(8):   # una scelta può farne comparire altre (il talento, Guerriero benedetto)
        vuote = 0
        for s in await sez.locator('select').all():
            if await s.input_value() or not await s.is_visible(): continue
            vuote += 1
            ok = [v for v in [await o.get_attribute('value') for o in await s.locator('option:not([disabled])').all()] if v]
            if ok: await s.select_option(ok[0]); await asyncio.sleep(0.05)
        if not vuote: return True
    return False

async def main():
    rapporto = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 360, 'height': 740}, device_scale_factor=1, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errori = []
        pg.on('pageerror', lambda e: errori.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:4173/'); await pg.evaluate("localStorage.clear()"); await pg.reload()
        for classe, bg, specie in PG:
            log, passi = [], []
            salito_ok = True
            await pg.goto('http://localhost:4173/'); await pg.tap('text=I miei personaggi')
            await pg.tap('button[aria-label="Crea un nuovo personaggio"]'); await pg.wait_for_timeout(200)
            await pg.get_by_role('button', name='Crea da zero').tap(); await pg.wait_for_timeout(200)   # dal 23/11 il «+» propone anche i personaggi pronti
            await pg.locator(f'li:has-text("{classe}") >> button >> nth=0').first.tap(); await pg.wait_for_timeout(200)
            for passo in range(8):
                titolo = (await pg.locator('main h1').first.inner_text()).strip()
                if 'background' in titolo.lower(): await pg.get_by_role('button', name=re.compile(rf'^{bg}')).first.tap(); await pg.wait_for_timeout(200)
                if 'specie' in titolo.lower(): await pg.locator(f'li:has-text("{specie}") >> button[aria-pressed] >> nth=0').first.tap(); await pg.wait_for_timeout(200)
                if 'caratteristiche' in titolo.lower():
                    c = pg.locator('button:has-text("Metti i valori consigliati")')
                    if await c.count(): await c.first.tap(); await pg.wait_for_timeout(150)
                if 'magia' in titolo.lower():
                    log.append('consiglio magia: ' + str(await pg.locator('summary:has-text("Non sai quali scegliere?")').count()))
                ok = await riempi(pg, log)
                passi.append((titolo, ok))
                await pg.screenshot(path=f'/tmp/giro-{classe}_{passo}.png', full_page=False)
                if not ok: break
                pulsante = pg.locator('button:has-text("Salva il personaggio")')
                if await pulsante.count() and await pulsante.first.is_enabled():
                    await pulsante.first.tap(); await pg.wait_for_timeout(400)
                    chiudi = pg.locator('[role=dialog] button').first
                    if await chiudi.count(): await chiudi.tap(); await pg.wait_for_timeout(300)
                    break
                await pg.locator('button:has-text("Avanti")').last.tap(); await pg.wait_for_timeout(250)
            # Revisione del 23/11: dopo il salvataggio sale di livello dall'interfaccia fino al 5°
            for n in range(2, LIVELLO_FINALE + 1):
                if not salito_ok: break
                await pg.get_by_role('tab', name='Chi è').tap(); await pg.wait_for_timeout(150)
                sali = pg.get_by_role('button', name=f'Sali al {n}° livello')
                if not await sali.count(): log.append(f'BLOCCATO: niente «Sali al {n}°»'); salito_ok = False; break
                await sali.first.tap(); await pg.wait_for_timeout(250)
                sez = pg.locator('section[aria-labelledby="titolo-livello"]')
                await riempi_tendine(sez)
                passa = sez.get_by_role('button', name=f'Passa al {n}° livello')
                if not (await passa.count() and await passa.is_enabled()):
                    vuote = [await x.evaluate("e=>(e.labels[0]?.innerText||'')+' :: '+[...e.options].map(o=>o.value+(o.disabled?'(x)':'')).join(',')") for x in await sez.locator('select').all() if not await x.input_value() and await x.is_visible()]
                    log.append(f'BLOCCATO al {n}°: tendine vuote {vuote}'); salito_ok = False; break
                await passa.tap(); await pg.wait_for_timeout(350)
                passi.append((f'livello {n}', True))
            # Riepilogo: numeri e avvisi
            testo = await pg.locator('main').inner_text()
            avvisi = []
            apri = pg.locator('summary:has-text("Da controllare")')
            if await apri.count():
                await apri.first.tap(); await pg.wait_for_timeout(200)
                t2 = await pg.locator('main').inner_text()
                blocco = t2[t2.find('Da controllare'):t2.find('Riposo breve')]
                avvisi = [r.strip() for r in blocco.split('\n')[1:] if len(r.strip()) > 20 and not r.strip().startswith(('Vai al passo', 'Accetta'))]
            await pg.screenshot(path=f'/tmp/giro-{classe}_fine.png')
            arch = json.loads(await pg.evaluate("localStorage.getItem('companion-b20:personaggi')") or '{}')
            ultimo = max(arch.get('personaggi', []), key=lambda x: x.get('aggiornato', ''), default={})
            salvato = bool(ultimo.get('conclusoIl') or ultimo.get('bozza', {}).get('conclusoIl'))
            rapporto[classe] = {'passi': passi, 'salvato': salvato, 'avvisi': avvisi[:12], 'bloccato': [l for l in log if l.startswith('BLOCC')]}
            print([l for l in log if l.startswith('consiglio')]); print(classe, 'salvato' if salvato else 'NON SALVATO', [t for t, ok in passi if not ok], avvisi[:6])
        print('errori pagina:', errori[:5])
        json.dump(rapporto, open('/tmp/giro-rapporto.json', 'w'), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main())
