"""Launch checks for the current marketing pages; no historical version assumptions."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, parse_qs
import json, re, sys

root=Path(__file__).resolve().parents[2]
if not (root/'index.html').exists():
    root=Path('C:/Users/Kazeyami_4/Documents/GitHub/thakurakash-gg')
pages=['index.html','work.html','services.html','nexiv.html','studio.html','products.html','events.html','team.html']
class Document(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=True); self.tags=[]; self.ids=[]; self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs); self.tags.append((tag,a))
        if 'id' in a:self.ids.append(a['id'])
docs={p:Document((root/p).read_text(encoding='utf8')) for p in pages}
errors=[];refs=0;assets=set();scripts=set()
options={m.group(1).replace('&amp;','&') for m in re.finditer(r'<option>(.*?)</option>',(root/'index.html').read_text(encoding='utf8'))}
for page,doc in docs.items():
    source=(root/page).read_text(encoding='utf8')
    def check(ok,message):
        if not ok:errors.append(page+': '+message)
    check(len(doc.ids)==len(set(doc.ids)),'duplicate IDs')
    check(sum(t=='h1' for t,a in doc.tags)==1,'one main heading required')
    check(any(t=='link' and a.get('rel')=='canonical' for t,a in doc.tags),'canonical missing')
    check('id="brief-date"' in source and 'id="brief-budget"' in source,'optional scoping fields missing')
    check('does not send or store your details' in source,'draft behavior must be explicit')
    check('id="copy-brief"' in source,'copy fallback missing')
    check('assets/launch-review.js' in source and 'assets/launch-review.css' in source,'launch refinements missing')
    check('href="'+page+'" aria-current="page"' in source,'current menu page missing')
    check(not any(x in source for x in ['DETAILS COMING','TEMPORARY STUDIO PREVIEW','hr@kazeyami.com','live-experience.html','dmx-showcase','medical-explainer','mario-miniature','amd-medical']),'retired content linked')
    labels={a.get('for') for t,a in doc.tags if t=='label'}
    for tag,a in doc.tags:
        if tag in ('input','select','textarea') and a.get('id')!='brief-copy-text':check(a.get('id') in labels,'unlabelled field '+str(a.get('id')))
        if tag=='img':check('alt' in a,'image missing alt')
        if tag=='a' and a.get('target')=='_blank':check('noopener' in a.get('rel',''),'new tab missing noopener')
        if tag=='video':check(a.get('preload')=='none' or a.get('id')=='opening-work-video','unexpected eager video')
        if tag=='script' and a.get('src'):scripts.add(urlsplit(a['src']).path)
        values=[a[k] for k in ['href','src','poster','data-src','data-video','data-poster'] if k in a]
        values += [item.strip().split()[0] for item in a.get('srcset','').split(',') if item.strip()]
        for ref in values:
            url=urlsplit(ref)
            if url.scheme or url.netloc:continue
            path=unquote(url.path) or page
            if path.startswith('/'):continue
            refs+=1;target=root/path
            check(target.is_file(),'missing local file '+path)
            if url.fragment and target.suffix=='.html' and target.is_file():
                targetdoc=docs.get(path) or Document(target.read_text(encoding='utf8'))
                check(unquote(url.fragment) in targetdoc.ids,'missing anchor '+ref)
            if path.startswith('assets/'):assets.add(path)
            if 'service' in parse_qs(url.query):check(parse_qs(url.query)['service'][0] in options,'unknown service query '+ref)
    check('\ufffd' not in source,'replacement character in source')
home=(root/'index.html').read_text(encoding='utf8')
if 'id="team"' in home:errors.append('team must have a separate page')
if home.count('class="direction-row"')!=4:errors.append('home requires four branches')
catalogue=(root/'assets/kazeyami-studio-catalogue.txt').read_text(encoding='utf8')
if any(x in catalogue for x in ['AMD medical explainer','Mario miniature study','#medical-explainer','#miniature']):errors.append('catalogue lists withdrawn sample projects')
if '#interior-natural-light' not in catalogue:errors.append('catalogue omits interior film')
for token in ['Architectural visualization','Medical & scientific visualization','Event organization & production']:
    if token not in catalogue:errors.append('catalogue service missing: '+token)
report={'pages':len(pages),'localReferences':refs,'linkedAssets':len(assets),'activeScripts':sorted(scripts),'errors':errors}
print(json.dumps(report,indent=2))
if errors:sys.exit(1)
