from pathlib import Path
from decimal import Decimal as D
import json, math
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from pdf2image import convert_from_path

ROOT=Path('/Users/Vogt/Downloads/matchTracker')
OUT=ROOT/'outputs/businessplan-2026-10'; TMP=ROOT/'tmp/businessplan-2026-10'
OUT.mkdir(parents=True,exist_ok=True)
# All commercial figures below are planning assumptions, not customer observations.
active=[0,0,5,20,30,45,60,80,105,130,160,200]
new=[0,0,0,5,3,4,4,6,7,7,9,10]; churn=[0,0,0,0,0,0,1,1,1,1,1,0]
paid=[]; n=0
for a,b in zip(new,churn): n+=a-b; paid.append(n)
fixed=[100]*3+[130]*3+[160]*3+[190]*3
balance=D(2200); months=[]
for i,(a,p,f) in enumerate(zip(active,paid,fixed)):
 rev=D(p)*6; variable=D(a)*D('.15')+D(p)*D('.40'); fees=rev*D('.03')+D(p)*D('.25')
 cost=D(f)+variable+fees; cf=rev-cost; start=balance; balance+=cf
 months.append(dict(month=i+1,active=a,new_paid=new[i],churn=churn[i],paid=p,revenue=float(rev),fixed=f,variable=float(variable),fees=float(fees),cost=float(cost),cashflow=float(cf),opening=float(start),closing=float(balance)))
assert paid[-1]==50 and sum(new)==55 and sum(churn)==5
fin={'assumptions':{'net_monthly_revenue_per_paid_equivalent':6,'variable_all_active_teams':.15,'extra_variable_paid_team':.40,'payment_rate':.03,'payment_fixed_per_monthly_equivalent':.25,'initial_capital_assumption':4000,'prelaunch_costs_2026':1800,'initial_cash_2027':2200},'months':months}
(OUT/'finanzannahmen.json').write_text(json.dumps(fin,ensure_ascii=False,indent=2))
fmt=lambda x: f'{x:,.2f}'.replace(',','X').replace('.',',').replace('X','.')
whole=lambda x: f'{x:,.0f}'.replace(',','.')
rev=sum(m['revenue'] for m in months); costs=sum(m['cost'] for m in months); cf=rev-costs
# Vector-like, high resolution charts, explicitly labelled scenario.
def chart(name, series, ymax, reserve=None):
 short=(name=='cash')
 c=canvas.Canvas(str(TMP/(name+'.pdf')),pagesize=(640,150 if short else 240))
 left,bottom,w,h=58,30 if short else 38,550,90 if short else 175
 c.setFont('Helvetica',12)
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
  c.drawPath(path);c.setFillColor(HexColor(color));c.drawString(left+160*j,138 if short else 227,label)
 c.setFillColor(HexColor('#52616d'));c.drawString(5,138 if short else 227,'EUR');c.save()
 convert_from_path(str(TMP/(name+'.pdf')),dpi=180,poppler_path='/Users/Vogt/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override')[0].save(TMP/(name+'.png'))
chart('cash',[('Umsatz',[m['revenue'] for m in months],'#e77b20'),('Ausgaben',[m['cost'] for m in months],'#203b50')],400)
chart('liquidity',[('Monatsendbestand',[m['closing'] for m in months],'#203b50')],2400,1000)

doc=Document(); sec=doc.sections[0];sec.page_width=Inches(8.5);sec.page_height=Inches(11);sec.top_margin=Inches(.7);sec.bottom_margin=Inches(.65);sec.left_margin=sec.right_margin=Inches(.8)
styles=doc.styles
for st in styles:
 for border in list(st.element.iter(qn('w:pBdr'))): border.getparent().remove(border)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3']:
 styles[name].font.name='Calibri';styles[name].font.color.rgb=RGBColor(0,0,0)
styles['Normal'].font.size=Pt(11);styles['Normal'].paragraph_format.space_after=Pt(7);styles['Normal'].paragraph_format.line_spacing=1.08
styles['Title'].font.size=Pt(34);styles['Title'].font.bold=True
styles['Subtitle'].font.size=Pt(16)
styles['Heading 1'].font.size=Pt(23);styles['Heading 1'].paragraph_format.space_after=Pt(14)
styles['Heading 2'].font.size=Pt(13);styles['Heading 2'].paragraph_format.space_before=Pt(12);styles['Heading 2'].paragraph_format.space_after=Pt(5)
styles['Heading 3'].font.size=Pt(11);styles['Heading 3'].font.bold=True
sec.header_distance=Inches(.3);sec.footer_distance=Inches(.3)
h=sec.header.paragraphs[0];h.text='MATCHTRACKER   /   GESCHÄFTSPLAN';h.style='Caption';h.runs[0].font.size=Pt(8);h.runs[0].font.color.rgb=RGBColor(0,0,0)
f=sec.footer.paragraphs[0];f.alignment=WD_ALIGN_PARAGRAPH.RIGHT
r=f.add_run('Vertraulich · 08.10.2026 · ');r.font.size=Pt(8)
fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');f._p.append(fld)
doc.core_properties.title='Businessplan für einen Liveticker-Service im Jugendfußball'
doc.core_properties.subject='Strategie Markt Geschäftsmodell Technik und Finanzplanung 2027 bis 2029'
doc.core_properties.author='matchTracker Projektteam'
sections=[]
def p(t,bold=False):
 x=doc.add_paragraph(t)
 if bold:
  for r in x.runs:r.bold=True
 return x
def h2(t):doc.add_heading(t,2)
def page(n,title):
 sections.append((n,title)); marker=p(f'{n:02d}   /   BUSINESSPLAN');marker.paragraph_format.page_break_before=True;marker.runs[0].font.size=Pt(9);doc.add_heading(title,1)
def table(headers,rows,widths=None):
 t=doc.add_table(rows=1,cols=len(headers));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
 widths=widths or [6.9/len(headers)]*len(headers)
 for c,w in zip(t.columns,widths):c.width=Inches(w)
 for i,head in enumerate(headers):t.rows[0].cells[i].text=head
 for row in rows:
  cells=t.add_row().cells
  for i,v in enumerate(row):cells[i].text=str(v)
 for ri,row in enumerate(t.rows):
  pr=row._tr.get_or_add_trPr();pr.append(OxmlElement('w:cantSplit'))
  if ri==0:pr.append(OxmlElement('w:tblHeader'))
  for ci,c in enumerate(row.cells):
   c.width=Inches(widths[ci]);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER;tcp=c._tc.get_or_add_tcPr()
   shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'203B50' if ri==0 else ('F1F4F6' if ri%2==0 else 'FFFFFF'));tcp.append(shade)
   borders=OxmlElement('w:tcBorders')
   for edge in ['top','left','bottom','right']:
    z=OxmlElement('w:'+edge);z.set(qn('w:val'),'single');z.set(qn('w:sz'),'4');z.set(qn('w:color'),'D9D9D9');borders.append(z)
   tcp.append(borders);mar=OxmlElement('w:tcMar')
   for edge in ['top','bottom','left','right']:
    z=OxmlElement('w:'+edge);z.set(qn('w:w'),'85');z.set(qn('w:type'),'dxa');mar.append(z)
   tcp.append(mar)
   for par in c.paragraphs:
    par.paragraph_format.space_after=Pt(2);par.paragraph_format.line_spacing=1.02
    for r in par.runs:r.font.size=Pt(9.5);r.bold=(ri==0);r.font.color.rgb=RGBColor.from_string('FFFFFF' if ri==0 else '000000')
 spacer=doc.add_paragraph();spacer.paragraph_format.space_after=Pt(0);spacer.paragraph_format.space_before=Pt(0);spacer.paragraph_format.line_spacing=Pt(2);spacer.add_run(' ').font.size=Pt(1)
 return t
def note(t):
 x=p(t)
 for r in x.runs:r.font.size=Pt(9);r.font.color.rgb=RGBColor.from_string('52616D')
def pic(name):
 par=doc.add_paragraph();par.paragraph_format.space_after=Pt(3);par.add_run().add_picture(str(TMP/name),width=Inches(6.8 if name=='cash.png' else 6.3))

p('STRATEGIE   ·   PRODUKT   ·   TECHNOLOGIE   ·   WIRTSCHAFTLICHKEIT').runs[0].font.size=Pt(9)
p('Businessplan',False).style='Title'
p('Liveticker-Service für den\nAmateur- und Jugendfußball').style='Subtitle'
p('matchTracker als Arbeitstitel',True)
p('Deutschland · Pilotstart im ersten Quartal 2027 · Planung bis 2029')
doc.add_paragraph('\n')
p('Ein Spieltag im Browser',True)
p('Mannschaften berichten live. Eltern und Fans verfolgen das Spiel über einen Link. Vereine behalten die Kontrolle über Inhalte, Daten und Berechtigungen.')
doc.add_paragraph('\n')
table(['Startpunkt','Unternehmerischer Rahmen'],[['Produkt','Bestehender vereinsbezogener Prototyp als fachliche Grundlage'],['Team','Voraussichtlich zwei Personen und KI als Arbeitswerkzeug'],['Zeit','Maximal zwei Stunden pro Person und Tag'],['Modell','Kostenloser Einstieg mit späteren Team- und Vereinsabos'],['Entscheidung','Begrenzten Pilot finanzieren und Nachfrage vor Ausbau belegen']],[1.45,5.45])
p('Der Plan empfiehlt einen stufenweisen Aufbau. Eine verlässliche Berichterstattung und wiederkehrende Nutzung haben Vorrang vor einer großen Funktionsliste. Wirtschaftliche Tragfähigkeit ist eine zu prüfende Hypothese, kein bereits erreichtes Ergebnis.')
note('Version 1.0 · 8. Oktober 2026 · Für Gründer und mögliche Mitstreiter. Produktname, Budget und Tarife sind noch nicht beschlossen. Zahlenmodelle sind Planungsszenarien und keine Umsatzprognosen aus Bestandskunden.')

page(1,'Entscheidung und Zusammenfassung')
p('Das Vorhaben ist als begrenztes Nebenprojekt plausibel. Ein breiter öffentlicher Start mit allen gewünschten Funktionen wäre mit dem vorgesehenen Zeitbudget dagegen zu riskant. Empfohlen wird ein Pilot mit drei bis fünf Mannschaften und einer klaren Entscheidung über Fortführung nach acht bis zwölf Wochen.')
h2('Problem und Lösung')
p('Ein Teil der Jugendmannschaften nutzt für den Spielverlauf verstreute Chatnachrichten oder Angebote, die das Team beziehungsweise den Wettbewerb nicht abbilden. Der geplante Dienst bietet einen eigenen Spieltagskanal: URL öffnen, anmelden, Spiel übernehmen und tickern. Zuschauer benötigen weder Registrierung noch Installation. Das konkrete Ausmaß dieses Problems wird im Pilot erhoben.')
h2('Geschäft und Wirtschaftlichkeit')
p(f'Kostenlose Ticker etablierter Anbieter begrenzen die Zahlungsbereitschaft für das Grundprodukt. Erlöse sollen deshalb aus Komfort, Vereinsorganisation und Gestaltung entstehen. Das Basisszenario erreicht 2027 {whole(rev)} EUR Nettoumsatz bei {whole(costs)} EUR zahlungswirksamen Ausgaben. Der operative Saldo beträgt {fmt(cf)} EUR vor Steuern und ohne Gründervergütung. Das ist ein Lernjahr, kein profitables Geschäftsjahr.')
table(['Entscheidungsgröße','Planwert oder Bedingung'],[['Pilotstart','Q1 2027, abhängig von Sicherheits- und Funktionsabnahme'],['Startfinanzierung','4.000 EUR als Vorschlag, nicht als zugesagtes Budget'],['Bezahlte Teamäquivalente Ende 2027','50 im Basisszenario, noch nicht validiert'],['Operative Kostendeckung','Bei 300 EUR Fixkosten und 300 aktiven Teams rund 67 bezahlte Teamäquivalente'],['Wirtschaftlicher Engpass','Regelmäßige Reporter und begrenzbarer Supportaufwand']],[2.65,4.25])
h2('Bedingungen für eine Fortführung')
p('Mindestens 60 Prozent der aktivierten Pilotteams tickern innerhalb von vier Spielgelegenheiten erneut. Drei voneinander unabhängige externe Teams sollen später eine konkrete Preiszusage oder Zahlung leisten. Mandantentrennung, Wiederherstellung und Reporterübergabe müssen nachweislich funktionieren. Ohne diese Signale wird der Umfang reduziert oder der Dienst als vereinsinternes Werkzeug weitergeführt.')
note('Kennzeichnung im gesamten Plan: Festlegung = vom Gründer genannt; Beleg = Quelle im Anhang; Annahme = Rechenwert; Vorschlag = noch zu entscheiden. Quellenabruf am 08.10.2026.')

page(2,'Leseführung und Entscheidungsstand')
table(['Teil','Kapitel'],[['Geschäft','3 Problem und Kunden · 4 Markt · 5 Wettbewerb · 6 Erlösmodell'],['Produkt','7 Pilotumfang · 8 Ausbau · 9 Nutzer und Rechte · 10 Datenmodell'],['Technik','11 Architektur · 12 Reporter Sperre · 13 API und Integrationen · 14 Skalierung'],['Betrieb','15 Betreiberkonsole · 16 Datenschutz · 17 Umsetzung · 18 Markteintritt'],['Finanzen','19 Annahmen · 20 Liquidität · 21 Szenarien · 22 Wirtschaftlichkeit'],['Entscheidung','23 Risiken · 24 Validierung und Beschlüsse · 25 Quellen']],[1.25,5.65])
h2('Was bereits feststeht')
p('Der Dienst soll eigenständig von der bestehenden Vereinswebsite funktionieren. Die eigene Mannschaft ist der Ausgangspunkt, auch wenn sie auswärts spielt. Pflege und Zuschaueransicht laufen im Browser. Spiele behalten ihre Adresse bis zur Löschung. Pro Spiel darf nur eine Sitzung Ereignisse schreiben. Ein kostenloser Einstieg, spätere Abos, eigenes Theming, eine REST-API und eine Betreiberkonsole gehören zum Zielbild.')
h2('Was noch nicht beschlossen ist')
p('Ein zweiter Mitstreiter ist noch nicht verbindlich zugesagt. Name, Rechtsform, Verantwortlichkeiten, Geldbudget, konkrete Tarife und Vertragsbedingungen bleiben offen. Insbesondere ist die Begrenzung mehrerer berechtigter Reporter auf ein Abo bislang nur eine Option. Der Plan stellt diese Entscheidungen nicht als bereits getroffen dar.')
h2('Wie der Plan verwendet wird')
p('Monatlich werden Nutzung, Betriebskosten, Supportstunden und Lernfortschritte aktualisiert. Entscheidungen erhalten Datum, Verantwortlichen und eine kurze Begründung. Produktwünsche werden dem Pilot, der nächsten Ausbaustufe oder einer späteren Option zugeordnet. Neue Wünsche verschieben nicht stillschweigend den Startumfang.')
p('Die Finanzdatei enthält alle Monatswerte und Rechenannahmen in maschinenlesbarer Form. Die Zahlen sind auf Monatsbasis modelliert; Jahresabos würden Liquidität und Erlösabgrenzung verändern. Ein vollständiger steuerlicher Jahresabschluss ist nicht Gegenstand dieses Entscheidungsplans.')

page(3,'Kundenproblem und Nutzen')
p('Der erste adressierte Bedarf ist die einfache Begleitung eines konkreten Jugendspiels durch Erwachsene. Der Dienst soll besonders dann helfen, wenn vorhandene Vereinsportale nicht passen oder ein klar gestalteter eigener Kanal gewünscht wird. Ein fehlender Eintrag bei FuPa ist ein möglicher Anlass, aber keine deutschlandweit belegte Versorgungslücke.')
table(['Nutzer','Aufgabe','Entscheidungskriterium'],[['Trainer oder Betreuer','Mannschaft vorbereiten und Reporter bestimmen','Wenig doppelte Datenpflege'],['Berichtender Elternteil','Spiel am Rand mit wenigen Eingaben erfassen','Bedienbarkeit, Empfang, korrigierbare Fehler'],['Eltern und Angehörige','Spiel verfolgen, auch wenn sie nicht vor Ort sind','Link öffnen, klare Infos, keine Kontopflicht'],['Jugendleitung oder Vorstand','Mehrere Teams organisieren und Daten kontrollieren','Rechte, Kosten, Datenschutz und Übergabe']],[1.5,2.7,2.7])
h2('Käufer und Nutzer sind nicht identisch')
p('Der Zuschauer erzeugt Reichweite, bezahlt aber voraussichtlich nicht. Der Reporter entscheidet über die tatsächliche Nutzung. Ein Trainer kann privat ein Teamabo zahlen; für einen Verein entscheidet meist eine andere Person. Marketing und Tarifgestaltung müssen beide Wege unterstützen, ohne Kinder zu zahlenden Nutzern zu machen.')
h2('Wertversprechen und Grenzen')
p('Der Nutzen entsteht aus wenig Aufwand pro Spiel, dauerhaft erreichbaren Spielseiten und einer wiedererkennbaren Mannschaftsansicht. Freie Spielanlage, ein stabiler Teamlink und ein sichtbarer Übergabestatus bilden den Kern. Der Dienst ersetzt weder den amtlichen Spielbericht noch die allgemeine Vereinsverwaltung.')
p('Für jüngere Altersgruppen ist eine reduzierte Veröffentlichung sinnvoll: Ergebnis und Mannschaftsinformationen können genügen. Spielerbilder, volle Namen und individuelle Leistungsstatistiken werden nicht automatisch vorausgesetzt. Trainings und private Testspiele können als nicht gelistete oder zugangsgeschützte Begegnungen geführt werden.')
h2('Zu prüfende Verhaltensannahme')
p('Die zentrale Hypothese lautet: Pro Mannschaft findet sich regelmäßig eine erwachsene Person, die ein Spiel tickert, ohne das Spiel selbst zu verpassen. Falls dies nicht zutrifft, helfen zusätzliche Cards oder Formationen wenig. Im Pilot messen wir Eingabezeit, Abbruchgründe und die Zahl tatsächlich abgedeckter Spieltage.')

page(4,'Markt und erreichbare Nachfrage')
p('Der DFB meldet für 2025/2026 insgesamt 23.713 Vereine und rund 8,2 Millionen Mitgliedschaften. Mitgliedschaften sind weder eindeutige Personen noch potenzielle Softwarekunden. Als differenzierte Mannschaftsbasis dient hier bewusst die ältere Statistik 2025: 92.848 Juniorenteams und 6.032 Mädchenteams, zusammen 98.880 Jugendteams. [Q1, Q2]')
table(['Marktebene','Herleitung','Bedeutung'],[['Breiter Bezugsmarkt','98.880 Jugendteams × 72 EUR/Jahr = 7,12 Mio. EUR','Theoretischer Umsatz bei 100 Prozent Kaufquote; keine realistische Prognose'],['Arbeitsannahme Zielsegment','10 bis 20 Prozent = 9.888 bis 19.776 Teams','Annahme zu organisatorischer Eignung und Interesse; durch Forschung zu prüfen'],['Zahlendes Segment als Sensitivität','Davon 10 bis 20 Prozent × 72 EUR = 71.194 bis 284.774 EUR/Jahr','Kein belegtes Marktvolumen; zeigt Wirkung niedriger Zahlungsquoten'],['Erreichbares Ziel 2027','200 aktive Teams, davon 50 bezahlt zum Jahresende','Bottom-up Vertriebsannahme; nicht aus Marktanteilen abgeleitet']],[1.4,2.65,2.85])
h2('Sinnvolle Eingrenzung')
p('Der Start konzentriert sich auf E bis C Jugend und erwachsene Teamverantwortliche. Dies ist ein Vorschlag zur Fokussierung, keine Ausschlussregel für andere Altersklassen. Zunächst werden der eigene Verein und benachbarte Vereine angesprochen. Mädchenmannschaften werden ausdrücklich eingeschlossen. Größere Turnierorganisation und weitere Sportarten folgen erst nach einem stabilen Kernprodukt.')
h2('Warum die Nachfrage noch unsicher ist')
p('Nicht jede Mannschaft benötigt einen öffentlichen Ticker. Viele Angehörige sind vor Ort; andere bevorzugen bestehende Messenger. Kostenlose Plattformen reduzieren die Zahlungsbereitschaft. Junge Mannschaften wechseln zudem pro Saison Kader und Verantwortliche. Bindung entsteht daher durch einfache Saisonübergaben und tatsächliche Nutzung, nicht allein durch gespeicherte Daten.')
p('Marktgröße und Finanzplanung bleiben getrennt: Die Umsätze werden aus gewonnenen, aktivierten und zahlenden Teams berechnet. Ein kleines Team kann wirtschaftlich erfolgreich sein, ohne einen nennenswerten Anteil aller deutschen Mannschaften zu erreichen.')

page(5,'Wettbewerb und Positionierung')
table(['Anbieter','Preisanker','Stärke und Relevanz'],[['FuPa','Ticker und Widgets kostenlos','Reichweite, Kader und Statistiken; Jugendabdeckung regional unterschiedlich [Q3]'],['FUSSBALL.DE und BFV','Kostenlose Tickerangebote','Offizielle Spieldaten, Apps, Push und Vereinswidgets [Q4, Q5]'],['Tickaroo Live Blog','79 EUR pro Blog für 30 Tage; weitere Tarife','Professionelle Redaktion, Embed, mehrere Reporter; anderes Budgetsegment [Q6]'],['GameChanger','Trainer kostenlos; Fanangebote sportabhängig','Teamorganisation, Scorekeeping und Video; Fußballfunktionen separat prüfen [Q7]'],['GAA Match Tracker','Einrichtung kostenlos; Gesamttarif offen','Vereinsorientiert, Zuschauer ohne Login; andere Sportarten [Q8]'],['Tournify','0 EUR bis 8 Teams; 40/120 EUR pro Event','Turnierplanung und Live Ergebnisse, weniger Ereignisfeed [Q9]'],['SpielerPlus und SportMember','Free plus Team- beziehungsweise Vereinsabos','Starke interne Organisation; mögliche Integrationspartner [Q10, Q11]']],[1.35,2.0,3.55])
h2('Worin wir uns unterscheiden wollen')
p('Der geplante Dienst kombiniert browserbasierte Berichterstattung, frei anlegbare Spiele, einen visuellen Mannschaftsfeed und klare Kontrolle über Veröffentlichung und Daten. Diese Kombination ist eine Positionierungshypothese. Einzelne Bestandteile wie Embed, Push, Farben oder Statistiken sind am Markt bereits vorhanden und werden nicht als exklusiv beworben.')
h2('Verteidigungsfähiger Vorteil')
p('Ein dauerhafter Vorteil kann aus besonders einfacher Bedienung, verlässlichen Spieltagsabläufen und Empfehlungen unter Trainern entstehen. Technische Features allein sind leicht nachbaubar. Datenexport und faire Kündigung gehören zum Vertrauensangebot; künstliche Wechselhürden sollen kein Geschäftsmodell sein.')
p('FuPa ist nicht pauschal erst ab C Jugend verfügbar. Seine eigene Widget Dokumentation beschreibt regionale Einschränkungen. Für den Pilot wird deshalb pro Zielteam geprüft, welche Alternative tatsächlich vorhanden ist. Der bestehende Name MatchTracker wird ebenfalls im Sport verwendet; vor Veröffentlichung braucht es einen unterscheidbaren Namen und eine gesonderte Namensprüfung.')
note('Preisanker beziehen sich auf öffentliche Angaben vom Recherchezeitpunkt. Keine Vollständigkeits oder Verfügbarkeitsgarantie für einzelne Ligen und Altersklassen.')

page(6,'Geschäftsmodell und Tarifhypothesen')
p('Der Service soll ohne Zahlung einen vollständigen einfachen Spieltag ermöglichen. Das Abo finanziert den organisatorischen Mehrwert. Die folgende Staffelung ist ein Testangebot und keine bereits beschlossene Preisgestaltung. Zunächst wird monatliche Zahlungsbereitschaft geprüft, erst danach ein Jahresrabatt festgelegt.')
table(['Funktion','Free','Team','Verein'],[['Preisvorschlag netto','0 EUR','6 EUR pro Monat','24 EUR pro Monat bis 5 Teams'],['Beispiel brutto bei 19 Prozent USt','0 EUR','7,14 EUR','28,56 EUR'],['Ticker und Zuschauerlink','Ja','Ja','Ja'],['Archiv ohne regulären Ablauf','Ja','Ja','Ja'],['Berechtigte Reporter','1 als Testvariante','Mehrere','Mehrere pro Team'],['Gleichzeitige Schreiber pro Spiel','1','1','1'],['Design','Logo und Basisfarben','Erweitertes Theming','Vorlagen für mehrere Teams'],['Komfort','Manuelle Pflege','Import und vertiefte Auswertung','Zentrale Rechte und Verwaltung'],['REST-API','Eigenes Frontend nutzt API','Externer Zugriff später','Kontingente und zentrale Schlüssel']],[2.25,1.45,1.6,1.6])
h2('Die Reportergrenze bewusst testen')
p('Nur ein berechtigter Reporter im kostenlosen Tarif könnte gerade den gewünschten Wechsel am Spieltag verhindern. Im Pilot werden beide Varianten verglichen: ein Konto oder zwei bis drei persönlich berechtigte Reporter. Gemeinsame Passwörter sind keine akzeptable Umgehung. Erst Nutzung und Zahlungsbereitschaft entscheiden über diese Grenze.')
h2('Faire Grenzen')
p('Medienkontingente, API-Raten und Missbrauchsschutz gelten auch bei kostenlosen Konten. Das Spielarchiv läuft nicht nach einem willkürlichen Zeitraum ab. Löschrechte, Datenschutz, Dienstbeendigung und Vertragskündigung werden dennoch transparent geregelt. Ein Archivversprechen ist keine Zusicherung ewigen Geschäftsbetriebs.')
p('Die Rechnung verwendet 6 EUR Nettoerlös pro bezahltem Teamäquivalent. Ein Vereinsabo zu 24 EUR entspricht vier Erlösäquivalenten, obwohl es fünf Teams betreuen kann. Rabatte und Vereinsmix können den Erlös je physischem Team senken; sie werden später im Modell getrennt ergänzt. Steuerstatus und Endkundenpreisauszeichnung sind vor Verkaufsstart zu klären.')

page(7,'Die erste veröffentlichbare Version')
p('Die erste Version muss eine Begegnung vom Anlegen bis zum Archiv zuverlässig abbilden. Alle folgenden Punkte sind Pilotumfang. Fortgeschrittene Cards sind nachgeordnet, wenn Sicherheit oder Datenkonsistenz sonst nicht rechtzeitig fertig werden.')
table(['Bereich','Abnahmekriterium'],[['Zugang und Mannschaft','Persönliche Anmeldung, Einladungen, Team und Saison; klare effektive Rechte'],['Spiele','Freie Gegneranlage, Ort und Startzeit, Status und stabile Spiel-ID'],['Berichten','Serverseitige Sitzungssperre, Tore, Kommentare, Uhr, Korrektur und Übergabe'],['Kader','Spieler und Trainer getrennt von Startaufstellung; Portrait optional'],['Zuschauer','Ohne Login lesbar; Teamlink, Einzelspiellink, responsive Light- und Dark-Ansichten'],['Veröffentlichung','Vorschau, Freigaben, öffentliche Datenprojektion, Löschung und Export'],['Betrieb','Betreiberkonsole mit aktiven Spielen, Reportern, Zuschauersitzungen und Fehlern'],['Qualität','Mandantentrennung, Wiederherstellungstest, Lasttest und mobiler Spieltagstest']],[1.6,5.3])
h2('Eine klare Nutzerreise')
p('Der Teamadmin legt Mannschaft und Spiel an und lädt einen Reporter ein. Dieser meldet sich im Browser an, übernimmt das Spiel und sieht die bestätigte Schreibberechtigung. Zuschauer öffnen den dauerhaften Mannschaftslink oder den direkten Spiellink. Nach Abpfiff bleibt derselbe Link bestehen. Ein verantwortlicher Nutzer kann Korrekturen mit Protokoll vornehmen.')
h2('Was im Pilot bewusst klein bleibt')
p('Eine minimale Aufstellung mit Startspielern und Ersatzbank ist möglich; der frei bedienbare Formationseditor folgt danach. Eine einfache Toreliste reicht zum Start. Das öffentliche Ticker Embed wird als schmaler Lesemodus vorbereitet. Externe API-Schlüssel und automatische Anbieteranbindungen kommen erst nach abgesicherter interner API.')
p('Echte Zahlungen werden nicht vorausgesetzt, um den geschlossenen Pilot zu starten. Tarifberechtigungen werden jedoch bereits als technische Fähigkeiten modelliert. So lässt sich später ein Abo ergänzen, ohne die Datenstruktur nachträglich an Produktpakete zu binden.')

page(8,'Funktionsplan und spätere Ausbaustufen')
table(['Wunsch','Ausbaustufe','Fachliche Regel'],[['Emoji-Reaktionen','Nach Pilot','Pro Sitzung begrenzen, moderierbar, aggregiert übertragen'],['Voting-Card','Nach Pilot','Eine Stimme pro Zuschauerkennung; ohne Login keine sichere Einmaligkeit pro Mensch'],['Aufklappbare Spielerinfos','Nach Pilot','Nur freigegebene Position, Saisontore und Zusatzdaten'],['Formation und echte Aufstellung','Nach Pilot','Flexible Teamgrößen, Startspieler, Positionen, Bank und Trainer'],['Statistikreiter','Nach Pilot','Nur aktivierte und hinreichend erfasste Daten anzeigen'],['Form der letzten 5 Spiele','Nach Pilot','Eigene Saison und Teamidentität; Abbrüche nicht als reguläre Ergebnisse werten'],['Historische direkte Duelle','Später','Eindeutige Mannschaften statt nur Vereinsnamen; Quellen kennzeichnen'],['Eigenes Theming','Basis im Pilot','Logo/Farben zuerst; Schriften und Vorlagen später'],['REST-API und Webhooks','Intern im Pilot','Versioniert; externe Freigabe erst nach Rechte und Quotenprüfung'],['Browser-Push und PWA','Nach Pilot','Freiwillig; iPhone benötigt Home-Screen Web-App [Q12]'],['Datenanbieter Import','Später','Nur erlaubte Schnittstellen und bestätigte Nutzungsrechte'],['Medien und Bild teilen','Nach Pilot','Portraitoptimierung und Spielgrafik vor umfangreichen Videofunktionen']],[1.85,1.2,3.85])
h2('Statistiken sind von der Erfassung abhängig')
p('Spielminuten setzen bekannte Startaufstellung, Spielabschnitte und vollständige Wechsel voraus. Erneute Einwechslungen im Jugendfußball müssen unterstützt werden. Ohne diese Grundlage bleibt die Minutenansicht aus. Vorlagenlisten entstehen nur bei aktivierter Vorlagenerfassung; unbekannt ist nicht null. Jede Statistik trägt einen Vollständigkeitsstatus.')
p('Konfiguration erfolgt als Mannschaftsvorlage und wird pro Spiel als Version gespeichert. Ein späterer Einstellungswechsel darf vergangene Begegnungen nicht stillschweigend neu interpretieren. Saisonstatistiken aggregieren nur passende, freigegebene Spiele und zeigen ihren Bezugszeitraum.')

page(9,'Nutzer und Berechtigungen')
p('Rechte werden nach Organisation, Mannschaft und gegebenenfalls Spiel vergeben. Ein Nutzer kann in einem Verein Admin und in einem anderen nur Reporter sein. Die Datenbank erzwingt diese Trennung zusätzlich zur API. Tarifrechte schalten Funktionen frei, ersetzen aber niemals Zugriffskontrollen.')
table(['Aktion','Vereinsadmin','Teamadmin','Reporter','Zuschauer'],[['Teams und Nutzer verwalten','Verein','Eigenes Team¹','Nein','Nein'],['Spieler und Freigaben pflegen','Verein','Eigenes Team','Nein','Nein'],['Spiele anlegen und konfigurieren','Ja','Eigenes Team','Zugewiesen²','Nein'],['Ereignisse schreiben','Mit Sperre','Mit Sperre','Mit Sperre','Nein'],['Reporter ablösen','Ja','Eigenes Team','Freigeben','Nein'],['Spiel löschen','Ja','Optional','Nein','Nein'],['Statistik und Ticker lesen','Ja','Ja','Ja','Nur freigegeben'],['Abo und API-Schlüssel verwalten','Ja','Optional','Nein','Nein']],[2.4,1.1,1.15,1.1,1.15])
note('¹ Nur delegierte Einladungsrechte, keine eigenmächtige Rechteerhöhung. ² Optionales Recht; Reporter können auf einzelne Spiele begrenzt werden.')
h2('Betreiberzugriff')
p('Der Betreiber sieht zunächst technische Zustände und Kontoverwaltung, nicht automatisch sämtliche privaten Spielerdaten. Ein begründeter Supportzugriff ist zeitlich begrenzt und protokolliert. Administratoren verwenden Mehrfaktoranmeldung. Der dauerhafte Betreiberzugang darf nicht als gemeinsam genutztes Teamkonto dienen.')
h2('Nachvollziehbare Rechte')
p('Die Konsole zeigt pro Nutzer die effektiven Rechte und ihre Herkunft: Rolle, Geltungsbereich, vergebende Person, Vergabezeit und Ablauf. Ein Auditprotokoll erfasst Rechteänderungen, Exporte, Übernahmen und Löschungen. Einladungen laufen ab; Austritte und Saisonwechsel können Rechte entziehen, ohne Spielhistorien zu verfälschen.')
p('Spieler und Trainer im Kader sind Datensätze, nicht automatisch Benutzerkonten. Für den Pilot werden nur erwachsene Verantwortliche als angemeldete Nutzer benötigt. Zuschauer bleiben anonym oder pseudonym; ihre Teilnahme an Abstimmungen verleiht keine Schreibrechte für den Ticker.')

page(10,'Datenmodell und Veröffentlichung')
table(['Objekt','Wichtige Informationen','Abgrenzung'],[['Organisation und Team','Verein, Teamname, Team-ID, Einstellungen','Team ist nicht gleich Heimseite im Spiel'],['Saisonzugehörigkeit','Spieler-ID, Team-ID, Saison, Nummer','Keine globale Rückennummer'],['Spieler und Trainer','Anzeigename, bevorzugte Position, Medien','Trainer als eigener Typ; kein Benutzerzwang'],['Spiel und Teilnahme','Gegner, Abschnitte, Kader, Startelf, Formation','Position im Spiel unabhängig vom Stammprofil'],['Ereignis','ID, Typ, Team, Spielzeit, Spieler, Autor, Revision','Korrekturen versioniert statt blind überschrieben'],['Freigabe und Medien','Zweck, Sichtbarkeit, Nachweis, Widerruf','Öffentliche Felder explizit auswählen'],['Abgeleitete Werte','Spielstand, Minuten, Saisonstatistik','Aus Ereignissen reproduzierbar'],['Reporter Lease','Sitzung, Ablauf, Generation','Technisches exklusives Schreibrecht']],[1.6,2.65,2.65])
h2('Ein öffentliches Lesemodell')
p('Interne Spielerdaten werden nicht direkt an Zuschauer übertragen. Eine Veröffentlichung erzeugt eine reduzierte Ansicht mit freigegebenen Feldern. Datenschutz betrifft damit nicht nur sichtbare HTML Elemente, sondern auch API-Antworten, Websocket-Nachrichten, Bilder, Exporte und Caches. Geburtsdatum, Kontaktinformationen und Einwilligungsnachweise gehören nicht in den öffentlichen Feed.')
h2('Historie und Identität')
p('Spiele speichern die damaligen Anzeigenamen und Kaderbezüge für nachvollziehbare Saisonhistorien. Dies darf einen späteren Widerruf oder eine Löschung personenbezogener Daten nicht blockieren: öffentliche Projektionen müssen aktualisiert oder anonymisiert werden. Gegenmannschaften erhalten stabile IDs; ähnliche Namen werden nicht automatisch zusammengeführt.')
p('Beim Saisonwechsel wird eine neue Zuordnung angelegt. Formkurve und Direktvergleich nennen Saison und Wettbewerb. Tests sind explizit markiert und aus Produktivstatistiken ausgeschlossen. Das Löschen eines Testspiels löst die Neuberechnung betroffener Aggregate aus, statt nur die sichtbare Card zu entfernen.')

page(11,'Architektur für einen kleinen Betreiber')
p('Empfohlen wird ein modular aufgebauter Dienst mit verwalteter Datenbank und Authentifizierung. Ein neues Repository trennt den Service von der bestehenden Vereinswebsite. Der vorhandene HTML/Firebase-Prototyp liefert Fachlogik und Gestaltung, aber noch keinen Nachweis einer mandantenfähigen SaaS-Architektur. Quellcode-Sichtprüfung: match-tracker.html und package.json am 08.10.2026.')
table(['Schicht','Vorschlag','Verantwortung'],[['Browser','TypeScript und React, responsiv','Admin, Reporter, Zuschauer, Embed; PWA optional'],['API','Schlanke serverseitige REST Schicht','Identität, Rechte, Sperre, Validierung, Quoten'],['Datenbank','Verwaltetes PostgreSQL, etwa Supabase EU-Region','Transaktionen, Row Level Security, Ereignisse, Audit'],['Live Verteilung','Verwaltetes Broadcast System','Nur serverbestätigte öffentliche Ereignisse verteilen'],['Medien','Objektspeicher und CDN','Freigegebene optimierte Bilder; private Originale getrennt'],['Hintergrundjobs','Outbox und Job-Worker','Push, Exporte, Statistik, Cache-Invalidierung'],['Betrieb','Monitoring, Backup und Kostenmessung','Fehler, Wiederherstellung, Budgetkontrolle']],[1.2,2.65,3.05])
h2('Datenfluss eines Tores')
p('Browser sendet Ereignis → API prüft Sitzung und Rechte → Datenbank schreibt Ereignis, Revision und Outbox atomar → Verteiler publiziert freigegebene Daten → Zuschauer aktualisieren den Feed. Bei verlorener Verbindung laden sie den bestätigten Stand ab ihrer letzten Revision nach. Die Datenbank bleibt die verbindliche Quelle. Broadcast-Kanäle erlauben Zuschauern ausschließlich Empfang; Senden bleibt serverseitig autorisiert. Private Kanäle und getrennte RLS-Regeln sichern dies ab. [Q23]')
h2('Hostingentscheidung')
p('Cloudflare für Frontend und gegebenenfalls API sowie Supabase für Datenbank/Auth/Realtime sind eine prüfbare Startoption. Ein verwalteter EU-Backend-Anbieter mit separatem Realtime-Dienst ist eine Alternative. ALL-INKL kann für Domain, Mail oder statische Seiten weiter genutzt werden; der konkrete Tarif ist nicht bekannt. Eine Aussage, dass 100 Spiele dort grundsätzlich unmöglich wären, ist nicht belegt.')
p('Kein Kubernetes und keine selbst betriebene Datenbank im Pilot. Die eingesparte Betriebszeit ist für zwei nebenberufliche Personen wertvoller als eine geringe Ersparnis bei Servermiete. Globale CDN-Verarbeitung ist nicht mit ausschließlich europäischer Verarbeitung gleichzusetzen; Vertrags- und Regionsprüfung bleibt erforderlich.')

page(12,'Exklusives Berichten und Ausfallsicherheit')
p('Die Ein-Reporter-Regel gilt pro Spiel und pro Sitzung. Weder ein zweites Browserfenster desselben Nutzers noch ein API-Schlüssel darf parallel Ereignisse schreiben. Das ist eine Datenkonsistenzregel und bleibt auch im Abo bestehen.')
h2('Sperre als zeitlich begrenzte Reservierung')
p('Die API vergibt in einer atomaren Datenbankoperation eine Lease mit Spiel-ID, Sitzungs-ID, Ablaufzeit und monoton steigender Generation. Als Startwerte gelten 15 Sekunden Erneuerungsintervall und 90 Sekunden Gültigkeit. Diese Werte sind Testparameter. Nur der Server bestimmt die Zeit und prüft bei jedem Schreibvorgang Gültigkeit und Generation.')
p('Bei einer Admin-Übernahme steigt die Generation. Alte Anfragen verlieren damit auch dann ihr Schreibrecht, wenn sie verspätet eintreffen. Ein bloßer Eintrag „Reporter online“ oder eine Sperre nur im Frontend genügt nicht. Eine konkurrierende Übernahme wird transaktional entschieden.')
table(['Situation','Vorgesehenes Verhalten'],[['Zwei Reporter starten gleichzeitig','Eine Lease wird vergeben; die andere Sitzung erhält Konfliktstatus'],['Kurzzeitiger Funkverlust','Entwürfe lokal halten, Status klar anzeigen; nur Serverbestätigung zählt als veröffentlicht'],['Lease läuft ab','Übernahme anbieten; alte Sitzung darf nicht automatisch weiterschreiben'],['Alte Offline-Ereignisse treffen ein','Generation prüfen, zurückweisen und manuelle Zuordnung anbieten'],['Doppelter Request','Idempotenzschlüssel liefert dasselbe Ergebnis statt eines zweiten Tores'],['Admin korrigiert laufendes Spiel','Ebenfalls Lease übernehmen; keine parallele Ausnahme']],[2.2,4.7])
h2('Korrekturen und Wiederanlauf')
p('Ereignisse tragen eine eindeutige ID, Spielrevision, Erfassungszeit und Spielzeit. Optimistische Versionsprüfung verhindert das Überschreiben neuerer Änderungen. Ein korrigiertes Tor aktualisiert Spielstand und Statistik über denselben Pfad. Hintergrundjobs sind wiederholbar; eine doppelte Ausführung darf keine doppelten Push-Nachrichten erzeugen.')
p('Schreibgeschützt weiterzulesen ist ein möglicher Notbetrieb. Bei nicht erreichbarem Server darf das Interface keine erfolgreiche Veröffentlichung suggerieren. Der Nutzer sieht „lokal gespeichert“ und „veröffentlicht“ als unterschiedliche Zustände.')

page(13,'REST-API und Datenanbieter')
table(['Endpunktgruppe','Beispiel','Schutz'],[['Öffentlich lesen','GET /v1/public/matches/{id}','Freigabe, Rate Limit, reduzierte Felder'],['Mannschaft verwalten','GET /v1/teams/{id}/players','Teamrecht, keine fremden Mandanten'],['Spiel übernehmen','POST /v1/matches/{id}/lease','Reporterrecht, atomare Vergabe'],['Ereignis erfassen','POST /v1/matches/{id}/events','Lease-Generation, Idempotenz, Revision'],['Export','POST /v1/teams/{id}/exports','Adminrecht, Audit, ablaufender Download'],['Webhook','match.updated oder match.finished','Signatur, Event-ID, Wiederholung mit Backoff']],[1.4,3.0,2.5])
p('OpenAPI beschreibt Datenfelder, Fehler und Beispiele. API-Schlüssel sind gehasht, begrenzt, widerrufbar und mit Rechten versehen. Drittanbieter dürfen die Reporter Sperre nicht umgehen; schreibende Integrationen werden einem berechtigten Akteur zugeordnet. Externe Schlüssel und Webhooks sind Ausbaustufe, nicht Voraussetzung des geschlossenen Pilots.')
h2('Integrationen mit Priorität')
p('Priorität 1 sind manuelle Pflege sowie validierter CSV und ICS Import. Ein Import zeigt vor dem Speichern Änderungen und Dubletten. Externe IDs, Herkunft und Aktualisierungszeit werden gespeichert. Lokale Änderungen dürfen nicht durch einen späteren Import unbemerkt überschrieben werden.')
p('Sportmedia liefert offiziell Saisonspielpläne, Ergebnisse und Tabellen als XML über FTP/SFTP. Der gesonderte Spielberichtservice enthält unter anderem Aufstellungen und Ereignisse nach Freigabe, ist bei Junioren laut Anbieter auf B/U17 und älter begrenzt. Er löst damit gerade die jüngere Zielgruppe nicht vollständig. Lizenz, Kosten, Archiv und SaaS Weitergabe müssen vertraglich bestätigt werden. [Q13, Q14]')
p('Für SpielerPlus ist bislang keine öffentlich dokumentierte allgemeine Schreib API verifiziert. Ebenso ist keine allgemeine Berechtigung zum Zurückschreiben amtlicher DFBnet Ergebnisse bestätigt. Solche Verbindungen werden nicht versprochen. Spond, SportMember und easy2coach sind spätere Prüfkandidaten, sobald Pilotkunden sie tatsächlich benötigen.')

page(14,'Skalierung und technische Kosten')
p('Entscheidend sind gleichzeitig verbundene Zuschauer, ausgelieferte Ereignisse und Medienvolumen. Hundert eingeloggte Reporter sind eine andere Last als hundert Spiele mit jeweils hundert Zuschauern. Die folgenden Werte sind Rechenannahmen für einen 90 Minuten langen Lasttest, keine gemessene Kapazität.')
table(['Lastprofil','Reporter','Zuschauer','Feed-Zustellungen je Spielblock'],[['Pilot: 5 Spiele × 30 Viewer','5','150','18.000'],['Wachstum: 100 Spiele × 100 Viewer','100','10.000','1.200.000'],['Spitze: 100 Spiele × 500 Viewer','100','50.000','6.000.000']],[2.75,.7,.9,2.55])
note('Annahme: 120 publizierte Ereignisse pro Spiel. Zustellungen = Spiele × Viewer × Ereignisse. Reconnects, Präsenz und Reaktionen kommen hinzu.')
p('Im Wachstumsprofil entstehen im Mittel rund 2,2 Schreibereignisse und 222 Zuschauerzustellungen pro Sekunde. Gleichzeitige Tore und Wiederverbindungen erzeugen deutlich höhere Spitzen. Eine sekündlich versandte Uhr würde zusätzlich 54 Millionen Zustellungen in 90 Minuten erzeugen. Deshalb berechnet der Browser die Uhr aus Serverzeit, Abschnitt und Startzeit.')
h2('Preisanker und Grenzen')
p('Supabase Pro beginnt bei 25 US Dollar monatlich. Realtime enthält 500 Spitzenverbindungen; darüber werden Pakete zu 10 US Dollar pro 1.000 berechnet. Bei 10.100 Verbindungen ergibt das rechnerisch 100 US Dollar Verbindungsaufschlag. Tarifkontingent und technische Verbindungsgrenze sind verschieden: Das dokumentierte Standardlimit muss für diese Last vorab geprüft und angehoben werden. [Q15, Q16, Q17]')
p('Fünf Millionen Realtime-Nachrichten sind im Pro-Tarif enthalten; Mehrverbrauch kostet 2,50 US Dollar pro Million. Vier vollständig besuchte Wachstumsblöcke ergeben bereits 4,8 Millionen Feedzustellungen, ohne zusätzliche Nachrichten. Cloudflare Workers Paid beginnt bei 5 US Dollar; R2 Standard Storage kostet 0,015 US Dollar je GB Monat zuzüglich Operationen, ohne direkte Egress-Gebühr. [Q18, Q19, Q20]')
p('Für den Pilot werden 40 bis 100 EUR technische Monatskosten als Reserve angesetzt, für etwa 10.000 gleichzeitige Viewer zunächst 150 bis 400 EUR. Das sind Budgetkorridore, keine Anbieterangebote oder Kapazitätszusagen. 50.000 Viewer erfordern einen separaten Lasttest und gegebenenfalls einen spezialisierten Verteiler. Kostenbegrenzungen dürfen nicht ungeprüft laufende Spiele abschalten.')

page(15,'Betreiberkonsole und Betriebsmodell')
p('Die Betreiberkonsole ist ein Kernprodukt für den Gründer. Sie verbindet Nutzer und Rechte, Datenherkunft, Veröffentlichungszustand und Systemgesundheit. Ein Dashboard mit Besucherzahlen allein genügt nicht.')
table(['Anzeige','Definition','Handlung'],[['Aktive Nutzer','Angemeldete Nutzer mit Aktivität in den letzten 5 Minuten','Nicht mit allen gültigen Logins verwechseln'],['Live Spiele','Status live, Pause separat; letzter erfolgreicher Schreibvorgang','Verwaiste Spiele markieren'],['Viewer jetzt','Aktive Zuschauersitzungen mit kurzem Ablauf','Näherung; mehrere Geräte sind mehrere Sitzungen'],['Reporter','Lease Inhaber, Generation, Ablauf, letzte Verbindung','Übernahme, Sperrgrund und Kontakt'],['Datenqualität','Fehlende Vorlagen, unvollständige Wechsel, Importkonflikte','Statistiken ausblenden oder prüfen'],['Technik','Fehlerquote, p95 Latenz, Outbox Rückstand, Reconnects','Alarm mit nachvollziehbarem Runbook'],['Kosten','Verbindungen, Nachrichten, Medien, Budgetverbrauch','Warnschwellen 50/80/100 Prozent']],[1.4,2.85,2.65])
h2('Messbare interne Betriebsziele')
p('Ziel im Pilot: 95 Prozent der bestätigten Ereignisse erscheinen innerhalb von zwei Sekunden beim verbundenen Zuschauer. Ein Ereignis gilt erst nach Datenbankbestätigung als gespeichert. Interne Verfügbarkeit von 99,5 Prozent im Monat ist ein Startziel, keine vertragliche SLA. Bei einem 30 Tage Monat entsprechen 0,5 Prozent rund 3,6 Stunden Ausfall; Spieltagsausfälle werden deshalb zusätzlich separat bewertet.')
h2('Backup und Wiederherstellung')
p('Tägliches Datenbankbackup und regelmäßiger Export in einen getrennten Speicher gehören zum Start. Für bereits bestätigte Live Ereignisse wird ein Recovery-Point-Ziel von höchstens fünf Minuten angestrebt; dafür sind zusätzliche kontinuierliche Sicherung oder PITR zu finanzieren. Mit ausschließlich täglichen Backups beträgt das mögliche Verlustfenster bis zu 24 Stunden. Pilotstart und öffentliche Zusagen müssen zum tatsächlich eingerichteten Schutz passen.')
p('Ein Restore Test vor Pilotstart prüft Datenbank, Medienreferenzen und Zugriffsschutz. Wiederherstellungsziel zunächst vier Stunden während vereinbarter Betreuungszeiten. Kein 24/7 Bereitschaftsversprechen bei zwei nebenberuflichen Personen. Ein wöchentlicher Betriebscheck und klar geregelte Vertretung sind verbindliche Arbeitsaufgaben.')

page(16,'Datenschutz und verantwortlicher Betrieb')
p('Jugendfußball betrifft personenbezogene Daten von Kindern. Datenschutz und Bildrechte sind deshalb Produktanforderungen. Die konkrete rechtliche Einordnung wird vor öffentlicher Einführung geprüft; dieser Plan definiert die vorzubereitenden Maßnahmen und ersetzt keine Einzelfallprüfung. [Q21, Q22]')
h2('Datensparsame Voreinstellungen')
p('Keine Kinderkonten für den Pilot. Öffentliche Anzeigenamen können auf Vornamen oder Kürzel beschränkt werden. Portraits und individuelle Statistiken werden erst nach dokumentierter Freigabe veröffentlicht. Geburtsdaten, Kontaktdaten und Gesundheitsangaben werden für den Liveticker nicht benötigt. Ein nicht gelisteter Link ist keine Zugangssicherung; geschützte Spiele benötigen echten Zugriffsschutz.')
h2('Zuständigkeiten und Verträge')
p('Für vereinsseitig gepflegte Daten ist eine Auftragsverarbeitung als Vertragsmodell zu prüfen. Für eigene Konto, Abrechnungs und Sicherheitszwecke kann der Betreiber eine eigene Verantwortlichkeit haben. Rollen, Zwecke, Unterauftragnehmer, Löschfristen und Drittlandtransfers werden dokumentiert. Eine EU-Datenbankregion allein erledigt diese Prüfung nicht. [Q21]')
table(['Thema','Vor öffentlichem Start erforderlich'],[['Veröffentlichung','Freigabeprozess und nachvollziehbare Bildrechte'],['Widerruf und Löschung','Öffentliche Projektion, Medien und CDN-Cache aktualisieren; Backup-Fristen dokumentieren'],['Rechtliche Dokumente','Impressum, Datenschutzhinweise, Nutzungsbedingungen und gegebenenfalls AV-Vertrag'],['Kontosicherheit','MFA für Admins, Session Widerruf, sichere Einladungen'],['Missbrauch','Melden, Moderation, Ratenbegrenzung; keine offenen Zuschauertexte im Pilot'],['Gründervereinbarung','Eigentum am Code, Kosten, Entscheidungskompetenz, Austritt und Fortführung']],[1.7,5.2])
p('KI unterstützt Entwicklung, Texte und Tests. Produktionsdaten von Kindern werden nicht ohne geregelte Grundlage in KI-Werkzeuge übertragen. Menschliche Verantwortung bleibt bei Freigaben, Datenzugriffen und Veröffentlichungen. Rechtliche Prüfung und Steuerberatung erhalten einen eigenen Kostenposten statt als kostenlose Nebenleistung vorausgesetzt zu werden.')

page(17,'Umsetzung und Ressourcen')
p('Die Obergrenze von zwei Stunden pro Person und Tag ergibt bei zwei Personen und fünf Tagen 20 Stunden pro Woche. Geplant werden konservativ 14 Stunden: zehn für Umsetzung und Qualität, vier für Abstimmung, Pilot und Betrieb. Wochenenden sind keine dauerhafte zusätzliche Kapazität. Ein zweiter Mitstreiter ist noch zu bestätigen.')
table(['Arbeitspaket','Stundenannahme','Ergebnis'],[['Fachmodell, UX und Entscheidungen','24','Festgelegter Pilotumfang und Datenmodell'],['Auth, Mandanten und Rechte','36','Getrennte Vereine und sichere Rollen'],['Spiele, Ereignisse und Reporter Lease','44','Zuverlässiger Schreibpfad'],['Zuschauer, Archiv und Basistheme','30','Durchgängige Browser Nutzung'],['Betreiberkonsole und Monitoring','22','Kontrolle über Nutzer und Betrieb'],['Migration und Export','14','Reproduzierbare Datenübernahme'],['Test, Backup, Datenschutzvorbereitung','30','Pilotabnahme'],['Dokumentation und Onboarding','10','Nutzung ohne persönliche Dauerhilfe'],['Reserve','40','Fehler, Geräteunterschiede und Nacharbeit'],['Gesamt','250','Pilot, ohne sämtliche Ausbaufunktionen']],[3.05,1.15,2.7])
p('Von Mitte Oktober bis Ende Februar stehen bei 18 tatsächlich nutzbaren Wochen etwa 252 Stunden zur Verfügung. Feiertage und Unterbrechungen sind damit berücksichtigt. Ein geschlossener Pilot Ende Februar oder im März 2027 ist plausibler als ein voll ausgestatteter öffentlicher Start im Januar. Mit nur einer Person muss der Umfang sinken oder der Termin verschoben werden.')
h2('Verantwortung statt unklarer Doppelzuständigkeit')
p('Person A übernimmt Produkt, Pilotkunden und Gestaltung; Person B Architektur, Sicherheit und Betrieb. Beide prüfen kritische Änderungen gegenseitig. KI reduziert Routinearbeit, ist aber weder zusätzliche garantierte Kapazität noch verantwortlicher Reviewer. Bei nur einer Person wird vor Start eine externe Sicherheitsprüfung eingeplant.')
p('Das neue Repository erhält automatisierte Prüfungen, getrennte Test und Produktionsumgebungen, versionierte Datenbankmigrationen und eine Rückrollstrategie. Bestehende Spiele werden nur nach Sicherung und Probeimport übernommen. Die Vereinswebsite kann währenddessen unabhängig weiterlaufen.')

page(18,'Markteintritt und Kundenbindung')
p('Der erste Vertriebskanal ist der eigene Verein. Das senkt Akquisitionskosten, erzeugt aber ein positives Auswahlbias: Kollegiale Unterstützung ist nicht dasselbe wie echte Zahlungsbereitschaft. Deshalb folgen vor einer größeren Freigabe unabhängige Vereine.')
table(['Phase','Maßnahme','Prüfgröße'],[['Vor Pilot','8 bis 12 Gespräche mit Trainern, Eltern und Jugendleitung','Problem, Alternative, Reporter Verfügbarkeit'],['Pilotwochen 1 bis 4','3 bis 5 Teams, mindestens 2 betreute Spiele je Team','Einrichtung, Fehler und Supportminuten'],['Pilotwochen 5 bis 8','Reporterwechsel ohne persönliche Einweisung','Erfolgreiche Übernahme, wiederholte Nutzung'],['Pilotwochen 9 bis 12','5 externe Teams einladen und Preisangebot testen','Konkrete Zusage oder echte Zahlung'],['Nach Freigabe','Empfehlungen, Vereinsdemonstrationen, dezenter Link im Feed','Aktivierte Teams je Kanal statt nur Besucher']],[1.4,3.2,2.3])
h2('Aktivierung und Bindung')
p('Ein Team zählt erst als aktiviert, wenn ein echtes Spiel veröffentlicht und von mindestens drei externen Zuschauersitzungen verfolgt wurde. Wiederkehrende Nutzung wird anhand der nächsten vier tatsächlich angesetzten Spiele gemessen, nicht nur anhand von Kalendertagen. Ferien, Winterpause und Spielabsagen werden separat betrachtet.')
p('Ein stabiler Teamlink, Saisonwechsel, Datenexport und verlässliche Reporterübergabe fördern Bindung. Der Dienst darf nicht vom privaten Konto eines einzigen Elternteils abhängig bleiben. Eigentümerschaft und Rechte müssen beim Trainerwechsel übertragbar sein.')
h2('Akquisitionsmodell 2027')
p('Ab April sind im Basisszenario 55 neue bezahlte Teamäquivalente und fünf Abgänge nötig, um 50 zum Jahresende zu erreichen. Das bedeutet gut sechs neue bezahlte Äquivalente pro Monat über neun Monate. Bei angenommenen 25 Prozent Abschlussquote wären rund 220 qualifizierte Angebotskontakte nötig. Diese Quote ist unbewiesen und macht den Vertriebsaufwand sichtbar.')
p('Bezahlte Werbung wird zunächst nicht eingeplant. Erst nach belegter Bindung kann ein kleiner Kanalselbsttest folgen. Gemessen werden nicht nur Geldkosten pro Kunde, sondern auch Gesprächs- und Einrichtungszeit. Ein hübscher Feed ohne wiederholte Reporteraktivität rechtfertigt keine Werbeausgaben.')

page(19,'Finanzannahmen und Kapitalbedarf')
p('Alle folgenden Beträge sind Planwerte in EUR ohne Umsatzsteuer, vor Ertragsteuern und ohne Gründerlohn. Euro-Budgets enthalten Reserven statt einer stillen Eins zu eins Umrechnung von US Dollar Tarifen. Die Steuer- und Rechtsform ist offen. Ein Geldbudget wurde vom Gründer noch nicht zugesagt.')
table(['Annahme','Wert','Rechenbedeutung'],[['Nettoerlös je bezahltem Äquivalent','6 EUR/Monat','Tarifhypothese, keine gemessene Zahlungsbereitschaft'],['Variable Infrastruktur','0,15 EUR je aktivem Team/Monat','Zusätzlich zur reservierten Basiskapazität'],['Zusatzkosten bezahlte Teams','0,40 EUR/Monat','Exporte und weitere Nutzung als Pauschalannahme'],['Zahlungsabwicklung','3 Prozent plus 0,25 EUR','Vorsichtige Modellpauschale, kein Anbieterangebot'],['Fixkosten 2027','100 / 130 / 160 / 190 EUR je Monat','Quartalsweise Ausbau von Betrieb und Werkzeugen'],['Gründervergütung','0 EUR zahlungswirksam','Opportunitätskosten separat angesetzt']],[2.1,1.85,2.95])
h2('Vorbereitung im Jahr 2026')
table(['Posten','Budgetannahme'],[['Vertrags- und Datenschutzprüfung','900 EUR'],['Externe technische Prüfung','500 EUR'],['Domain, Testbetrieb und Werkzeuge','250 EUR'],['Sonstige Einrichtung','150 EUR'],['Vorbereitung insgesamt','1.800 EUR'],['Vorgeschlagene Einlage insgesamt','4.000 EUR'],['Verfügbarer Bestand am 01.01.2027','2.200 EUR']],[5.1,1.8])
p('Der Einlagevorschlag deckt Vorbereitung, das modellierte erste Betriebsjahr und eine Reserve. Er ist keine Ausgabefreigabe. Soll das gesamte Risikobudget niedriger liegen, werden externe Leistungen neu angeboten und der Pilot verkleinert. Sicherheit oder Rechteprüfung dürfen nicht einfach entfallen.')
p('In den Fixkosten des ersten Quartals sind als Orientierung 50 EUR Basishosting und Backups, 35 EUR KI/Entwicklungswerkzeuge sowie 15 EUR Domain, Mail und Monitoring vorgesehen. Der Korridor ist eng: höhere KI-Abos oder kontinuierliche Wiederherstellung erhöhen ihn. Gründerhardware gilt als vorhanden; Datenlizenzen, Videobetrieb und bezahlte Werbung sind nicht enthalten.')

page(20,'Liquidität im ersten Betriebsjahr')
p('Basisszenario 2027 mit monatlicher Abrechnung und Zahlung im gleichen Monat. Aktiv und bezahlt sind modellierte Monatsbestände; Zu und Abgänge wirken vereinfachend zu Monatsbeginn. Der kostenlose Pilot beginnt im März mit fünf aktiven Teams. Einzahlungen entsprechen hier dem Nettoumsatz; Umsatzsteuerflüsse werden nach Klärung des Steuerstatus ergänzt.')
rows=[]
for m in months:rows.append([['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][m['month']-1],str(m['active']),str(m['paid']),fmt(m['revenue']),fmt(m['cost']),fmt(m['cashflow']),fmt(m['closing'])])
rows.append(['Jahr','–','–',fmt(rev),fmt(costs),fmt(cf),fmt(balance)])
table(['Monat','Aktiv','Bezahlt¹','Umsatz','Ausgaben','Saldo','Bestand'],rows,[.64,.65,.78,1.05,1.15,1.12,1.51])
pic('cash.png')
note('¹ Bezahlte Teamäquivalente. Alle Beträge EUR netto. Jahresendbestand = 2.200 EUR Anfangsbestand plus Jahressaldo. Die Ausgaben enthalten fixe Kosten, variable Nutzung und modellierte Zahlungsgebühren. Daten: finanzannahmen.json.')
p(f'Der niedrigste Monatsendbestand liegt bei {fmt(min(m["closing"] for m in months))} EUR. Im Dezember liegt der monatliche operative Saldo bei {fmt(months[-1]["cashflow"])} EUR. Ein positiver Einzelmonat bedeutet noch keine Rückzahlung der Vorbereitungskosten oder Vergütung der Gründer.')

page(21,'Szenarien und Dreijahresperspektive')
p('Die Szenarien testen unterschiedliche Nachfrage und Kosten. Ein Teammonat entspricht einem aktiven Team in einem Monat; ein bezahlter Äquivalentmonat einem abrechenbaren Erlösäquivalent. Es handelt sich um Sensitivitäten, nicht um Wahrscheinlichkeitsprognosen.')
sc=[]
for name,am,pm,fx,end in [('Vorsichtig',500,80,1440,15),('Basis',sum(active),sum(paid),sum(fixed),50),('Wachstum',3000,550,3000,140)]:
 r=pm*6;c=fx+am*.15+pm*.4+pm*.43
 sc.append([name,whole(am),whole(pm),whole(end),fmt(r),fmt(r-c)])
table(['2027','Aktive Teammonate','Bezahlte Monate','Bezahlt Ende','Umsatz','Op. Saldo'],sc,[1.05,1.15,1.2,.95,1.25,1.4])
h2('Fortschreibung des Basisszenarios')
rows=[]
for yr,a,paidm,fx in [(2027,sum(active),sum(paid),sum(fixed)),(2028,450*12,90*12,3600),(2029,1000*12,220*12,5400)]:
 r=paidm*6;c=fx+a*.15+paidm*.4+paidm*.43
 rows.append([yr,fmt(r),fmt(c),fmt(r-c),'15.000,00',fmt(r-c-15000)])
table(['Jahr','Umsatz','Ausgaben','Op. Saldo','Eigenzeit²','Ökon. Saldo'],rows,[.65,1.18,1.18,1.25,1.25,1.49])
note('² Annahme für jedes Betriebsjahr: 500 Gründerstunden zusammen × 30 EUR kalkulatorischer Stundenwert. Keine Auszahlung. Vorbereitungsaufwand 2026 und Steuern zusätzlich.')
p('Für 2028 werden durchschnittlich 450 aktive Teams und 90 bezahlte Äquivalente angenommen, für 2029 durchschnittlich 1.000 beziehungsweise 220. Diese Ausweitung setzt überregionale Akquisition, stabile Bindung und weitgehend selbstständiges Onboarding voraus. Sie ist mit dem vorhandenen Pilotzugang allein nicht erklärt und deshalb ausdrücklich ambitioniert.')
p('Die Dreijahresperspektive zeigt: Ein positiver Geldsaldo kann ein kleines Nebenprojekt tragen, obwohl die eigene Arbeitszeit noch nicht marktüblich vergütet wird. Wer daraus einen Haupterwerb machen möchte, benötigt höhere Erlöse je Kunde, deutlich mehr zahlende Kunden oder einen erheblich geringeren Zeitaufwand.')
h2('Auswirkung höherer Kosten')
p('Zusätzliche 100 EUR monatliche Fixkosten verschlechtern jeden Jahressaldo um 1.200 EUR. Im Basisszenario würde die Liquidität damit ohne neue Einlage unter die Reserve fallen. Kostenwarnungen sind daher bereits bei kleinen absoluten Beträgen sinnvoll.')

page(22,'Gewinnschwelle und wirtschaftliche Steuerung')
p('Bei sechs EUR Nettoerlös verbleiben nach 0,40 EUR Zusatznutzung sowie 0,43 EUR modellierten Zahlungsgebühren 5,17 EUR je bezahltem Teamäquivalent. Die allgemeinen variablen Kosten aller aktiven Teams sind zusätzlich zu decken. Bei 300 aktiven Teams und 300 EUR Fixkosten ergeben sich 345 EUR zu deckende Monatskosten und damit aufgerundet 67 bezahlte Äquivalente.')
table(['Erlös je Äquivalent','Deckungsbeitrag¹','Nötige zahlende Äquivalente²'],[['4 EUR','3,23 EUR','107'],['6 EUR','5,17 EUR','67'],['8 EUR','7,11 EUR','49']],[2.2,2.2,2.5])
note('¹ Erlös minus 0,40 EUR und Zahlungsgebühren 3 Prozent plus 0,25 EUR. ² Bei unverändert 300 aktiven Teams und 300 EUR Fixkosten, ohne Gründerlohn.')
h2('Akquisitionskosten und Bindung')
p('Bei beispielhaft 30 EUR Akquisitionskosten wäre die Rückzahlung aus 5,17 EUR Deckungsbeitrag nach rund sechs bezahlten Monaten erreicht. Kostet die Gewinnung zusätzlich zwei Gründerstunden zu je 30 EUR, steigt der wirtschaftliche Aufwand auf 90 EUR und die Rückzahlung auf rund 18 Monate. Eine hohe Konversion allein reicht deshalb nicht, wenn jedes Team persönliche Begleitung braucht.')
p('Ein Kundenwert aus Erlös geteilt durch Kündigungsrate wird vorerst nicht angesetzt. Es fehlen belastbare Kohorten und der Saisonwechsel kann Kündigungen bündeln. Stattdessen werden bezahlte Monate, Wiederkehr zur nächsten Saison, Supportminuten und tatsächliche Abgänge beobachtet.')
pic('liquidity.png')
note('Liquiditätskurve des Basisszenarios 2027. Die Linie bei 1.000 EUR ist eine vorgeschlagene Reservegrenze, keine zugesagte Finanzierung.')
p('Ab einer Unterschreitung der Reserve werden optionale Entwicklung und neue Kostenverträge gestoppt und die Planung aktualisiert. Ein Ausgabenstopp darf nicht unvorbereitet bestehende Archive oder laufende Spiele unzugänglich machen. Export und geordneter Rückbau gehören deshalb zum Betriebskonzept.')

page(23,'Risiken und Gegenmaßnahmen')
table(['Risiko','Bewertung³','Gegenmaßnahme und Auslöser'],[['Zu wenig regelmäßige Reporter','Hoch / hoch','Vier Spielgelegenheiten beobachten; bei schwacher Wiederkehr Bedienung vereinfachen'],['Keine Zahlungsbereitschaft','Hoch / hoch','Konkretes Angebot an externe Teams; Ausbau nicht allein auf Lob stützen'],['Zeitbudget überschritten','Hoch / hoch','Wöchentlich Stunden erfassen; bei 3 Wochen Überlast Umfang reduzieren'],['Datenzugriff auf fremden Verein','Mittel / sehr hoch','RLS und API Tests; kein Pilot ohne bestandene Isolationstests'],['Fehler bei Reporterwechsel','Mittel / hoch','Lease-Generation und konkurrierende Tests; Offline-Fälle zwingend abnehmen'],['Kinderbilder unzulässig öffentlich','Mittel / sehr hoch','Freigaben, reduzierte Voreinstellungen und schneller Widerrufspfad'],['Lastspitze oder Kostenanstieg','Mittel / hoch','Lasttest, Quoten, Cache und Kostenwarnung; keine unbegrenzten Medien'],['Importlizenz fehlt','Hoch / mittel','Manuelle Pflege als vollständiger Basispfad; keine Abhängigkeit vom Datenvertrag'],['Gründer fällt aus','Mittel / hoch','Dokumentierte Zugänge, Vertretung, Vereinbarung und Restore-Runbook'],['Saisonwechsel erzeugt Abgänge','Hoch / mittel','Teameigentum übertragen, Saisonwechsel testen, Kohorten getrennt messen']],[1.9,1.1,3.9])
note('³ Qualitative Einschätzung von Eintritt / Auswirkung durch die Planung, keine statistisch gemessene Risikowahrscheinlichkeit.')
h2('Stärken und Schwächen')
p('Stärken sind ein bereits praktisch entwickeltes Produktverständnis, direkter Zugang zu einem Verein und ein klarer Browseransatz. Schwächen sind begrenzte Gründerzeit, fehlende Zahlungsdaten und die notwendige Neuentwicklung der Mandanten- und Berechtigungsstruktur. Chancen liegen in einfacher teambezogener Kommunikation; Bedrohungen sind kostenlose Alternativen und steigender Supportbedarf.')
h2('Geordneter Ausstieg')
p('Wird der öffentliche Betrieb nicht tragfähig, müssen Vereine ihre Daten exportieren können. Vor Dienstende wird eine angemessene Ankündigungs- und Exportphase vertraglich festgelegt. Keine dauerhaften Links zusagen, die bei Geschäftsaufgabe technisch nicht weiter betrieben werden können. Der vereinsinterne Einsatz bleibt eine mögliche Fortführung mit kleinerem Umfang.')

page(24,'Validierung und nächste Beschlüsse')
p('Der nächste Schritt ist eine begrenzte Investitionsentscheidung für den Pilot, nicht die Freigabe sämtlicher Funktionen. Folgende Prüfungen machen aus dem Plan eine steuerbare Umsetzung.')
table(['Prüfung','Zielwert als Vorschlag','Konsequenz'],[['Erstes Spiel','Mindestens 4 von 5 Testreportern ohne persönliche Hilfe','Bei Verfehlung Onboarding überarbeiten'],['Wiederkehr','Mindestens 60 Prozent innerhalb von 4 Spielgelegenheiten','Bei Verfehlung Bedarf und Aufwand neu prüfen'],['Zuschauernutzen','Mindestens 10 externe Sitzungen bei 3 von 5 Pilotteams','Interviews statt vorschneller Reichweitenannahme'],['Zahlung','Mindestens 3 externe Teams mit Zahlung oder konkreter Preiszusage','Erst dann Tarifausbau priorisieren'],['Support','Nach Einrichtung höchstens 10 Minuten pro aktivem Team und Monat','Bei 100 Teams sonst bereits über 16 Stunden monatlich'],['Technische Sicherheit','Keine offenen kritischen Zugriffs- oder Datenverlustfehler','Öffentlichen Start verschieben'],['Skalierung','100 Schreibsitzungen und 10.000 Viewer als separater Lasttest','Kapazität erst nach Messung zusagen']],[1.25,3.1,2.55])
h2('Jetzt zu entscheiden')
p('Erstens: zweiten Mitstreiter und Verantwortlichkeiten bestätigen. Zweitens: ein Risikobudget wählen; der Plan schlägt 4.000 EUR inklusive Vorbereitung und Reserve vor. Drittens: drei bis fünf Pilotteams benennen. Viertens: Umfang und Abnahme des geschlossenen Pilots festhalten. Fünftens: vor externer Veröffentlichung einen Namen und die rechtliche Betriebsform klären.')
h2('Empfohlene Entscheidung')
p('Pilot unter klarer Kosten- und Zeitbegrenzung starten. Den Dienst technisch auf mehrere Vereine vorbereiten, aber zunächst nur wenige Teams betreuen. Zuerst wiederkehrende Berichterstattung und kontrollierbaren Support nachweisen, dann Zahlungen und externe Integrationen ausbauen. Die ambitionierte Funktionsliste bleibt erhalten, wird jedoch schrittweise anhand gemessenen Nutzens umgesetzt.',True)
p('Der Plan wird nach den ersten zehn getickerten Spielen und erneut nach dem ersten extern bezahlten Monat aktualisiert. Dabei werden Annahmen durch tatsächliche Zahlen ersetzt, statt neue Funktionen als Ersatz für fehlende Nachfrage hinzuzufügen.')

sources=[
('Q1','DFB Mitgliederstatistik 2025 2026','Vereine und Mitgliedschaften; keine Kundenanzahl','https://www.dfb.de/news/dfb-mitgliederstatistik-positive-signale-bei-maedchenteams-kindern-und-schiris'),
('Q2','DFB Statistik 2025','92.848 Junioren und 6.032 Mädchenteams; ältere detaillierte Basis','https://assets.dfb.de/uploads/000/322/167/original_DFB-Statistik_2025.pdf'),
('Q3','FuPa Widgets','Kostenlose Widgets, Jugendabdeckung und Archivansicht','https://widget.fupa.net/'),
('Q4','FUSSBALL DE Liveticker','Bedienung, Zuschauer und offizielle Aufstellungen','https://www.fussball.de/newsdetail/alles-was-du-zum-liveticker-wissen-musst/-/article-id/122493'),
('Q5','BFV Widgets','Kostenlose Einbettung und Vereinsfarben','https://www.bfv.de/der-bfv/digitalangebote/widgets/die-bfv-widgets'),
('Q6','Tickaroo Preise','Aktuelle Liveblog Tarife; nicht mit alten Season Pass Preisen gleichsetzen','https://tickaroo.com/de/pricing'),
('Q7','GameChanger Soccer','Fußballangebot und sportabhängige Tarifbedingungen','https://gc.com/soccer'),
('Q8','GAA Match Tracker','Browser Zuschauer und Vereinskonzept; vollständiger Tarif offen','https://www.gaamatchtracker.ie/'),
('Q9','Tournify Preise','Grenzen und Preise pro Veranstaltung','https://tournifyapp.com/en/pricing'),
('Q10','SpielerPlus Premium','Funktionsumfang; dynamischer Preisrechner','https://www.spielerplus.de/lp/premium'),
('Q11','SportMember Vereinsabos','Mitgliedsbasierte Preise und Zusatzleistungen','https://www.sportmember.de/de/was-kostet-es/vereinsabonnements'),
('Q12','Apple Web Push','iOS Home-Screen Voraussetzung und macOS Webseiten','https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers'),
('Q13','Sportmedia Ergebnisservice','Offizielle Spielpläne, Ergebnisse, XML und SFTP','https://www.sportmedia.de/ergebnisservice.php'),
('Q14','Sportmedia Spielberichtservice','Ereignisse, Freigabe und Altersbegrenzung','https://www.sportmedia.de/spielberichtservice.php'),
('Q15','Supabase Preise','Pro Preis und Backupumfang','https://supabase.com/pricing'),
('Q16','Supabase Spitzenverbindungen','Kontingent und paketweise Mehrverbrauchskosten','https://supabase.com/docs/guides/platform/manage-your-usage/realtime-peak-connections'),
('Q17','Supabase Realtime Limits','Technische Grenzen getrennt von Abrechnungsquoten','https://supabase.com/docs/guides/realtime/limits'),
('Q18','Supabase Realtime-Nachrichten','Inklusivvolumen und Mehrverbrauch','https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages'),
('Q19','Cloudflare Workers Preise','Grundtarif und nutzungsabhängige Abrechnung','https://developers.cloudflare.com/workers/platform/pricing/'),
('Q20','Cloudflare R2 Preise','Standard Storage, Operationen und Egress','https://developers.cloudflare.com/r2/pricing/'),
('Q21','BfDI Auftragsverarbeitung','Vertragsmuster und Anforderungen an Dienstleister','https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Muster/Muster_zur_Auftragsverarbeitung.pdf'),
('Q22','Kunsturhebergesetz Paragraph 22','Rechtliche Grundlage für die Prüfung von Bildveröffentlichungen','https://www.gesetze-im-internet.de/kunsturhg/__22.html'),
('Q23','Supabase Realtime Authorization','Separate Autorisierung von Broadcast-Kanälen','https://supabase.com/docs/guides/realtime/authorization'),
('Q24','Researchly Businessplan Vorgehen','Kapitelweise Entwicklung und Szenarioplanung als methodische Anregung','https://www.researchly.at/post/mit-den-richtigen-chatgpt-prompts-zum-perfekten-businessplan')]

def hyperlink(par,text,url):
 from docx.opc.constants import RELATIONSHIP_TYPE as RT
 rid=par.part.relate_to(url,RT.HYPERLINK,is_external=True);h=OxmlElement('w:hyperlink');h.set(qn('r:id'),rid);r=OxmlElement('w:r');pr=OxmlElement('w:rPr');c=OxmlElement('w:color');c.set(qn('w:val'),'203B50');pr.append(c);sz=OxmlElement('w:sz');sz.set(qn('w:val'),'20');pr.append(sz);r.append(pr);txt=OxmlElement('w:t');txt.text=text;r.append(txt);h.append(r);par._p.append(h)
page(25,'Quellen und Nachweisgrenzen')
p('Abruf und Prüfung am 8. Oktober 2026. Quellen belegen jeweils die genannten Sachverhalte; Modellwerte, Zielgrößen und Architekturentscheidungen sind eigene Planungsannahmen. Wettbewerbsfunktionen wurden anhand öffentlicher Angaben verglichen, nicht durch vollständige Produkttests.')
for code,title,why,url in sources[:12]:
 par=doc.add_paragraph();hyperlink(par,f'{code}  {title}',url);par.paragraph_format.space_after=Pt(2)
 note(why)
doc.add_heading('Technische und weitere Quellen',1).paragraph_format.page_break_before=True
for code,title,why,url in sources[12:]:
 par=doc.add_paragraph();hyperlink(par,f'{code}  {title}',url);par.paragraph_format.space_after=Pt(2)
 note(why)
h2('Nicht als belegt zu behandeln')
p('Zahlungsbereitschaft, Kundenwachstum, Supportbedarf, Budgetfreigabe und Hostingkosten unter konkreter Last sind noch offen. Der bestehende Prototyp ist kein Umsatz oder Sicherheitsnachweis. Markenfreigabe und Partner API-Zugänge sind nicht erteilt. Die gezeigte Architektur ist ein Vorschlag und wurde für diesen Plan nicht implementiert.')
# Set page break before each top level heading already controlled, prevent orphans.
for par in doc.paragraphs:
 par.paragraph_format.widow_control=True
# Save source and document.
path=OUT/'Businessplan_matchTracker_2026-10.docx';doc.save(path)
(OUT/'quellen.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2))
print(json.dumps({'docx':str(path),'revenue':rev,'costs':costs,'cashflow':cf,'closing':float(balance),'min_cash':min(m['closing'] for m in months),'paid_months':sum(paid),'active_months':sum(active),'sections':len(sections)},indent=2))
