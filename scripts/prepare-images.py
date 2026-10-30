#!/usr/bin/env python3
"""Builds the site plates from images/master and images/upscaled.

The masters stay untouched. Each plate is sized for the "whole picture fits one
screen" layout: the frieze and the closing macro get a wave-shaped alpha top so
the scene above shows through the join, the closing gets extra paper on the
right for wide windows, and the frieze gets a graphite version for the
sketch-to-photo wipe. The painted town comes from the approved board.

Run scripts/upscale.py on the four masters first (see README), then:
python3 scripts/prepare-images.py
"""
import base64
import io
import re
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER, UP, OUT = ROOT / 'images/master', ROOT / 'images/upscaled', ROOT / 'site/assets'
PETROLE = np.array([0x10, 0x2C, 0x35], np.float32)
PAPER = np.array([0xF4, 0xEB, 0xDE], np.float32)

# Same curves as the lines drawn over them in site/index.html, in plate pixels.
FRIEZE_TOP = 'M0 16 C262 132 411 38 630 48 S1008 124 1211 70 S1415 50 1551 14'
CLOSING_TOP = 'M0 0 C190 2 380 30 571 83 S800 165 1071 135 S1400 195 1700 165 S2100 130 2231 150'
FRIEZE_SIZE, CLOSING_SIZE = (1551, 900), (2231, 1014)


def curve(d, width):
    """Samples an 'M C S' path into y(x) for every column of a plate `width` wide."""
    nums = [float(n) for n in re.findall(r'-?\d+\.?\d*', d)]
    pts, i = [np.array(nums[:2])], 2
    cmds = re.findall(r'[CS]', d)
    last_ctrl = None
    samples = []
    for c in cmds:
        p0 = pts[-1]
        if c == 'C':
            p1, p2, p3 = (np.array(nums[i + k:i + k + 2]) for k in (0, 2, 4))
            i += 6
        else:
            p1 = 2 * p0 - last_ctrl
            p2, p3 = np.array(nums[i:i + 2]), np.array(nums[i + 2:i + 4])
            i += 4
        for t in np.linspace(0, 1, 200):
            samples.append((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3)
        pts.append(p3)
        last_ctrl = p2
    s = np.array(samples)
    return np.interp(np.arange(width), s[:, 0], s[:, 1])


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def load(name):
    """Master at 2x: 60 % Real-ESRGAN for the edges, 40 % Lanczos so skin keeps its grain."""
    master = Image.open(MASTER / f'{name}.png').convert('RGB')
    up = np.asarray(Image.open(UP / f'{name}@2x.png').convert('RGB'), np.float32)
    soft = np.asarray(master.resize((up.shape[1], up.shape[0]), Image.LANCZOS), np.float32)
    return up * .6 + soft * .4


def save(rgb, path, width=None, quality=84, alpha=None):
    a = np.clip(rgb, 0, 255).astype(np.uint8)
    if alpha is not None:
        a = np.dstack([a, np.clip(alpha * 255, 0, 255).astype(np.uint8)])
    im = Image.fromarray(a)
    if width and width < im.width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=quality, method=6, alpha_quality=88)
    print(f'{path.name}: {im.width}x{im.height} {path.stat().st_size // 1024} KB')


def wave_alpha(h, w, ys, feather):
    return smooth(-feather, feather, (np.arange(h)[:, None] - ys[None, :]))


def graphite(rgb):
    """Pencil rendering: colour-dodge of the inverted blur, capes kept dark."""
    g = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    blur = cv2.GaussianBlur(255 - g, (0, 0), 26)
    dodge = np.clip(g * 255 / (256 - blur), 0, 255)
    tone = np.minimum(dodge, g * 1.25 + 40)
    return (tone[..., None] / 255) * PAPER


def painted_wave_line(rgb):
    """Row where the painted petroleum wave starts, per column of the frieze (2x)."""
    h, w, _ = rgb.shape
    dark = (rgb.sum(2) < 240) & (rgb[..., 2] >= rgb[..., 0])
    ys = np.full(w, h, np.float32)
    for x in range(w):
        col = dark[1400:, x]
        run = np.convolve(col, np.ones(24), 'same')
        hits = np.flatnonzero(run > 22)
        if hits.size:
            ys[x] = 1400 + hits[0]
    return cv2.GaussianBlur(ys[None, :], (0, 0), 40).ravel()


def frieze():
    rgb = load('service-frieze')
    w, h = FRIEZE_SIZE[0] * 2, FRIEZE_SIZE[1] * 2
    rgb = rgb[:h, :w]
    ys = np.arange(h, dtype=np.float32)[:, None, None]
    fade = smooth(1640, 1790, ys)
    rgb = rgb * (1 - fade) + PETROLE * fade
    alpha = wave_alpha(h, w, curve(FRIEZE_TOP, FRIEZE_SIZE[0]).repeat(2) * 2, 5)
    save(rgb, OUT / 'frieze-color.webp', 1551, 86, alpha)
    save(rgb, OUT / 'frieze-color@2x.webp', 2600, 82, alpha)
    pencil = graphite(rgb)
    keep = smooth(-30, 30, np.arange(h)[:, None] - painted_wave_line(rgb)[None, :])[..., None]
    pencil = pencil * (1 - keep) + rgb * keep
    save(pencil, OUT / 'frieze-sketch.webp', 1551, 62, alpha)


def closing():
    rgb = load('closing-art')
    h, w, _ = rgb.shape
    full = CLOSING_SIZE[0] * 2
    rng = np.random.default_rng(14)
    grain = cv2.GaussianBlur(rng.normal(0, 1.1, (h, full - w)).astype(np.float32), (0, 0), .8)[..., None]
    joined = np.hstack([rgb, PAPER + grain])
    # The master's right-hand paint would sit behind the contact column: thin it out, then settle into plain paper.
    drift = cv2.GaussianBlur(rng.normal(0, 1, (h, 1)).astype(np.float32), (1, 0), 0, sigmaY=90).ravel()
    drift = drift / np.abs(drift).max() * 210
    x = np.arange(full, dtype=np.float32)[None, :] + drift[:, None]
    thin = (smooth(2200, 2560, x) * .7 + smooth(2380, 2860, x) * .3)[..., None]
    joined = joined * (1 - thin) + PAPER * thin
    ys = curve(CLOSING_TOP, CLOSING_SIZE[0]).repeat(2) * 2
    below = np.arange(h)[:, None] - ys[None, :]
    alpha = wave_alpha(h, full, ys, 4)
    # Dark brush band under the line, as on the board: streaks along x.
    noise = cv2.GaussianBlur(rng.random((h, full), np.float32), (0, 0), sigmaX=60, sigmaY=2)
    noise = (noise - noise.min()) / (noise.max() - noise.min())
    band = (1 - smooth(8, 70, below)) * smooth(.4, .62, noise + (1 - smooth(0, 44, below)) * .62)
    left = 1 - smooth(900, 2100, np.arange(full, dtype=np.float32))[None, :]
    band = (band * left)[..., None]
    joined = joined * (1 - band) + PETROLE * band
    save(joined, OUT / 'closing-plate.webp', CLOSING_SIZE[0], 84, alpha)
    save(joined, OUT / 'closing-plate@2x.webp', 3400, 80, alpha)
    # Phones only show the photograph, not the paper tail.
    save(joined[:, :w], OUT / 'closing-phone.webp', 1200, 80, alpha[:, :w])


def hero():
    save(load('hero-art'), OUT / 'hero-art@2x.webp', 2600, 84)
    save(load('hero-mobile-art'), OUT / 'hero-mobile-art@2x.webp', 1536, 82)


def town():
    """Painted town lifted from the approved board (x 408-565, y 870-1078), fading into the petroleum."""
    crop = OUT.parent.parent / 'images/upscaled/ville-board.png'
    tmp = OUT.parent.parent / 'images/upscaled/ville-board-1x.png'
    Image.open(ROOT / 'references/Modelo-3-Aprovado.png').convert('RGB').crop((408, 870, 565, 1078)).save(tmp)
    subprocess.run([sys.executable, str(ROOT / 'scripts/upscale.py'), str(tmp), str(crop), '--scale', '4'], check=True, capture_output=True)
    tmp.unlink()
    rgb = np.asarray(Image.open(crop).convert('RGB'), np.float32)
    h, w, _ = rgb.shape
    x = np.arange(w, dtype=np.float32)[None, :]
    y = np.arange(h, dtype=np.float32)[:, None]
    alpha = smooth(110, 300, x) * smooth(0, 40, y) * (1 - smooth(h - 44, h - 6, y))
    # The board's headline sits in the top-left corner of the crop.
    alpha *= 1 - (1 - smooth(450, 490, x)) * (1 - smooth(250, 290, y))
    save(rgb, OUT / 'ville-peinte.webp', None, 82, alpha)


def brush():
    """Horizontal bristle edge used as the wipe mask, inlined so it also works from file://."""
    w, h = 720, 120
    rng = np.random.default_rng(3)
    coarse = np.interp(np.arange(h), np.linspace(0, h, 7), rng.uniform(-.09, .09, 7))
    bristle = cv2.GaussianBlur(rng.normal(0, 1, (h, 1)).astype(np.float32), (1, 0), 0, sigmaY=.7).ravel() * .03
    edge = .5 + coarse + bristle
    x = (np.arange(w) / w)[None, :]
    a = 1 - smooth(edge[:, None] - .035, edge[:, None] + .035, x)
    la = Image.new('LA', (w, h))
    la.putdata([(0, int(v)) for v in (a * 255).ravel()])
    buf = io.BytesIO()
    la.save(buf, 'PNG', optimize=True)
    data = base64.b64encode(buf.getvalue()).decode()
    (ROOT / 'site/brush.css').write_text(f":root{{--brush:url('data:image/png;base64,{data}')}}\n")
    print(f'brush.css: {len(data) // 1024} KB')


if __name__ == '__main__':
    steps = {'frieze': frieze, 'closing': closing, 'hero': hero, 'town': town, 'brush': brush}
    for name in sys.argv[1:] or steps:
        steps[name]()
