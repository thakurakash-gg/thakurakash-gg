"""Launch audit: local routes, assets, anchors, accessible forms and honest content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, parse_qs
from html import unescape
import re
import json
root=Path(__file__).resolve().parents[2]
pages=['index.html','nexiv.html','studio.html','products.html','services.html','work.html','events.html']
class Document(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=True);self.tags=[];self.ids=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append((tag,a))
        if 'id' in a:self.ids.append(a['id'])
documents={p:Document((root/p).read_text(encoding='utf-8')) for p in pages}
options=set(unescape(s) for s in re.findall(r'<option>([^<]+)</option>',(root/'index.html').read_text(encoding='utf-8')))
errors=[];links=0;assets=set()
for page,doc in documents.items():
    if len(doc.ids)!=len(set(doc.ids)):errors.append(page+': duplicate IDs')
    if sum(t=='h1' for t,a in doc.tags)!=1:errors.append(page+': requires exactly one main heading')
    if not any(t=='link' and a.get('rel')=='canonical' for t,a in doc.tags):errors.append(page+': canonical missing')
    labels={a.get('for') for t,a in doc.tags if t=='label'}
    for tag,a in doc.tags:
        if tag in ('input','select','textarea') and a.get('id')!='brief-copy-text' and a.get('id') not in labels:errors.append(page+': missing field label '+str(a.get('id')))
        if tag=='img' and 'alt' not in a:errors.append(page+': image missing alternative text')
        if tag=='a' and a.get('target')=='_blank' and 'noopener' not in a.get('rel',''):errors.append(page+': external tab missing noopener')
        refs=[]
        for key in ['src','href','poster','data-crew-image']:
            if key in a:refs.append(a[key])
        for item in a.get('srcset','').split(','):
            if item.strip():refs.append(item.strip().split()[0])
        for ref in refs:
            url=urlsplit(ref)
            if url.scheme or url.netloc:continue
            path=unquote(url.path) or page
            if url.query.startswith('service='):
                selection=parse_qs(url.query)
                if set(selection)!={'service'} or selection['service'][0] not in options:errors.append(f'{page}: invalid service selection {ref}')
            if path.startswith('/'):continue
            target=root/path;links+=1
            if not target.is_file():errors.append(f'{page}: missing {path}');continue
            if url.fragment and path in documents and unquote(url.fragment) not in documents[path].ids:errors.append(f'{page}: missing anchor {ref}')
            if path.startswith('assets/'):assets.add(path)
    source=(root/page).read_text(encoding='utf-8')
    if any(x in source for x in ['DETAILS COMING','PORTFOLIO DETAILS COMING','TEMPORARY STUDIO PREVIEW','hr@kazeyami.com']):errors.append(page+': stale public copy')
    if 'assets/enquiry.js?v=4.12.1' not in source:errors.append(page+': draft fallback not loaded')
    if 'id="copy-brief"' not in source:errors.append(page+': copy fallback missing')
    if 'does not send or store your details' not in source:errors.append(page+': enquiry behavior must be explicit')
    if any('kazeyami.com' not in a.get('href','') for t,a in doc.tags if a.get('href','').startswith('mailto:')):errors.append(page+': incorrect email')
home=(root/'index.html').read_text(encoding='utf-8')
team_members=[('Siya Baranwal','UI/UX Artist'),('Pragati Saxena','HR'),('DK','Developer'),('Deepraj','Senior Developer'),('Shayan Ansari','Technical Artist'),('Akash Singh','3D Artist'),('Hammer','Unreal Artist')]
team_buttons=[a for t,a in documents['index.html'].tags if t=='button' and 'team-cast__member' in a.get('class','').split()]
assert [a.get('aria-label') for a in team_buttons]==[f'{name}, {role}' for name,role in team_members], 'Team roster must contain the seven approved people and roles'
assert sum(a.get('aria-pressed')=='true' for a in team_buttons)==1, 'Team needs exactly one initial selected member'
assert all(a.get('type')=='button' and a.get('aria-pressed') in ('true','false') for a in team_buttons), 'Team choices must be accessible toggle buttons'
team_image=root/'assets/team/kazeyami-crew.webp'
atlas=json.loads((root/'assets/team/atlas.json').read_text(encoding='utf-8'))
assert team_image.stat().st_size<400000, 'Team atlas must remain below the 400 KB image budget'
assert atlas['webpBytes']==team_image.stat().st_size, 'Team atlas metadata must match the delivered file'
assert atlas['dimensions']==[1536,1024] and atlas['grid']==[4,2], 'Team atlas registration changed'
assert atlas['cells']==[name for name,role in team_members]+[None], 'Team atlas order must match the roster'
assert home.count('class="direction-row"')==4
nav=home.split('<nav aria-label="Main navigation">')[1].split('</nav>')[0]
assert '3D Studio' not in nav and 'design.html' not in nav and '3d.html' not in nav
assert all(x in nav for x in ['studio.html','nexiv.html','products.html','events.html','work.html','services.html'])
assert len([a for t,a in documents['services.html'].tags if a.get('class')=='service-entry'])==10
assert len([a for t,a in documents['events.html'].tags if a.get('class')=='service-entry'])==7
for p in ['studio.html','products.html','nexiv.html']:
    assert len([a for t,a in documents[p].tags if a.get('class')=='service-entry'])>=2,p+': branch catalogue missing'
for stem in ['mario-miniature-poster','amd-medical-poster','experience-center-poster']:
    assert (root/'assets'/f'{stem}-1440.webp').stat().st_size<70000
assert (root/'assets/experience-center-mobile.mp4').stat().st_size<180000
for p,target in [('3d.html','studio.html'),('design.html','studio.html')]:assert target in (root/p).read_text(encoding='utf-8')
summary={'pages':len(pages),'localReferencesChecked':links,'uniqueLinkedAssets':len(assets),'errors':errors}
print(json.dumps(summary,indent=2))
if errors:raise SystemExit(1)
