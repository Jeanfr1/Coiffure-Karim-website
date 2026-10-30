#!/usr/bin/env python3
"""Exports natifs de la marque, fontes locales et formats web. Aucun téléchargement implicite."""
from pathlib import Path
import json,hashlib,shutil
import numpy as np
from PIL import Image
from scipy.ndimage import label
from matplotlib.figure import Figure
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import fitz

ROOT=Path(__file__).resolve().parents[1]
INK='#172A36';PAPER='#F3EFE4';SAFFRON='#EBA247'
source=ROOT/'brand/source/Logo-Karim-Original-Transparente.png'
alpha=np.asarray(Image.open(source).getchannel('A'))
labels,_=label(alpha>127)
def trace(a):
    fig=Figure();ax=fig.subplots();cs=ax.contour(a,levels=[127.5]);paths=[]
    for contour in cs.allsegs[0]:
        if len(contour)<4:continue
        points=contour[::1]
        paths.append('M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in points)+' Z')
    return paths
full=trace(alpha)
mark=trace(np.where(np.isin(labels,[1,2,8]),alpha,0))
signature=trace(np.where(np.isin(labels,[3,5,7]),alpha,0))
def svg(paths,fill,viewbox):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"><path fill="{fill}" fill-rule="evenodd" d="'+''.join(paths)+'"/></svg>'
def raster(text,path,width):
    document=fitz.open(stream=text.encode(),filetype='svg');pdf=fitz.open('pdf',document.convert_to_pdf())
    page=pdf[0];page.get_pixmap(matrix=fitz.Matrix(width/page.rect.width,width/page.rect.width),alpha=True).save(path)
def save_svg(name,text):
    (ROOT/'brand'/name).write_text(text)
for name,color in [('Petrole',INK),('Ivoire',PAPER)]:
    original=svg(full,color,'0 0 1774 887');save_svg(f'Logo-Karim-{name}.svg',original)
    raster(original,ROOT/'brand'/f'Logo-Karim-{name}-Transparente.png',1774)
    header=svg(full,color,'50 140 1715 590');(ROOT/'site/assets'/f'logo-{name.lower()}.svg').write_text(header)
    save_svg(f'Monogramme-K-{name}.svg',svg(mark,color,'55 145 600 570'))
save_svg('Signature-Karim.svg',svg(signature,INK,'545 195 1215 400'))
(ROOT/'site/assets/signature-karim.svg').write_text(svg(signature,INK,'545 195 1215 400'))
avatar=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="{PAPER}"/><g transform="translate(16.4 -94.2) scale(1.4)"><path fill="{INK}" fill-rule="evenodd" d="'+''.join(mark)+'"/></g></svg>'
save_svg('Avatar-Karim.svg',avatar);raster(avatar,ROOT/'brand/Avatar-Karim.png',1024)
(ROOT/'site/assets/favicon.svg').write_text(svg(mark,INK,'35 125 630 610'))
for name,axis in [('BricolageGrotesque-SemiBold',{'opsz':72,'wdth':100,'wght':600}),('BricolageGrotesque-Bold',{'opsz':72,'wdth':100,'wght':700}),('DMSans-Regular',{'opsz':14,'wght':400}),('DMSans-Medium',{'opsz':14,'wght':500}),('DMSans-SemiBold',{'opsz':14,'wght':600}),('Caveat-Medium',{'wght':500}),('Caveat-SemiBold',{'wght':600})]:
    family=name.split('-',1)[0]
    font=TTFont(ROOT/'fonts/originals'/f'{family}-Variable.ttf')
    static=instantiateVariableFont(font,axis,inplace=False);static.save(ROOT/'fonts'/f'{name}.ttf')
    static.flavor='woff';static.save(ROOT/'site/fonts'/f'{name}.woff')
for path in (ROOT/'fonts/originals').glob('*-OFL.txt'):shutil.copyfile(path,ROOT/'site/fonts'/path.name)
for master in (ROOT/'images/master').glob('*.png'):
    with Image.open(master) as image:image.save(ROOT/'site/assets'/(master.stem+'.webp'),quality=94,method=6)
report={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'full_contours':len(full),'mark_contours':len(mark),'signature_contours':len(signature),'native_svg':True,'uniform_fill':INK,'png_size':[1774,887],'webp_quality':94,'video':False}
(ROOT/'docs/asset-exports.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
