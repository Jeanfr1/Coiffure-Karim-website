#!/usr/bin/env python3
"""Checks estáticos do kit; não simula browser QA."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote
import argparse,json,hashlib,re,subprocess,xml.etree.ElementTree as ET
from PIL import Image,ImageFont
from fontTools.ttLib import TTFont
import numpy as np

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--atualizar-relatorio',action='store_true')
args=parser.parse_args();ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';checks=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(name,condition,**details):
    checks.append({'check':name,'status':'PASS' if condition else 'FAIL',**details})
    if not condition:raise AssertionError(name)
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.path=path;self.ids=[];self.anchors=[];self.local=[];self.scenes=[];self.links=[];self.aria=[];self.ld=[];self.script_type=None;self.lang='';self.h1=0;self.tabs=[];self.services=[];self.tags=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append(tag)
        if tag=='html':self.lang=a.get('lang')
        if tag=='h1':self.h1+=1
        if a.get('id'):self.ids.append(a['id'])
        if a.get('data-scene'):self.scenes.append({'id':a.get('id'),'scene':a['data-scene'],'background':a.get('data-background')})
        if a.get('data-tab'):self.tabs.append(a['data-tab'])
        if a.get('data-service'):self.services.append(a['data-service'])
        if tag=='a':self.links.append(a)
        for attr in ('href','src','srcset'):
            value=a.get(attr)
            if value and not value.startswith(('http:','https:','data:','tel:')):
                if value.startswith('#'):self.anchors.append(value[1:])
                elif attr=='srcset':self.local+=[c.split()[0] for c in value.split(',')]
                else:self.local.append(value.split('#',1)[0].split('?',1)[0])
        for attr in ('aria-labelledby','aria-controls'):
            if a.get(attr):self.aria+=a[attr].split()
        if tag=='script':self.script_type=a.get('type')
    def handle_endtag(self,tag):
        if tag=='script':self.script_type=None
    def handle_data(self,data):
        if self.script_type=='application/ld+json':self.ld.append(json.loads(data))
index=Page(SITE/'index.html');html=index.path.read_text();index.feed(html)
lock=json.loads((ROOT/'docs/architecture-lock.json').read_text())
check('modelo 3 e quatro cenas na ordem aprovada',lock['model']==3 and index.scenes==lock['scene_order'],scenes=index.scenes)
check('único fundo liso na localização',[s['id'] for s in index.scenes if s['background']=='solid']==['nous-trouver'])
check('francês e um H1',index.lang=='fr' and index.h1==1)
check('IDs únicos',len(index.ids)==len(set(index.ids)))
check('âncoras existentes',set(index.anchors)<=set(index.ids))
check('ARIA aponta para IDs existentes',set(index.aria)<=set(index.ids))
check('caminhos locais do HTML',all((SITE/unquote(p)).is_file() for p in index.local))
check('links externos protegidos',all('noopener' in a.get('rel','') and 'noreferrer' in a.get('rel','') for a in index.links if a.get('target')=='_blank'))
maps=[a['href'] for a in index.links if 'google.com/maps' in a.get('href','')]
phones=[a['href'] for a in index.links if a.get('href','').startswith('tel:')]
check('itinerários do endereço correto',len(maps)>=5 and set(maps)=={lock['map']},count=len(maps))
check('telefone correto em todos os links',len(phones)>=8 and set(phones)=={'tel:'+lock['phone']},count=len(phones))
check('sem agenda ou preços inventados',not re.search(r'planity|réserver|rendez-vous|€|4\.94',html,re.I))
check('JSON-LD coerente',len(index.ld)==1 and index.ld[0]['@type']=='HairSalon' and index.ld[0]['telephone']==lock['phone'] and index.ld[0]['address']['streetAddress']=='14 rue Maurice Sambron' and 'aggregateRating' not in index.ld[0] and 'openingHours' not in index.ld[0])
check('referência escolhida preservada',sha(ROOT/lock['source'])==lock['reference_sha256'])
check('PNG original preservado',sha(ROOT/'brand/source/Logo-Karim-Original-Transparente.png')==lock['logo_original_sha256'])
check('quatro títulos específicos',all(t in html for t in ['L’art','de la ligne.','Trois gestes.','Une même attention.','Au cœur','de Pontchâteau.','Le prochain','c’est le vôtre.']))
check('sem mídia de vídeo áudio ou canvas',not set(index.tags)&{'video','audio','canvas'})
check('Hero responsivo próprio','hero-mobile-art.webp' in html and 'max-width:700px' in html)

guide=Page(ROOT/'docs/GUIA-VISUAL.html');guide.feed(guide.path.read_text())
check('links locais do guia',all((guide.path.parent/unquote(p)).is_file() for p in guide.local))
css=(SITE/'styles.css').read_text();css_urls=re.findall(r'url\([\'"]?([^\)\'\"]+)[\'"]?\)',css)
check('assets e fontes CSS existentes',all((SITE/p).is_file() for p in css_urls))
check('CSS sem CDN',all(not p.startswith('http') for p in css_urls))
def balanced(value):
    value=re.sub(r'/\*.*?\*/','',value,flags=re.S)
    value=re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'','',value)
    stack=[];pairs={'}':'{',')':'(',']':'['}
    for c in value:
        if c in '{([':stack.append(c)
        elif c in '})]':
            if not stack or stack.pop()!=pairs[c]:return False
    return not stack
check('delimitadores CSS consistentes',balanced(css))
check('redução e pausa previstas','prefers-reduced-motion' in css and '.motion-off' in css)
check('sem runway ou scroll capturado','position:sticky' not in css and 'scroll-snap-type' not in css)
for name in ('app.js','content.js'):
    code=(SITE/name).read_text();result=subprocess.run(['node','--check',str(SITE/name)],capture_output=True,text=True)
    check('sintaxe '+name,result.returncode==0,details=result.stderr.strip())
    check('IDs do JS '+name,all(i in index.ids for i in re.findall(r'getElementById\([\'"]([^\'\"]+)[\'"]\s*\)',code)))
    check('runtime sem rede '+name,not re.search(r'\bfetch\s*\(|XMLHttpRequest',code))
program='global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.KARIM));'
result=subprocess.run(['node','-e',program,str(SITE/'content.js')],capture_output=True,text=True,check=True);content=json.loads(result.stdout)
check('categorias e abas alinhadas',set(content['services'])==set(index.services)==set(index.tabs)=={'homme','enfant','barbe'})
check('contato editável consistente',content['phone']==lock['phone'] and content['map']==lock['map'])
check('menu e diálogo nativos','details' in index.tags and 'dialog' in index.tags)
app=(SITE/'app.js').read_text()
check('pausa cancela animações e respeita preferências',all(t in app for t in ['karim.motion.paused','saveData','cancelIntro','visibilitychange','constrained','toggle.disabled']))
check('teclado das abas previsto',all(t in app for t in ['ArrowRight','ArrowLeft','Home','End','returnFocus?.focus()']))

for name in ('Petrole','Ivoire'):
    im=np.asarray(Image.open(ROOT/'brand'/f'Logo-Karim-{name}-Transparente.png'))
    check('PNG 1774x887 RGBA '+name,im.shape==(887,1774,4))
    check('alfa real '+name,int(im[:,:,3].min())==0 and int(im[:,:,3].max())==255,transparent_percent=round(float((im[:,:,3]==0).mean()*100),3))
    check('cantos transparentes '+name,all(im[y,x,3]==0 for y,x in [(0,0),(0,1773),(886,0),(886,1773)]))
for path in sorted((ROOT/'brand').glob('*.svg')):
    svg=ET.fromstring(path.read_text())
    check('SVG nativo '+path.name,not svg.findall('.//{http://www.w3.org/2000/svg}image') and bool(svg.findall('.//{http://www.w3.org/2000/svg}path')))
for name in ('Petrole','Ivoire'):
    full=ET.parse(ROOT/'brand'/f'Logo-Karim-{name}.svg').getroot();header=ET.parse(SITE/'assets'/f'logo-{name.lower()}.svg').getroot()
    check('geometria do cabeçalho '+name,full.find('.//{http://www.w3.org/2000/svg}path').attrib['d']==header.find('.//{http://www.w3.org/2000/svg}path').attrib['d'] and header.attrib['viewBox']=='50 140 1715 590')
for path in (SITE/'assets').glob('*.svg'):ET.parse(path)
for markup in re.findall(r'<svg\b.*?</svg>',html,re.S):ET.fromstring(markup)
check('SVGs do site válidos',True)
check('três divisões diferentes',len(set(re.findall(r'<svg class="seam .*?</svg>',html,re.S)))==3)
masters=list((ROOT/'images/master').glob('*.png'))
check('quatro masters de campanha',len(masters)==4 and {p.stem for p in masters}=={'hero-art','hero-mobile-art','service-frieze','closing-art'})
for path in masters:
    with Image.open(path) as im:
        web=Image.open(SITE/'assets'/(path.stem+'.webp'))
        check('distribuição WebP '+path.stem,im.size==web.size and min(im.size)>=1000)
inventory=json.loads((ROOT/'docs/asset-manifest.json').read_text())
check('hashes e assets do inventário',all((ROOT/a['path']).is_file() and sha(ROOT/a['path'])==a['sha256'] for a in inventory['assets']))
check('três referências recebidas identificadas',len([a for a in inventory['assets'] if a['origin']=='user_attachment'])==3)
images=0
for path in ROOT.rglob('*'):
    if path.is_file() and path.suffix.lower() in ('.png','.webp','.jpg','.jpeg'):
        with Image.open(path) as image:image.load()
        images+=1
    if path.is_file() and path.suffix=='.json':json.loads(path.read_text())
check('rasters legíveis',images>=15,count=images)
for path in (SITE/'fonts').glob('*.woff'):
    font=TTFont(path);needed='éèêàâçôùûîïÉÂ’'
    check('fonte válida '+path.name,path.read_bytes()[:4]==b'wOFF' and all(ord(c) in font.getBestCmap() for c in needed))
for family in ('BricolageGrotesque','DMSans','Caveat'):
    check('licença OFL '+family,'SIL OPEN FONT LICENSE' in (ROOT/'fonts/originals'/f'{family}-OFL.txt').read_text().upper())
sources=json.loads((ROOT/'docs/font-sources.json').read_text())
check('fontes de origem oficial e hashes',len(sources)==6 and all(a['url'].startswith('https://raw.githubusercontent.com/google/fonts/') and sha(ROOT/a['path'])==a['sha256'] for a in sources))
measures=[]
for width in (320,360,375,390,430):
    hero_size=69 if width<=370 else 79;subtitle_size=22 if width<=370 else 23
    for text,size,available in [('de la ligne.',hero_size,width*.78),('Une même attention.',subtitle_size,width*.48)]:
        font=ImageFont.truetype(str(ROOT/'fonts/Caveat-SemiBold.ttf'),size);advance=font.getlength(text)-(len(text)-1)*size*.035
        measures.append({'viewport':width,'text':text,'width':round(advance,1),'available':round(available,1)})
        check(f'métrica manuscrita {width} {text}',advance<=available)
check('seis roteiros e README',(ROOT/'README.md').is_file() and len(list((ROOT/'roteiros').glob('*')))==6)
check('timeline do modelo escolhido',json.loads((ROOT/'motion/timeline.json').read_text())['model']==3)
check('sem vídeo ou animação raster',not any(p.suffix.lower() in ('.mp4','.mov','.webm','.gif') for p in (SITE,ROOT/'images',ROOT/'motion') for p in p.rglob('*')))
check('configuração local sem publicação',json.loads((SITE/'.openai/hosting.json').read_text())=={'static':{'directory':'.'}})
check('sem pranchas dos modelos 1/2',not any(re.search(r'Model[oè]?-?[12][-.]',p.name,re.I) for p in ROOT.rglob('*')))
report={'date':'2026-10-30','model':3,'status':'STATIC_CHECKS_PASS_BROWSER_QA_UNVERIFIED','passed':len(checks),'checks':checks,'raster_files':images,'font_metric_support':measures,'browser_qa':'UNVERIFIED — prévia indisponível; layout, cliques, teclado e performance não executados em navegador','preview_error':'sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests','video':False,'deployed':False,'limits':['Campanhas não documentam proprietário, equipe, clientes ou interior.','Métricas de fonte são apoio estático, não prova de layout no navegador.']}
if args.atualizar_relatorio:(ROOT/'docs/qa-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks),'raster_files':images,'browser_qa':'UNVERIFIED'}))
