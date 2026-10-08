from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, math
repo=Path(__file__).resolve().parent.parent
ref=repo/'assets/androidmetro-icon-minimal-512.png'
out=repo/'docs/evidencias';out.mkdir(exist_ok=True)
im=Image.open(ref).convert('RGBA')
mask=Image.new('L',im.size,0);mp=mask.load();p=im.load()
# The navy background has G<=31. Keep original visible white/cyan/gray pixels.
for y in range(512):
 for x in range(512):
  r,g,b,a=p[x,y]
  if 76<=x<=451 and 103<=y<=442 and g>=42:mp[x,y]=255
# Preserve the existing dark windshield/body inside the train's row boundaries.
for y in range(104,376):
 xs=[x for x in range(88,344) if mp[x,y]]
 if xs:
  for x in range(min(xs),max(xs)+1):mp[x,y]=255
cut=im.copy();cut.putalpha(mask)
assert cut.convert('RGB').tobytes()==im.convert('RGB').tobytes()
# Same source geometry; center visible drawing and scale into the 66dp safe circle.
source_center=(264,273); factor=.60; side=round(512*factor)
fg=Image.new('RGBA',(512,512));fg.alpha_composite(cut.resize((side,side),Image.Resampling.LANCZOS),(round(256-source_center[0]*factor),round(256-source_center[1]*factor)))
# Monochrome: reuse visible color strokes as alpha; leave the windshield hollow.
mono=Image.new('RGBA',(512,512),(255,255,255,0)); strokes=Image.new('L',(512,512))
for y in range(512):
 for x in range(512):
  r,g,b,a=p[x,y]
  # White/cyan, gray bumper and rail ties; exclude navy/reflection areas.
  if 76<=x<=451 and 103<=y<=442 and g>=42 and not (135<=x<=294 and 155<=y<=255 and r<30 and g<80):strokes.putpixel((x,y),255)
# Keep continuous gray rail-tie silhouettes rather than their original texture.
for y in range(390,437):
 xs=[x for x in range(130,298) if p[x,y][0]>=25 and p[x,y][1]>=42]
 if xs:
  for x in range(min(xs),max(xs)+1):strokes.putpixel((x,y),255)
small=strokes.resize((side,side),Image.Resampling.LANCZOS)
a=Image.new('L',(512,512));a.paste(small,(round(256-source_center[0]*factor),round(256-source_center[1]*factor)));mono.putalpha(a)
fg.save(repo/'assets/androidmetro-icon-foreground.png',optimize=True);mono.save(repo/'assets/androidmetro-icon-monochrome.png',optimize=True)
# Actual adaptive viewport is 72dp within 108dp layers: central 2/3.
viewport=(85,85,427,427);navy=(1,18,40,255)
normal=Image.new('RGBA',(512,512),navy);normal.alpha_composite(fg);normal=normal.crop(viewport)
alpha=mono.crop(viewport).getchannel('A');themed=Image.new('RGBA',(342,342),(225,236,245,255));tint=Image.new('RGBA',(342,342),(22,44,62,255));tint.putalpha(alpha);themed.alpha_composite(tint)
board=Image.new('RGB',(960,740),'#dddddd');d=ImageDraw.Draw(board)
font=ImageFont.load_default(size=18)
d.text((20,12),'Original aprobado / adaptativo circular / adaptativo redondeado / monocromo',fill='black',font=font)
board.paste(im.resize((210,210)).convert('RGB'),(20,55))
for col,(label,base,shape) in enumerate([('Circular',normal,'circle'),('Redondeado',normal,'round'),('Tematico',themed,'circle')],start=1):
 icon=base.resize((210,210),Image.Resampling.LANCZOS);m=Image.new('L',(210,210));md=ImageDraw.Draw(m)
 if shape=='circle':md.ellipse((0,0,209,209),fill=255)
 else:md.rounded_rectangle((0,0,209,209),radius=45,fill=255)
 board.paste(icon.convert('RGB'),(20+col*235,55),m)
for row,size in enumerate([48,72,96]):
 y=310+row*130;d.text((20,y),f'{size}px / fondos claro y oscuro',fill='black',font=font)
 for col,base in enumerate([normal,themed]):
  icon=base.resize((size,size),Image.Resampling.LANCZOS);m=Image.new('L',(size,size));ImageDraw.Draw(m).ellipse((0,0,size-1,size-1),fill=255)
  for k,bg in enumerate(['#f1f1f1','#121923']):
   x=330+col*260+k*115;d.rounded_rectangle((x-10,y-5,x+size+10,y+size+5),radius=5,fill=bg);board.paste(icon.convert('RGB'),(x,y),m)
board.save(out/'icono-prototipo-mascaras.png',optimize=True)
# Verify all visible source pixels are inside the centered 66dp-diameter safe circle.
coords=[(x,y) for y in range(512) for x in range(512) if mp[x,y]]
max_radius=max(math.hypot(x-source_center[0],y-source_center[1])*factor for x,y in coords)
assert max_radius <= 512*33/108, 'Drawing exceeds Android safe zone'
print(json.dumps({'source_sha256':hashlib.sha256(ref.read_bytes()).hexdigest(),'foreground_bbox':fg.getbbox(),'max_visible_radius_px':max_radius,'safe_radius_px':512*33/108,'source_pixels_preserved':True,'prototype':str(out/'icono-prototipo-mascaras.png')},indent=2))
