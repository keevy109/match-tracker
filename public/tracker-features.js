/* Standalone tracker preferences. Paid entitlements belong to the service backend. */
(function(root){
 const key=new URLSearchParams(location.search).get('dev')==='1'?'matchtracker_dev_features':'matchtracker_features';
 function cardsEnabled(){try{return JSON.parse(localStorage.getItem(key)||'{}').cards!==false;}catch{return true;}}
 function refresh(){
  document.querySelectorAll('[data-feature="cards"]').forEach(el=>el.hidden=!cardsEnabled());
  const input=document.getElementById('cardsEnabled');if(input)input.checked=cardsEnabled();
 }
 function setCards(enabled){
  if(!enabled&&!confirm('Karten-Erfassung deaktivieren? Die Karten-Buttons werden ausgeblendet. Bereits gespeicherte Karten bleiben im Ticker erhalten. Dies gilt für diesen Browser und ändert keine Kundenverträge.'))return false;
  let settings={};try{settings=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
  localStorage.setItem(key,JSON.stringify({...settings,cards:!!enabled}));refresh();return true;
 }
 root.TrackerFeatures={cardsEnabled,refresh,setCards};
 document.addEventListener('DOMContentLoaded',refresh);
 window.addEventListener('storage',e=>{if(e.key===key)refresh();});
})(window);
