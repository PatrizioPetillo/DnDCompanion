# Giro di prova dell'aumento di livello (23/11, schermata unica): i 12 personaggi di prova salvati al 1° livello
# salgono al 2° dall'interfaccia: «Sali al 2° livello», tendine in cima alla scheda, «Passa al 2° livello».
# Uso: archivio preparato in /tmp/arch-12.json, app su http://localhost:4173
import asyncio, json
from playwright.async_api import async_playwright
URL = 'http://localhost:4173/'
async def riempi_tendine(sez):
    for _ in range(6):   # una scelta può farne comparire altre (Guerriero benedetto)
        vuote = 0
        for s in await sez.locator('select').all():
            if await s.input_value(): continue
            vuote += 1
            ok = [await o.get_attribute('value') for o in await s.locator('option:not([disabled])').all()]
            ok = [v for v in ok if v]
            if ok: await s.select_option(ok[0]); await asyncio.sleep(0.05)
        if not vuote: return True
    return False
async def main():
    archivio = open('/tmp/arch-12.json').read()
    nomi = [p['bozza']['nome'] for p in json.loads(archivio)['personaggi']]
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.evaluate("a=>localStorage.setItem('companion-b20:personaggi', a)", archivio)
        esiti = {}
        for k, nome in enumerate(nomi):
            await pg.goto(URL); await pg.wait_for_timeout(400)
            await pg.get_by_text('I miei personaggi').first.click(); await pg.wait_for_timeout(250)
            await pg.get_by_text(nome, exact=True).first.click(); await pg.wait_for_timeout(400)
            await pg.get_by_role('tab', name='Chi è').click()
            await pg.get_by_role('button', name='Sali al 2° livello').first.click(); await pg.wait_for_timeout(300)
            sez = pg.locator('section[aria-labelledby="titolo-livello"]')
            await riempi_tendine(sez)
            if k == 6: await pg.screenshot(path='/tmp/livello-paladino.png', full_page=True)
            passa = sez.get_by_role('button', name='Passa al 2° livello')
            if await passa.count() and await passa.is_enabled():
                await passa.click(); await pg.wait_for_timeout(400)
                testo = await pg.locator('main').inner_text()
                esiti[nome] = 'al 2°' if 'Livello 2' in testo or '2° livello' in testo else 'cliccato, livello non visibile'
            else:
                esiti[nome] = 'BLOCCATO: ' + (await sez.inner_text())[:300].replace('\n', ' | ')
        for n, e in esiti.items(): print(f'{n}: {e}')
        print('errori pagina:', errs)
        await b.close()
asyncio.run(main())
