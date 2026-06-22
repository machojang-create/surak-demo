/* 수락스트릿 — 관리자 로직 (매장 CRUD + 시드 + QR)  명세 §4.2·§4.3
 * 의존: FB·fbInit·fbLoginGoogle·fbLogout·fbOnAuth·fbConfigured(firebase-init.js)
 *       STORES(data.js, 시드용) · QRCode(qrcode.min.js)
 * 운영자(마스터 이메일)만 접근. 서버측도 firestore.rules가 master만 쓰기 허용.
 */
var MASTER_EMAILS = ['machojang@gmail.com','machojang@naver.com'];
function isMaster(u){ return !!(u && MASTER_EMAILS.indexOf((u.email||'').toLowerCase()) >= 0); }

var _stores = [];      // 현재 로드된 매장
var _qrCurrent = null; // QR 모달 현재 매장ID

function gel(id){ return document.getElementById(id); }
function gate(msg){ var m=gel('gate-msg'); if(m) m.textContent = msg||''; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

// ── 인증 게이트 ──
if (typeof fbInit === 'function') fbInit();
if (typeof fbOnAuth === 'function') fbOnAuth(onAdmAuth);

function onAdmAuth(u){
  if (isMaster(u)) {
    gel('login-gate').style.display = 'none';
    gel('admin-panel').style.display = 'block';
    gel('adm-who').textContent = u.email;
    loadStores();
    loadCoupons();
    loadPolicy();
    loadNotices();
    loadFeatured();
    loadStats();
  } else {
    gel('admin-panel').style.display = 'none';
    gel('login-gate').style.display = 'block';
    if (u) gate('운영자 권한이 없는 계정입니다: ' + u.email);
  }
}

function admLogin(){
  if (typeof fbConfigured === 'function' && !fbConfigured()){
    gate('Firebase가 아직 연결되지 않았어요. (firebase-init.js에 config 필요)');
    return;
  }
  fbLoginGoogle().catch(function(){ gate('로그인에 실패했어요.'); });
}
function admLogout(){ if (typeof fbLogout === 'function') fbLogout(); }

// ── 매장 목록 ──
function loadStores(){
  if (!FB.ready){ gel('store-list').innerHTML = '<div class="hint">Firebase 미연결</div>'; return; }
  gel('store-list').innerHTML = '<div class="hint">불러오는 중...</div>';
  FB.db.collection('stores').orderBy('id').get().then(function(snap){
    _stores = snap.docs.map(function(d){ return d.data(); });
    renderStores();
  }).catch(function(e){ gel('store-list').innerHTML = '<div class="hint">불러오기 실패: ' + esc(e.message) + '</div>'; });
}

function renderStores(){
  gel('store-count').textContent = '(' + _stores.length + '개)';
  if (!_stores.length){ gel('store-list').innerHTML = '<div class="hint">등록된 매장이 없습니다. "시드" 또는 "매장 추가"를 눌러주세요.</div>'; return; }
  gel('store-list').innerHTML = _stores.map(function(s){
    return '<div class="st-row">'
      + '<div class="id">#' + s.id + '</div>'
      + '<div class="nm">' + esc(s.name || '(이름없음)') + '<small>' + esc(s.cat || '') + ' · ' + esc(s.addr || '') + '</small></div>'
      + '<div class="tag' + (s.visible === false ? ' off' : '') + '">' + (s.visible === false ? '비공개' : '공개') + '</div>'
      + '<div class="acts">'
      +   '<button onclick="genQR(' + s.id + ')">QR</button>'
      +   '<button onclick="editStore(' + s.id + ')">수정</button>'
      +   '<button onclick="delStore(' + s.id + ')">삭제</button>'
      + '</div></div>';
  }).join('');
}

// ── 매장 추가/수정 ──
function openStoreForm(){
  gel('sf-title').textContent = '매장 추가';
  gel('sf-orig-id').value = '';
  ['sf-id','sf-name','sf-lat','sf-lng','sf-phone','sf-hours','sf-addr','sf-desc'].forEach(function(id){ gel(id).value = ''; });
  gel('sf-cat').value = 'food'; gel('sf-visible').checked = true; gel('sf-onuri').checked = false;
  gel('store-modal').classList.add('on');
}
function editStore(id){
  var s = _stores.find(function(x){ return x.id === id; }); if (!s) return;
  gel('sf-title').textContent = '매장 수정 (#' + id + ')';
  gel('sf-orig-id').value = id;
  gel('sf-id').value = s.id; gel('sf-name').value = s.name || ''; gel('sf-cat').value = s.cat || 'food';
  gel('sf-lat').value = s.lat != null ? s.lat : ''; gel('sf-lng').value = s.lng != null ? s.lng : '';
  gel('sf-phone').value = s.phone || ''; gel('sf-hours').value = s.hours || ''; gel('sf-addr').value = s.addr || '';
  gel('sf-desc').value = s.desc || ''; gel('sf-visible').checked = s.visible !== false; gel('sf-onuri').checked = !!s.onuri;
  gel('store-modal').classList.add('on');
}
function closeStoreForm(){ gel('store-modal').classList.remove('on'); }

function saveStore(){
  var id = parseInt(gel('sf-id').value, 10);
  if (!id){ alert('매장 ID(숫자)를 입력해주세요.'); return; }
  var lat = parseFloat(gel('sf-lat').value), lng = parseFloat(gel('sf-lng').value);
  if (isNaN(lat) || isNaN(lng)){ alert('위도/경도를 입력해주세요 (QR 적립에 GPS 검증이 필요합니다).'); return; }
  var data = {
    id: id, name: gel('sf-name').value.trim(), cat: gel('sf-cat').value,
    lat: lat, lng: lng, phone: gel('sf-phone').value.trim(), hours: gel('sf-hours').value.trim(),
    addr: gel('sf-addr').value.trim(), desc: gel('sf-desc').value.trim(),
    visible: gel('sf-visible').checked, onuri: gel('sf-onuri').checked
  };
  var btn = gel('sf-save'); btn.disabled = true; btn.textContent = '저장 중...';
  FB.db.collection('stores').doc(String(id)).set(data, { merge: true }).then(function(){
    closeStoreForm(); loadStores();
  }).catch(function(e){ alert('저장 실패: ' + e.message); }).then(function(){ btn.disabled = false; btn.textContent = '저장'; });
}

function delStore(id){
  if (!confirm('매장 #' + id + '을(를) 삭제할까요?')) return;
  FB.db.collection('stores').doc(String(id)).delete().then(loadStores).catch(function(e){ alert('삭제 실패: ' + e.message); });
}

// ── 시드 (data.js STORES → Firestore, ko→name·visible:true) ──
function seedStores(){
  if (typeof STORES === 'undefined'){ alert('STORES 데이터를 찾을 수 없습니다.'); return; }
  if (!FB.ready){ alert('Firebase 미연결 — config가 필요합니다.'); return; }
  if (!confirm('기존 ' + STORES.length + '개 매장을 Firestore에 등록합니다. 같은 ID는 덮어씁니다. 진행할까요?')) return;
  var btn = gel('seed-btn'); btn.disabled = true; btn.textContent = '시드 중...';
  var batch = FB.db.batch();
  STORES.forEach(function(s){
    var ref = FB.db.collection('stores').doc(String(s.id));
    batch.set(ref, {
      id: s.id, name: s.ko || s.name || ('매장' + s.id),
      nameI18n: { ko: s.ko || '', en: s.en || '', jp: s.jp || '', cn: s.cn || '' },
      cat: s.cat || 'etc', addr: s.addr || '', hours: s.hours || '',
      lat: s.lat, lng: s.lng, onuri: !!s.onuri,
      desc: s.dko || '', descI18n: { ko: s.dko || '', en: s.den || '', jp: s.djp || '', cn: s.dcn || '' },
      menus: s.menus || [], visible: true, visitXp: 0, visitCount: 0
    }, { merge: true });
  });
  batch.commit().then(function(){
    alert(STORES.length + '개 매장을 등록했습니다.'); loadStores();
  }).catch(function(e){ alert('시드 실패: ' + e.message); })
    .then(function(){ btn.disabled = false; btn.textContent = '기존 51개 매장 가져오기(시드)'; });
}

// ── QR 생성/다운로드 (URL: surakstreet.com/?s={id}) ──
function genQR(storeId){
  var s = _stores.find(function(x){ return x.id === storeId; });
  _qrCurrent = storeId;
  var url = 'https://surakstreet.com/?s=' + storeId;
  gel('qr-title').textContent = 'QR — ' + ((s && s.name) || ('#' + storeId));
  gel('qr-url').textContent = url;
  var box = gel('qr-box'); box.innerHTML = '';
  new QRCode(box, { text: url, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  gel('qr-modal').classList.add('on');
}
function closeQR(){ gel('qr-modal').classList.remove('on'); }
function downloadQR(){
  var box = gel('qr-box');
  var img = box.querySelector('img'), canvas = box.querySelector('canvas');
  var dataUrl = img ? img.src : (canvas ? canvas.toDataURL('image/png') : null);
  if (!dataUrl){ alert('QR 생성 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  var a = document.createElement('a'); a.href = dataUrl; a.download = 'surak-qr-' + _qrCurrent + '.png'; a.click();
}

// ── 쿠폰 관리 (§4.4) ──
var _coupons = [];
function loadCoupons(){
  if(!FB.ready){ gel('coupon-list').innerHTML='<div class="hint">Firebase 미연결</div>'; return; }
  gel('coupon-list').innerHTML='<div class="hint">불러오는 중...</div>';
  FB.db.collection('coupons').get().then(function(snap){
    _coupons=snap.docs.map(function(d){ var x=d.data(); x._id=d.id; return x; });
    renderCoupons();
  }).catch(function(e){ gel('coupon-list').innerHTML='<div class="hint">불러오기 실패: '+esc(e.message)+'</div>'; });
}
function renderCoupons(){
  gel('coupon-count').textContent='('+_coupons.length+'개)';
  if(!_coupons.length){ gel('coupon-list').innerHTML='<div class="hint">등록된 쿠폰이 없습니다. "쿠폰 추가"를 눌러주세요.</div>'; return; }
  gel('coupon-list').innerHTML=_coupons.map(function(c){
    return '<div class="st-row"><div style="font-size:22px;width:34px;text-align:center;flex-shrink:0;">'+esc(c.icon||'🎟️')+'</div>'
      +'<div class="nm">'+esc(c.title||'(제목없음)')+'<small>'+esc(c.storeName||'전체매장')+(c.desc?(' · '+esc(c.desc)):'')+(c.until?(' · ~'+esc(c.until)):'')+'</small></div>'
      +'<div class="tag'+(c.visible===false?' off':'')+'">'+(c.visible===false?'비공개':'공개')+'</div>'
      +'<div class="acts"><button onclick="editCoupon(\''+c._id+'\')">수정</button><button onclick="delCoupon(\''+c._id+'\')">삭제</button></div></div>';
  }).join('');
}
function fillCouponStores(){
  var sel=gel('cf-store'); if(!sel) return;
  sel.innerHTML='<option value="">전체 매장</option>'+(_stores||[]).map(function(s){ return '<option value="'+s.id+'">'+esc(s.name||('#'+s.id))+'</option>'; }).join('');
}
function openCouponForm(){
  gel('cf-title').textContent='쿠폰 추가'; gel('cf-id').value='';
  ['cf-title-in','cf-icon','cf-desc','cf-until','cf-pin'].forEach(function(id){ gel(id).value=''; });
  gel('cf-limit').value='0'; gel('cf-visible').checked=true;
  fillCouponStores(); gel('coupon-modal').classList.add('on');
}
function editCoupon(id){
  var c=_coupons.find(function(x){ return x._id===id; }); if(!c) return;
  gel('cf-title').textContent='쿠폰 수정'; gel('cf-id').value=id;
  gel('cf-title-in').value=c.title||''; gel('cf-icon').value=c.icon||''; gel('cf-desc').value=c.desc||'';
  gel('cf-until').value=c.until||''; gel('cf-pin').value=c.pin||''; gel('cf-limit').value=c.useLimit||0; gel('cf-visible').checked=c.visible!==false;
  fillCouponStores(); gel('cf-store').value=c.storeId!=null?String(c.storeId):'';
  gel('coupon-modal').classList.add('on');
}
function closeCouponForm(){ gel('coupon-modal').classList.remove('on'); }
function saveCoupon(){
  var title=gel('cf-title-in').value.trim();
  if(!title){ alert('제목을 입력해주세요.'); return; }
  var sid=gel('cf-store').value;
  var store=sid?(_stores||[]).find(function(s){ return String(s.id)===sid; }):null;
  var data={ title:title, icon:gel('cf-icon').value.trim()||'🎟️',
    storeId:sid?parseInt(sid,10):null, storeName:store?(store.name||''):'',
    desc:gel('cf-desc').value.trim(), until:gel('cf-until').value, pin:gel('cf-pin').value.trim(),
    useLimit:parseInt(gel('cf-limit').value,10)||0, visible:gel('cf-visible').checked };
  var btn=gel('cf-save'); btn.disabled=true; btn.textContent='저장 중...';
  var ref=gel('cf-id').value?FB.db.collection('coupons').doc(gel('cf-id').value):FB.db.collection('coupons').doc();
  ref.set(data,{merge:true}).then(function(){ closeCouponForm(); loadCoupons(); }).catch(function(e){ alert('저장 실패: '+e.message); }).then(function(){ btn.disabled=false; btn.textContent='저장'; });
}
function delCoupon(id){
  if(!confirm('이 쿠폰을 삭제할까요?')) return;
  FB.db.collection('coupons').doc(id).delete().then(loadCoupons).catch(function(e){ alert('삭제 실패: '+e.message); });
}

// ── XP/레벨 정책 (§4.6) ──
function loadPolicy(){
  if(!FB.ready) return;
  FB.db.collection('config').doc('xpPolicy').get().then(function(s){
    var d=s.exists?s.data():{};
    var setv=function(id,v){ var e=gel(id); if(e) e.value=(v==null?'':v); };
    setv('pol-scanXp',d.scanXp); setv('pol-visitXp',d.visitXp); setv('pol-couponXp',d.couponXp); setv('pol-courseXp',d.courseXp);
    setv('pol-gpsRadiusM',d.gpsRadiusM); setv('pol-rescanMinutes',d.rescanMinutes);
    setv('pol-levelTable',(d.levelTable||[]).join(',')); setv('pol-storeLevelTable',(d.storeLevelTable||[]).join(','));
  }).catch(function(){});
}
function savePolicy(){
  if(!FB.ready){ alert('Firebase 미연결'); return; }
  var num=function(id){ return parseInt(gel(id).value,10)||0; };
  var arr=function(id){ return gel(id).value.split(',').map(function(x){ return parseInt(x.trim(),10)||0; }); };
  var data={ scanXp:num('pol-scanXp'), visitXp:num('pol-visitXp'), couponXp:num('pol-couponXp'), courseXp:num('pol-courseXp'),
    gpsRadiusM:num('pol-gpsRadiusM'), rescanMinutes:num('pol-rescanMinutes'),
    levelTable:arr('pol-levelTable'), storeLevelTable:arr('pol-storeLevelTable') };
  var btn=gel('pol-save'); btn.disabled=true; btn.textContent='저장 중...';
  FB.db.collection('config').doc('xpPolicy').set(data,{merge:true}).then(function(){ gel('pol-msg').textContent='✅ 저장됨 — qrScan이 즉시 반영합니다.'; })
    .catch(function(e){ gel('pol-msg').textContent='실패: '+e.message; }).then(function(){ btn.disabled=false; btn.textContent='정책 저장'; });
}

// ── 공지 관리 (§4.8) ──
function loadNotices(){
  if(!FB.ready) return;
  FB.db.collection('notices').get().then(function(snap){
    var arr=snap.docs.map(function(d){ var x=d.data(); x._id=d.id; return x; });
    arr.sort(function(a,b){ return ((b.ts&&b.ts.seconds)||0)-((a.ts&&a.ts.seconds)||0); });
    gel('notice-count').textContent='('+arr.length+')';
    gel('notice-list').innerHTML=arr.length?arr.map(function(n){
      return '<div class="st-row"><div class="nm">'+esc(n.title||'')+'<small>'+esc(n.body||'')+'</small></div>'
        +'<div class="tag'+(n.visible===false?' off':'')+'">'+(n.visible===false?'비공개':'공개')+'</div>'
        +'<div class="acts"><button onclick="toggleNotice(\''+n._id+'\','+(n.visible===false)+')">'+(n.visible===false?'공개':'숨김')+'</button><button onclick="delNotice(\''+n._id+'\')">삭제</button></div></div>';
    }).join(''):'<div class="hint">공지가 없습니다.</div>';
  }).catch(function(){});
}
function addNotice(){
  var t=gel('nt-title').value.trim(); if(!t){ alert('제목을 입력하세요.'); return; }
  FB.db.collection('notices').add({ title:t, body:gel('nt-body').value.trim(), visible:true, ts:firebase.firestore.FieldValue.serverTimestamp() })
    .then(function(){ gel('nt-title').value=''; gel('nt-body').value=''; loadNotices(); }).catch(function(e){ alert('실패: '+e.message); });
}
function toggleNotice(id,makeVisible){ FB.db.collection('notices').doc(id).set({ visible:makeVisible },{merge:true}).then(loadNotices).catch(function(e){ alert(e.message); }); }
function delNotice(id){ if(!confirm('공지를 삭제할까요?')) return; FB.db.collection('notices').doc(id).delete().then(loadNotices).catch(function(e){ alert(e.message); }); }

// ── 추천 콘텐츠 (§4.7) ──
function loadFeatured(){
  if(!FB.ready) return;
  FB.db.collection('config').doc('home').get().then(function(s){ if(s.exists&&gel('rec-stores')) gel('rec-stores').value=(s.data().featuredStoreIds||[]).join(','); }).catch(function(){});
}
function saveFeatured(){
  if(!FB.ready){ alert('Firebase 미연결'); return; }
  var ids=gel('rec-stores').value.split(',').map(function(x){ return parseInt(x.trim(),10); }).filter(function(x){ return !isNaN(x); });
  FB.db.collection('config').doc('home').set({ featuredStoreIds:ids },{merge:true}).then(function(){ gel('rec-msg').textContent='✅ 저장됨'; }).catch(function(e){ gel('rec-msg').textContent='실패: '+e.message; });
}

// ── 통계 · 사용자 (§4.10) ──
function statCard(label,val){
  return '<div style="flex:1;min-width:88px;background:rgba(0,0,0,.03);border:1px solid var(--bd);border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:21px;font-weight:800;color:var(--ac);">'+val+'</div><div style="font-size:11px;color:var(--t3);margin-top:2px;">'+label+'</div></div>';
}
function loadStats(){
  if(!FB.ready) return;
  FB.db.collection('users').get().then(function(snap){
    var users=snap.docs.map(function(d){ var x=d.data(); x._id=d.id; return x; });
    var totalXp=0,totalPts=0; users.forEach(function(u){ totalXp+=(u.xp||0); totalPts+=(u.points||0); });
    gel('stat-summary').innerHTML=statCard('👥 사용자',users.length)+statCard('📷 QR스캔','<span id="stat-scans">…</span>')+statCard('⭐ 누적 XP',totalXp)+statCard('🏆 누적 P',totalPts);
    users.sort(function(a,b){ return (b.xp||0)-(a.xp||0); });
    gel('user-list').innerHTML=users.length?users.slice(0,50).map(function(u){
      return '<div class="st-row"><div class="nm">'+esc(u.displayName||u.email||u._id)+'<small>'+esc(u.email||'')+'</small></div><div class="tag">Lv.'+(u.level||1)+'</div><div style="font-size:12px;color:var(--t3);white-space:nowrap;margin-left:8px;">'+(u.xp||0)+'XP · '+(u.points||0)+'P</div></div>';
    }).join(''):'<div class="hint">가입한 사용자가 없습니다.</div>';
  }).catch(function(e){ gel('user-list').innerHTML='<div class="hint">사용자 불러오기 실패: '+esc(e.message)+'</div>'; });
  FB.db.collection('qrLogs').get().then(function(snap){ var el=gel('stat-scans'); if(el) el.textContent=snap.size; }).catch(function(){ var el=gel('stat-scans'); if(el) el.textContent='-'; });
}
