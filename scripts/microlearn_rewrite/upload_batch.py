#!/usr/bin/env python3
"""Upload rewritten book JSON files to Supabase. Usage: python3 upload_batch.py batch1"""
import json, sys, re, urllib.request, urllib.parse, subprocess
from pathlib import Path
from collections import Counter

REF='gtnjrauujrzkesaulius'
batch = sys.argv[1] if len(sys.argv)>1 else 'batch1'
folder = Path(__file__).parent / batch
files = sorted(folder.glob('*.json'))
files = [f for f in files if f.name != 'meta.json']
if not files:
    print('No files'); sys.exit(1)

SERVICE=next(k['api_key'] for k in json.loads(subprocess.check_output(['supabase','projects','api-keys','--project-ref',REF,'-o','json'], text=True)) if k.get('id')=='service_role')
BASE=f'https://{REF}.supabase.co/rest/v1'

def words(html):
    return len(re.sub(r'<[^>]+>',' ', html or '').split())

def validate(d):
    html=d['content_text']
    w=words(html)
    h3=re.findall(r'<h3>([^<]+)</h3>', html)
    if any(re.search(r'(?i)Deep Practice|Application Lab|ten-day curriculum', t) for t in h3):
        return False, 'filler h3 present'
    if len(h3)<11:
        return False, f'only {len(h3)} chapters'
    if w<4500:
        return False, f'only {w} words'
    # duplicate bodies
    parts=re.split(r'(<h3>[^<]+</h3>)', html)
    bodies=[]
    for i in range(1,len(parts),2):
        body=re.sub(r'<[^>]+>',' ',parts[i+1])
        bodies.append(re.sub(r'\s+',' ',body).strip())
    if len(set(bodies)) < len(bodies):
        return False, 'identical chapter bodies'
    # shared long sentences
    sents=[]
    for s in re.split(r'[.!?]\s+', re.sub(r'<[^>]+>',' ', html)):
        s=re.sub(r'\s+',' ',s).strip()
        if len(s.split())>=18: sents.append(s)
    dups=[(n,s) for s,n in Counter(sents).items() if n>1]
    if dups:
        return False, f'{len(dups)} repeated long sentences e.g. {dups[0][1][:60]}'
    return True, f'{w}w {len(h3)}ch'

for f in files:
    d=json.load(open(f))
    ok, msg = validate(d)
    print(f.name, 'VALIDATE', ok, msg)
    if not ok:
        print('SKIP'); continue
    body=json.dumps({
        'content_text': d['content_text'],
        'duration_minutes': d.get('duration_minutes'),
        'short_description': d.get('short_description'),
        'cover_image_url': d.get('cover_image_url'),
    }).encode()
    req=urllib.request.Request(
        f'{BASE}/information?id=eq.{d["id"]}',
        data=body, method='PATCH',
        headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json','Prefer':'return=minimal'})
    with urllib.request.urlopen(req) as r:
        print('  patched content', r.status)
    # update questions if provided
    for i,q in enumerate(d.get('questions') or []):
        qid=q.get('id')
        payload={
            'question_text':q['question_text'],
            'option_a':q['option_a'],'option_b':q['option_b'],
            'option_c':q['option_c'],'option_d':q['option_d'],
            'correct_answer':q['correct_answer'],
        }
        if qid:
            data=json.dumps(payload).encode()
            req=urllib.request.Request(f'{BASE}/questions?id=eq.{qid}', data=data, method='PATCH',
                headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json'})
            with urllib.request.urlopen(req) as r:
                print('  q', i+1, r.status)
        else:
            # need information_id
            payload['information_id']=d['id']
            payload['question_order']=i+1
            data=json.dumps(payload).encode()
            req=urllib.request.Request(f'{BASE}/questions', data=data, method='POST',
                headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json','Prefer':'return=minimal'})
            with urllib.request.urlopen(req) as r:
                print('  q insert', i+1, r.status)
print('done')
