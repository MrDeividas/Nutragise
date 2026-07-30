#!/usr/bin/env python3
"""Generate SQL insert files for microlearn batch 2 books."""
from __future__ import annotations

import json
import re
from pathlib import Path


def esc(s: str) -> str:
    return s.replace("'", "''")


def slug(title: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_")
    return s[:50]


def book_sql(b: dict) -> str:
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
    return f"""DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = '{title}');
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


def main() -> None:
    root = Path(__file__).resolve().parent
    books = json.loads((root / "microlearn_batch2_books.json").read_text())
    outdir = root / "sql_batch2"
    chunks_dir = outdir / "chunks"
    outdir.mkdir(exist_ok=True)
    chunks_dir.mkdir(exist_ok=True)

    sql_texts: list[str] = []
    for i, b in enumerate(books, 1):
        sql = book_sql(b)
        sql_texts.append(sql)
        path = outdir / f"{i:02d}_{slug(b['title'])}.sql"
        path.write_text(sql)
        print(f"wrote {path.name} ({len(sql)} chars)")

    # chunk_1: books 1-4, chunk_2: 5-7, chunk_3: 8-10
    chunk_map = {
        1: sql_texts[0:4],
        2: sql_texts[4:7],
        3: sql_texts[7:10],
    }
    for n, parts in chunk_map.items():
        chunk_path = chunks_dir / f"chunk_{n}.sql"
        chunk_path.write_text("\n".join(parts))
        print(f"wrote chunks/{chunk_path.name} ({chunk_path.stat().st_size} bytes, {len(parts)} books)")


if __name__ == "__main__":
    main()
