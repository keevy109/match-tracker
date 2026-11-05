/* Templates and timed messages are independent of DOM, transport and the timer. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MatchTexts=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const defaults={locale:'de',templates:[{id:'goalless',de:'Noch keine Tore: {score}. Noch {remaining} Minute bis zur Pause.',en:'Still goalless: {score}. {remaining} minute until the break.'}],rules:[{enabled:true,kind:'point',anchor:'beforeBreak',from:1,to:1,score:'goalless',templateId:'goalless'}]};
  function normalize(input=defaults){
    if(!['de','en'].includes(input.locale)||!Array.isArray(input.templates)||!Array.isArray(input.rules)||input.templates.length>30||input.rules.length>30)throw new Error('Sprache, Textbausteine oder Regeln ungültig (maximal 30).');
    const ids=new Set();
    const templates=input.templates.map(t=>{if(!t.id||ids.has(t.id))throw new Error('Textbaustein-ID muss eindeutig sein.');ids.add(t.id);const de=String(t.de||'').trim(),en=String(t.en||'').trim();if(!de||!en||de.length>500||en.length>500)throw new Error('Bitte jeden Text auf Deutsch und Englisch ausfüllen (maximal 500 Zeichen).');for(const text of [de,en])for(const token of text.matchAll(/\{([^}]+)\}/g))if(!['score','remaining','minute','period'].includes(token[1]))throw new Error('Unbekannter Platzhalter: '+token[0]);return {id:t.id,de,en};});
    const rules=input.rules.map(r=>{const from=Number(r.from),to=r.kind==='point'?from:Number(r.to);if(!['point','range'].includes(r.kind)||!['elapsed','beforeBreak','beforeEnd'].includes(r.anchor)||!['any','goalless','draw'].includes(r.score)||!ids.has(r.templateId)||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>480)throw new Error('Regel prüfen: Zeitpunkt/Zeitraum, Bedingung und Textbaustein müssen gültig sein.');return {...r,enabled:r.enabled!==false,from,to};});
    return {locale:input.locale,templates,rules};
  }
  function messages(config,context){
    if(!config||!context.running||!context.started||context.finished||context.abandoned||context.inBreak)return [];
    const result=[];
    for(const rule of config.rules){
      if(!rule.enabled)continue;
      if(rule.score==='goalless'&&(context.homeScore!==0||context.awayScore!==0))continue;
      if(rule.score==='draw'&&context.homeScore!==context.awayScore)continue;
      if(rule.anchor==='beforeBreak'&&context.period>=context.count-1)continue;
      if(rule.anchor==='beforeEnd'&&context.period!==context.count-1)continue;
      const value=rule.anchor==='elapsed'?Math.floor(context.elapsed/60):Math.ceil(context.remaining/60);
      if(value<rule.from||value>rule.to||context.remaining<0&&rule.anchor!=='elapsed')continue;
      const template=config.templates.find(t=>t.id===rule.templateId);if(!template)continue;
      const values={score:`${context.homeScore}:${context.awayScore}`,remaining:Math.max(0,Math.ceil(context.remaining/60)),minute:Math.floor(context.elapsed/60),period:context.period+1};
      const text=template[config.locale].replace(/\{(score|remaining|minute|period)\}/g,(_,key)=>values[key]);
      if(!result.includes(text))result.push(text);
    }
    return result;
  }
  return {defaults,normalize,messages};
});
