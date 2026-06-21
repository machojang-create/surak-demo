/**
 * 수락스트릿 (Surak Street) — Firebase Cloud Functions
 * ───────────────────────────────────────────────────────────────────────
 * qrScan: QR 스캔 검증 + 보상 지급 — 시스템의 심장 (명세 §5, §10)
 *   "QR 기반 방문 데이터를 중심으로 모든 보상이 연결되는 구조"
 *
 * 보안 핵심: points·xp·stamp 등 모든 보상은 클라이언트가 못 쓰게 잠겨 있고
 *   (firestore.rules 의 `allow write: if false`), 오직 이 함수(Admin SDK)만 기록한다.
 *   → QR + 로그인 + GPS 검증을 통과해야만 보상 지급 → 포인트 조작 차단(명세 §6.2).
 */
const functions = require('firebase-functions/v1'); // dasibom과 동일한 v1 콜러블 API
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const REGION = 'asia-northeast3'; // 서울 리전 (낮은 지연)

// ── 정책 기본값 — 운영자가 config/xpPolicy 문서로 덮어쓸 수 있음 (명세 §4.6) ──
const DEFAULTS = {
  scanXp:        10,    // QR 스캔 1회 적립 XP(=포인트)
  gpsRadiusM:    100,   // GPS 인정 반경 m (명세 §5.2)
  rescanMinutes: 30,    // 재스캔 제한 분 (명세 §5.2)
  levelTable: [0, 50, 150, 350, 700, 1200, 2000] // 누적 XP → 레벨 경계
};

async function loadPolicy() {
  try {
    const snap = await db.doc('config/xpPolicy').get();
    return Object.assign({}, DEFAULTS, snap.exists ? snap.data() : {});
  } catch (e) { return DEFAULTS; }
}

// 두 좌표 사이 거리(m) — Haversine
function distM(aLat, aLng, bLat, bLng) {
  const R = 6371000, toR = d => d * Math.PI / 180;
  const dLat = toR(bLat - aLat), dLng = toR(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// 누적 XP → 레벨 번호
function levelFromXp(xp, table) {
  let lv = 1;
  for (let i = 0; i < table.length; i++) if (xp >= table[i]) lv = i + 1;
  return lv;
}

// KST(UTC+9) 기준 'YYYY-MM-DD' (서버는 UTC로 동작)
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// QR 스캔 감사 로그 — append-only (명세 §5.3, §7.3)
function logScan(uid, storeId, ts, day, gpsValid, dist, lat, lng, reward, note) {
  return db.collection('qrLogs').add({
    userId: uid, storeId, ts, day, gpsValid,
    dist: isFinite(dist) ? dist : null, lat, lng,
    rewarded: !!reward, reward: reward || null,
    ...(note ? { note } : {})
  });
}

/**
 * qrScan — 클라이언트: QR(매장ID) 스캔 후 브라우저 GPS 좌표와 함께 호출.
 *   입력  { storeId, lat, lng }
 *   반환  { ok, reward?{xp,stamp,totalXp,points,level,levelUp}, store{name}, message }
 *   에러  unauthenticated / invalid-argument / not-found
 *         / failed-precondition(GPS 100m 초과) / resource-exhausted(30분 재스캔)
 */
exports.qrScan = functions.region(REGION).https.onCall(async (data, context) => {
  // 1) 로그인 확인 (GPS 단독 보상 금지 — QR+로그인+GPS 모두 필요, 명세 §6.2)
  const uid = context.auth && context.auth.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');

  const storeId = data && data.storeId;
  const lat = data && data.lat, lng = data && data.lng;
  if (!storeId || typeof lat !== 'number' || typeof lng !== 'number')
    throw new functions.https.HttpsError('invalid-argument', '매장 정보와 현재 위치가 필요합니다.');

  const pol = await loadPolicy();

  // 2) 매장 확인
  const storeRef = db.doc(`stores/${storeId}`);
  const storeSnap = await storeRef.get();
  if (!storeSnap.exists || storeSnap.data().visible === false)
    throw new functions.https.HttpsError('not-found', '존재하지 않는 매장입니다.');
  const store = storeSnap.data();

  const now = admin.firestore.Timestamp.now();
  const day = todayKST();

  // 3) GPS 100m 검증 (명세 §5.2)
  const dist = (typeof store.lat === 'number' && typeof store.lng === 'number')
    ? Math.round(distM(lat, lng, store.lat, store.lng)) : Infinity;
  if (dist > pol.gpsRadiusM) {
    await logScan(uid, storeId, now, day, false, dist, lat, lng, null, 'too_far');
    throw new functions.https.HttpsError('failed-precondition',
      `매장에서 약 ${isFinite(dist) ? dist : '?'}m 떨어져 있어요. ${pol.gpsRadiusM}m 이내에서 스캔해주세요.`);
  }

  // 4) 재스캔(30분)·1일1회 제한 — 스탬프 문서 상태로 판정 (명세 §5.2)
  const stampRef = db.doc(`stamps/${uid}_${storeId}`);
  const stSnap = await stampRef.get();
  const st = stSnap.exists ? stSnap.data() : {};
  const lastMs = st.lastAt ? st.lastAt.toMillis() : 0;
  if (now.toMillis() - lastMs < pol.rescanMinutes * 60 * 1000)
    throw new functions.https.HttpsError('resource-exhausted',
      `${pol.rescanMinutes}분 이내 재스캔이에요. 잠시 후 다시 시도해주세요.`);
  if (st.lastDay === day) {
    await logScan(uid, storeId, now, day, true, dist, lat, lng, null, 'daily_done');
    return { ok: true, alreadyToday: true, reward: null,
      store: { name: store.name || '' }, message: '오늘은 이미 이 매장 방문 적립을 받았어요.' };
  }

  // 5) 보상 지급 — 트랜잭션 (user XP/points/level + 스탬프 + 매장 방문XP + xpLog)
  const reward = await db.runTransaction(async tx => {
    const userRef = db.doc(`users/${uid}`);
    const u = await tx.get(userRef);
    const c = u.exists ? u.data() : {};
    const newXp  = (c.xp || 0) + pol.scanXp;
    const newPts = (c.points || 0) + pol.scanXp;
    const newLv  = levelFromXp(newXp, pol.levelTable);
    const levelUp = newLv > (c.level || 1);
    const count = (st.count || 0) + 1;

    tx.set(userRef, { xp: newXp, points: newPts, level: newLv, updatedAt: now }, { merge: true });
    tx.set(stampRef, { userId: uid, storeId, count, lastAt: now, lastDay: day }, { merge: true });
    tx.set(storeRef, {
      visitXp:    admin.firestore.FieldValue.increment(pol.scanXp),   // 매장 레벨용 누적 (명세 §3.8)
      visitCount: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
    tx.set(db.collection('xpLogs').doc(),
      { userId: uid, actionType: 'qr_scan', xpAmount: pol.scanXp, storeId, ts: now });

    return { xp: pol.scanXp, stamp: count, totalXp: newXp, points: newPts, level: newLv, levelUp };
  });

  await logScan(uid, storeId, now, day, true, dist, lat, lng, reward);

  return {
    ok: true, reward, store: { name: store.name || '' },
    message: `${store.name || '매장'} 방문 적립! +${reward.xp}XP · 스탬프 ${reward.stamp}개`
           + (reward.levelUp ? ` · 레벨 ${reward.level} 달성! 🎉` : '')
  };
});
