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
