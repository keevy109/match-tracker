(function(){
 const dev=new URLSearchParams(location.search).get('dev')==='1';
 document.getElementById('back').href='./match-tracker.html?'+(dev?'dev=1&':'')+'tab=einstellungen';
 const input=document.getElementById('cardsEnabled'),status=document.getElementById('featureStatus');
 input.onchange=()=>{try{const changed=TrackerFeatures.setCards(input.checked);TrackerFeatures.refresh();status.textContent=changed?'Gespeichert. Geöffnete Tracker übernehmen die Einstellung automatisch.':'Änderung abgebrochen.';}catch{TrackerFeatures.refresh();status.textContent='Einstellung konnte nicht gespeichert werden.';}};
 if(['localhost','127.0.0.1'].includes(location.hostname)){
  const link=document.getElementById('operator');link.hidden=false;link.href='http://'+location.hostname+':4319/operator'+(dev?'?dev=1':'');
  if(dev)document.getElementById('operatorInfo').textContent='Testmodus: Die Betreiber-Demo ändert ausschließlich fiktive Kunden und Pakete.';
 }
})();
