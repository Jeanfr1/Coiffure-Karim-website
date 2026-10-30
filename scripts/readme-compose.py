#!/usr/bin/env python3
"""Frame the README captures (scripts/out/readme) into .github/assets."""
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts/out/readme'
DST = ROOT / '.github/assets'
DST.mkdir(parents=True, exist_ok=True)
BG = '#F6EDE1'


def browser(img, width=960):
    img = img.convert('RGB').resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    bar = 30
    card = Image.new('RGB', (width, img.height + bar), '#E7DFD3')
    d = ImageDraw.Draw(card)
    for i, c in enumerate(('#FF5F57', '#FEBC2E', '#28C840')):
        d.ellipse((14 + i * 18, 10, 24 + i * 18, 20), fill=c)
    d.rounded_rectangle((width * .32, 6, width * .68, 24), 7, fill='#FFFFFF')
    card.paste(img, (0, bar))
    mask = Image.new('L', card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card.width - 1, card.height - 1), 10, fill=255)
    out = Image.new('RGBA', card.size)
    out.paste(card, (0, 0), mask)
    return out


def phone(img, width=300):
    img = img.convert('RGB').resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    pad = 11
    body = Image.new('RGBA', (width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, body.width - 1, body.height - 1), 42, fill='#151C20')
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), 32, fill=255)
    body.paste(img, (pad, pad), m)
    return body


shots = [browser(Image.open(SRC / f'd{i}.png')) for i in range(4)]
w, h = shots[0].size
sheet = Image.new('RGB', (w * 2 + 72, h * 2 + 72), BG)
for i, s in enumerate(shots):
    sheet.paste(s, (24 + (i % 2) * (w + 24), 24 + (i // 2) * (h + 24)), s)
sheet.save(DST / 'desktop-sections.jpg', quality=84, optimize=True)

phones = [phone(Image.open(SRC / f'm{i}.png')) for i in range(3)]
w, h = phones[0].size
sheet = Image.new('RGB', (w * 3 + 128, h + 64), BG)
for i, s in enumerate(phones):
    sheet.paste(s, (32 + i * (w + 32), 32), s)
sheet.save(DST / 'mobile-screens.jpg', quality=84, optimize=True)

shutil.copy(SRC / 'banner.png', DST / 'banner.png')

# Every third frame at 680 px: the photo-heavy page dithers badly past 80 colours under 4 MB.
vf = ("select='not(mod(n\\,3))',setpts=N/5/TB,scale=680:-1:flags=lanczos,split[a][b];"
      "[a]palettegen=max_colors=80:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '15', '-i', str(SRC / 'frames/f_%04d.png'),
                '-vf', vf, '-r', '5', '-loop', '0', str(DST / 'hero-scroll.gif')], check=True)
for f in sorted(DST.iterdir()):
    print(f.name, f.stat().st_size // 1024, 'KB')
