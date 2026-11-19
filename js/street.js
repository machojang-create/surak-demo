'use strict';
/* 수락스트릿 전면개편 (2026-11-19)
 * 하단 탭: 홈 · 매장 · 📷QR · 놀이 · 이야기 · 마이
 *  - 매장  : 추천 매장 3곳(팔선당·쿠마키친·오공김밥) 브랜드 화면 + 지도/수락이 + 전체 매장
 *  - 놀이  : 웹게임 「수락산 스트릿」 (주소가 정해지면 SURAK_GAME.url 만 바꾼다)
 *  - 이야기: 인물 연재(수락산 사람들) · 칼럼 · 등산로
 * 의존(app.js/data.js): g, lang, sv, STORES, SD, TRAILS, openPopup, openQrScan, showGpsToast
 */

/* ── 공용 ── */
function _e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function _paras(t){
  return String(t||'').split(/\n+/).map(function(p){
    p=p.trim(); if(!p) return '';
    if(p.indexOf('■')===0) return '<h4>'+_e(p.replace(/^■\s*/,''))+'</h4>';
    return '<p>'+_e(p)+'</p>';
  }).join('');
}
function _store(id){return (typeof STORES!=='undefined')?STORES.find(function(s){return s.id===id;}):null;}

/* ═══════════ 데이터 ═══════════ */

/* 웹게임 — 정식 주소가 생기면 url 한 줄만 바꾼다. 비어 있으면 「곧 공개」 */
var SURAK_GAME={
  title:'수락산 스트릿',
  sub:'낮엔 장사, 밤엔 전쟁',
  desc:'수락산 골목을 무대로 한 로그라이크 게임. 낮에는 가게를 꾸리고, 밤에는 몰려오는 적으로부터 상권을 지켜 내세요.',
  url:(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?'http://localhost:5199/index.html':'')
};

/* 추천 매장 — 내용은 각 매장 브랜드 페이지(Manus 제작본, 네이버 플레이스 기준)에서 옮김 */
var SHOPS=[
  {key:'palseondang',storeId:7,name:'팔선당',en:'PAL SEON DANG',mark:'八',color:'#B23A2B',
   cat:'중식',walk:'수락산역 걸어서 약 6분',
   tagline:'불 앞에서, 정직하게.',
   lead:'좋은 한 끼는 요란한 말보다 뜨거운 웍 안에서 시작되니까.',
   story:'팔선당은 수락산역 골목에서 한 접시를 제대로 내고 싶은 마음으로 불을 켭니다.\n익숙한 메뉴일수록 한 번 더 살피고, 주문이 들어오면 그때 볶아 내는 것. 특별한 척하기보다 기본을 지키는 것. 그게 팔선당이 생각하는 중식의 멋입니다.',
   points:[{k:'火',h:'그때그때 볶아 내는 짜장',d:'주문이 들어오면 그때 웍에 올립니다.'},
           {k:'外',h:'날씨 좋은 날엔 야외 자리도',d:'골목 바람 맞으며 먹는 한 그릇.'},
           {k:'街',h:'수락산역에서 만나는 동네 중식',d:'익숙한 메뉴를 조금 더 선명하게.'}],
   menu:[{n:'짜장면',p:'8,000',d:'진하게 볶아낸 간짜장 스타일. 소스의 고소함과 양파의 식감을 한 젓가락에.',best:1},
         {n:'짬뽕',p:'11,000',d:'불향을 담은 한 그릇.'},
         {n:'탕수육',p:'23,000',d:'바삭함으로 승부하는 대표 요리.'},
         {n:'미니 탕수육',p:'12,000',d:'둘이서도 부담 없이.'},
         {n:'볶음짜장',p:'10,000',d:'매운맛 / 순한맛 선택.'}],
   menuNote:'네이버 플레이스 등록 메뉴(2026.09.11) 기준 · 매장 사정에 따라 바뀔 수 있습니다.',
   addr:'서울 노원구 동일로242길 60, 1층',way:'수락산역 3번 출구에서 걸어서 약 6분',
   hours:['화–일 11:00–22:00','월요일 정기휴무','평일 브레이크타임 15:00–16:30','라스트오더 20:30'],
   tel:'0507-1309-6376',place:'https://m.place.naver.com/place/1668961674',
   map:'https://map.naver.com/p/search/%ED%8C%94%EC%84%A0%EB%8B%B9',
   hero:'img/shops/palseondang-hero.webp',menuImg:'img/shops/palseondang-menu.webp'},

  {key:'kumakitchen',storeId:21,name:'쿠마키친 수락산점',short:'쿠마키친',en:'KUMA KITCHEN',mark:'熊',color:'#2E5A88',
   cat:'일식 · 카츠&나베',walk:'수락산역 약 410m',
   tagline:'천천히 숙성하고, 바삭하게.',
   lead:'좋은 고기는 시간을 들여 준비하고, 카츠는 주문 뒤에 튀깁니다.',
   story:'‘쿠마’는 일본어로 곰. 정성을 담아 꾸준히 잘하겠다는 이름입니다.\n쿠마키친 수락산점은 특허기술 아이스에이징으로 숙성한 돈육을 사용하고, 메뉴와 소스를 직접 개발·제조합니다. 익숙한 카츠와 나베도 한 번 더 살펴, 주문이 들어오면 그때 바삭하게 내어드립니다.',
   points:[{k:'熟',h:'천천히 숙성',d:'특허기술 아이스에이징으로 준비한 돈육.'},
           {k:'自',h:'메뉴와 소스는 직접',d:'매장에서 개발하고 정성껏 만드는 맛.'},
           {k:'揚',h:'주문 뒤에 바삭하게',d:'카츠는 주문 즉시 튀겨 따뜻하게 냅니다.'}],
   menu:[{n:'쿠마카츠정식',d:'쿠마키친의 오리지널 모듬카츠 정식.',best:1},
         {n:'히레카츠정식',d:'부드러운 식감이 돋보이는 대표 카츠.'},
         {n:'로제 · 매운토마토 카츠나베',d:'직접 개발한 소스와 카츠를 함께 즐기는 나베.'},
         {n:'쿠마소바세트',d:'카츠와 면 메뉴가 함께하는 든든한 한 끼.'}],
   menuNote:'메뉴와 가격은 네이버 플레이스에서 최신 정보로 확인해 주세요.',
   addr:'서울 노원구 동일로242길 61, 1층',way:'7호선 수락산역 3번 출구에서 약 410m',
   hours:['매일 11:00–21:30'],parking:'매장 주차 가능(공간 협소) · 만차 시 인근 공영주차장',
   tel:'0507-1348-3907',place:'https://m.place.naver.com/restaurant/1612572766/home',
   map:'https://map.naver.com/p/search/'+encodeURIComponent('쿠마키친 수락산점'),
   hero:'img/shops/kuma-hero.webp',menuImg:'img/shops/kuma-menu.webp'},

  {key:'ogonggimbap',storeId:1,name:'오공김밥 수락산점',short:'오공김밥',en:'50 GIMBAP',mark:'五',color:'#C9822B',
   cat:'김밥 전문',walk:'수락산역 약 407m',
   tagline:'수락산 가는 길, 든든한 한 줄.',
   lead:'익숙한 추억의 김밥부터 오늘 처음 만나는 새로운 한 줄까지.',
   story:'수락산 자락에서 만나는 따뜻한 한 끼. 밥 한 톨, 재료 하나하나에 정성을 담아 김밥 한 줄로 하루를 채워드립니다.\n오공김밥 수락산점은 등산길의 든든한 친구이자, 동네에서 잠시 쉬어 가는 작은 쉼터가 되고 싶습니다. 어린 시절 소풍의 설렘을 떠올리는 익숙한 맛부터 새로운 조합까지, 오늘 입맛에 맞는 한 줄을 골라보세요.',
   points:[{k:'58',h:'58가지의 다양한 맛',d:'취향 따라 고르는 김밥.'},
           {k:'9',h:'아침 9시 영업 시작',d:'등산 전에 한 줄 챙기기 좋은 시간.'},
           {k:'五',h:'2025년 11월 문을 연 가게',d:'오픈 날, 골목에 긴 줄이 섰습니다.'}],
   menu:[{n:'치치불김밥',p:'7,500',d:'참치 · 치즈 · 진미채, 시그니처 한 줄.',best:1},
         {n:'치치불키토김밥',p:'8,300',d:'참치와 매콤진미채, 치즈소스 조합.'},
         {n:'떡볶이',p:'6,500',d:'김밥 짝꿍, 오공김밥만의 특별한 소스.'},
         {n:'참치김밥',p:'6,300',d:'익숙해서 더 반가운 기본의 맛.'},
         {n:'흑돼지 돈까스김밥',p:'6,800',d:'돈까스와 어니언후레이크, 데리야끼소스.'}],
   menuNote:'2026년 11월 네이버 플레이스 기준 · 매운맛은 맵기 조절이 어렵고, 명란·와사비·갈릭 소스류는 별도 제공됩니다.',
   addr:'서울 노원구 동일로242길 55, 1층',way:'수락산역 3번 출구에서 약 407m',
   hours:['09:00 영업 시작','매월 1·3번째 수요일 정기휴무','폐점 시각은 네이버 플레이스에서 확인'],
   tel:'0507-1329-5050',place:'https://m.place.naver.com/restaurant/2071278260/home',
   map:'https://map.naver.com/p/search/'+encodeURIComponent('오공김밥 수락산점'),
   hero:'img/shops/ogong-hero.webp',menuImg:'img/shops/ogong-menu.webp'}
];
function _shop(key){return SHOPS.find(function(s){return s.key===key;});}

/* 인물 연재 — 본문은 data.js 의 SD(16명). 순서 = 화 번호 */
var EP_ILL=['cheon','kimsiseup','inhyeon','parksedang','hwanghui','leeseonggye','leehwang','yeonsangun','heungseon','jeongseon','eomheungdo','kimsatgat','jeongjo','deokhye','hanseokbong','seonjo'];
var EP_HOOK={0:'이 세상 소풍 끝내는 날…',1:'다섯 살에 세종을 감탄시킨 천재',2:'장희빈에 맞선 수락산의 기적',3:'삼각산보다 수락산이 으뜸!',
  4:'수락(水落)이라는 이름을 낳은 한 마디',5:'삐쳐서 서울에 등 돌린 반역산',7:'민초들의 저주가 서린 수락산',8:'수락산을 글씨로 도배한 야망',
  9:'300년 전 그 각도 그대로',10:'영화 속 그 장면이 수락산에서…',11:'수락산을 사랑한 천재들의 야사',12:'백일기도 끝에 태어난 순조'};
var EP_SERIES='수락산 사람들';
function _epCount(){return (typeof SD!=='undefined')?SD.length:0;}
function _ko(o){return (o&&typeof o==='object')?(o[lang]||o.KO||''):(o||'');}
function _ep(i){
  var p=SD[i]; if(!p) return null;
  return {i:i,no:i+1,name:_ko(p.nm),sub:_ko(p.sub),hook:EP_HOOK[i]||_ko(p.sub),
          body:(p.body&&typeof p.body==='object')?(p.body.KO||''):(p.body||''),
          ill:EP_ILL[i]?EP_ILL[i]+'.png':''};
}
function _epRead(){try{return JSON.parse(localStorage.getItem('surak_ep_read')||'[]');}catch(e){return [];}}
function _epMark(i){var r=_epRead();if(r.indexOf(i)<0){r.push(i);try{localStorage.setItem('surak_ep_read',JSON.stringify(r));}catch(e){}}}
function _epNextUnread(){var r=_epRead();for(var i=0;i<_epCount();i++){if(r.indexOf(i)<0)return i;}return 0;}

/* 칼럼 — 사실 확인된 정보(매장 안내·코스 데이터)만으로 쓴 편집부 글 */
var COLUMNS=[
  {id:'halfday',ic:'🚶',bg:'linear-gradient(135deg,#7B6EF0,#5B8DEF)',date:'2026.11',
   title:'처음 온 수락산 디자인거리, 반나절 이렇게 걸어 보세요',
   summary:'수락산역 3번 출구에서 시작해 한 줄 김밥, 둘레길, 하산 후 한 그릇까지.',
   body:'수락산 디자인거리는 7호선 수락산역 3번 출구에서 시작합니다. 출구를 나와 400m 남짓 걸으면 골목 양쪽으로 작은 가게들이 이어지는데, 이 앱에서 소개하는 오공김밥(약 407m)·쿠마키친(약 410m)·팔선당(걸어서 약 6분)도 모두 이 골목에 모여 있습니다.\n'+
        '■ 오전 — 산에 들고 갈 한 줄\n'+
        '오공김밥은 아침 9시에 문을 엽니다. 등산 전에 김밥 한 줄을 챙기기 좋은 시간입니다. 단, 매월 첫째·셋째 수요일은 쉬는 날이니 그날은 미리 준비해 오세요.\n'+
        '■ 산 — 내 체력에 맞는 코스 고르기\n'+
        '처음이라면 둘레길 코스(약 6.1km, 2시간, 초급)를, 물소리를 듣고 싶다면 벽운계곡 코스(약 3.5km, 2시간)를 권합니다. 정상(637m)에 서고 싶다면 주봉 코스(약 8.2km, 왕복 약 4시간, 중급)인데, 깔딱고개 돌계단 구간은 낙석에 주의하세요. 자세한 길 안내는 이야기 탭의 ‘등산로’에 있습니다.\n'+
        '■ 하산 후 — 따뜻한 한 그릇\n'+
        '내려와서는 쿠마키친(매일 11:00–21:30)의 카츠나 나베, 팔선당(화–일 11:00–22:00)의 짜장·짬뽕으로 하루를 마무리해 보세요. 팔선당은 월요일 정기휴무이고, 평일 오후 3시부터 4시 반까지는 브레이크타임입니다.\n'+
        '■ 잊지 말 것\n'+
        '수락스트릿 QR이 붙은 매장에서는 앱 가운데 📷 버튼으로 QR을 찍어 방문 적립을 받을 수 있습니다. 영업시간과 메뉴는 바뀔 수 있으니 출발 전 네이버 플레이스에서 한 번 더 확인하세요.',
   shops:['ogonggimbap','kumakitchen','palseondang']},
  {id:'mealtime',ic:'🍱',bg:'linear-gradient(135deg,#F2A03D,#E5573F)',date:'2026.11',
   title:'등산 전 한 줄, 하산 후 한 그릇 — 시간대별 식사 가이드',
   summary:'일찍 출발하고 늦게 내려오는 날, 디자인거리 세 가게의 문 여는 시간을 한눈에.',
   body:'수락산을 오르는 날은 식사 시간이 들쭉날쭉합니다. 일찍 출발하고, 늦게 내려오고. 그래서 디자인거리 세 가게의 문 여는 시간을 한눈에 정리했습니다.\n'+
        '■ 아침 9시~ : 오공김밥\n'+
        '가장 먼저 문을 엽니다. 58가지 김밥 가운데 대표 메뉴는 참치·치즈·진미채가 들어간 치치불김밥(7,500원). 무난하게 가고 싶다면 참치김밥(6,300원), 든든하게 가려면 흑돼지 돈까스김밥(6,800원)도 있습니다.\n'+
        '■ 점심 11시~ : 쿠마키친 · 팔선당\n'+
        '쿠마키친은 매일 11시에 엽니다. 아이스에이징으로 숙성한 돼지고기를 주문 뒤에 바로 튀기는 카츠가 중심이고, 쌀쌀한 날엔 로제·매운토마토 카츠나베가 잘 어울립니다. 팔선당도 화요일부터 일요일까지 11시에 문을 엽니다. 간짜장 스타일 짜장면(8,000원)과 불향 짬뽕(11,000원)이 대표 메뉴입니다.\n'+
        '■ 오후 3시~4시 반 : 팔선당 쉬는 시간\n'+
        '평일 이 시간에는 팔선당이 브레이크타임입니다. 늦은 점심이라면 쿠마키친이나 오공김밥으로 가세요.\n'+
        '■ 저녁 : 마감 시간 확인\n'+
        '팔선당 라스트오더는 저녁 8시 30분, 쿠마키친은 밤 9시 30분까지 영업합니다. 하산이 늦어질 것 같다면 쿠마키친이 마지막 선택지입니다.\n'+
        '■ 쉬는 날 정리\n'+
        '팔선당 — 매주 월요일 · 오공김밥 — 매월 첫째·셋째 수요일 · 쿠마키친 — 매일 영업.\n'+
        '메뉴와 가격은 각 매장의 네이버 플레이스 등록 정보(2026년 9~11월) 기준이며 바뀔 수 있습니다.',
   shops:['ogonggimbap','kumakitchen','palseondang']},
  {id:'howto',ic:'📷',bg:'linear-gradient(135deg,#5BBF8A,#3A9468)',date:'2026.11',
   title:'수락스트릿 앱, 이렇게 쓰면 두 배로 즐겁습니다',
   summary:'QR 방문 적립, 매장 레벨, 쿠폰함, 연재까지 — 앱 사용 설명서.',
   body:'수락스트릿은 수락산 디자인거리를 걸으며 쓰는 앱입니다. 가게를 들르고, 산을 오르고, 이야기를 읽을수록 쌓이는 것이 있습니다.\n'+
        '■ QR로 방문 적립\n'+
        '아래 가운데 📷 QR 버튼을 누르고 매장에 붙은 수락스트릿 QR을 비추면 방문이 기록됩니다. 한 번 찍을 때마다 경험치 10을 받고, 같은 매장은 하루 한 번 적립됩니다. 적립하려면 로그인이 필요하고, 매장 근처에서 찍어야 합니다.\n'+
        '■ 매장 레벨\n'+
        '손님들의 방문이 쌓이면 매장도 레벨이 오릅니다. 매장 정보 화면에서 지금 레벨과 다음 레벨까지 남은 양을 볼 수 있습니다.\n'+
        '■ 쿠폰함과 스탬프\n'+
        '매장이 쿠폰을 열어 두면 마이 탭의 쿠폰함에서 확인할 수 있고, 방문할 때마다 그 매장 스탬프가 하나씩 찍힙니다.\n'+
        '■ 이야기 탭\n'+
        '수락산과 인연이 닿은 인물들의 이야기가 한 화씩 연재됩니다. 등산로 안내와 칼럼도 이곳에 모여 있습니다.\n'+
        '■ 놀이 탭\n'+
        '수락산 골목을 무대로 한 게임 ‘수락산 스트릿’이 준비되고 있습니다.'}
];

/* 등산 안전 수칙 (공통) */
var TRAIL_SAFETY=['일몰 1시간 전에는 하산을 시작하세요.','물과 간식을 챙기세요 — 출발 전 디자인거리에서 준비할 수 있습니다.',
  '깔딱고개 돌계단·로프 구간은 낙석 주의, 앞사람과 간격을 두세요.','비 온 뒤 바위 구간은 미끄럽습니다. 무리하지 마세요.'];

/* ═══════════ 공용 시트(전체 화면) · 뒤로가기 ═══════════ */
var _stStack=[];
function _stEnsureDom(){
  if(g('st-sheet')) return;
  var sh=document.createElement('div');
  sh.id='st-sheet'; sh.className='st-sheet';
  /* 모바일 = 전체 화면 / PC = 가운데 창 + 어두운 바깥(바깥 누르면 닫힘) */
  sh.innerHTML='<div class="st-sheet-panel"><div class="st-sheet-bar"><button class="st-sbtn" id="st-sheet-back" aria-label="뒤로">‹</button>'
    +'<div class="st-sheet-title" id="st-sheet-title"></div>'
    +'<button class="st-sbtn" id="st-sheet-x" aria-label="닫기">✕</button></div>'
    +'<div class="st-sheet-body" id="st-sheet-body"></div></div>';
  document.body.appendChild(sh);
  g('st-sheet-back').onclick=stCloseSheet; g('st-sheet-x').onclick=stCloseSheet;
  sh.addEventListener('click',function(e){ if(e.target===sh) stCloseSheet(); });

  var gm=document.createElement('div');
  gm.id='st-game'; gm.className='st-game';
  /* 게임 iframe 은 열 때마다 새로 만들고 닫을 때 제거한다 —
     src 를 바꿔 끼우면 브라우저 방문기록이 쌓여 폰 「뒤로가기」가 게임을 못 닫는다(2026-11-19 실측) */
  gm.innerHTML='<button class="st-game-x" id="st-game-x" aria-label="게임 닫기">✕</button>';
  document.body.appendChild(gm);
  g('st-game-x').onclick=stCloseGame;
}
function _stPush(kind){_stStack.push(kind);try{history.pushState({st:kind},'');}catch(e){}}
function _stTop(){return _stStack[_stStack.length-1];}
window.addEventListener('popstate',function(){
  var k=_stStack.pop();
  if(k==='game') _stHideGame(); else if(k==='sheet') _stHideSheet();
});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape') return;
  if(_stTop()==='game') stCloseGame(); else if(_stTop()==='sheet') stCloseSheet();
});
function stOpenSheet(title,html){
  _stEnsureDom();
  var sh=g('st-sheet'); g('st-sheet-title').textContent=title||''; g('st-sheet-body').innerHTML=html;
  g('st-sheet-body').scrollTop=0;
  if(!sh.classList.contains('on')){ sh.classList.add('on'); _stPush('sheet'); }
}
function _stHideSheet(){var sh=g('st-sheet');if(sh)sh.classList.remove('on');}
function stCloseSheet(){ if(_stTop()==='sheet'){ try{history.back();}catch(e){_stStack.pop();_stHideSheet();} } else _stHideSheet(); }

/* ═══════════ 매장 탭 ═══════════ */
var _stCat='all';
function _featCard(s,small){
  return '<div class="st-feat'+(small?' sm':'')+'" role="button" tabindex="0" data-shop="'+s.key+'" style="--c:'+s.color+'">'
    +'<div class="st-feat-img" style="background-image:url('+s.hero+')"></div><div class="st-feat-shade"></div>'
    +'<div class="st-feat-mark">'+_e(s.mark)+'</div>'
    +'<div class="st-feat-txt"><div class="st-feat-cat">'+_e(s.cat)+' · '+_e(s.walk)+'</div>'
    +'<div class="st-feat-nm">'+_e(s.short||s.name)+'</div>'
    +(small?'':'<div class="st-feat-tag">'+_e(s.tagline)+'</div>')+'</div></div>';
}
function _bindShopCards(root){
  (root||document).querySelectorAll('[data-shop]').forEach(function(el){
    el.onclick=function(){openBrand(this.getAttribute('data-shop'));};
  });
}
function renderShopTab(){
  var el=g('shop-inner'); if(!el) return;
  var cats=[['all','전체'],['food','식당'],['cafe','카페'],['gogi','고기'],['bar','주점']];
  var h='<div class="st-page">'
    +'<div class="st-hd"><div class="st-hd-k">SURAK DESIGN STREET</div><h2 class="st-hd-t">수락산 디자인거리의 가게들</h2>'
    +'<div class="st-hd-s">수락산역 3번 출구에서 걸어서 5분, 골목마다 한 끼가 있습니다.</div></div>'
    +'<div class="st-sec">⭐ 추천 매장</div><div class="st-feat-grid">';
  SHOPS.forEach(function(s){h+=_featCard(s);});
  h+='</div><div class="st-tools"><button class="st-tool" onclick="sv(\'map\')"><span>🗺️</span>지도로 보기</button>'
    +'<button class="st-tool" onclick="sv(\'search\')"><span>🔍</span>수락이에게 묻기</button></div>'
    +'<div class="st-sec">🏪 디자인거리 전체 매장 <small id="st-shop-n"></small></div>'
    +'<div class="st-chips">'+cats.map(function(c){return '<button class="st-chip'+(_stCat===c[0]?' on':'')+'" data-cat="'+c[0]+'">'+c[1]+'</button>';}).join('')+'</div>'
    +'<div id="st-shop-list" class="st-list"></div></div>';
  el.innerHTML=h;
  _bindShopCards(el);
  el.querySelectorAll('.st-chip').forEach(function(b){
    b.onclick=function(){_stCat=this.getAttribute('data-cat');el.querySelectorAll('.st-chip').forEach(function(x){x.classList.remove('on');});this.classList.add('on');_stRenderShopList();};
  });
  _stRenderShopList();
}
function _stRenderShopList(){
  var box=g('st-shop-list'); if(!box||typeof STORES==='undefined') return;
  var CAT={food:'식당',cafe:'카페',gogi:'고기',bar:'주점',outdoor:'아웃도어'};
  var IC={food:'🍽️',cafe:'☕',gogi:'🥩',bar:'🍺',outdoor:'⛰️'};
  var list=STORES.filter(function(s){return _stCat==='all'||s.cat===_stCat;})
    .slice().sort(function(a,b){return (a.dist||999)-(b.dist||999);});
  var n=g('st-shop-n'); if(n) n.textContent=list.length+'곳';
  box.innerHTML=list.map(function(s){
    var feat=SHOPS.find(function(f){return f.storeId===s.id;});
    return '<div class="st-row" role="button" tabindex="0" data-sid="'+s.id+'">'
      +'<div class="st-row-ic">'+(IC[s.cat]||'🏪')+'</div>'
      +'<div class="st-row-b"><div class="st-row-nm">'+_e(s.ko)+(feat?' <span class="st-badge">추천</span>':'')+'</div>'
      +'<div class="st-row-m">'+(CAT[s.cat]||'')+(s.dist?' · '+s.dist+'m':'')+'</div></div><div class="st-row-go">›</div></div>';
  }).join('')||'<div class="st-empty">이 분류의 매장이 아직 없어요.</div>';
  box.querySelectorAll('[data-sid]').forEach(function(r){
    r.onclick=function(){
      var id=parseInt(this.getAttribute('data-sid'),10);
      var feat=SHOPS.find(function(f){return f.storeId===id;});
      if(feat) openBrand(feat.key); else { var s=_store(id); if(s&&typeof openPopup==='function') openPopup(s); }
    };
  });
}

/* 브랜드 화면 */
function openBrand(key){
  var s=_shop(key); if(!s) return;
  var st=_store(s.storeId);
  var h='<div class="br" style="--c:'+s.color+'">'
    +'<div class="br-hero" style="background-image:url('+s.hero+')"><div class="br-hero-shade"></div>'
    +'<div class="br-hero-txt"><div class="br-mark">'+_e(s.mark)+'</div><div class="br-en">'+_e(s.en)+' · SURAKSAN</div>'
    +'<div class="br-nm">'+_e(s.name)+'</div><div class="br-tag">'+_e(s.tagline)+'</div></div></div>'
    +'<div class="br-acts">'
    +'<a class="br-act" href="tel:'+s.tel.replace(/-/g,'')+'"><span>📞</span>전화</a>'
    +'<a class="br-act" href="'+s.map+'" target="_blank" rel="noopener"><span>🧭</span>길찾기</a>'
    +'<a class="br-act" href="'+s.place+'" target="_blank" rel="noopener"><span>N</span>플레이스</a>'
    +(st?'<button class="br-act" id="br-stamp"><span>⭐</span>적립·레벨</button>':'')
    +'</div>'
    +'<div class="br-sec"><div class="br-k">OUR STORY</div><div class="br-lead">'+_e(s.lead)+'</div>'+_paras(s.story)+'</div>'
    +'<div class="br-points">'+s.points.map(function(p){return '<div class="br-pt"><div class="br-pt-k">'+_e(p.k)+'</div><div><div class="br-pt-h">'+_e(p.h)+'</div><div class="br-pt-d">'+_e(p.d)+'</div></div></div>';}).join('')+'</div>'
    +'<div class="br-sec"><div class="br-k">MENU</div><div class="br-h">오늘, 뭐가 당기세요?</div>'
    +'<div class="br-menu-img" style="background-image:url('+s.menuImg+')"></div>'
    +s.menu.map(function(m){return '<div class="br-mi"><div class="br-mi-b"><div class="br-mi-n">'+_e(m.n)+(m.best?' <span class="st-badge">대표</span>':'')+'</div><div class="br-mi-d">'+_e(m.d)+'</div></div>'+(m.p?'<div class="br-mi-p">'+m.p+'<small>원</small></div>':'')+'</div>';}).join('')
    +'<div class="br-note">'+_e(s.menuNote)+'</div></div>'
    +'<div class="br-sec"><div class="br-k">VISIT</div><div class="br-h">골목에서 기다릴게요</div>'
    +'<div class="br-info"><div class="br-ir"><b>주소</b><span>'+_e(s.addr)+'</span></div>'
    +'<div class="br-ir"><b>오는 길</b><span>'+_e(s.way)+'</span></div>'
    +'<div class="br-ir"><b>영업</b><span>'+s.hours.map(_e).join('<br>')+'</span></div>'
    +(s.parking?'<div class="br-ir"><b>주차</b><span>'+_e(s.parking)+'</span></div>':'')
    +'<div class="br-ir"><b>전화</b><span><a href="tel:'+s.tel.replace(/-/g,'')+'">'+_e(s.tel)+'</a></span></div></div>'
    +'<div class="br-note">영업시간·메뉴는 바뀔 수 있어요. 출발 전 네이버 플레이스에서 확인해 주세요.</div></div>'
    +'<button class="br-qr" onclick="stCloseSheet();setTimeout(function(){openQrScan();},250)">📷 매장 QR 찍고 방문 적립하기</button>'
    +'</div>';
  stOpenSheet(s.short||s.name,h);
  var bs=g('br-stamp'); if(bs) bs.onclick=function(){ if(typeof openPopup==='function') openPopup(st); };
}

/* ═══════════ 놀이 탭 ═══════════ */
function renderPlayTab(){
  var el=g('play-inner'); if(!el) return;
  var ready=!!SURAK_GAME.url;
  el.innerHTML='<div class="st-page">'
    +'<div class="st-hd"><div class="st-hd-k">PLAY</div><h2 class="st-hd-t">수락산에서 놀자</h2><div class="st-hd-s">디자인거리를 무대로 한 게임을 즐겨 보세요.</div></div>'
    +'<div class="gm-card"><div class="gm-sky"><span class="gm-sun">☀️</span><span class="gm-moon">🌙</span></div>'
    +'<div class="gm-badge">'+(ready?'개발 중 · 시험판':'곧 공개')+'</div>'
    +'<div class="gm-t">'+_e(SURAK_GAME.title)+'</div><div class="gm-s">'+_e(SURAK_GAME.sub)+'</div>'
    +'<div class="gm-d">'+_e(SURAK_GAME.desc)+'</div>'
    +'<button class="gm-play" id="gm-play">'+(ready?'▶ 지금 플레이':'🔔 곧 만나요')+'</button></div>'
    +'<div class="st-note">더 많은 놀이가 준비되고 있어요. 새 게임이 열리면 이곳에 가장 먼저 올라옵니다.</div></div>';
  g('gm-play').onclick=openGame;
}
function openGame(){
  if(!SURAK_GAME.url){ if(typeof showGpsToast==='function') showGpsToast('🎮 수락산 스트릿은 곧 공개됩니다!'); return; }
  _stEnsureDom();
  var gm=g('st-game'); if(gm.classList.contains('on')) return;
  _stPush('game');
  var f=document.createElement('iframe');
  f.id='st-game-frame'; f.title=SURAK_GAME.title; f.setAttribute('allow','autoplay; fullscreen; gamepad');
  f.src=SURAK_GAME.url;            /* 붙이기 전에 src 지정 → 방문기록에 안 남음 */
  gm.insertBefore(f,gm.firstChild);
  gm.classList.add('on');
}
function _stHideGame(){var gm=g('st-game');if(!gm)return;gm.classList.remove('on');var f=g('st-game-frame');if(f&&f.parentNode)f.parentNode.removeChild(f);}
function stCloseGame(){ if(_stTop()==='game'){ try{history.back();}catch(e){_stStack.pop();_stHideGame();} } else _stHideGame(); }

/* ═══════════ 이야기 탭 ═══════════ */
var _storySeg='ep';
function renderStoryTab(){
  var el=g('story-inner'); if(!el) return;
  var segs=[['ep','📜 인물 연재'],['col','✍️ 칼럼'],['trail','⛰️ 등산로']];
  var h='<div class="st-page"><div class="st-hd"><div class="st-hd-k">STORY</div><h2 class="st-hd-t">수락산 이야기</h2>'
    +'<div class="st-hd-s">사람의 이야기, 골목의 이야기, 산의 이야기.</div></div>'
    +'<div class="st-seg">'+segs.map(function(s){return '<button class="st-seg-b'+(_storySeg===s[0]?' on':'')+'" data-seg="'+s[0]+'">'+s[1]+'</button>';}).join('')+'</div>'
    +'<div id="st-story-body"></div></div>';
  el.innerHTML=h;
  el.querySelectorAll('.st-seg-b').forEach(function(b){
    b.onclick=function(){_storySeg=this.getAttribute('data-seg');renderStoryTab();};
  });
  var body=g('st-story-body');
  if(_storySeg==='ep') body.innerHTML=_epListHtml();
  else if(_storySeg==='col') body.innerHTML=_colListHtml();
  else body.innerHTML=_trailListHtml();
  _bindStory(body);
}
function _bindStory(root){
  root.querySelectorAll('[data-ep]').forEach(function(x){x.onclick=function(){openEpisode(parseInt(this.getAttribute('data-ep'),10));};});
  root.querySelectorAll('[data-col]').forEach(function(x){x.onclick=function(){openColumn(parseInt(this.getAttribute('data-col'),10));};});
  root.querySelectorAll('[data-trail]').forEach(function(x){x.onclick=function(){openTrail(parseInt(this.getAttribute('data-trail'),10));};});
}
function _epListHtml(){
  var n=_epCount(), r=_epRead(), nx=_epNextUnread(), e=_ep(nx);
  var h='<div class="ep-series"><div class="ep-series-k">연재</div><div class="ep-series-t">'+EP_SERIES+'</div>'
    +'<div class="ep-series-d">수락산 자락에 발자취를 남긴 사람들의 이야기를 한 화씩 읽어 보세요.</div>'
    +'<div class="ep-prog"><div class="ep-prog-bar"><i style="width:'+Math.round(r.length/Math.max(n,1)*100)+'%"></i></div><span>'+n+'화 중 '+r.length+'화 읽음</span></div>'
    +(e?'<button class="ep-cont" data-ep="'+nx+'">'+(r.length?'이어 읽기':'제1화부터 읽기')+' · 제'+e.no+'화 '+_e(e.name)+' ›</button>':'')+'</div>';
  for(var i=0;i<n;i++){
    var p=_ep(i); var rd=r.indexOf(i)>=0;
    h+='<div class="ep-row'+(rd?' is-read':'')+'" role="button" tabindex="0" data-ep="'+i+'">'
      +'<div class="ep-th" style="background-image:url('+p.ill+')"></div>'
      +'<div class="ep-b"><div class="ep-no">제'+p.no+'화'+(rd?' · <span class="ep-rd">읽음</span>':'')+'</div>'
      +'<div class="ep-nm">'+_e(p.name)+'</div><div class="ep-hk">'+_e(p.hook)+'</div></div><div class="st-row-go">›</div></div>';
  }
  h+='<div class="st-note">이 연재는 역사 기록과 수락산 일대에 전해 내려오는 이야기(야사)를 함께 엮어 재구성한 읽을거리입니다. 일부 내용은 사실과 다를 수 있습니다.</div>';
  return h;
}
function openEpisode(i){
  var p=_ep(i); if(!p) return;
  _epMark(i);
  var n=_epCount(), prev=i>0?_ep(i-1):null, next=i<n-1?_ep(i+1):null;
  var h='<article class="rd">'
    +'<div class="rd-ill" style="background-image:url('+p.ill+')"></div>'
    +'<div class="rd-k">연재 · '+EP_SERIES+' · 제'+p.no+'화</div>'
    +'<h1 class="rd-t">'+_e(p.name)+'</h1><div class="rd-s">'+_e(p.sub)+'</div>'
    +'<div class="rd-hook">“'+_e(p.hook)+'”</div>'
    +'<div class="rd-body">'+_paras(p.body)+'</div>'
    +'<div class="rd-end">— 제'+p.no+'화 끝 —</div>'
    +(next?'<button class="rd-next" data-ep="'+(i+1)+'"><small>다음 화</small>제'+next.no+'화 · '+_e(next.name)+' ›</button>':'<div class="rd-fin">지금까지 '+EP_SERIES+' 연재를 모두 읽으셨어요. 다음 이야기를 기다려 주세요!</div>')
    +'<div class="rd-nav">'+(prev?'<button data-ep="'+(i-1)+'">‹ 제'+prev.no+'화</button>':'<span></span>')
    +'<button id="rd-list">목록</button>'+(next?'<button data-ep="'+(i+1)+'">제'+next.no+'화 ›</button>':'<span></span>')+'</div>'
    +'</article>';
  stOpenSheet('제'+p.no+'화 · '+p.name,h);
  var body=g('st-sheet-body'); _bindStory(body);
  var lb=g('rd-list'); if(lb) lb.onclick=stCloseSheet;
  if(g('story-view')&&g('story-view').classList.contains('on')) renderStoryTab();
  if(g('home-street')) streetHomeExtras();
}
function _colListHtml(){
  return COLUMNS.map(function(c,i){
    return '<div class="col-card" role="button" tabindex="0" data-col="'+i+'">'
      +'<div class="col-cv" style="background:'+c.bg+'"><span>'+c.ic+'</span></div>'
      +'<div class="col-b"><div class="col-t">'+_e(c.title)+'</div><div class="col-s">'+_e(c.summary)+'</div>'
      +'<div class="col-by">수락스트릿 편집부 · '+c.date+'</div></div></div>';
  }).join('')+'<div class="st-note">디자인거리에 도움이 될 칼럼이 계속 올라옵니다.</div>';
}
function openColumn(i){
  var c=COLUMNS[i]; if(!c) return;
  var h='<article class="rd"><div class="col-hero" style="background:'+c.bg+'"><span>'+c.ic+'</span></div>'
    +'<div class="rd-k">칼럼 · 수락스트릿 편집부 · '+c.date+'</div><h1 class="rd-t">'+_e(c.title)+'</h1>'
    +'<div class="rd-hook">'+_e(c.summary)+'</div><div class="rd-body">'+_paras(c.body)+'</div>'
    +(c.shops?'<div class="st-sec">글에 나온 가게</div><div class="st-mini">'+c.shops.map(function(k){return _featCard(_shop(k),true);}).join('')+'</div>':'')
    +'<div class="rd-nav">'+(i>0?'<button data-col="'+(i-1)+'">‹ 이전 글</button>':'<span></span>')+'<button id="rd-list">목록</button>'
    +(i<COLUMNS.length-1?'<button data-col="'+(i+1)+'">다음 글 ›</button>':'<span></span>')+'</div></article>';
  stOpenSheet('칼럼',h);
  var body=g('st-sheet-body'); _bindStory(body); _bindShopCards(body);
  var lb=g('rd-list'); if(lb) lb.onclick=stCloseSheet;
}
function _trailListHtml(){
  if(typeof TRAILS==='undefined') return '';
  return TRAILS.map(function(t,i){
    return '<div class="tr-card" role="button" tabindex="0" data-trail="'+i+'" style="--c:'+(t.color||'#7B6EF0')+'">'
      +'<div class="tr-top"><div class="tr-nm">⛰️ '+_e(t.ko)+'</div><div class="tr-lv">'+_e(t.lk)+'</div></div>'
      +'<div class="tr-st"><span>📏 '+_e(t.dist)+'</span><span>⏱ '+_e(t.timeko)+'</span></div>'
      +'<div class="tr-pt">'+_e(t.ptko)+'</div></div>';
  }).join('')+'<div class="st-note">'+TRAIL_SAFETY[0]+' 하산 시각은 홈 화면에서 확인할 수 있어요.</div>';
}
function openTrail(i){
  var t=TRAILS[i]; if(!t) return;
  var L=function(o){return (o&&(o.KO||o))||'';};
  var h='<article class="rd" style="--c:'+(t.color||'#7B6EF0')+'"><div class="tr-hero"><div class="tr-hero-nm">⛰️ '+_e(t.ko)+'</div>'
    +'<div class="tr-hero-st"><span>'+_e(t.lk)+'</span><span>📏 '+_e(t.dist)+'</span><span>⏱ '+_e(t.timeko)+'</span></div></div>'
    +'<div class="st-sec">코스</div><div class="tr-route">'+_e(t.ptko)+'</div>';
  if(t.landmarks&&t.landmarks.length){
    h+='<div class="st-sec">구간 안내</div><div class="tr-tl">'+t.landmarks.map(function(l){
      return '<div class="tr-li"><div class="tr-dot">'+l.icon+'</div><div class="tr-lb"><div class="tr-ln">'+_e(L(l.name))+'</div>'
        +'<div class="tr-lm">출발 '+l.time+'분 · 해발 '+l.elev+'m</div><div class="tr-ld">'+_e(L(l.desc))+'</div>'
        +(l.warn?'<div class="tr-lw">'+_e(L(l.warn))+'</div>':'')+'</div></div>';
    }).join('')+'</div>';
  }
  h+='<div class="st-sec">안전 수칙</div><ul class="tr-safe">'+TRAIL_SAFETY.map(function(s){return '<li>'+_e(s)+'</li>';}).join('')+'</ul>'
    +'<div class="st-sec">출발 전 · 하산 후 들르기</div><div class="st-mini">'+SHOPS.map(function(s){return _featCard(s,true);}).join('')+'</div>'
    +'<div class="rd-nav">'+(i>0?'<button data-trail="'+(i-1)+'">‹ 이전 코스</button>':'<span></span>')+'<button id="rd-list">목록</button>'
    +(i<TRAILS.length-1?'<button data-trail="'+(i+1)+'">다음 코스 ›</button>':'<span></span>')+'</div></article>';
  stOpenSheet(t.ko,h);
  var body=g('st-sheet-body'); _bindStory(body); _bindShopCards(body);
  var lb=g('rd-list'); if(lb) lb.onclick=stCloseSheet;
}

/* ═══════════ 홈에 끼우는 블록 ═══════════ */
function streetHomeExtras(){
  var el=g('home-street'); if(!el) return;
  var r=_epRead(), nx=_epNextUnread(), n=_epCount();
  var h='<div class="stit">⭐ 수락스트릿 추천 매장</div><div class="st-mini">'+SHOPS.map(function(s){return _featCard(s,true);}).join('')+'</div>'
    +'<div class="hm-game" role="button" tabindex="0" onclick="sv(\'play\')"><div class="hm-game-ic">☀️🌙</div>'
    +'<div class="hm-game-b"><div class="hm-game-t">'+_e(SURAK_GAME.title)+'</div><div class="hm-game-s">'+_e(SURAK_GAME.sub)+' · '+(SURAK_GAME.url?'플레이하기':'곧 공개')+'</div></div><div class="st-row-go">›</div></div>'
    +'<div class="stit">📜 연재 · '+EP_SERIES+' <small class="hm-more" onclick="_storySeg=\'ep\';sv(\'story\')">전체 '+n+'화 ›</small></div>'
    +'<div class="hm-eps">';
  var order=[nx]; for(var i=0;i<n&&order.length<6;i++){ if(i!==nx) order.push(i); }
  order.forEach(function(i,k){
    var p=_ep(i); if(!p) return; var rd=r.indexOf(i)>=0;
    h+='<div class="hm-ep" role="button" tabindex="0" data-ep="'+i+'"><div class="hm-ep-im" style="background-image:url('+p.ill+')"></div>'
      +'<div class="hm-ep-b">'+(k===0?'<span class="hm-ep-new">'+(r.length?'이어 읽기':'첫 화')+'</span>':'')
      +'<div class="hm-ep-no">제'+p.no+'화'+(rd?' · 읽음':'')+'</div><div class="hm-ep-nm">'+_e(p.name)+'</div><div class="hm-ep-hk">'+_e(p.hook)+'</div></div></div>';
  });
  h+='</div>';
  el.innerHTML=h;
  _bindShopCards(el); _bindStory(el);
}

/* 초기화: 시트 DOM 미리 생성 */
if(document.readyState!=='loading') _stEnsureDom(); else document.addEventListener('DOMContentLoaded',_stEnsureDom);
