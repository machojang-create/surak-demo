/* 수락스트릿 — QR 스캔 방문 적립 플로우 (명세 §3.4, §5)
 * ─────────────────────────────────────────────────────────────
 * 흐름: URL ?s={storeId} 감지 → 로그인 확인 → GPS → fbQrScan → 보상 팝업 → 매장 상세
 * 의존: STORES·openPopup·showGameAlert·showGameConfirm·showGpsToast(app.js)
 *       FB·fbLoginGoogle·fbQrScan·fbOnAuth(firebase-init.js)
 * 인쇄 QR 인코딩 URL 예: https://surakstreet.com/?s=1
 */
var _pendingScan = null; // 로그인 후 재개할 매장ID

function _findStore(id){ return (typeof STORES !== 'undefined') && STORES.find(function(x){ return x.id === id; }); }
function _storeName(s){ return (s && (s.ko || s.name)) || '매장'; }
function _toast(msg){ if (typeof showGpsToast === 'function') showGpsToast(msg); }

// 진입: URL ?s= 감지 (스캔으로 들어온 경우)
function checkQrScanEntry(){
  var sid = new URLSearchParams(location.search).get('s');
  if (!sid) return;
  history.replaceState(null, '', location.pathname); // URL 정리 → 새로고침/공유 시 중복 스캔 방지
  startQrScan(parseInt(sid, 10));
}

function startQrScan(storeId){
  var store = _findStore(storeId);
  if (!store) { showGameAlert('매장 정보를 찾을 수 없어요.'); return; }

  // Firebase 미설정(개발 중) — 적립 서버 미연결
  if (typeof FB === 'undefined' || !FB.ready) {
    showGameAlert('아직 적립 서버가 연결되지 않았어요.\n(개발 중 — Firebase 설정 후 동작합니다)');
    if (typeof openPopup === 'function') openPopup(store);
    return;
  }
  // 로그인 확인 (GPS 단독 보상 금지 — 로그인+QR+GPS 모두 필요)
  if (!FB.user) {
    _pendingScan = storeId;
    showGameConfirm('방문 적립', _storeName(store) + ' 방문 적립을 받으려면\n로그인이 필요해요. 로그인할까요?', function(){
      fbLoginGoogle().catch(function(){ showGameAlert('로그인에 실패했어요. 다시 시도해주세요.'); });
    });
    return;
  }
  doQrScan(storeId, store);
}

function doQrScan(storeId, store){
  if (!navigator.geolocation) { showGameAlert('이 기기는 위치를 지원하지 않아요.'); return; }
  _toast('📍 ' + _storeName(store) + ' 위치 확인 중...');
  navigator.geolocation.getCurrentPosition(function(pos){
    fbQrScan(storeId, pos.coords.latitude, pos.coords.longitude)
      .then(function(res){ showScanReward(res, store); })
      .catch(function(err){
        showGameAlert((err && err.message) ? err.message : '적립에 실패했어요.');
        if (typeof openPopup === 'function') openPopup(store);
      });
  }, function(){
    showGameAlert('위치 권한이 필요해요.\nGPS를 켜고 다시 시도해주세요.');
  }, { enableHighAccuracy:true, timeout:10000, maximumAge:0 });
}

// 보상 축하 팝업 (앱 모달 스타일·CSS변수 재사용)
function showScanReward(res, store){
  if (typeof fbSyncUser === 'function') fbSyncUser();
  if (res && res.alreadyToday) {
    showGameAlert(res.message || '오늘은 이미 이 매장 방문 적립을 받았어요.');
    if (typeof openPopup === 'function') openPopup(store);
    return;
  }
  var r = (res && res.reward) || {};
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9300;display:flex;align-items:center;justify-content:center;';
  function cell(val, label){
    return '<div style="flex:1;background:var(--acbg);border-radius:12px;padding:12px 4px;">'
         + '<div style="font-size:20px;font-weight:800;color:var(--ac);">' + val + '</div>'
         + '<div style="font-size:11px;color:var(--t3);">' + label + '</div></div>';
  }
  d.innerHTML = '<div style="background:var(--sf);border-radius:20px;width:300px;padding:28px 22px;text-align:center;box-shadow:var(--s3);">'
    + '<img src="surak/excited.png" style="width:88px;height:88px;border-radius:50%;margin-bottom:2px;" alt="수락이"/>'
    + '<div style="font-size:17px;font-weight:800;color:var(--t1);margin-bottom:4px;">방문 적립 완료!</div>'
    + '<div style="font-size:13px;color:var(--t2);margin-bottom:18px;">' + _storeName(store) + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:' + (r.levelUp ? '14px' : '18px') + ';">'
    +   cell('+' + (r.xp || 0), 'XP') + cell(r.stamp || 0, '스탬프') + cell('Lv.' + (r.level || 1), '레벨')
    + '</div>'
    + (r.levelUp ? '<div style="font-size:13px;font-weight:700;color:var(--am);margin-bottom:14px;">⭐ 레벨 ' + r.level + ' 달성!</div>' : '')
    + '<button style="width:100%;padding:13px;border-radius:10px;background:var(--ac);border:none;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">확인</button>'
    + '</div>';
  document.body.appendChild(d);
  d.querySelector('button').addEventListener('click', function(){
    d.parentNode.removeChild(d);
    if (typeof openPopup === 'function') openPopup(store);
  });
}

// 로그인 후 대기중이던 스캔 재개
function _resumePendingScan(u){
  if (u && _pendingScan != null) {
    var sid = _pendingScan; _pendingScan = null;
    var store = _findStore(sid);
    if (store) doQrScan(sid, store);
  }
}

// 등록·진입
if (typeof fbOnAuth === 'function') fbOnAuth(_resumePendingScan);
if (document.readyState !== 'loading') checkQrScanEntry();
else document.addEventListener('DOMContentLoaded', checkQrScanEntry);
