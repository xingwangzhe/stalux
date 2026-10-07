"""Rebuild Stalux's OFL math auxiliary font with fonttools[woff] (no FontCreator).

Sources: KaTeX/katex-fonts commit 56e79c93c88c9054b017cc92e496b383e0bf82d7.
Their font name tables explicitly license the font data under OFL 1.1.
The repository's MIT license does not replace these font-specific terms.
"""
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts/font-sources"
script = TTFont(SOURCE / "KaTeX_Script-Regular.ttf")
main = TTFont(SOURCE / "KaTeX_Main-Regular.ttf")
# Unicode script capitals contain eight legacy letterlike symbols.
capitals = [0x1D49C,0x212C,0x1D49E,0x1D49F,0x2130,0x2131,0x1D4A2,
            0x210B,0x2110,0x1D4A5,0x1D4A6,0x2112,0x2133,0x1D4A9,
            0x1D4AA,0x1D4AB,0x1D4AC,0x211B,0x1D4AE,0x1D4AF,
            0x1D4B0,0x1D4B1,0x1D4B2,0x1D4B3,0x1D4B4,0x1D4B5]
glyphs = {}; metrics = {}; cmap = {}
for g in [".notdef", "space"]:
    glyphs[g] = script['glyf'][g]
    metrics[g] = script['hmtx'][g]
cmap[32] = cmap[160] = "space"
for letter, cp in zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ", capitals):
    original = script.getBestCmap()[ord(letter)]
    name = f"u{cp:X}"
    glyphs[name] = script['glyf'][original]
    metrics[name] = script['hmtx'][original]
    cmap[cp] = name
# Derive primes from KaTeX Main's OFL prime. Match the previous auxiliary
# font's bounding box, advance widths and repeated-prime spacing. The curve
# design changes slightly; it is not copied from the ambiguous Temml binary.
prime = main.getGlyphSet()[main.getBestCmap()[0x2032]]
for cp, count, reflected in [(0x2032,1,False),(0x2033,2,False),
                            (0x2034,3,False),(0x2057,4,False),
                            (0x2035,1,True),(0x2036,2,True),(0x2037,3,True)]:
    name = f"u{cp:X}"
    pen = TTGlyphPen(None)
    sx, sy = 273/232, 453/517
    for i in range(count):
        dx = 67 - 30*sx + 240*i
        if reflected:
            transform = (-sx,0,0,sy,407-(67-30*sx)+240*i,96-43*sy)
        else:
            transform = (sx,0,0,sy,dx,96-43*sy)
        prime.draw(TransformPen(pen, transform))
    glyphs[name] = pen.glyph()
    metrics[name] = (407+240*(count-1),67)
    cmap[cp] = name
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(list(glyphs)); fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs); fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=735, descent=-314, lineGap=90)
fb.setupOS2(sTypoAscender=800,sTypoDescender=-200,sTypoLineGap=90,
            usWinAscent=735,usWinDescent=314)
fb.setupNameTable({
    "familyName":"Stalux Math Aux", "styleName":"Regular",
    "uniqueFontIdentifier":"Stalux Math Aux 1.0",
    "fullName":"Stalux Math Aux Regular", "psName":"StaluxMathAux-Regular",
    "version":"Version 1.0", "copyright":
    "Copyright (c) 2009-2010 Design Science, Inc.\n"
    "Copyright (c) 2014-2018 Khan Academy\nCopyright (c) 2026 xingwangzhe",
    "licenseDescription":"This Font Software is licensed under the SIL Open Font License, Version 1.1.",
    "licenseInfoURL":"https://openfontlicense.org",
})
fb.setupPost(); fb.setupMaxp()
for tag in ['fpgm', 'prep', 'cvt ', 'gasp']:
    if tag in script: fb.font[tag] = script[tag]
fb.font['head'].created = fb.font['head'].modified = 3863721600
fb.font.recalcTimestamp = False
fb.font.flavor = 'woff2'
output = ROOT / "public/fonts/StaluxMathAux.woff2"
fb.font.save(output)
license_text = (SOURCE/'OFL.txt').read_text()
license_text = license_text.replace('with Reserved Font Names KaTeX_Main and KaTeX_Script.',
    'Original fonts have Reserved Font Names KaTeX_Main and KaTeX_Script.\n'
    'Modified font: Stalux Math Aux. Copyright (c) 2026 xingwangzhe.\n'
    'Renamed, script codepoints remapped, primes scaled/repeated/reflected;\n'
    'rebuilt with FontTools without FontCreator or its generated binaries.')
(ROOT/'public/fonts/StaluxMathAux-OFL.txt').write_text(license_text)
print(f"Built {output}: {len(cmap)} codepoints; {output.stat().st_size} bytes")
