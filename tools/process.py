# GPverse — Ombra & Corona — elaborazione grafica (V.0.3.0)
# Uso: python3 tools/process.py assets/raw assets/sprites
# Elabora le immagini di Arena: chroma key magenta, ritaglio, ridimensionamento, texture ripetibili
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image

RAW = Path(sys.argv[1]); OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)

def key(img, soft=(0.30, 0.72)):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    k = np.minimum(R, B) - G                      # quanto è "magenta"
    border = np.concatenate([k[:6].ravel(), k[-6:].ravel(), k[:, :6].ravel(), k[:, -6:].ravel()])
    kb = float(np.median(border))
    bgc = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3)]), axis=0)
    lo, hi = soft[0] * kb, soft[1] * kb
    alpha = np.clip((hi - k) / (hi - lo), 0, 1)
    alpha[alpha < 0.06] = 0
    # togli il colore dello sfondo dai bordi semitrasparenti
    am = np.maximum(alpha, 0.05)[..., None]
    rgb = np.clip((a - (1 - am) * bgc) / am, 0, 255)
    rgb = np.where(alpha[..., None] > 0.97, a, rgb)
    # residuo magenta sui bordi
    edge = alpha < 0.98
    mx = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    fix = edge & (mx > 25)
    for c in (0, 2):
        ch = rgb[..., c]; ch[fix] = np.minimum(ch[fix], rgb[..., 1][fix] + 25)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), kb

def crop(im, pad=4):
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 25)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad + 1), min(im.height, y1 + pad + 1)))

def fit(im, w=None, h=None):
    if h and (not w or im.height / h >= im.width / w): s = h / im.height
    else: s = w / im.width
    return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)

def seamless(im, size):
    a = np.asarray(im.convert('RGB').resize((size, size), Image.LANCZOS)).astype(np.float32)
    r = np.roll(np.roll(a, size // 2, 0), size // 2, 1)
    t = np.linspace(0, 1, size)
    w1 = np.sin(np.pi * t) ** 2
    w = np.minimum(w1[:, None], w1[None, :])[..., None]
    w = np.clip(w * 1.6, 0, 1)
    return Image.fromarray((a * w + r * (1 - w)).astype(np.uint8))

info = {}
def save(im, name, q=90):
    p = OUT / f'{name}.webp'
    im.save(p, 'WEBP', quality=q, method=6)
    info[name] = [im.width, im.height]

for f in sorted([*RAW.glob('*.png'), *RAW.glob('*.jpg')]):
    n = f.stem
    src = Image.open(f)
    if n.startswith('ground_'):
        im = src.convert('RGB')
        save(seamless(im, 512), n, 88)
    elif n.startswith('ability_'):
        save(src.convert('RGB').resize((160, 160), Image.LANCZOS), n, 88)
    elif n == 'title_background':
        save(fit(src.convert('RGB'), w=1920), n, 84)
    else:
        im, kb = key(src)
        im = crop(im)
        if n.startswith('unit_'): im = fit(im, h=320)
        elif n.startswith('bld_'): im = fit(im, w=560)
        elif n.startswith('res_'): im = fit(im, h=256) if 'tree' in n else fit(im, w=256)
        elif n.startswith('icon_'): im = fit(im, w=96, h=96)
        elif n == 'emblem': im = fit(im, w=512)
        save(im, n, 92)
        print(f'{n:26s} sfondo={kb:6.1f} -> {im.width}x{im.height}')

(OUT / 'sizes.json').write_text(json.dumps(info, indent=1))
print('fatto:', len(info))
