#!/usr/bin/env python3
"""Generate UPDATE SQL for expanded microlearn books (preserves information ids)."""
from __future__ import annotations

import json
import re
from pathlib import Path


def esc(s: str) -> str:
    return s.replace("'", "''")


def slug(title: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_").lower()
    return s[:60]


def main() -> None:
    books_dir = Path("scripts/microlearn_expanded/books")
    outdir = Path("scripts/sql_expanded")
    outdir.mkdir(exist_ok=True)

    files = sorted(books_dir.glob("*.json"))
    if not files:
        raise SystemExit(f"No book JSON files in {books_dir}")

    for i, path in enumerate(files, 1):
        b = json.loads(path.read_text())
        title = esc(b["title"])
        # Update content in place; replace quiz rows for this book only
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
        sql = f"""UPDATE public.information
SET
  content_text = '{esc(b["content_text"])}',
  duration_minutes = {b["duration_minutes"]},
  cover_image_url = '{esc(b["cover_image_url"])}',
  short_description = '{esc(b["short_description"])}',
  points_reward = 1,
  is_active = true,
  category = 'Books'
WHERE title = '{title}';

DELETE FROM public.questions
WHERE information_id IN (SELECT id FROM public.information WHERE title = '{title}');

INSERT INTO public.questions (
  information_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order
)
SELECT i.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.question_order
FROM public.information i
CROSS JOIN (
  VALUES
{values_block}
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order)
WHERE i.title = '{title}';
"""
        out = outdir / f"{i:02d}_{slug(b['title'])}.sql"
        out.write_text(sql)
        print(f"wrote {out.name} ({len(sql)} chars, word_count={b.get('word_count')})")


if __name__ == "__main__":
    main()
