/* Isolated conference prototype: synthetic input, original ticker renderer, no backend. */
(()=>{
 const stage=document.getElementById('crossStage'),controls=document.getElementById('crossControls'),status=document.getElementById('crossStatus');
 const params=new URLSearchParams(location.search);
 const expandable=['accordion','expandable'].includes(params.get('view'));
 const compact=expandable||['compact','score-compact'].includes(params.get('view'));
 const scores=compact||params.get('view')==='score';
 const style=params.get('style')==='dark'?'dark':'light';
 document.body.dataset.style=style;
 const simulate=params.get('simulate')==='1';
 if(simulate)document.body.classList.add('cross-simulate');
 if(scores){document.body.classList.add('cross-compact');controls.hidden=true;if(!compact)document.body.classList.add('cross-scores');}
 const games=['U11','U13','Frauen'].map((team,i)=>({team,data:{...TickerFixtures.get('max'),homeTeam:'FC Beispiel '+team,awayTeam:['SV Muster','FC Nord','TSV Süd'][i],homeScore:i,awayScore:0,events:[],timerOffset:(12+i*8)*60},frame:document.createElement('iframe')}));
 let active=0,rotation=true,priority=false,queue=[],sequence=1000;
 let focused=null;
 function focusGame(index){
  focused=focused===index?null:index;
  stage.classList.toggle('has-focused-game',focused!==null);
  games.forEach((g,i)=>{
   if(!g.row)return;
   const selected=focused===i;
   g.row.classList.toggle('focused-game',selected);
   g.row.classList.toggle('collapsed-game',focused!==null&&!selected);
   g.frame.contentWindow.CrossTrackerDev?.navigation(()=>focusGame(i),selected,focused!==null&&!selected);
   g.frame.contentWindow.CrossTrackerDev?.setFormat(selected?'feed':compact?'score-compact':'score');
  });
 }

 function select(index){active=index;let side=0;games.forEach((g,i)=>{g.frame.className=i===active?'main':(++side===2?'side-two':'');});status.textContent=(priority?'Tor im Fokus · ':'Haupttracker · ')+games[active].team;}
 const spotlight=document.createElement('iframe');
 spotlight.className='cross-goal-overlay';spotlight.title='Tor · Vereinskonferenz';spotlight.hidden=true;
 spotlight.src='./match-tracker.html?dev=1&fixture=max&ticker=dev-fixture&embed=score&crossdev=1&style='+style;
 if(scores)document.body.append(spotlight);
 function moveFirst(game){
  const rows=games.map(g=>g.row||g.frame),positions=new Map(rows.map(row=>[row,row.getBoundingClientRect().top]));
  const row=game.row||game.frame;stage.prepend(row);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)rows.forEach(item=>item.animate([{transform:'translateY('+(positions.get(item)-item.getBoundingClientRect().top)+'px)'},{transform:'translateY(0)'}],{duration:450,easing:'ease-out'}));
  document.scrollingElement.scrollTo({top:0,behavior:'smooth'});
 }
 function pump(){
  if(priority||!queue.length)return;
  if(scores&&!spotlight.contentWindow.CrossTrackerDev){setTimeout(pump,100);return;}
  priority=true;const job=queue.shift(),game=games[job.index];select(job.index);
  game.frame.contentWindow.CrossTrackerDev.render(job.data,scores?null:job.event);
  if(scores){moveFirst(game);setTimeout(()=>{spotlight.hidden=false;spotlight.contentWindow.CrossTrackerDev.render(job.data);spotlight.contentWindow.CrossTrackerDev.showConferenceGoal(job.event);},450);}
  setTimeout(()=>{spotlight.hidden=true;priority=false;if(queue.length)pump();else select(active);},scores?3900:6000);
 }

 const toggle=document.createElement('button');toggle.textContent='Rotation pausieren';toggle.onclick=()=>{rotation=!rotation;toggle.textContent=rotation?'Rotation pausieren':'Rotation fortsetzen';};if(!scores)controls.append(toggle);
 games.forEach((g,index)=>{
  const url=new URL('./match-tracker.html',location.href);url.search=new URLSearchParams({dev:'1',fixture:'max',ticker:'dev-fixture',embed:compact?'score-compact':'score',crossdev:'1',style});if(!scores)url.searchParams.set('scoreboard','tv');
  g.frame.title='Live · '+g.team;g.frame.src=url;
  stage.append(g.frame);
  if(scores){
   if(!g.row){g.row=document.createElement('section');g.row.className='cross-score-row';stage.insertBefore(g.row,g.frame);g.row.append(g.frame);}
   g.frame.id='cross-game-'+index;

  }
  const choose=document.createElement('button'),goal=document.createElement('button');choose.textContent=g.team+' zeigen';choose.onclick=()=>{if(!priority)select(index);};goal.textContent='Tor '+g.team;goal.disabled=true;
  g.frame.onload=()=>{const wait=setInterval(()=>{if(!g.frame.contentWindow.CrossTrackerDev)return;clearInterval(wait);g.frame.contentWindow.CrossTrackerDev.render(g.data);if(scores)g.frame.contentWindow.CrossTrackerDev.navigation(()=>focusGame(index),focused===index,focused!==null&&focused!==index);if(focused===index)g.frame.contentWindow.CrossTrackerDev.setFormat('feed');goal.disabled=false;},100);};
  goal.onclick=()=>{g.data.homeScore++;const event={id:++sequence,typ:'tor',team:'home',minute:Math.floor(g.data.timerOffset/60),scorer:'Jonah',scorerId:4,snapshot:g.data.homeScore+':'+g.data.awayScore};g.data.events.push(event);const snapshot=structuredClone(g.data);queue.push({index,event,data:snapshot});pump();};if(!scores)controls.append(choose);controls.append(goal);
 });
 select(0);setInterval(()=>{if(!scores&&rotation&&!priority)select((active+1)%games.length);},10000);
})();
