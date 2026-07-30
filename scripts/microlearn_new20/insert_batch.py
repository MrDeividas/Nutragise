#!/usr/bin/env python3
"""Insert new book JSON into Supabase. Usage: python3 insert_batch.py batch1"""
import json, sys, re, urllib.request, urllib.parse, subprocess
from pathlib import Path
from collections import Counter

REF='gtnjrauujrzkesaulius'
batch=sys.argv[1] if len(sys.argv)>1 else 'batch1'
folder=Path(__file__).parent/batch
files=sorted([f for f in folder.glob('*.json') if f.name!='meta.json'])
SERVICE=next(k['api_key'] for k in json.loads(subprocess.check_output(['supabase','projects','api-keys','--project-ref',REF,'-o','json'], text=True)) if k.get('id')=='service_role')
BASE=f'https://{REF}.supabase.co/rest/v1'

def words(html):
    return len(re.sub(r'<[^>]+>',' ', html or '').split())

def validate(d):
    html=d['content_text']
    w=words(html)
    h3=re.findall(r'<h3>([^<]+)</h3>', html)
    if any(re.search(r'(?i)Deep Practice|Application Lab|ten-day curriculum|Chapter EX', t) for t in h3):
        return False, 'filler h3'
    if len(h3)<11: return False, f'only {len(h3)} chapters'
    if w<4500: return False, f'only {w} words'
    parts=re.split(r'(<h3>[^<]+</h3>)', html)
    bodies=[]
    for i in range(1,len(parts),2):
        bodies.append(re.sub(r'\s+',' ', re.sub(r'<[^>]+>',' ', parts[i+1])).strip())
    if len(set(bodies))<len(bodies): return False, 'identical bodies'
    sents=[re.sub(r'\s+',' ',s).strip() for s in re.split(r'[.!?]\s+', re.sub(r'<[^>]+>',' ', html)) if len(s.split())>=18]
    dups=[(n,s) for s,n in Counter(sents).items() if n>1]
    if dups: return False, f'repeated sentences ({len(dups)})'
    return True, f'{w}w {len(h3)}ch'

for f in files:
    d=json.load(open(f))
    ok,msg=validate(d)
    print(f.name, 'VALIDATE', ok, msg)
    if not ok: continue
    # skip if title already exists
    title=d['title']
    req=urllib.request.Request(BASE+'/information?category=eq.Books&title=eq.'+urllib.parse.quote(title)+'&select=id',
        headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}'})
    with urllib.request.urlopen(req) as r:
        existing=json.loads(r.read())
    payload={
        'title': d['title'],
        'content_text': d['content_text'],
        'duration_minutes': d['duration_minutes'],
        'category': 'Books',
        'difficulty_level': 'beginner',
        'points_reward': 1,
        'is_active': True,
        'cover_image_url': d['cover_image_url'],
        'short_description': d['short_description'],
    }
    if existing:
        iid=existing[0]['id']
        body=json.dumps({k:payload[k] for k in ['content_text','duration_minutes','cover_image_url','short_description','is_active']}).encode()
        req=urllib.request.Request(f'{BASE}/information?id=eq.{iid}', data=body, method='PATCH',
            headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json'})
        with urllib.request.urlopen(req) as r: print('  patched', r.status)
        # replace questions
        req=urllib.request.Request(f'{BASE}/questions?information_id=eq.{iid}', method='DELETE',
            headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}'})
        with urllib.request.urlopen(req) as r: print('  cleared qs', r.status)
    else:
        body=json.dumps(payload).encode()
        req=urllib.request.Request(BASE+'/information', data=body, method='POST',
            headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json','Prefer':'return=representation'})
        with urllib.request.urlopen(req) as r:
            iid=json.loads(r.read())[0]['id']
            print('  inserted', iid[:8])
    for i,q in enumerate(d.get('questions') or [],1):
        qpay={
            'information_id': iid,
            'question_text': q['question_text'],
            'option_a': q['option_a'], 'option_b': q['option_b'],
            'option_c': q['option_c'], 'option_d': q['option_d'],
            'correct_answer': q['correct_answer'],
            'question_order': i,
        }
        data=json.dumps(qpay).encode()
        req=urllib.request.Request(BASE+'/questions', data=data, method='POST',
            headers={'apikey':SERVICE,'Authorization':f'Bearer {SERVICE}','Content-Type':'application/json','Prefer':'return=minimal'})
        with urllib.request.urlopen(req) as r: print('  q', i, r.status)
print('done')
