# Testo di una pagina dell'SRD 5.2.1 italiano a due colonne, in ordine di lettura:
# prima la colonna sinistra poi la destra, righe raggruppate per linea di base (non per «top»,
# che con il corsivo e i titoli in GillSans sbaglia l'ordine).
import pdfplumber

META = 297          # le colonne partono a x 63 e 313
ALTO, BASSO = 40, 744   # sotto 744 c'è il piè di pagina (System Reference Document 5.2.1, numero)

def righe_colonna(pagina, x0, x1):
    cs = [c for c in pagina.chars if x0 <= c['x0'] < x1 and ALTO <= c['top'] <= BASSO]
    x_col = min((c['x0'] for c in cs if c['text'].strip()), default=x0)
    gruppi = []
    for c in sorted(cs, key=lambda c: (-c['matrix'][5], c['x0'])):
        base = c['matrix'][5]
        if gruppi and abs(gruppi[-1][0] - base) < 2.5:
            gruppi[-1][1].append(c)
        else:
            gruppi.append([base, [c]])
    out = []
    for base, l in gruppi:
        l.sort(key=lambda c: c['x0'])
        testo, prima = '', None
        for c in l:
            if prima is not None and c['x0'] - prima['x1'] > min(c['size'], prima['size']) * 0.18 and not testo.endswith(' ') and c['text'] != ' ':
                testo += ' '
            testo += c['text']
            prima = c
        titolo = all(c['size'] >= 11.5 for c in l if c['text'].strip())
        tabella = not titolo and all('GillSans' in c['fontname'] for c in l if c['text'].strip())
        primo = next((c for c in l if c['text'].strip()), l[0])
        # nuovo paragrafo: rientro della prima riga, oppure riga che comincia in grassetto (es. «Utilizzo di uno slot…»)
        rientro = primo['x0'] - x_col > 4
        grassetto = 'Bold' in primo['fontname']
        out.append((titolo, rientro and not titolo, grassetto and not titolo, ('‖' if tabella else '') + testo.strip()))
    return out

def pagina(pdf, n):
    p = pdf.pages[n - 1]
    return righe_colonna(p, 0, META) + righe_colonna(p, META, p.width)

if __name__ == '__main__':
    import sys
    pdf = pdfplumber.open(sys.argv[1])
    a, b = int(sys.argv[2]), int(sys.argv[3])
    righe = []
    for n in range(a, b + 1):
        prima_rientrata = False
        for t, rientro, grassetto, r in pagina(pdf, n):
            # paragrafo nuovo: la prima riga rientrata dopo una riga a filo (un blocco tutto rientrato resta unito),
            # oppure una riga in grassetto dopo una frase finita (il titoletto su due righe resta unito)
            fine = bool(righe) and righe[-1][-1:] in '.:!?»)'
            if righe and righe[-1] and not r[:1].islower() and (fine and ((rientro and not prima_rientrata) or grassetto)):
                righe.append('')
            righe.append(('¶' if t else '') + r)
            prima_rientrata = rientro
    open(sys.argv[4], 'w', encoding='utf-8').write('\n'.join(righe) + '\n')
