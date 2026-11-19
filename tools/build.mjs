// 수락스트릿 정적 사이트 생성기 (2026-11-19)
// 사용: node tools/build.mjs            (오늘 날짜 기준으로 공개된 연재만 생성)
//       BUILD_DATE=2026-11-23 node tools/build.mjs   (그 날짜 기준 미리보기)
// 입력: content/site-data.json, content/people/*.md
// 출력: index.html, shop/<key>/, game/, people/, people/<번호-슬러그>/, column/, column/<id>/,
//       trail/, trail/<slug>/, 404.html, sitemap.xml, robots.txt, rss.xml
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site-data.json'), 'utf8'));
const S = D.SITE, BASE = S.url.replace(/\/$/, '');
const VER = 'v=' + Date.now().toString(36);
const todayKST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const TODAY = process.env.BUILD_DATE || todayKST();
const warn = []; const written = [];

/* ── 공용 ── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num2 = n => (n < 10 ? '0' : '') + n;
const abs = p => BASE + (p.startsWith('/') ? p : '/' + p);
const img = p => '/' + String(p).replace(/^\//, '');
const fmtDate = d => { const [y, m, dd] = d.split('-').map(Number); const w = '일월화수목금토'[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]; return `${y}. ${m}. ${dd}. (${w})`; };
const paras = t => String(t || '').split(/\n+/).map(p => { p = p.trim(); if (!p) return ''; if (p.startsWith('■')) return `<h2>${esc(p.replace(/^■\s*/, ''))}</h2>`; return `<p>${esc(p)}</p>`; }).join('');
const cut = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* ── 연재 일정: 1화=시작일, 2화부터 매주 월요일 ── */
function epDate(no) {
  if (no === 1) return S.seriesStart;
  const s = new Date(S.seriesStart + 'T00:00:00Z'); const dow = s.getUTCDay();
  const firstMon = new Date(s.getTime() + (((8 - dow) % 7) || 7) * 864e5);   // 시작일 다음 월요일
  return new Date(firstMon.getTime() + (no - 2) * 7 * 864e5).toISOString().slice(0, 10);
}

/* ── 연재 원고(md) 읽기 ── */
function readPosts() {
  const dir = path.join(ROOT, 'content/people');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /^\d+-.+\.md$/.test(f)).map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) { warn.push(`앞머리(---) 없음: ${f}`); return null; }
    const fm = {}; m[1].split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) fm[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    const no = +fm.no; const date = epDate(no);   // 공개일은 일정표가 정한다(원고 date 는 참고)
    return { ...fm, no, date, body: m[2], file: f, url: `/people/${num2(no)}-${fm.slug}/` };
  }).filter(Boolean).sort((a, b) => a.no - b.no);
}
const ALL_POSTS = readPosts();
const POSTS = ALL_POSTS.filter(p => p.date <= TODAY);

function mdToHtml(post) {
  const lines = post.body.split('\n'); const out = []; const toc = []; let para = []; let inRefs = false; let list = [];
  const flush = () => { if (para.length) { out.push(`<p>${esc(para.join(' '))}</p>`); para = []; } if (list.length) { out.push(`<ul class="refs">${list.join('')}</ul>`); list = []; } };
  for (const ln of lines) {
    const t = ln.trim();
    if (!t) { flush(); continue; }
    if (t.startsWith('## ')) { flush(); const h = t.slice(3).trim(); inRefs = /참고/.test(h);
      if (inRefs) { out.push(`<h2 class="refs-h">${esc(h)}</h2>`); continue; }
      const id = 's' + (toc.length + 1); toc.push({ id, h }); out.push(`<h2 id="${id}">${esc(h)}</h2>`); continue; }
    const im = t.match(/^\[\[IMG:([^|\]]+)\|([^|\]]*)\|?([^\]]*)\]\]$/);
    if (im) { flush(); const file = `img/people/${num2(post.no)}-${im[1]}.webp`;
      if (fs.existsSync(path.join(ROOT, file))) out.push(`<figure><img src="/${file}" alt="${esc(im[2])}" loading="lazy" decoding="async"/><figcaption>${esc(im[2])}</figcaption></figure>`);
      else warn.push(`그림 없음(건너뜀): ${file}`);
      continue; }
    if (inRefs) { const s = t.replace(/^[-*·]\s*/, ''); const u = s.match(/https?:\/\/\S+/);
      list.push(`<li>${u ? esc(s.replace(u[0], '').replace(/[—–-]\s*$/, '').trim()) + ` <a href="${esc(u[0])}" target="_blank" rel="noopener nofollow">${esc(u[0].replace(/^https?:\/\//, '').slice(0, 48))}</a>` : esc(s)}</li>`); continue; }
    if (t.startsWith('> ')) { flush(); out.push(`<blockquote>${esc(t.slice(2))}</blockquote>`); continue; }
    para.push(t);
  }
  flush();
  /* 분량 = 본문(공백 포함). 그림 자리·섹션 제목·「참고한 자료」는 뺀다 */
  const text = post.body.split(/^## .*참고.*$/m)[0].replace(/\[\[IMG:[^\]]*\]\]/g, '').replace(/^## .*$/gm, '');
  return { html: out.join('\n'), toc, chars: text.replace(/\s*\n\s*/g, ' ').trim().length };
}

/* ── 메뉴 ── */
const MENU = [
  { id: 'shops', label: '매장', href: '/', ic: '<path d="M4 10h16v10H4z"/><path d="M3 10l2-6h14l2 6"/><path d="M10 20v-5h4v5"/>' },
  { id: 'game', label: '게임', href: '/play/', ic: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="16" cy="11.5" r=".9"/><circle cx="18" cy="13.5" r=".9"/>' },
  { id: 'people', label: '인물 연재', href: '/people/', ic: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>' },
  { id: 'column', label: '칼럼', href: '/column/', ic: '<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>' },
  { id: 'trail', label: '등산로', href: '/trail/', ic: '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M9 8l1.6 2.6"/>' }];
const svg = p => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%231C1A17'/%3E%3Ctext x='32' y='44' font-family='serif' font-size='34' font-weight='700' text-anchor='middle' fill='%23E6D3B3'%3ES%3C/text%3E%3C/svg%3E";

/* ── 레이아웃 (SEO 머리 포함) ── */
function layout({ p, title, desc, image, type = 'website', sec, body, ld = [], crumbs, published, keywords }) {
  const url = abs(p);
  const _og = image || 'img/shops/ogong-hero.webp'; const _ogJpg = _og.replace(/.webp$/, '.jpg');
  const ogImg = abs(fs.existsSync(path.join(ROOT, _ogJpg)) ? _ogJpg : _og);
  const jsonld = [...ld];
  if (crumbs) jsonld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: abs(c[1]) })) });
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
${keywords ? `<meta name="keywords" content="${esc(keywords)}"/>\n` : ''}<link rel="canonical" href="${url}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<meta property="og:type" content="${type}"/>
<meta property="og:site_name" content="${esc(S.name)}"/>
<meta property="og:locale" content="ko_KR"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${ogImg}"/>
<meta name="twitter:card" content="summary_large_image"/>
${published ? `<meta property="article:published_time" content="${published}T09:00:00+09:00"/>\n` : ''}${S.googleVerify ? `<meta name="google-site-verification" content="${esc(S.googleVerify)}"/>\n` : ''}${S.naverVerify ? `<meta name="naver-site-verification" content="${esc(S.naverVerify)}"/>\n` : ''}<meta name="theme-color" content="#F5F1EA"/>
<link rel="icon" type="image/png" sizes="32x32" href="/img/brand/favicon-32.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/img/brand/apple-touch-icon.png"/>
<link rel="alternate" type="application/rss+xml" title="${esc(S.name)}" href="/rss.xml"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"/>
<link rel="stylesheet" href="/css/site.css?${VER}"/>
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<header class="hd"><div class="hd-in">
  <a class="logo" href="/" aria-label="${esc(S.name)} 처음으로"><img class="logo-mark" src="/img/brand/logo.png" alt="" width="50" height="40"/><span class="logo-txt"><span class="logo-en">${esc(S.nameEn)}</span><span class="logo-ko">수락스트릿 · 수락산 디자인거리</span></span></a>
  <nav class="nav" aria-label="주 메뉴">${MENU.map(m => `<a href="${m.href}"${m.id === sec ? ' class="on" aria-current="page"' : ''}>${m.label}</a>`).join('')}</nav>
</div></header>
<main id="page">
${body}
</main>
<footer class="ft"><div class="ft-in">
  <div class="ft-logo"><img class="ft-mark" src="/img/brand/logo-light.png" alt="" width="50" height="40"/>${esc(S.nameEn)}</div>
  <div class="ft-sub">서울 노원구 수락산 디자인거리 · 수락산역 3번 출구</div>
  <nav class="ft-nav">${MENU.map(m => `<a href="${m.href}">${m.label}</a>`).join('')}</nav>
  <div class="ft-note">매장 정보는 각 매장의 네이버 플레이스 등록 정보를 바탕으로 정리했으며, 바뀔 수 있습니다.</div>
  <div class="ft-copy">© 2026 ${esc(S.name)}</div>
</div></footer>
<nav class="tb" aria-label="하단 메뉴">${MENU.map(m => `<a href="${m.href}"${m.id === sec ? ' class="on" aria-current="page"' : ''}>${svg(m.ic)}<span>${m.label}</span></a>`).join('')}</nav>
<script src="/js/site.js?${VER}" defer></script>
</body>
</html>
`;
}
function write(p, html) {
  const file = p.endsWith('/') ? path.join(ROOT, p, 'index.html') : path.join(ROOT, p);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, html); written.push(p);
}
const head = (k, t, s, tag = 'h1') => `<header class="ph"><div class="kicker">${k}</div><${tag} class="ph-t">${t}</${tag}>${s ? `<p class="ph-s">${s}</p>` : ''}</header>`;

/* ── 매장 ── */
const SHOPS = D.SHOPS;
const shopCard = (s, i, h = 'h3') => `<a class="sc" href="/shop/${s.key}/"><div class="sc-img" style="background-image:url(${img(s.hero)})"><span class="sc-mark">${esc(s.mark)}</span></div><div class="sc-b"><div class="sc-meta"><span>${num2(i + 1)}</span>${esc(s.cat)}</div><${h} class="sc-nm">${esc(s.name)}</${h}><p class="sc-tag">${esc(s.tagline)}</p><span class="more">자세히 보기 <i>→</i></span></div></a>`;
const OHS = { palseondang: [{ d: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], o: '11:00', c: '22:00' }],
  kumakitchen: [{ d: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], o: '11:00', c: '21:30' }] };
function shopLd(s) {
  const street = s.addr.replace(/^서울\s*노원구\s*/, '');
  const j = { '@context': 'https://schema.org', '@type': 'Restaurant', name: s.full || s.name, image: [abs(s.hero)], url: abs(`/shop/${s.key}/`),
    telephone: s.tel, servesCuisine: s.cat, description: s.lead,
    address: { '@type': 'PostalAddress', streetAddress: street, addressLocality: '노원구', addressRegion: '서울특별시', addressCountry: 'KR' },
    sameAs: [s.place] };
  if (s.geo) j.geo = { '@type': 'GeoCoordinates', latitude: s.geo[0], longitude: s.geo[1] };
  if (OHS[s.key]) j.openingHoursSpecification = OHS[s.key].map(x => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: x.d, opens: x.o, closes: x.c }));
  return j;
}

/* ── 페이지들 ── */
const FAQ = [
  ['수락산 등산코스는 어떤 것들이 있나요?', '수락산역 3번 출구에서 출발하는 대표 코스는 세 가지예요. 정상 주봉(637m)에 오르는 주봉 코스(8.2km, 약 4시간, 중급), 물소리 따라 걷는 벽운계곡 코스(약 2시간, 초중급), 가볍게 걷는 둘레길 코스(약 2시간, 초급). 바위 능선을 즐기고 싶다면 7호선 장암역에서 석림사를 지나 기차바위로 오르는 코스도 많이 찾습니다.'],
  ['수락산 석림사·기차바위 코스는 어떤가요?', '석림사는 의정부 장암동, 7호선 장암역에서 석림사 방향으로 20분쯤 걸으면 나오는 절이에요. 여기서 기차바위를 지나 정상으로 오르는데, 다녀온 분들 기준으로 오르는 데 2시간 안팎이 걸립니다. 기차바위는 밧줄을 잡고 오르내리는 긴 바위 구간이라 장갑을 챙기고, 비 온 뒤에는 피하세요. 장암역은 공사로 임시 승강장을 운영 중이니 출발 전에 운행 상황을 확인하세요.'],
  ['수락산과 불암산은 어떻게 다른가요?', '두 산은 덕릉고개를 사이에 두고 이어져 있어요. 북쪽이 수락산(정상 주봉 637m), 남쪽이 불암산(약 508m)입니다. 수락산은 서울 노원구와 경기 의정부시·남양주시 별내에 걸쳐 있고, 더 높고 바위 능선이 길어 산행 시간도 긴 편이에요. 둘 다 노원구에서 지하철로 바로 닿습니다.'],
  ['수락산 자연휴양림 「수락휴」는 어디에 있나요?', '서울 노원구 덕릉로145길 108, 수락산 자락에 있는 서울의 첫 자연휴양림이에요. 2025년 7월 17일 정식 개장했고, 가장 가까운 역은 4호선 불암산역입니다(걸어서 25분 안팎). 숙박은 숲나들e에서 예약합니다.'],
  ['수락산역 먹자골목에는 어떤 식당이 모여 있나요?', '7호선 수락산역 3번 출구 앞 수락산 디자인서울거리 일대를 흔히 「수락산역 먹자골목」이라고 불러요. 고깃집·횟집·순댓국집 같은 하산 식당부터 김밥, 일식 카츠, 중식까지 걸어서 5~7분 안에 모여 있습니다. 수락스트릿에서는 오공김밥(김밥 전문), 쿠마키친(일식 카츠·나베), 팔선당(중식)을 소개합니다.'],
  ['수락산 주변에 가볼 만한 곳이 있을까요?', '수락산역 쪽으로는 물소리 시원한 벽운계곡과 천상병 시인을 기리는 천상병공원이, 장암역 쪽으로는 석림사와 노강서원이 있어요. 자연휴양림 수락휴도 수락산 자락에 있습니다. 이 산 아래 살다 간 사람들의 이야기는 매주 월요일 연재 「수락산 사람들」에서 만나 보세요.'],
  ['하산하고 밥은 어디서 먹나요?', '주봉·벽운계곡·둘레길 코스 모두 수락산역 3번 출구 쪽으로 내려오면 디자인거리(먹자골목)로 바로 이어집니다. 하산 시간대별 추천은 칼럼 「등산 후 한 끼」에 정리해 두었어요.'],
  ['차를 가져가도 되나요?', '수락산 디자인서울거리 근처에 주차장이 있지만 주말 등산 시간대에는 금방 찹니다. 지하철 7호선 수락산역으로 오시는 게 가장 편해요.'],
];
function pageHome() {
  const latest = POSTS[POSTS.length - 1]; const col = D.COLUMNS[0]; const tr = D.TRAILS[0];
  const body = `<section class="hero"><video class="hero-v" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/media/surak-home.mp4" type="video/mp4"/></video>
<div class="hero-sh"></div><div class="hero-in"><div class="kicker light">SURAK DESIGN STREET · NOWON, SEOUL</div>
<h1 class="hero-t">수락산 아래,<br/>골목의 맛과 이야기</h1>
<p class="hero-s">정상까지 637m, 김밥까지 407m. 오늘은 어느 쪽부터 가실래요?</p>
<a class="hero-cta" href="#shops">가게 둘러보기 <i>↓</i></a></div></section>
<div class="wrap"><section class="sec" id="shops">${head('THE SHOPS', '디자인거리의 가게들', '수락스트릿이 소개하는 세 곳의 이야기.', 'h2')}
<div class="sc-grid">${SHOPS.map((s, i) => shopCard(s, i)).join('')}</div></section>
<section class="sec about">${head('ABOUT', '산이 먼저냐, 밥이 먼저냐', '', 'h2')}
<div class="about-b">
<p>수락산역 3번 출구를 나오면 두 가지 유혹이 동시에 손짓합니다. 한쪽은 해발 637m 수락산 주봉, 다른 한쪽은 걸어서 5분 거리 <strong>수락산 디자인거리</strong>, 흔히 <strong>수락산역 먹자골목</strong>이라 부르는 맛집 골목. 수락스트릿은 그 갈림길에서 「오늘은 무엇부터」를 함께 고민해 주는 동네 안내서입니다.</p>
<p>등산 전엔 <a href="/shop/ogonggimbap/">오공김밥</a>에서 든든한 한 줄을 챙기고, 하산 후엔 <a href="/shop/kumakitchen/">쿠마키친</a>의 바삭한 카츠나 <a href="/shop/palseondang/">팔선당</a>의 불향 가득한 짜장으로 수고한 무릎을 달래 보세요. 가게 정보는 각 매장의 네이버 플레이스를 바탕으로 정리하고, 바뀌면 바로 고칩니다. (사장님보다 조금 늦게 알 수는 있습니다.)</p>
<p>매주 월요일에는 인물 연재 <a href="/people/">「수락산 사람들」</a>이 올라옵니다. 천상병 시인, 매월당 김시습처럼 이 산 아래 머물다 간 사람들의 이야기를 그림과 함께 천천히 풀어 놓습니다. 산은 늘 그 자리인데, 이야기는 매주 한 편씩 자랍니다.</p>
<p><a href="/trail/">수락산 등산 코스</a>도 체력별로 챙겨 두었습니다. 정상을 노리는 주봉 코스부터 물소리 따라 걷는 벽운계곡, 가볍게 한 바퀴 도는 둘레길까지. 내려오는 길이 오르는 길보다 즐거운 동네, 수락산 디자인거리에 오신 걸 환영합니다.</p>
</div>
<nav class="tags" aria-label="주제 태그">${[['#수락산', '/#faq'], ['#수락산등산코스', '/trail/'], ['#수락산맛집', '/#shops'], ['#수락산역맛집', '/#shops'], ['#수락산먹자골목', '/#faq'], ['#수락산기차바위', '/#faq'], ['#수락휴', '/#faq'], ['#수락산디자인거리', '/column/halfday/'], ['#벽운계곡', '/trail/byeokun-valley/'], ['#수락산둘레길', '/trail/dulle/'], ['#등산후맛집', '/column/mealtime/'], ['#노원맛집', '/#shops'], ['#천상병공원', POSTS[0] ? POSTS[0].url : '/people/'], ['#수락산사람들', '/people/']].map(t => `<a href="${t[1]}">${t[0]}</a>`).join('')}</nav>
</section>
<section class="sec faq" id="faq">${head('FAQ', '수락산, 이것부터 물어보세요', '수락산 등산코스, 기차바위, 수락휴, 수락산역 먹자골목까지 — 가장 많이 찾는 질문.', 'h2')}
<div class="faq-l">${FAQ.map(([q, a], k) => `<details class="faq-i"${k === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a).replace('「등산 후 한 끼」', '<a href="/column/mealtime/">「등산 후 한 끼」</a>').replace('「수락산 사람들」', '<a href="/people/">「수락산 사람들」</a>')}</p></details>`).join('')}</div>
</section>
<section class="sec">${head('STORIES', '수락산의 이야기', '사람의 이야기, 골목의 이야기, 산의 이야기.', 'h2')}<div class="teasers">
${latest ? `<a class="tz" href="${latest.url}"><div class="tz-img ill" style="background-image:url(/${latest.hero})"></div><div class="tz-b"><div class="tz-k">인물 연재 · 제${latest.no}화</div><h3>${esc(latest.title)}</h3><p>${esc(latest.summary)}</p></div></a>` : ''}
<a class="tz" href="/column/${col.id}/"><div class="tz-img" style="background-image:url(${img(col.img)})"></div><div class="tz-b"><div class="tz-k">칼럼</div><h3>${esc(col.title)}</h3><p>${esc(col.summary)}</p></div></a>
<a class="tz" href="/trail/${tr.slug}/"><div class="tz-img tz-mtn"><span>637m</span></div><div class="tz-b"><div class="tz-k">등산로</div><h3>${esc(tr.name)}</h3><p>${esc(tr.lead)}</p></div></a>
</div></section>
${gameCard()}</div>`;
  write('/', layout({ p: '/', title: `${S.name} — 수락산 등산코스 · 수락산역 맛집 · 먹자골목 안내`, desc: S.desc, sec: 'shops', body,
    keywords: '수락산, 수락산 등산코스, 수락산역, 수락산 맛집, 수락산역 맛집, 수락산 먹자골목, 수락산역 먹자골목, 수락산 기차바위, 수락산 석림사, 수락산 자연휴양림, 수락휴, 수락산 디자인서울거리, 수락산 디자인거리, 수락산역 3번출구, 수락산 계곡, 벽운계곡, 수락산 둘레길, 불암산, 장암역 등산, 노원 맛집, 상계동 맛집, 등산 후 맛집, 천상병공원, 수락스트릿, 팔선당, 쿠마키친, 오공김밥',
    ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }, { '@context': 'https://schema.org', '@type': 'WebSite', name: S.name, alternateName: S.nameEn, url: BASE + '/', inLanguage: 'ko-KR', description: S.desc },
      { '@context': 'https://schema.org', '@type': 'Organization', name: S.name, alternateName: S.nameEn, url: BASE + '/', logo: abs('img/brand/icon-512.png') }] }));
}
function pageShop(s, i) {
  const t = s.full || s.name;
  const body = `<section class="sh-hero" style="background-image:url(${img(s.hero)})"><div class="sh-hero-sh"></div><div class="sh-hero-in"><a class="back light" href="/#shops">← 매장</a>
<div class="sh-mark">${esc(s.mark)}</div><div class="kicker light">${esc(s.en)} · ${esc(s.cat)}</div><h1>${esc(t)}</h1><p>${esc(s.tagline)}</p></div></section>
<div class="wrap"><div class="sh-grid"><div class="sh-main">
<section class="sec-s"><div class="kicker">OUR STORY</div><p class="lead">${esc(s.lead)}</p>${s.story.split('\n').map(x => `<p>${esc(x)}</p>`).join('')}</section>
<section class="pts">${s.points.map(p => `<div class="pt"><div class="pt-k">${esc(p.k)}</div><h3>${esc(p.h)}</h3><p>${esc(p.d)}</p></div>`).join('')}</section>
<section class="sec-s"><div class="kicker">MENU</div><h2 class="h2">오늘, 뭐가 당기세요?</h2>
${s.menuImg ? `<img class="menu-img" src="${img(s.menuImg)}" alt="${esc(s.name)} 대표 메뉴" loading="lazy"/>` : ''}
<ul class="menu">${s.menu.map(m => `<li><div class="mn-row"><span class="mn-n">${esc(m.n)}${m.best ? '<em>대표</em>' : ''}</span><span class="mn-dot"></span>${m.p ? `<span class="mn-p">${m.p}원</span>` : ''}</div><p>${esc(m.d)}</p></li>`).join('')}</ul>
<p class="small">${esc(s.menuNote)}</p></section></div>
<aside class="sh-side"><div class="info"><div class="info-k">VISIT</div><dl>
<dt>주소</dt><dd>${esc(s.addr)}</dd><dt>오는 길</dt><dd>${esc(s.way)}</dd><dt>영업</dt><dd>${s.hours.map(esc).join('<br/>')}</dd>
${s.parking ? `<dt>주차</dt><dd>${esc(s.parking)}</dd>` : ''}<dt>전화</dt><dd><a href="tel:${s.tel.replace(/-/g, '')}">${esc(s.tel)}</a></dd></dl>
<div class="btns"><a class="btn dark" href="tel:${s.tel.replace(/-/g, '')}">전화하기</a><a class="btn" href="${s.map}" target="_blank" rel="noopener">길찾기</a><a class="btn" href="${s.place}" target="_blank" rel="noopener">네이버 플레이스</a></div>
<p class="small">영업시간·메뉴는 바뀔 수 있어요. 출발 전 네이버 플레이스에서 확인해 주세요.</p></div></aside></div>
<section class="sec"><div class="kicker">OTHER SHOPS</div><div class="sc-grid two">${SHOPS.filter(x => x.key !== s.key).map(x => shopCard(x, SHOPS.indexOf(x))).join('')}</div></section></div>`;
  write(`/shop/${s.key}/`, layout({ p: `/shop/${s.key}/`, title: `${t} — ${s.cat} · 수락산 디자인거리 | ${S.name}`,
    desc: cut(`${t}(${s.cat}). ${s.tagline} ${s.lead} ${s.addr}, ${s.way}.`, 155), image: s.hero, sec: 'shops', body,
    keywords: `${s.name}, ${t}, 수락산 맛집, 수락산역 맛집, 수락산 먹자골목, 수락산역 ${s.cat}, 수락산 디자인거리, 노원 ${s.cat}`,
    ld: [shopLd(s)], crumbs: [['수락스트릿', '/'], ['매장', '/'], [t, `/shop/${s.key}/`]] }));
}
/* 게임 카드(홈) — 대표 그림 + 세 사장님 + 바로 플레이 (2026-11-19 「배너와 카드가 재미없다」 개편) */
function gameCard() {
  const G = D.GAME; const ready = !!G.url;
  return `<section class="sec gsec" aria-label="게임"><a class="gcard" href="/play/">
<div class="gc-art"><img src="${img(G.banner)}" alt="${esc(G.title)} 대표 그림 — 낮에는 장사, 밤에는 좀비와 싸우는 수락산역 골목의 세 사장님" loading="lazy" width="1600" height="894"/>
<span class="gc-tag day">☀ 낮 · 장사</span><span class="gc-tag night">☾ 밤 8시 · 좀비</span></div>
<div class="gc-b"><div class="kicker light">GAME · 무료 웹게임</div><h2 class="gc-t">${esc(G.title)}</h2><p class="gc-sub">${esc(G.sub)}</p>
<div class="gc-cast">${(G.cast || []).map(c => `<img src="${img(c.face)}" alt="${esc(c.shop)} 사장님" width="48" height="48" loading="lazy"/>`).join('')}<span>세 사장님이 골목을 지킨다</span></div>
<span class="gc-go">${ready ? '지금 플레이' : '곧 공개'} <i>→</i></span></div></a></section>`;
}
function pageGame() {
  const G = D.GAME; const ready = !!G.url;
  const play = ready ? `<a class="gm-play" href="${esc(G.url)}"><span class="gm-play-ic" aria-hidden="true">▶</span>지금 바로 플레이</a>` : '<span class="gm-play off">곧 공개됩니다</span>';
  const body = `<div class="wrap"><section class="sec gm">
<div class="gm-hero"><div class="gm-art"><img src="${img(G.banner)}" alt="${esc(G.title)} 대표 그림 — 낮에는 세 가게에 손님이 줄을 서고, 밤에는 좀비 떼가 몰려오는 수락산역 골목" width="1600" height="894" fetchpriority="high"/>
<span class="gc-tag day">☀ 낮 · 장사</span><span class="gc-tag night">☾ 밤 8시 · 좀비</span></div>
<div class="gm-b"><div class="kicker light">${ready ? 'PLAY NOW · 무료 · 설치 없음' : 'COMING SOON'}</div><h1 class="gm-t">${esc(G.title)}</h1><p class="gm-sub">${esc(G.sub)}</p><p class="gm-desc">${esc(G.desc)}</p>
${play}<p class="gm-note">폰·PC 브라우저에서 바로 열립니다. 소리를 켜면 더 재밌어요.</p></div></div>
<div class="gm-steps">${(G.steps || []).map((x, i) => `<div class="gm-step s${i + 1}"><div class="gm-step-t">${esc(x.t)}</div><div class="gm-step-h">${esc(x.h)}</div><p>${esc(x.p)}</p></div>`).join('<span class="gm-arrow" aria-hidden="true">→</span>')}</div>
<div class="gm-cast-h"><div class="kicker">THE CAST</div><h2>골목을 지키는 세 사장님</h2><p>낮에는 손님을 받고, 밤에는 가게 앞을 막아섭니다. 선글라스는 셋 다 안 벗습니다.</p></div>
<div class="gm-cast">${(G.cast || []).map(c => `<div class="gm-who"><img src="${img(c.face)}" alt="${esc(c.shop)} 사장님" width="96" height="96" loading="lazy"/><div class="gm-who-b"><div class="gm-shop">${esc(c.shop)}</div><div class="gm-role">${esc(c.role)}</div><p class="gm-line">“${esc(c.line)}”</p></div></div>`).join('')}</div>
${ready ? `<div class="gm-end">${play}</div>` : ''}
</section></div>`;
  write('/play/', layout({ p: '/play/', title: `${G.title} — ${G.sub} | 수락산역 골목 좀비 디펜스 웹게임 | ${S.name}`, desc: cut(`${G.desc} 설치 없이 폰·PC 브라우저에서 무료로.`, 155), image: G.banner || undefined, sec: 'game', body,
    keywords: '수락산 스트릿, 수락스트릿 게임, 무료 웹게임, 좀비 디펜스, 가게 운영 게임, 수락산역, 오공김밥, 쿠마키친, 팔선당',
    ld: [{ '@context': 'https://schema.org', '@type': 'VideoGame', name: G.title, description: G.desc, url: BASE + '/play/', image: BASE + img(G.banner).replace(/\.webp$/, '.jpg'), genre: ['로그라이크', '디펜스', '경영'], gamePlatform: ['웹 브라우저', '모바일 브라우저'], applicationCategory: 'Game', operatingSystem: 'Web', inLanguage: 'ko-KR', offers: { '@type': 'Offer', price: 0, priceCurrency: 'KRW' } }],
    crumbs: [['수락스트릿', '/'], ['게임', '/play/']] }));
}
function pagePeople() {
  const next = D.LINEUP.find(l => l.no === (POSTS.length ? POSTS[POSTS.length - 1].no + 1 : 1));
  const rows = [...POSTS].reverse().map(p => `<a class="bd-row" href="${p.url}"><span class="bd-no">${num2(p.no)}</span>
<span class="bd-th" style="background-image:url(/${p.hero})"></span><span class="bd-main"><span class="bd-t">${esc(p.title)}</span><span class="bd-s">${esc(p.summary)}</span></span>
<span class="bd-date">${fmtDate(p.date)}</span></a>`).join('');
  const body = `<div class="wrap"><section class="sec">${head('SERIES · 수락산 사람들', '인물 연재', `수락산 자락에 발자취를 남긴 사람들의 이야기. 매주 ${S.seriesDay}, 한 사람씩.`)}
<div class="bd"><div class="bd-head"><span>번호</span><span>제목</span><span>공개일</span></div>${rows || '<p class="bd-empty">첫 이야기를 준비하고 있어요.</p>'}</div>
${next ? `<div class="bd-next"><div class="kicker">NEXT</div><div class="bd-next-b"><span class="bd-next-im" style="background-image:url(/${next.ill})"></span><div><strong>제${next.no}화 · ${esc(next.name)}</strong><p>${esc(next.sub)} — ${fmtDate(epDate(next.no))} 공개 예정</p></div></div></div>` : ''}
<p class="small center">역사 기록을 바탕으로 쓰되, 수락산 일대에 전해 내려오는 이야기(야사)는 본문에 그렇다고 밝혀 둡니다.</p></section></div>`;
  write('/people/', layout({ p: '/people/', title: `인물 연재 「수락산 사람들」 | ${S.name}`,
    desc: `수락산 자락에 발자취를 남긴 사람들의 이야기를 매주 한 편씩 연재합니다. ${POSTS.map(p => p.name).join(' · ')}`.trim(), image: POSTS[0] ? POSTS[0].hero : undefined,
    sec: 'people', body, crumbs: [['수락스트릿', '/'], ['인물 연재', '/people/']],
    ld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: '수락산 사람들', url: abs('/people/'), inLanguage: 'ko-KR',
      blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: abs(p.url), datePublished: p.date })) }] }));
}
function pagePost(p, i) {
  const r = mdToHtml(p); const prev = POSTS[i - 1], next = POSTS[i + 1];
  const upcoming = !next ? D.LINEUP.find(l => l.no === p.no + 1) : null;
  const nImg = (r.html.match(/<figure>/g) || []).length;
  if (nImg < 5) warn.push(`제${p.no}화 사진 ${nImg}장 — 최소 5장 필요 (분량은 1만 자 미만도 괜찮음)`);
  const mins = Math.max(1, Math.round(r.chars / 500));
  const body = `<div class="wrap narrow"><article class="art post">
<nav class="crumb"><a href="/people/">인물 연재</a> <i>›</i> 제${p.no}화</nav>
<div class="kicker">수락산 사람들 · 제${p.no}화</div><h1 class="art-t">${esc(p.title)}</h1>
<div class="art-s">${esc(p.subtitle || '')}</div>
<div class="post-meta"><span>${fmtDate(p.date)}</span><span>수락스트릿 편집부</span><span>읽는 데 약 ${mins}분</span></div>
<figure class="post-hero"><img src="/${p.hero}" alt="${esc(p.name)} 초상 그림" fetchpriority="high"/></figure>
<p class="post-sum">${esc(p.summary)}</p>
${r.toc.length > 2 ? `<nav class="toc" aria-label="목차"><div class="kicker">CONTENTS</div><ol>${r.toc.map(t => `<li><a href="#${t.id}">${esc(t.h)}</a></li>`).join('')}</ol></nav>` : ''}
<div class="art-body">${r.html}</div>
<div class="art-end">— 제${p.no}화 끝 —</div>
${next ? `<a class="next" href="${next.url}"><small>다음 화</small>제${next.no}화 · ${esc(next.name)} <i>→</i></a>`
  : upcoming ? `<div class="fin"><small>NEXT</small>제${upcoming.no}화 · ${esc(upcoming.name)}<br/><span>${fmtDate(epDate(upcoming.no))} 공개 예정</span></div>` : ''}
<nav class="pn">${prev ? `<a href="${prev.url}">← 제${prev.no}화</a>` : '<span></span>'}<a href="/people/">목록</a>${next ? `<a href="${next.url}">제${next.no}화 →</a>` : '<span></span>'}</nav>
</article></div>`;
  write(p.url, layout({ p: p.url, title: `${p.title} | 수락산 사람들 제${p.no}화`, desc: cut(p.summary, 155), image: p.hero, type: 'article', sec: 'people', body,
    published: p.date, keywords: p.keywords,
    crumbs: [['수락스트릿', '/'], ['인물 연재', '/people/'], [`제${p.no}화 ${p.name}`, p.url]],
    ld: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.summary, image: [abs(p.hero)], inLanguage: 'ko-KR',
      datePublished: p.date + 'T09:00:00+09:00', dateModified: p.date + 'T09:00:00+09:00', keywords: p.keywords, wordCount: r.chars,
      author: { '@type': 'Organization', name: '수락스트릿 편집부', url: BASE + '/' }, publisher: { '@type': 'Organization', name: S.name, url: BASE + '/', logo: { '@type': 'ImageObject', url: abs('img/brand/icon-512.png') } },
      mainEntityOfPage: abs(p.url), about: { '@type': 'Person', name: p.name } }] }));
}
function pageColumns() {
  const body = `<div class="wrap"><section class="sec">${head('COLUMN', '칼럼', '수락산 디자인거리를 더 잘 즐기는 법.')}<div class="cols">
${D.COLUMNS.map(c => `<a class="colc" href="/column/${c.id}/"><div class="colc-img" style="background-image:url(${img(c.img)})"></div><div class="colc-b"><div class="kicker">No. ${num2(c.no)} · ${c.date}</div><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p><span class="more">읽기 <i>→</i></span></div></a>`).join('')}
</div></section></div>`;
  write('/column/', layout({ p: '/column/', title: `칼럼 — 수락산 디자인거리 즐기는 법 | ${S.name}`, desc: '수락산 디자인거리 반나절 코스, 등산 전후 식사 시간표 등 동네를 더 잘 즐기는 법.', sec: 'column', body,
    crumbs: [['수락스트릿', '/'], ['칼럼', '/column/']] }));
}
function pageColumn(c, i) {
  const pv = D.COLUMNS[i - 1], nx = D.COLUMNS[i + 1];
  const body = `<div class="wrap narrow"><article class="art">
<nav class="crumb"><a href="/column/">칼럼</a> <i>›</i> No. ${num2(c.no)}</nav>
<img class="art-photo" src="${img(c.img)}" alt="${esc(c.title)}" fetchpriority="high"/>
<div class="kicker">COLUMN No. ${num2(c.no)} · 수락스트릿 편집부 · ${c.date}</div><h1 class="art-t">${esc(c.title)}</h1>
<blockquote>${esc(c.summary)}</blockquote><div class="art-body">${paras(c.body)}</div>
${c.shops ? `<div class="kicker mt">글에 나온 가게</div><div class="sc-grid mini">${c.shops.map(k => { const s = SHOPS.find(x => x.key === k); return shopCard(s, SHOPS.indexOf(s), 'h2'); }).join('')}</div>` : ''}
<nav class="pn">${pv ? `<a href="/column/${pv.id}/">← 이전 글</a>` : '<span></span>'}<a href="/column/">목록</a>${nx ? `<a href="/column/${nx.id}/">다음 글 →</a>` : '<span></span>'}</nav></article></div>`;
  write(`/column/${c.id}/`, layout({ p: `/column/${c.id}/`, title: `${c.title} | ${S.name} 칼럼`, desc: cut(c.summary + ' ' + c.body, 155), image: c.img, type: 'article', sec: 'column', body,
    crumbs: [['수락스트릿', '/'], ['칼럼', '/column/'], [c.title, `/column/${c.id}/`]],
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: c.title, description: c.summary, image: [abs(c.img)], inLanguage: 'ko-KR',
      author: { '@type': 'Organization', name: '수락스트릿 편집부' }, mainEntityOfPage: abs(`/column/${c.id}/`) }] }));
}
function pageTrails() {
  const body = `<div class="wrap"><section class="sec">${head('TRAILS', '수락산 등산코스', '수락산역 3번 출구에서 시작하는 세 갈래 길 — 소요시간·난이도·구간 안내.')}<div class="trs">
${D.TRAILS.map((t, i) => `<a class="trc" href="/trail/${t.slug}/"><div class="trc-n">${num2(i + 1)}</div><div class="trc-b"><div class="trc-lv">${esc(t.level)} · ${esc(t.dist)} · ${esc(t.time)}</div><h2>${esc(t.name)}</h2><p>${esc(t.lead)}</p><div class="route">${t.route.map(esc).join('<i>›</i>')}</div></div></a>`).join('')}
</div><div class="safety"><div class="kicker">SAFETY</div><ul>${D.SAFETY.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div></section></div>`;
  write('/trail/', layout({ p: '/trail/', title: `수락산 등산코스 — 주봉 · 벽운계곡 · 둘레길 소요시간·난이도 | ${S.name}`, desc: '수락산역 3번 출구에서 시작하는 수락산 등산코스 세 가지 — 정상 주봉 코스(8.2km·약 4시간), 벽운계곡 코스, 둘레길 코스의 소요시간·난이도·구간 안내와 안전 수칙. 하산 후엔 수락산역 먹자골목으로.', sec: 'trail', body,
    crumbs: [['수락스트릿', '/'], ['등산로', '/trail/']] }));
}
function pageTrail(t, i) {
  const body = `<div class="wrap narrow"><article class="art">
<nav class="crumb"><a href="/trail/">등산로</a> <i>›</i> ${esc(t.name)}</nav>
<div class="kicker">TRAIL ${num2(i + 1)} · ${esc(t.level)}</div><h1 class="art-t">${esc(t.name)}</h1>
<div class="facts"><div><b>거리</b>${esc(t.dist)}</div><div><b>시간</b>${esc(t.time)}</div><div><b>난이도</b>${esc(t.level)}</div></div>
<blockquote>${esc(t.lead)}</blockquote><div class="route big">${t.route.map(esc).join('<i>›</i>')}</div>
${t.marks.length ? `<h2 class="h2">구간 안내</h2><ol class="tl">${t.marks.map((m, k) => `<li><div class="tl-n">${num2(k + 1)}</div><div class="tl-b"><h3>${esc(m.n)}</h3><div class="tl-m">출발 ${m.t}분 · 해발 ${m.e}m</div><p>${esc(m.d)}</p>${m.w ? `<p class="warn">${esc(m.w)}</p>` : ''}</div></li>`).join('')}</ol>` : ''}
<div class="safety"><div class="kicker">SAFETY</div><ul>${D.SAFETY.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
<div class="kicker mt">출발 전 · 하산 후 들르기</div><div class="sc-grid mini">${SHOPS.map((s, k) => shopCard(s, k, 'h2')).join('')}</div>
<nav class="pn">${i > 0 ? `<a href="/trail/${D.TRAILS[i - 1].slug}/">← 이전 코스</a>` : '<span></span>'}<a href="/trail/">목록</a>${i < D.TRAILS.length - 1 ? `<a href="/trail/${D.TRAILS[i + 1].slug}/">다음 코스 →</a>` : '<span></span>'}</nav></article></div>`;
  write(`/trail/${t.slug}/`, layout({ p: `/trail/${t.slug}/`, title: `${t.name} — ${t.dist} · ${t.level} | 수락산 등산로`, desc: cut(`${t.name}: ${t.lead} 경로 ${t.route.join('→')}. ${t.dist}, ${t.time}.`, 155), sec: 'trail', body,
    crumbs: [['수락스트릿', '/'], ['등산로', '/trail/'], [t.name, `/trail/${t.slug}/`]] }));
}
function page404() {
  const body = `<div class="wrap narrow"><section class="sec center-box"><div class="kicker">404</div><h1 class="art-t">길을 잃으셨나요?</h1><p class="ph-s">찾으시는 페이지가 없거나 주소가 바뀌었어요.</p><a class="btn dark" href="/">처음으로</a></section></div>`;
  let html = layout({ p: '/404.html', title: `페이지를 찾을 수 없어요 | ${S.name}`, desc: S.desc, sec: '', body });
  html = html.replace('content="index,follow,max-image-preview:large"', 'content="noindex"');
  write('/404.html', html);
}

/* ── 실행: 생성 폴더 비우고 다시 만든다 ── */
for (const d of ['shop', 'play', 'people', 'column', 'trail'])   /* ★ /game/ 은 다른 창이 올린 실제 게임 — 절대 지우지 않는다 */
 fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
pageHome(); SHOPS.forEach(pageShop); pageGame(); pagePeople(); POSTS.forEach(pagePost);
pageColumns(); D.COLUMNS.forEach(pageColumn); pageTrails(); D.TRAILS.forEach(pageTrail); page404();

/* 사이트맵 · robots · RSS */
const lastmod = p => { const m = p.match(/^\/people\/(\d+)-/); if (m) { const x = POSTS.find(q => q.no === +m[1]); return x ? x.date : TODAY; } return TODAY; };
const urls = written.filter(p => p !== '/404.html');
// /game/(게임 앱 화면)은 사이트맵에 넣지 않는다 — 제목·본문·대표주소가 없어 「크롤링됨-색인 안 됨」으로 쌓인다(2026-11-19 실측). 소개는 /play/
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(p => `  <url><loc>${abs(p)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /app-legacy.html\nDisallow: /functions/\nDisallow: /content/\nDisallow: /tools/\n\nSitemap: ${BASE}/sitemap.xml\n`);
const items = [...POSTS.map(p => ({ t: `[수락산 사람들 제${p.no}화] ${p.title}`, u: abs(p.url), d: p.summary, date: p.date })),
  ...D.COLUMNS.map(c => ({ t: c.title, u: abs(`/column/${c.id}/`), d: c.summary, date: S.seriesStart }))].sort((a, b) => b.date.localeCompare(a.date));
const rfc = d => new Date(d + 'T09:00:00+09:00').toUTCString();
fs.writeFileSync(path.join(ROOT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${esc(S.name)}</title><link>${BASE}/</link><description>${esc(S.desc)}</description><language>ko</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items.map(it => `<item><title>${esc(it.t)}</title><link>${it.u}</link><guid>${it.u}</guid><description>${esc(it.d)}</description><pubDate>${rfc(it.date)}</pubDate></item>`).join('\n')}\n</channel></rss>\n`);

console.log(`기준일 ${TODAY} · 페이지 ${written.length}개 · 연재 공개 ${POSTS.length}/${ALL_POSTS.length}화`);
written.forEach(p => console.log('  ' + p));
if (warn.length) { console.log('⚠ 확인:'); warn.forEach(w => console.log('  - ' + w)); }
