/* Layout module only: move existing controls, never clone state or event handlers. */
(function(root){
  const breakpoint=window.matchMedia('(min-width: 1024px)');
  const anchors=[];
  const isSplit=()=>breakpoint.matches&&!document.body.classList.contains('ticker-mode');
  root.MatchScoreboard=Object.freeze({isSplit,refresh:layout});
  function layout(){
    const panel=document.querySelector('.scoreboard-panel');
    if(!panel)return;
    if(!anchors.length)document.querySelectorAll('#tabSpiel .export-row,#tabSpiel .reset-row,#tabSpiel .btn-clear,#tabSpiel .feed-result-space').forEach(element=>{
      const anchor=document.createComment('scoreboard-mobile-position');element.before(anchor);anchors.push({element,anchor});
    });
    anchors.forEach(({element,anchor})=>{if(isSplit()){if(element.classList.contains('feed-result-space'))panel.before(element);else panel.append(element);}else anchor.after(element);});
    if(typeof root.updateFeedScrollState==='function')root.updateFeedScrollState();
  }
  breakpoint.addEventListener('change',layout);
  document.addEventListener('DOMContentLoaded',layout,{once:true});
})(window);
