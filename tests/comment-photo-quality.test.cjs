const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../match-tracker.html'),'utf8');
const source=html.slice(html.indexOf('function isCommentPhoto('),html.indexOf('function buildPlayerOptions('));
function setup(width,height,input,encode){
 const attempts=[],draws=[],ctx={drawImage(...args){draws.push(args.slice(1));}};
 const canvas={getContext:()=>ctx,toDataURL(type,quality){attempts.push({type,quality,width:canvas.width,height:canvas.height});return encode(quality);}};
 class FileReader {readAsDataURL(){this.result=input;this.onload();}}
 class Image {constructor(){this.width=width;this.height=height;}set src(value){this.onload();}}
 const c=vm.createContext({FileReader,Image,document:{createElement:()=>canvas}});
 vm.runInContext(source,c);return {c,attempts,draws,ctx};
}
const file={type:'image/png',size:100000};
test('images within the resolution and size limits retain their original bytes',async()=>{
 const original='data:image/png;base64,aGVsbG8=';
 const {c,attempts}=setup(1672,941,original,()=>{throw Error('must not recompress');});
 assert.equal(await c.prepareCommentPhoto(file),original);assert.equal(attempts.length,0);
});
test('large images retain 2560 pixels and high quality for full width cards',async()=>{
 const encoded='data:image/webp;base64,'+'A'.repeat(500000);
 const {c,attempts,ctx}=setup(6000,3000,'data:image/png;base64,aGVsbG8=',()=>encoded);
 assert.equal(await c.prepareCommentPhoto(file),encoded);
 assert.deepEqual(attempts,[{type:'image/webp',quality:0.92,width:2560,height:1280}]);
 assert.equal(ctx.imageSmoothingQuality,'high');
});
test('oversized output is rejected instead of repeatedly shrinking into a thumbnail',async()=>{
 const oversized='data:image/webp;base64,'+'A'.repeat(2*1024*1024);
 const {c,attempts}=setup(4000,2000,'data:image/png;base64,aGVsbG8=',()=>oversized);
 await assert.rejects(c.prepareCommentPhoto(file),/guter Qualität/);
 assert.equal(attempts.length,3);
 assert.ok(attempts.every(a=>a.width===2560&&a.height===1280&&a.quality>=0.84));
});
