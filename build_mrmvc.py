from PIL import Image, ImageDraw, ImageFont
import random, math
from pathlib import Path
r=random.Random(42)
W,H=1500,400
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',218)
mask=Image.new('L',(W,H)); d=ImageDraw.Draw(mask); b=d.textbbox((0,0),'MrMVC',font=font); d.text(((W-(b[2]-b[0]))/2-b[0],(H-(b[3]-b[1]))/2-b[1]-8),'MrMVC',font=font,fill=255)
parts=['''<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="400" viewBox="0 0 1500 400" role="img" aria-label="MrMVC animated matrix banner">
<defs><radialGradient id="ambient"><stop stop-color="#29104b" stop-opacity=".65"/><stop offset="1" stop-color="#050308" stop-opacity="0"/></radialGradient><linearGradient id="rain" x2="0" y2="1"><stop stop-color="#21102f"/><stop offset=".65" stop-color="#7842c5"/><stop offset="1" stop-color="#d6a5ff"/></linearGradient><linearGradient id="sweep"><stop stop-color="#d946ef" stop-opacity="0"/><stop offset=".5" stop-color="#e9caff" stop-opacity=".8"/><stop offset="1" stop-color="#687aff" stop-opacity="0"/></linearGradient><clipPath id="bounds"><rect width="1500" height="400" rx="12"/></clipPath></defs>
<rect width="1500" height="400" rx="12" fill="#07050c"/><ellipse cx="750" cy="205" rx="680" ry="270" fill="url(#ambient)"/><g clip-path="url(#bounds)" font-family="monospace" font-size="13">''']
for x in range(12,W,25):
    y=r.randrange(-260,40); dur=r.uniform(4,10); delay=r.uniform(-10,0); opacity=r.uniform(.14,.48)
    parts.append(f'<g opacity="{opacity:.2f}" fill="url(#rain)"><animateTransform attributeName="transform" type="translate" from="0 -280" to="0 440" dur="{dur:.2f}s" begin="{delay:.2f}s" repeatCount="indefinite"/>')
    for j in range(r.randrange(9,24)):
        parts.append(f'<text x="{x}" y="{y+j*17}">{r.randrange(10)}</text>')
    parts.append('</g>')
parts.append('<g font-size="12" text-anchor="middle" font-weight="bold">')
for y in range(90,300,13):
    for x in range(300,1200,10):
        if mask.getpixel((x,y))>150:
            c=r.choice(['#a78bfa','#c084fc','#e9d5ff','#a855f7','#d946ef','#818cf8']); digit=r.randrange(10)
            parts.append(f'<text x="{x}" y="{y+4}" fill="{c}">{digit}<animate attributeName="opacity" values=".55;1;.8;.55" dur="{r.uniform(2,5):.2f}s" begin="{-r.uniform(0,5):.2f}s" repeatCount="indefinite"/></text>')
parts.append('''</g><rect x="0" y="315" width="1500" height="1" fill="url(#sweep)" opacity=".28"/><rect x="0" y="315" width="220" height="1.5" fill="url(#sweep)"><animate attributeName="x" values="-220;1500" dur="5s" repeatCount="indefinite"/></rect></g></svg>''')
Path('/mnt/data/mrmvc-matrix.svg').write_text(''.join(parts))
