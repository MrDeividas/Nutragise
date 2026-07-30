# Batch 3 microlearn writing spec

## Goal
Write research-based educational summaries for Nutrapp microlearning.
Each book: **4000–6000 words** (use the assigned target_words ±8%, never below 4000).

## Hard rules
- Paraphrase; do NOT paste copyrighted book text.
- No invented fake frameworks or fake study names.
- HTML structure:

```html
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. ...</h2>
<ul><li>...</li></ul>
... (5–8 outline items) ...
<h1>PART 2 — BOOK TITLE IN CAPS</h1>
<h2>A {duration}-Minute Read Summary</h2>
<h3>Chapter 1: ...</h3>
<p>...</p>
<p>...</p>
<p><strong>Lesson:</strong> one clear takeaway.</p>
```

- 11–14 chapters; each ends with Lesson line.
- Each chapter ~350–500 words of real explanation + application.
- Write **5 real quiz questions** grounded in YOUR summary (options A–D, correct_answer A/B/C/D). Replace catalog placeholders.
- Keep cover_image_url, short_description, duration_minutes from catalog (duration already sized to word target).

## Output
One JSON per book at:
`scripts/microlearn_batch3/books/{slug}.json`

```json
{
  "title": "...",
  "author": "...",
  "duration_minutes": 28,
  "cover_image_url": "...",
  "short_description": "...",
  "content_text": "<h1>PART 1...</h1>...",
  "questions": [/* 5 real questions */],
  "word_count": 5012
}
```

word_count = HTML-stripped word count.
