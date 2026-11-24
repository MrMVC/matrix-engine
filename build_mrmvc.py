"""Generate a customizable animated Matrix-style SVG banner."""
import argparse
import random
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from xml.sax.saxutils import quoteattr
from PIL import Image, ImageDraw, ImageFont

PALETTES = {
    'purple': ('#07050c', '#29104b', '#7842c5', '#d8b4fe', '#d946ef'),
    'green': ('#030805', '#10351c', '#229955', '#b5ffcc', '#39ff88'),
    'blue': ('#040812', '#102b50', '#3579df', '#c0dfff', '#38bdf8'),
    'red': ('#100405', '#481219', '#bb394b', '#ffd0d5', '#ff5370'),
    'cyan': ('#030b0d', '#10383e', '#2299a9', '#c0ffff', '#22d3ee'),
    'mono': ('#080808', '#292929', '#888888', '#eeeeee', '#ffffff'),
}


def load_font(size, font_path=None):
    candidates = [font_path] if font_path else [
        'DejaVuSans-Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf',
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    raise ValueError('No compatible font found. Use --font-path.')


def build_svg(text='MrMVC', width=1500, height=400,
              output='output/matrix-banner.svg', font_path=None,
              font_size=218, seed=42, color='purple', speed=1.0,
              animate=True, show_scanline=True, animate_scanline=True):
    if not text.strip() or len(text) > 80 or any(ord(c) < 32 or 0xD800 <= ord(c) <= 0xDFFF or ord(c) in (0xFFFE, 0xFFFF) for c in text):
        raise ValueError('Text must contain 1–80 printable characters.')
    if not (300 <= width <= 4000 and 120 <= height <= 1600):
        raise ValueError('Width: 300–4000; height: 120–1600.')
    if not (0.25 <= speed <= 4 and 8 <= font_size <= 1600):
        raise ValueError('Speed: 0.25–4; font size: 8–1600.')
    if color not in PALETTES:
        raise ValueError('Unknown color preset.')
    bg, ambient, mid, light, accent = PALETTES[color]
    rng = random.Random(seed)
    mask = Image.new('L', (width, height))
    draw = ImageDraw.Draw(mask)
    size = min(font_size, int(height * .8))
    while size >= 8:
        font = load_font(size, font_path)
        l, t, r, b = draw.textbbox((0, 0), text, font=font)
        if r-l <= width*.82 and b-t <= height*.55:
            break
        size -= max(1, size//15)
    else:
        raise ValueError('Text cannot fit into the selected dimensions.')
    draw.text(((width-r+l)/2-l, (height-b+t)/2-t), text, font=font, fill=255)
    step = max(3, min(10, size//14))
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label={quoteattr(text + " matrix banner")}>',
             f'<defs><radialGradient id="ambient"><stop stop-color="{ambient}" stop-opacity=".7"/><stop offset="1" stop-color="{bg}" stop-opacity="0"/></radialGradient><linearGradient id="rain" x2="0%" y2="100%"><stop stop-color="{ambient}"/><stop offset=".65" stop-color="{mid}"/><stop offset="1" stop-color="{light}"/></linearGradient><clipPath id="bounds"><rect width="{width}" height="{height}" rx="12"/></clipPath></defs>',
             f'<g clip-path="url(#bounds)" font-family="monospace"><rect width="{width}" height="{height}" fill="{bg}"/><rect width="{width}" height="{height}" fill="url(#ambient)"/>']
    for x in range(12, width, 25):
        length = rng.randrange(9, 24)
        y = rng.randrange(-height, height)
        parts.append(f'<g fill="url(#rain)" font-size="13" opacity="{rng.uniform(.14,.48):.2f}">')
        if animate:
            parts.append(f'<animateTransform attributeName="transform" type="translate" from="0 {-y-length*17}" to="0 {height-y}" dur="{rng.uniform(4,10)/speed:.2f}s" begin="{-rng.uniform(0,10)/speed:.2f}s" repeatCount="indefinite"/>')
        for j in range(length):
            parts.append(f'<text x="{x}" y="{y+j*17}">{rng.randrange(10)}</text>')
        parts.append('</g>')
    parts.append(f'<g font-size="{step+2}" text-anchor="middle" font-weight="bold">')
    for y in range(step, height, step+2):
        for x in range(step, width, step):
            if mask.getpixel((x,y)) > 150:
                parts.append(f'<text x="{x}" y="{y+step//2}" fill="{rng.choice([mid,light,light,accent])}">{rng.randrange(10)}')
                if animate:
                    parts.append(f'<animate attributeName="opacity" values=".55;1;.8;.55" dur="{rng.uniform(2,5)/speed:.2f}s" begin="{-rng.uniform(0,5)/speed:.2f}s" repeatCount="indefinite"/>')
                parts.append('</text>')
    parts.append('</g>')
    if show_scanline:
        line_y = height * .79
        parts.append(f'<path d="M0 {line_y} H{width}" stroke="{accent}" opacity=".2"/>')
        if animate and animate_scanline:
            scan_width = width * .22
            # Match JavaScript's toFixed(2) for ties such as 3 / 0.96.
            duration = Decimal.from_float(3 / speed).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)
            parts.append(f'<defs><linearGradient id="scanline"><stop offset="0" stop-color="{accent}" stop-opacity="0"/><stop offset=".5" stop-color="{light}"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></linearGradient></defs>')
            parts.append(f'<rect x="{-scan_width}" y="{line_y - 1}" width="{scan_width}" height="2" fill="url(#scanline)"><animate attributeName="x" from="{-scan_width}" to="{width}" dur="{duration}s" repeatCount="indefinite"/></rect>')
    parts.append('</g></svg>')
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(''.join(parts), encoding='utf-8')
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--text', default='MrMVC')
    parser.add_argument('--width', type=int, default=1500)
    parser.add_argument('--height', type=int, default=400)
    parser.add_argument('--font-size', type=int, default=218)
    parser.add_argument('--font-path')
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--color', choices=PALETTES, default='purple')
    parser.add_argument('--speed', type=float, default=1.0)
    parser.add_argument('--output', default='output/matrix-banner.svg')
    parser.add_argument('--no-animation', dest='animate', action='store_false',
                        help='Generate a static SVG with all animation disabled.')
    parser.add_argument('--no-scanline', dest='show_scanline', action='store_false',
                        help='Hide the scanline and its moving light impulse.')
    parser.add_argument('--no-scanline-animation', dest='animate_scanline', action='store_false',
                        help='Keep the static scanline while other animations continue.')
    args = vars(parser.parse_args())
    try:
        print(f'Banner generated: {build_svg(**args)}')
    except (ValueError, OSError) as exc:
        parser.error(str(exc))


if __name__ == '__main__':
    main()
