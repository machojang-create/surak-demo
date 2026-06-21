/* 수락스트릿 — Firebase 초기화 + 인증 + qrScan 호출
 * ─────────────────────────────────────────────────────────────
 * config 미설정 시 조용히 비활성(앱 나머지는 정상 동작), config 붙이면 자동 활성화.
 * 전역 함수: fbInit, fbLoginGoogle, fbLogout, fbQrScan / 전역 객체: FB
 */

/* ⬇️⬇️ Macho: surakstreet Firebase 프로젝트 생성 후, 콘솔 > 프로젝트설정 > 웹앱의 config를 여기에 붙여넣기 ⬇️⬇️ */
var SURAK_FIREBASE_CONFIG = {
  apiKey:            "PASTE_HERE",
  authDomain:        "PASTE_HERE.firebaseapp.com",
  projectId:         "PASTE_HERE",
  storageBucket:     "PASTE_HERE.appspot.com",
  messagingSenderId: "PASTE_HERE",
  appId:             "PASTE_HERE"
};
/* ⬆️⬆️ 여기 6줄만 교체하면 연결됩니다 ⬆️⬆️ */

var FB = { ready:false, app:null, auth:null, db:null, fns:null, user:null };
var _fbAuthCbs = [];                 // 로그인 상태변화 리스너 (qr.js·로그인UI 등이 등록)
function fbOnAuth(cb){ _fbAuthCbs.push(cb); }

function fbConfigured(){
  return !!(window.firebase && SURAK_FIREBASE_CONFIG.apiKey && SURAK_FIREBASE_CONFIG.apiKey !== 'PASTE_HERE');
}

function fbInit(){
  if (FB.ready) return FB;
  if (!fbConfigured()){
    console.warn('[FB] Firebase config 미설정 — 로그인·리워드 비활성 (firebase-init.js의 config 6줄 교체 필요). 앱 나머지는 정상 동작합니다.');
    return FB;
  }
  FB.app  = firebase.initializeApp(SURAK_FIREBASE_CONFIG);
  FB.auth = firebase.auth();
  FB.db   = firebase.firestore();
  try { FB.fns = firebase.app().functions('asia-northeast3'); } catch(e){ FB.fns = firebase.functions(); }
  FB.ready = true;
  FB.auth.onAuthStateChanged(function(u){
    FB.user = u;
    if (u) ensureUserDoc(u);
    _fbAuthCbs.forEach(function(cb){ try{ cb(u); }catch(e){ console.warn('[FB] auth cb 오류', e); } });
  });
  console.log('[FB] 초기화 완료:', SURAK_FIREBASE_CONFIG.projectId);
  return FB;
}

// 첫 로그인 시 회원 문서 생성 (보안규칙: points/xp=0, level=1로만 생성 허용)
function ensureUserDoc(u){
  var ref = FB.db.collection('users').doc(u.uid);
  ref.get().then(function(s){
    if (!s.exists){
      ref.set({ nickname: u.displayName || '수락이', points:0, xp:0, level:1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
  }).catch(function(e){ console.warn('[FB] user 문서 확인 실패', e); });
}

// 구글 로그인 (MVP 우선 — 카카오/네이버는 추후 dasibom 콜백 패턴 재사용)
function fbLoginGoogle(){
  if (!fbInit().ready) return Promise.reject(new Error('Firebase 미설정'));
  return FB.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}
function fbLogout(){ return FB.ready ? FB.auth.signOut() : Promise.resolve(); }

// qrScan 호출 — QR 스캔 화면에서 { storeId, lat, lng } 전달, 보상 결과 반환
function fbQrScan(storeId, lat, lng){
  if (!fbInit().ready) return Promise.reject(new Error('Firebase 미설정 — 로그인/리워드를 쓰려면 config가 필요합니다.'));
  return FB.fns.httpsCallable('qrScan')({ storeId:storeId, lat:lat, lng:lng })
           .then(function(r){ return r.data; });
}

// 페이지 로드시 자동 초기화 (config 없으면 조용히 패스)
if (document.readyState !== 'loading') fbInit();
else document.addEventListener('DOMContentLoaded', fbInit);
