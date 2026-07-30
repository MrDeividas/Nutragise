# Microlearn expanded book writing spec

## Goal
Write research-based educational summaries of classic books for a mobile microlearning app.
Each book must be **4000–6000 words** of readable prose (target given per book).

## Hard rules
- Paraphrase ideas; do NOT paste copyrighted book text.
- No invented fake frameworks or fake study names. Stick to well-known ideas associated with the book.
- HTML only, using this structure:

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
<p>...</p>
<p><strong>Lesson:</strong> one clear takeaway sentence.</p>
... more chapters ...
```

- Use **Chapter N:** headings (not Lesson N) for PART 2 sections.
- Every chapter ends with `<p><strong>Lesson:</strong> ...</p>`
- Aim for **11–14 chapters** so word count is reachable with substance (not fluff).
- Each chapter: typically 350–500 words of real explanation, examples, and how-to application.
- Keep existing quiz questions unless a question is factually wrong; include them unchanged in the JSON.
- Keep cover_image_url and short_description (can lightly improve description if needed).

## Output file format
Write one JSON file per book at:
`scripts/microlearn_expanded/books/{slug}.json`

```json
{
  "title": "...",
  "author": "...",
  "duration_minutes": 28,
  "cover_image_url": "...",
  "short_description": "...",
  "content_text": "<h1>PART 1...</h1>...",
  "questions": [ ...5 questions... ],
  "word_count": 5012
}
```

`word_count` = word count of content_text with HTML tags stripped.
Must be within ±8% of the assigned target, and never below 4000 or above 6200.

## Duration
Use the assigned duration_minutes from the catalog (already sized to word target).
