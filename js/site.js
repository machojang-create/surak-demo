/* 수락스트릿 — 페이지는 tools/build.mjs 가 HTML 로 미리 만든다. 여기선 작은 손질만.
   옛 주소(#/shop/x 처럼 '#/' 로 시작)로 들어오면 새 주소로 옮긴다. */
(function(){
  var h=location.hash;
  if(h.indexOf('#/')===0){
    var p=h.slice(2).replace(/\/$/,''); var m;
    var to='/'+(p?p+'/':'');
    if((m=p.match(/^people\/(\d+)$/)))to='/people/';
    if((m=p.match(/^trail\/(\d+)$/)))to='/trail/'+(['jubong','byeokun-valley','dulle'][+m[1]-1]||'')+'/';
    if(p==='game/play')to='/game/';
    location.replace(to.replace(/\/\/$/,'/'));return;
  }
  var v=document.querySelector('.hero-v');
  if(v){v.muted=true;var pr=v.play&&v.play();if(pr&&pr.catch)pr.catch(function(){});}
})();
