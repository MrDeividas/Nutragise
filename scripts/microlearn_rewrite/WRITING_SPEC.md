# Microlearn rewrite spec

## Goal
Replace stub+filler book summaries with real unique chapter content.
Each book: **4500–6000 words**. NO repeated paragraphs. NO "Deep Practice Block" / "Application Lab" / "ten-day curriculum" filler.

## Hard rules
- Paraphrase only; do NOT paste copyrighted book text.
- HTML structure exactly as Atomic Habits style:

PART 1 outline (6–8 h2 items with ul/li), then PART 2 with 12 unique Chapter h3 sections.
- Each chapter 350–500 words of DISTINCT explanation. Every chapter teaches something different.
- End each chapter with `<p><strong>Lesson:</strong> ...</p>` unique per chapter.
- 5 quiz questions grounded in the summary (A–D, correct_answer A/B/C/D).
- Keep id, cover_image_url, short_description, duration_minutes from meta.

## Output JSON path given in task with fields:
id, title, duration_minutes, cover_image_url, short_description, content_text, questions, word_count (>=4500)
