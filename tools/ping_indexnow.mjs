// 네이버·Bing 에 「새 페이지 생겼다」 알림 (IndexNow, 0원). 구글은 IndexNow 를 안 받는다(서치콘솔+사이트맵으로 옴).
// 사용: node tools/ping_indexnow.mjs            → sitemap.xml 의 모든 주소
//       node tools/ping_indexnow.mjs /people/   → 그 주소만
// ★배포 뒤에 부른다 — 키 파일(<키>.txt)이 라이브에 먼저 있어야 통과한다(없으면 403).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site-data.json'), 'utf8')).SITE;
const host = new URL(S.url).host, key = S.indexnowKey;
let urls = process.argv.slice(2).map(p => S.url.replace(/\/$/, '') + p);
if (!urls.length) urls = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const body = JSON.stringify({ host, key, keyLocation: `${S.url.replace(/\/$/, '')}/${key}.txt`, urlList: urls });
for (const ep of ['https://searchadvisor.naver.com/indexnow', 'https://api.indexnow.org/indexnow']) {
  try { const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
    console.log(`${ep.includes('naver') ? '네이버' : 'Bing 등'} → ${r.status} ${r.status < 300 ? '받음' : (await r.text()).slice(0, 120)} (주소 ${urls.length}개)`);
  } catch (e) { console.log(ep, '실패', e.message); }
}
