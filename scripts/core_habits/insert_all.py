#!/usr/bin/env python3
"""Upload core-habit covers and insert information + questions into Supabase."""
import json
import mimetypes
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from scripts.core_habits.content_data import HABITS, word_count  # noqa: E402

REF = 'gtnjrauujrzkesaulius'
COVERS = ROOT / 'assets' / 'core-habits'
SERVICE = next(
    k['api_key']
    for k in json.loads(
        subprocess.check_output(
            ['supabase', 'projects', 'api-keys', '--project-ref', REF, '-o', 'json'],
            text=True,
        )
    )
    if k.get('id') == 'service_role'
)
REST = f'https://{REF}.supabase.co/rest/v1'
STORAGE = f'https://{REF}.supabase.co/storage/v1'


def req(url, method='GET', data=None, headers=None, raw=False):
    h = {
        'apikey': SERVICE,
        'Authorization': f'Bearer {SERVICE}',
    }
    if headers:
        h.update(headers)
    body = data if raw else (json.dumps(data).encode() if data is not None else None)
    if body is not None and not raw and 'Content-Type' not in h:
        h['Content-Type'] = 'application/json'
    r = urllib.request.Request(url, data=body, method=method, headers=h)
    try:
        with urllib.request.urlopen(r) as resp:
            payload = resp.read()
            if not payload:
                return resp.status, None
            try:
                return resp.status, json.loads(payload)
            except Exception:
                return resp.status, payload
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f'{method} {url} -> {e.code}: {err}') from e


def ensure_bucket():
    status, buckets = req(f'{STORAGE}/bucket')
    names = {b['name'] for b in (buckets or [])}
    if 'core-habit-covers' not in names:
        req(
            f'{STORAGE}/bucket',
            method='POST',
            data={'id': 'core-habit-covers', 'name': 'core-habit-covers', 'public': True},
        )
        print('created bucket core-habit-covers')
    else:
        print('bucket exists')


def upload_cover(slug: str) -> str:
    path = COVERS / f'{slug}.png'
    if not path.exists():
        raise FileNotFoundError(path)
    data = path.read_bytes()
    object_path = f'{slug}.png'
    # upsert
    url = f'{STORAGE}/object/core-habit-covers/{object_path}'
    try:
        req(
            url,
            method='POST',
            data=data,
            headers={
                'Content-Type': 'image/png',
                'x-upsert': 'true',
            },
            raw=True,
        )
    except RuntimeError as e:
        if 'Duplicate' in str(e) or 'already exists' in str(e).lower():
            req(
                url,
                method='PUT',
                data=data,
                headers={'Content-Type': 'image/png', 'x-upsert': 'true'},
                raw=True,
            )
        else:
            # try PUT upsert
            req(
                url,
                method='PUT',
                data=data,
                headers={'Content-Type': 'image/png', 'x-upsert': 'true'},
                raw=True,
            )
    public = f'https://{REF}.supabase.co/storage/v1/object/public/core-habit-covers/{object_path}'
    return public


def find_existing(title: str):
    q = urllib.parse.urlencode({
        'category': 'eq.Core Habits',
        'title': f'eq.{title}',
        'select': 'id',
    })
    _, rows = req(f'{REST}/information?{q}')
    return rows[0]['id'] if rows else None


def upsert_habit(habit: dict, cover_url: str):
    title = habit['title']
    payload = {
        'title': title,
        'content_text': habit['content_text'],
        'duration_minutes': habit['duration_minutes'],
        'category': 'Core Habits',
        'difficulty_level': 'beginner',
        'points_reward': 1,
        'is_active': True,
        'cover_image_url': cover_url,
        'short_description': habit['short_description'],
    }
    iid = find_existing(title)
    if iid:
        patch = {k: payload[k] for k in [
            'content_text', 'duration_minutes', 'cover_image_url',
            'short_description', 'is_active', 'category',
        ]}
        req(f'{REST}/information?id=eq.{iid}', method='PATCH', data=patch)
        req(f'{REST}/questions?information_id=eq.{iid}', method='DELETE')
        print(f'  patched {title} ({word_count(habit["content_text"])}w)')
    else:
        _, rows = req(
            f'{REST}/information',
            method='POST',
            data=payload,
            headers={'Prefer': 'return=representation'},
        )
        iid = rows[0]['id']
        print(f'  inserted {title} {iid[:8]} ({word_count(habit["content_text"])}w)')

    for i, q in enumerate(habit['questions'], 1):
        qpay = {
            'information_id': iid,
            'question_text': q['question_text'],
            'option_a': q['option_a'],
            'option_b': q['option_b'],
            'option_c': q['option_c'],
            'option_d': q['option_d'],
            'correct_answer': q['correct_answer'],
            'question_order': i,
        }
        req(f'{REST}/questions', method='POST', data=qpay, headers={'Prefer': 'return=minimal'})
    print(f'  {len(habit["questions"])} questions')
    return iid


def main():
    ensure_bucket()
    for habit in HABITS:
        print(habit['slug'])
        cover = upload_cover(habit['slug'])
        print('  cover', cover)
        upsert_habit(habit, cover)
    # verify
    _, rows = req(f'{REST}/information?category=eq.Core%20Habits&select=id,title,cover_image_url&order=title')
    print('TOTAL', len(rows or []))
    for r in rows or []:
        print('-', r['title'], 'cover' if r.get('cover_image_url') else 'NO COVER')


if __name__ == '__main__':
    main()
