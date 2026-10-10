const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('match-tracker.html','utf8');
test('share image renders goals only, uses fixture colors and fits long names',()=>{
 const texts=[],colors=[];
 const ctx={fillRect(){colors.push(this.fillStyle);},fillText(text,x,y,max){texts.push({text,max});},createLinearGradient(){return {addColorStop(){}};}};
 const canvas={getContext:()=>ctx};
 const c=vm.createContext({document:{getElementById:()=>canvas},getCanvasColors:()=>({home:'#000',away:'#000'}),getTeamColor:name=>name==='Heim'?'#ff8800':'#ff0000'});
 vm.runInContext(html.slice(html.indexOf('function renderMatchCanvas('),html.indexOf('async function prepareMatchCanvas(')),c);
 c.renderMatchCanvas({homeName:'Heim',awayName:'Ein sehr langer Mannschaftsname',hScore:5,aScore:1,dateStr:'10.10.2026',sorted:[{typ:'wechsel',rausName:'Wechselspieler',reinName:'Einwechselspieler'},{id:1,team:'home',snapshot:'1:0',scorer:'Tom',minute:5},{typ:'kommentar',text:'Nicht exportieren'}]});
 assert(texts.some(t=>t.text==='Tom')); assert(!texts.some(t=>/Wechsel|exportieren/.test(t.text)));
 assert(texts.some(t=>t.text==='Ein sehr langer Mannschaftsname'&&t.max===450));
 assert(colors.includes('#ff8800'));assert.equal(canvas.height,586);
});
