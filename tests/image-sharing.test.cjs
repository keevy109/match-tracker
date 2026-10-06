const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('match-tracker.html', 'utf8').split('async function shareCanvas')[1].split('\nfunction exportImage()')[0];
function setup(share) {
  const calls = [];
  const context = {navigator:{canShare:()=>true, share}, Uint8Array, atob,
    File:class {constructor(parts,name){this.name=name;}},
    URL:{createObjectURL:()=> 'blob:test', revokeObjectURL:()=>calls.push('revoke')},
    document:{body:{appendChild:()=>calls.push('append')},createElement:()=>({click:()=>calls.push('download'),remove:()=>{}})},
    setTimeout:()=>calls.push('deferred cleanup'), showToast:()=>{}, console};
  vm.createContext(context);
  vm.runInContext('async function shareCanvas'+source,context);
  return {context,calls,canvas:{toDataURL:()=> 'data:image/png;base64,YQ=='}};
}
test('native sharing is invoked immediately from the click path', async()=>{
  let shared = false;
  const {context,canvas,calls} = setup(()=>{shared=true;return Promise.resolve();});
  const pending=context.shareCanvas(canvas);
  assert.equal(shared,true);
  await pending;
  assert.deepEqual(calls,[]);
});
test('failed sharing downloads the image and defers URL cleanup',async()=>{
  const {context,canvas,calls}=setup(()=>Promise.reject({name:'NotAllowedError'}));
  await context.shareCanvas(canvas);
  assert.deepEqual(calls,['append','download','deferred cleanup']);
});
test('cancelling native sharing does not download',async()=>{
  const {context,canvas,calls}=setup(()=>Promise.reject({name:'AbortError'}));
  await context.shareCanvas(canvas);
  assert.deepEqual(calls,[]);
});
