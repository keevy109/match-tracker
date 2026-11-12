from pathlib import Path
p=Path('tmp/businessplan-2026-10/build.py');s=p.read_text();s=s.replace("import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt", "from reportlab.pdfgen import canvas\nfrom reportlab.lib.colors import HexColor\nfrom pdf2image import convert_from_path")
a=s.index('plt.rcParams.update');b=s.index('\ndoc=Document()',a)
s=s[:a]+'''def chart(name, series, ymax, reserve=None):
 c=canvas.Canvas(str(TMP/(name+'.pdf')),pagesize=(640,240))
 left,bottom,w,h=58,38,550,175
 c.setFont('Helvetica',9)
 for v in range(0,int(ymax)+1,int(ymax/4)):
  y=bottom+h*v/ymax;c.setStrokeColor(HexColor('#dce2e7'));c.line(left,y,left+w,y)
  c.setFillColor(HexColor('#52616d'));c.drawRightString(left-8,y-3,str(v))
 for i,lab in enumerate(['Jan','Feb','Maer','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']):
  c.drawCentredString(left+w*i/11,20,lab)
 if reserve:
  c.setStrokeColor(HexColor('#e77b20'));c.setDash(4,3);c.line(left,bottom+h*reserve/ymax,left+w,bottom+h*reserve/ymax);c.setDash()
 for j,(label,vals,color) in enumerate(series):
  c.setStrokeColor(HexColor(color));c.setLineWidth(2.5)
  path=c.beginPath()
  for i,v in enumerate(vals):
   x,y=left+w*i/11,bottom+h*v/ymax
   if i==0:path.moveTo(x,y)
   else:path.lineTo(x,y)
  c.drawPath(path);c.setFillColor(HexColor(color));c.drawString(left+160*j,227,label)
 c.setFillColor(HexColor('#52616d'));c.drawString(5,227,'EUR');c.save()
 convert_from_path(str(TMP/(name+'.pdf')),dpi=180,poppler_path='/Users/Vogt/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override')[0].save(TMP/(name+'.png'))
chart('cash',[('Umsatz',[m['revenue'] for m in months],'#e77b20'),('Ausgaben',[m['cost'] for m in months],'#203b50')],400)
chart('liquidity',[('Monatsendbestand',[m['closing'] for m in months],'#203b50')],2400,1000)
''' +s[b:];p.write_text(s)
