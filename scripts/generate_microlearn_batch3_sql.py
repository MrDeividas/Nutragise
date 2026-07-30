#!/usr/bin/env python3
"""Generate INSERT SQL for microlearn batch 3 books."""
from __future__ import annotations

import json
import re
from pathlib import Path


def esc(s: str) -> str:
    return s.replace("'", "''")


def slug(title: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")
    return s[:60]


def main() -> None:
    books_dir = Path("scripts/microlearn_batch3/books")
    outdir = Path("scripts/sql_batch3")
    outdir.mkdir(exist_ok=True)

    files = sorted(books_dir.glob("*.json"))
    if not files:
        raise SystemExit(f"No books in {books_dir}")

    for i, path in enumerate(files, 1):
        b = json.loads(path.read_text())
        title = esc(b["title"])
        value_rows = []
        for order, q in enumerate(b["questions"], 1):
            value_rows.append(
                "  ('{qt}', '{a}', '{b}', '{c}', '{d}', '{ans}', {order})".format(
                    qt=esc(q["question_text"]),
                    a=esc(q["option_a"]),
                    b=esc(q["option_b"]),
                    c=esc(q["option_c"]),
                    d=esc(q["option_d"]),
                    ans=q["correct_answer"],
                    order=order,
                )
            )
        values_block = ",\n".join(value_rows)
        sql = f"""DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = '{title}');
DELETE FROM public.information WHERE title = '{title}';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    '{title}',
    '{esc(b["content_text"])}',
    {b["duration_minutes"]},
    'Books',
    'beginner',
    1,
    true,
    '{esc(b["cover_image_url"])}',
    '{esc(b["short_description"])}'
  )
  RETURNING id
)
INSERT INTO public.questions (
  information_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order
)
SELECT i.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.question_order
FROM inserted i
CROSS JOIN (
  VALUES
{values_block}
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
"""
        out = outdir / f"{i:02d}_{slug(b['title'])}.sql"
        out.write_text(sql)
        print(f"wrote {out.name} ({len(sql)} chars, words={b.get('word_count')})")


if __name__ == "__main__":
    main()
