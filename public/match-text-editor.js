/* DOM editor; all user text is assigned through value/textContent. */
function textEditorField(row,label,tag,value,choices){
 const wrapper=document.createElement('label');wrapper.textContent=label;
 const field=document.createElement(tag);field.dataset.field=label;
 if(choices)for(const [key,name] of choices){const option=document.createElement('option');option.value=key;option.textContent=name;field.append(option);}
 field.value=value;wrapper.append(field);row.append(wrapper);return field;
}
function readTextEditor(){
 const read=(row,key)=>row.querySelector(`[data-field="${key}"]`).value;
 return {locale:document.getElementById('timingLocale').value,templates:[...document.querySelectorAll('#timingTemplatesEditor > section')].map(row=>({id:row.dataset.id,de:read(row,'Deutsch'),en:read(row,'English')})),rules:[...document.querySelectorAll('#timingRulesEditor > section')].map(row=>({enabled:read(row,'Aktiv')==='yes',kind:read(row,'Typ'),anchor:read(row,'Bezug'),from:read(row,'Von / Zeitpunkt (Min.)'),to:read(row,'Bis (Min.)'),score:read(row,'Spielstand'),templateId:read(row,'Textbaustein')}))};
}
function renderTextEditor(config){
 document.getElementById('timingLocale').value=config.locale;
 const templates=document.getElementById('timingTemplatesEditor'),rules=document.getElementById('timingRulesEditor');templates.replaceChildren();rules.replaceChildren();
 const remove=(row,kind,index)=>{const button=document.createElement('button');button.type='button';button.textContent='Entfernen';button.onclick=()=>{const current=readTextEditor();if(kind==='templates'&&current.rules.some(r=>r.templateId===current.templates[index].id)){alert('Dieser Text wird noch in einer Regel verwendet. Bitte zuerst die Regel ändern oder entfernen.');return;}current[kind].splice(index,1);renderTextEditor(current);};row.append(button);};
 config.templates.forEach((template,index)=>{const row=document.createElement('section');row.dataset.id=template.id;const title=document.createElement('h4');title.textContent=`Textbaustein ${index+1}`;row.append(title);for(const [key,label] of [['de','Deutsch'],['en','English']]){const field=textEditorField(row,label,'textarea',template[key]);field.maxLength=500;field.rows=3;field.style.width='100%';}remove(row,'templates',index);templates.append(row);});
 config.rules.forEach((rule,index)=>{const row=document.createElement('section');const title=document.createElement('h4');title.textContent=`Regel ${index+1} · Wenn … dann Textbaustein`;row.append(title);
 textEditorField(row,'Aktiv','select',rule.enabled?'yes':'no',[['yes','Ja'],['no','Nein']]);
 const kind=textEditorField(row,'Typ','select',rule.kind,[['point','Zeitpunkt'],['range','Zeitraum']]);
 textEditorField(row,'Bezug','select',rule.anchor,[['elapsed','Seit Spielbeginn (offizielle Spielzeit)'],['beforeBreak','Vor der nächsten Pause'],['beforeEnd','Vor regulärem Spielende']]);
 for(const [key,label] of [['from','Von / Zeitpunkt (Min.)'],['to','Bis (Min.)']]){const field=textEditorField(row,label,'input',rule[key]);field.type='number';field.min=0;field.max=480;}
 const end=row.querySelector('[data-field="Bis (Min.)"]');end.parentElement.hidden=rule.kind==='point';kind.onchange=()=>{end.parentElement.hidden=kind.value==='point';};
 textEditorField(row,'Spielstand','select',rule.score,[['any','Beliebig'],['goalless','0:0'],['draw','Unentschieden']]);
 textEditorField(row,'Textbaustein','select',rule.templateId,config.templates.map((t,i)=>[t.id,`Textbaustein ${i+1}: ${t.de.slice(0,45)}`]));
 remove(row,'rules',index);rules.append(row);
 });
}
function loadAutomationSettings(){
 const key=DEV_MODE?'matchtracker_dev_automation_v1':'matchtracker_automation_v1';
 try { const saved=localStorage.getItem(key);return MatchTexts.normalize(saved?JSON.parse(saved):MatchTexts.defaults); }
 catch { return MatchTexts.normalize(MatchTexts.defaults); }
}
function restoreTextEditor(){renderTextEditor(loadAutomationSettings());}
function saveAutomationSettings(){
 const status=document.getElementById('automationSettingsStatus');
 try {const config=MatchTexts.normalize(readTextEditor());localStorage.setItem(DEV_MODE?'matchtracker_dev_automation_v1':'matchtracker_automation_v1',JSON.stringify(config));status.textContent='Gespeichert. Gilt für künftig konfigurierte Spiele in diesem Browser.';}
 catch(error){status.textContent=error.message;}
}
function addTimingRule(){const config=readTextEditor();if(config.rules.length>=30)return;config.rules.push({enabled:true,kind:'point',anchor:'beforeBreak',from:1,to:1,score:'goalless',templateId:config.templates[0]?.id||''});renderTextEditor(config);}
function addTimingTemplate(){const config=readTextEditor();if(config.templates.length>=30)return;config.templates.push({id:crypto.randomUUID(),de:'',en:''});renderTextEditor(config);}
function applyAutomationToCurrentMatch(){
 const status=document.getElementById('automationSettingsStatus');
 if(!activeMatchId||!matchTiming||schedule.find(game=>game.id===activeMatchId)?.result){status.textContent='Bitte ein aktives Spiel mit konfigurierter Spielzeit öffnen.';return;}
 if(!confirm('Gespeicherte Automationsvorlage für dieses Spiel ersetzen? Spielzeit und Ereignisse bleiben erhalten.'))return;
 matchTiming={...matchTiming,automation:loadAutomationSettings()};save();updateTimerDisplay();status.textContent='Vorlage im aktuellen Spiel übernommen. Die Bedingungen werden bei laufender Uhr automatisch geprüft.';
}
function previewAutomation(){
 const output=document.getElementById('automationPreviewResult');
 try{
 const number=id=>{const value=Number(document.getElementById(id).value);if(!Number.isFinite(value)||value<0)throw new Error('Bitte gültige, nicht negative Zahlen eingeben.');return value;};
 const messages=MatchTexts.messages(MatchTexts.normalize(readTextEditor()),{running:true,started:true,homeScore:number('automationPreviewHome'),awayScore:number('automationPreviewAway'),elapsed:number('automationPreviewElapsed')*60,remaining:number('automationPreviewRemaining')*60,period:document.getElementById('automationPreviewPhase').value==='end'?1:0,count:2});
 output.textContent=messages.join(' ')||'Keine Regel trifft auf diese Situation zu.';
 }catch(error){output.textContent=error.message;}
}
