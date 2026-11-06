(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MatchTiming=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const vocabulary=Object.freeze({periods:{1:'Spiel',2:'Halbzeit',3:'Drittel',4:'Viertel'},halfTime:'Halbzeit',break:'Pause',end:'Abpfiff',added:'Nachspielzeit'});
  function plan(input){
    const count=Number(input.count??2),duration=Number(input.duration);
    if(!Number.isInteger(count)||count<1||count>4||!Number.isInteger(duration)||duration<count||duration>count*120||duration%count!==0)throw new Error('Die Gesamtspielzeit muss gleichmäßig auf die Abschnitte aufteilbar sein (1–120 Minuten je Abschnitt).');
    const minutes=duration/count;
    return {count,duration,minutes,summary:`${count} × ${minutes} Minuten · ${duration} Minuten Spielzeit · ${count-1} ${count===2?'Pause':'Pausen'}`};
  }
  function configure(input){
    if(typeof input==='number')input={duration:input};
    if(input.duration!==undefined)input={...input,...plan(input)};
    const count=Number(input.count),minutes=Number(input.minutes);
    if(!Number.isInteger(count)||count<1||count>4||!Number.isInteger(minutes)||minutes<1||minutes>120)throw new Error('Bitte 1–4 Abschnitte mit jeweils 1–120 Minuten wählen.');
    const breaks=input.breaks||Array(count-1).fill(10);
    if(breaks.length!==count-1||breaks.some(n=>!Number.isInteger(Number(n))||Number(n)<0||Number(n)>60))throw new Error('Pausen müssen zwischen 0 und 60 Minuten liegen.');
    return {version:1,count,minutes,breaks:breaks.map(Number),period:0,periodStart:0,breakStarted:null,message:String(input.message||'').slice(0,240)};
  }
  const clock=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  function describe(state,elapsed,options={}){
    const seconds=Math.max(0,Math.floor(elapsed));
    if(!state)return {clock:clock(seconds),text:'',minute:Math.floor(seconds/60)+1};
    const duration=state.minutes*60,local=Math.max(0,seconds-state.periodStart),boundary=(state.period+1)*duration;
    const overtime=Math.max(0,local-duration);
    const label=`${state.period+1}. ${vocabulary.periods[state.count]}`;
    const target=state.period===state.count-1?vocabulary.end:state.count===2?vocabulary.halfTime:`Pause nach dem ${state.period+1}. ${vocabulary.periods[state.count]}`;
    let text;
    if(options.finished)text=options.abandoned?'Spiel abgebrochen.':'Spiel beendet.';
    else if(state.breakStarted!=null){
      text=`Pause · bereit für ${state.count===2?'die':'das'} ${label}.`;
    }else if(!options.started)text=`${state.count} × ${state.minutes} Minuten · bereit zum Anpfiff.`;
    else if(local>=duration)text=`${label} · ${vocabulary.added}.`;
    else {const left=Math.ceil((duration-local)/60);text=`${label} · noch ${left} ${left===1?'Minute':'Minuten'} bis ${target===vocabulary.halfTime?'zur Halbzeit':target===vocabulary.end?'zum Abpfiff':'zur '+target}.`;if(options.running===false)text+=' Uhr angehalten.';}
    const textModule=typeof MatchTexts!=='undefined'?MatchTexts:(typeof require==='function'?require('./match-texts.js'):null);
    const automated=textModule?textModule.messages(state.automation,{...options,homeScore:Number(options.homeScore)||0,awayScore:Number(options.awayScore)||0,elapsed:state.period*duration+local,remaining:duration-local,period:state.period,count:state.count,inBreak:state.breakStarted!=null}):[];
    return {baseText:`Ergebnis: ${Number(options.homeScore)||0}:${Number(options.awayScore)||0}. ${text}${state.message?' '+state.message:''}`,messages:automated,clock:state.breakStarted!=null?clock(state.period*duration):local>=duration?`${Math.floor(boundary/60)} +${Math.floor(overtime/60)}`:clock(state.period*duration+local),minute:Math.floor((state.period*duration+local)/60)+1,overtime,label,text:`Ergebnis: ${Number(options.homeScore)||0}:${Number(options.awayScore)||0}. ${text}${state.message?' '+state.message:''}${automated.length?' '+automated.join(' '):''}`};
  }
  function endPeriod(state,elapsed,now){
    if(!state||state.breakStarted!=null||state.period>=state.count-1)throw new Error('Kein weiterer Spielabschnitt verfügbar.');
    return {...state,period:state.period+1,periodStart:Math.max(0,Math.floor(elapsed)),breakStarted:now};
  }
  function resume(state){return state?{...state,breakStarted:null}:null;}
  return {vocabulary,plan,configure,describe,endPeriod,resume};
});
