#!/usr/bin/env python3
"""Download matching audio from curated OpenGameArt pages, best effort.

No external dependencies. Run on a networked computer, not in this offline authoring environment.
Do not assume a download is cleared for all uses simply because it succeeded.
"""
import json, re, pathlib, urllib.request, urllib.parse, html
from html.parser import HTMLParser

BASE = pathlib.Path(__file__).resolve().parent
LIMIT_BYTES = 80 * 1024 * 1024
HEADERS = {'User-Agent': 'Mozilla/5.0 (PTPlay music pack curation; personal download)'}

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.open=False; self.href=''; self.txt=[]; self.links=[]
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.open=True; self.href=dict(attrs).get('href',''); self.txt=[]
    def handle_data(self, data):
        if self.open: self.txt.append(data)
    def handle_endtag(self, tag):
        if tag == 'a' and self.open:
            self.links.append((self.href, ''.join(self.txt).strip()))
            self.open=False; self.href=''; self.txt=[]

def get(url):
    req=urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode('utf-8','replace')

def download(url, dst):
    req=urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=45) as r, open(dst,'wb') as f:
        size=0
        while True:
            chunk=r.read(65536)
            if not chunk: break
            size+=len(chunk)
            if size>LIMIT_BYTES: raise ValueError('File exceeds safety size limit')
            f.write(chunk)
    if size<1024: raise ValueError('Downloaded audio unexpectedly small')
    return size

def candidates(source, hint):
    p=Links(); p.feed(get(source))
    wanted=hint.casefold().replace(' ','')
    matches=[]
    for href, text in p.links:
        url=urllib.parse.urljoin(source, html.unescape(href))
        parsed=urllib.parse.urlparse(url)
        if parsed.hostname not in ('opengameart.org','www.opengameart.org'): continue
        if not parsed.path.lower().endswith(('.ogg','.mp3','.wav','.flac')): continue
        name=urllib.parse.unquote(parsed.path.split('/')[-1])
        needle=(name+' '+text).casefold().replace(' ','')
        if wanted not in needle: continue
        ext=pathlib.Path(parsed.path).suffix.lower()
        score={'.ogg':0,'.mp3':1,'.wav':2,'.flac':3}.get(ext,5)
        matches.append((score,url,name))
    return sorted(matches)

def main():
    manifest=json.loads((BASE/'music-catalog.json').read_text(encoding='utf-8'))
    summary=[]
    for track in manifest['tracks']:
        out=BASE/'downloaded'/track['gameId']; out.mkdir(parents=True, exist_ok=True)
        print('Checking',track['title'])
        try:
            matching=candidates(track['sourcePage'], track['fileHint'])
            if not matching: raise ValueError('No audio link matching fileHint found; download manually from source page')
            _, url, filename=matching[0]
            filename=re.sub(r'[^a-zA-Z0-9._ -]','_',filename)
            dest=out/filename
            if dest.exists() and dest.stat().st_size>1024:
                print('  already exists', dest)
            else:
                size=download(url,dest)
                print('  downloaded',size,'bytes to',dest)
            summary.append({'id':track['id'],'file':str(dest.relative_to(BASE)),'downloadUrl':url,'sourcePage':track['sourcePage']})
        except Exception as e:
            print('  FAILED:',str(e))
            print('  MANUAL:',track['sourcePage'])
    (BASE/'download-report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Complete: {len(summary)}/{len(manifest["tracks"])} files available. Still require audio & license review.')

if __name__=='__main__': main()
