#!/usr/bin/env python3
"""Generate simple Core Habit cover PNGs (title + CORE HABIT label + icon)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[2] / 'assets' / 'core-habits'
OUT.mkdir(parents=True, exist_ok=True)

FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONT_REG = '/System/Library/Fonts/Supplemental/Arial.ttf'

HABITS = [
    ('sleep', 'Sleep', '#34D399', 'moon'),
    ('gym', 'Workout', '#EF4444', 'dumbbell'),
    ('run', 'Exercise', '#EAB308', 'run'),
    ('meditation', 'Meditation', '#14B8A6', 'lotus'),
    ('update_goal', 'Update Goal', '#A78BFA', 'flag'),
    ('microlearn', 'Microlearn', '#FB7185', 'book'),
    ('focus', 'Focus', '#F472B6', 'target'),
    ('reflect', 'Reflect', '#F59E0B', 'journal'),
    ('water', 'Water', '#60A5FA', 'drop'),
    ('cold_shower', 'Cold Shower', '#38BDF8', 'snow'),
    ('screen_time', 'Screen Time', '#FBBF24', 'phone'),
]


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def draw_icon(draw, kind, cx, cy, color):
    if kind == 'moon':
        draw.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=color)
        draw.ellipse((cx - 18, cy - 48, cx + 48, cy + 28), fill='#111827')
    elif kind == 'dumbbell':
        draw.rounded_rectangle((cx - 55, cy - 12, cx + 55, cy + 12), radius=6, fill=color)
        draw.rounded_rectangle((cx - 70, cy - 28, cx - 42, cy + 28), radius=8, fill=color)
        draw.rounded_rectangle((cx + 42, cy - 28, cx + 70, cy + 28), radius=8, fill=color)
    elif kind == 'run':
        draw.ellipse((cx - 10, cy - 48, cx + 14, cy - 24), fill=color)
        draw.line([(cx, cy - 22), (cx - 8, cy + 10), (cx - 28, cy + 40)], fill=color, width=8)
        draw.line([(cx, cy - 22), (cx + 18, cy + 8), (cx + 36, cy + 36)], fill=color, width=8)
        draw.line([(cx - 4, cy - 5), (cx - 30, cy - 8)], fill=color, width=8)
        draw.line([(cx - 4, cy - 5), (cx + 28, cy + 4)], fill=color, width=8)
    elif kind == 'lotus':
        for dx in (-28, 0, 28):
            draw.ellipse((cx + dx - 22, cy - 10, cx + dx + 22, cy + 40), fill=color)
        draw.ellipse((cx - 18, cy - 35, cx + 18, cy + 15), fill='#FFFFFF')
        draw.ellipse((cx - 12, cy - 28, cx + 12, cy + 8), fill=color)
    elif kind == 'flag':
        draw.line([(cx - 30, cy - 45), (cx - 30, cy + 45)], fill=color, width=8)
        draw.polygon([(cx - 26, cy - 42), (cx + 40, cy - 20), (cx - 26, cy + 2)], fill=color)
    elif kind == 'book':
        draw.rounded_rectangle((cx - 40, cy - 45, cx + 40, cy + 45), radius=8, fill=color)
        draw.line([(cx, cy - 40), (cx, cy + 40)], fill='#111827', width=4)
        draw.line([(cx - 28, cy - 20), (cx - 8, cy - 20)], fill='#111827', width=3)
        draw.line([(cx + 8, cy - 20), (cx + 28, cy - 20)], fill='#111827', width=3)
    elif kind == 'target':
        for r, fill in ((48, color), (34, '#111827'), (20, color), (8, '#FFFFFF')):
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    elif kind == 'journal':
        draw.rounded_rectangle((cx - 38, cy - 48, cx + 38, cy + 48), radius=6, fill=color)
        for y in (-20, -4, 12):
            draw.line([(cx - 22, cy + y), (cx + 22, cy + y)], fill='#111827', width=3)
    elif kind == 'drop':
        draw.polygon([(cx, cy - 48), (cx + 36, cy + 8), (cx, cy + 48), (cx - 36, cy + 8)], fill=color)
        draw.ellipse((cx - 28, cy - 5, cx + 28, cy + 48), fill=color)
    elif kind == 'snow':
        for ang in range(0, 180, 30):
            import math
            rad = math.radians(ang)
            x2 = cx + int(48 * math.cos(rad))
            y2 = cy + int(48 * math.sin(rad))
            x3 = cx - int(48 * math.cos(rad))
            y3 = cy - int(48 * math.sin(rad))
            draw.line([(x3, y3), (x2, y2)], fill=color, width=6)
        draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=color)
    elif kind == 'phone':
        draw.rounded_rectangle((cx - 28, cy - 48, cx + 28, cy + 48), radius=10, fill=color)
        draw.rounded_rectangle((cx - 20, cy - 36, cx + 20, cy + 28), radius=4, fill='#111827')
        draw.ellipse((cx - 6, cy + 34, cx + 6, cy + 46), fill='#111827')


def make_cover(slug, title, accent, icon):
    w, h = 600, 900
    img = Image.new('RGB', (w, h), '#111827')
    draw = ImageDraw.Draw(img)

    # soft top panel
    draw.rounded_rectangle((36, 36, w - 36, h - 36), radius=36, fill='#1F2937')
    draw.rounded_rectangle((36, 36, w - 36, 210), radius=36, fill=accent)
    # square off bottom of accent so only top is rounded visually
    draw.rectangle((36, 120, w - 36, 210), fill=accent)

    label_font = font(FONT_BOLD, 28)
    title_font = font(FONT_BOLD, 54 if len(title) < 12 else 42)
    sub_font = font(FONT_REG, 22)

    label = 'CORE HABIT'
    lw = draw.textlength(label, font=label_font)
    draw.text(((w - lw) / 2, 88), label, fill='#111827', font=label_font)

    draw_icon(draw, icon, w // 2, 430, accent)

    # title block
    tw = draw.textlength(title, font=title_font)
    draw.text(((w - tw) / 2, 620), title, fill='#FFFFFF', font=title_font)

    tag = 'Why this habit matters'
    sw = draw.textlength(tag, font=sub_font)
    draw.text(((w - sw) / 2, 700), tag, fill='#9CA3AF', font=sub_font)

    path = OUT / f'{slug}.png'
    img.save(path, 'PNG')
    print('wrote', path)
    return path


if __name__ == '__main__':
    for slug, title, accent, icon in HABITS:
        make_cover(slug, title, accent, icon)
    print('done', len(HABITS))
