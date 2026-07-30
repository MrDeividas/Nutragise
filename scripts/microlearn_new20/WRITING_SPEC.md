# New books writing spec (Nutrapp microlearn)

## Goal
Write research-based educational summaries. Each book: **4500–6000 words** (hit target_words ±8%, never below 4500).

## Hard rules
- Paraphrase only; do NOT paste copyrighted book text.
- NO "Deep Practice Block", "Application Lab", "ten-day curriculum", or repeated filler paragraphs.
- Every chapter must teach something DIFFERENT.
- HTML structure:

```html
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. ...</h2>
<ul><li>...</li></ul>
... (6–8 outline items) ...
<h1>PART 2 — BOOK TITLE</h1>
<h2>A {duration}-Minute Read Summary</h2>
<h3>Chapter N: ...</h3>
<p>...</p>
<p><strong>Lesson:</strong> unique takeaway.</p>
```

- 12 chapters; each ~350–500 words + unique Lesson line.
- 5 quiz questions (options A–D, correct_answer A/B/C/D).
- Keep cover_image_url, short_description, duration_minutes, author from catalog.

## Output JSON
```json
{
  "title": "...",
  "author": "...",
  "duration_minutes": 28,
  "cover_image_url": "...",
  "short_description": "...",
  "content_text": "<h1>PART 1...</h1>...",
  "questions": [{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A"}],
  "word_count": 5012
}
```
