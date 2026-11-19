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
  const ogImg = abs(image || 'img/shops/ogong-hero.webp');
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
<link rel="icon" href="${FAVICON}"/>
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
  <a class="logo" href="/" aria-label="${esc(S.name)} 처음으로"><span class="logo-en">${esc(S.nameEn)}</span><span class="logo-ko">수락스트릿 · 수락산 디자인거리</span></a>
  <nav class="nav" aria-label="주 메뉴">${MENU.map(m => `<a href="${m.href}"${m.id === sec ? ' class="on" aria-current="page"' : ''}>${m.label}</a>`).join('')}</nav>
</div></header>
<main id="page">
${body}
</main>
<footer class="ft"><div class="ft-in">
  <div class="ft-logo">${esc(S.nameEn)}</div>
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
function pageHome() {
  const latest = POSTS[POSTS.length - 1]; const col = D.COLUMNS[0]; const tr = D.TRAILS[0];
  const body = `<section class="hero"><video class="hero-v" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/media/surak-home.mp4" type="video/mp4"/></video>
<div class="hero-sh"></div><div class="hero-in"><div class="kicker light">SURAK DESIGN STREET · NOWON, SEOUL</div>
<h1 class="hero-t">수락산 아래,<br/>골목의 맛과 이야기</h1>
<p class="hero-s">수락산역 3번 출구에서 걸어서 5분. 산을 오르기 전 한 줄, 내려와서 한 그릇.</p>
<a class="hero-cta" href="#shops">가게 둘러보기 <i>↓</i></a></div></section>
<div class="wrap"><section class="sec" id="shops">${head('THE SHOPS', '디자인거리의 가게들', '수락스트릿이 소개하는 세 곳의 이야기.', 'h2')}
<div class="sc-grid">${SHOPS.map((s, i) => shopCard(s, i)).join('')}</div></section>
<section class="sec">${head('STORIES', '수락산의 이야기', '사람의 이야기, 골목의 이야기, 산의 이야기.', 'h2')}<div class="teasers">
${latest ? `<a class="tz" href="${latest.url}"><div class="tz-img ill" style="background-image:url(/${latest.hero})"></div><div class="tz-b"><div class="tz-k">인물 연재 · 제${latest.no}화</div><h3>${esc(latest.title)}</h3><p>${esc(latest.summary)}</p></div></a>` : ''}
<a class="tz" href="/column/${col.id}/"><div class="tz-img" style="background-image:url(${img(col.img)})"></div><div class="tz-b"><div class="tz-k">칼럼</div><h3>${esc(col.title)}</h3><p>${esc(col.summary)}</p></div></a>
<a class="tz" href="/trail/${tr.slug}/"><div class="tz-img tz-mtn"><span>637m</span></div><div class="tz-b"><div class="tz-k">등산로</div><h3>${esc(tr.name)}</h3><p>${esc(tr.lead)}</p></div></a>
</div></section>
<a class="gband" href="/play/"${D.GAME.banner ? ` style="background-image:linear-gradient(90deg,rgba(20,16,12,.85),rgba(20,16,12,.2)),url(${img(D.GAME.banner)})"` : ''}><div><div class="kicker light">GAME</div><h3>${esc(D.GAME.title)}</h3><p>${esc(D.GAME.sub)}</p></div><span class="more light">${D.GAME.url ? '플레이하기' : '곧 공개'} <i>→</i></span></a></div>`;
  write('/', layout({ p: '/', title: `${S.name} — 수락산 디자인거리의 가게와 이야기`, desc: S.desc, sec: 'shops', body,
    ld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: S.name, alternateName: S.nameEn, url: BASE + '/', inLanguage: 'ko-KR', description: S.desc }] }));
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
    keywords: `${s.name}, ${t}, 수락산 맛집, 수락산역 ${s.cat}, 수락산 디자인거리, 노원 ${s.cat}`,
    ld: [shopLd(s)], crumbs: [['수락스트릿', '/'], ['매장', '/'], [t, `/shop/${s.key}/`]] }));
}
function pageGame() {
  const G = D.GAME; const ready = !!G.url;
  const body = `<div class="wrap"><section class="sec">${head('GAME', '게임', '수락산 골목을 무대로 한 게임.')}
<div class="game${G.banner ? ' has-banner' : ''}"${G.banner ? ` style="background-image:url(${img(G.banner)})"` : ''}><div class="game-in"><div class="kicker light">${ready ? 'PLAY NOW' : 'COMING SOON'}</div>
<h2>${esc(G.title)}</h2><div class="game-sub">${esc(G.sub)}</div><p>${esc(G.desc)}</p>
${ready ? `<a class="btn light" href="${esc(G.url)}" >게임 시작하기 →</a>` : '<span class="btn light ghost">곧 공개됩니다</span>'}</div>
${G.banner ? '' : '<div class="game-art"><span class="g-sun"></span><span class="g-moon"></span><span class="g-mtn"></span></div>'}</div></section></div>`;
  write('/play/', layout({ p: '/play/', title: `${G.title} — ${G.sub} | ${S.name}`, desc: cut(G.desc, 150), image: G.banner || undefined, sec: 'game', body,
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
      author: { '@type': 'Organization', name: '수락스트릿 편집부', url: BASE + '/' }, publisher: { '@type': 'Organization', name: S.name, url: BASE + '/' },
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
  const body = `<div class="wrap"><section class="sec">${head('TRAILS', '등산로', '수락산역에서 시작하는 세 갈래 길.')}<div class="trs">
${D.TRAILS.map((t, i) => `<a class="trc" href="/trail/${t.slug}/"><div class="trc-n">${num2(i + 1)}</div><div class="trc-b"><div class="trc-lv">${esc(t.level)} · ${esc(t.dist)} · ${esc(t.time)}</div><h2>${esc(t.name)}</h2><p>${esc(t.lead)}</p><div class="route">${t.route.map(esc).join('<i>›</i>')}</div></div></a>`).join('')}
</div><div class="safety"><div class="kicker">SAFETY</div><ul>${D.SAFETY.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div></section></div>`;
  write('/trail/', layout({ p: '/trail/', title: `수락산 등산로 — 주봉 · 벽운계곡 · 둘레길 | ${S.name}`, desc: '수락산역 3번 출구에서 시작하는 수락산 주봉 코스(8.2km), 벽운계곡 코스, 둘레길 코스 안내와 안전 수칙.', sec: 'trail', body,
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
if (fs.existsSync(path.join(ROOT, 'game/index.html'))) urls.push('/game/');   // 다른 창이 올린 실제 게임
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(p => `  <url><loc>${abs(p)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /app-legacy.html\nDisallow: /functions/\nDisallow: /content/\nDisallow: /tools/\n\nSitemap: ${BASE}/sitemap.xml\n`);
const items = [...POSTS.map(p => ({ t: `[수락산 사람들 제${p.no}화] ${p.title}`, u: abs(p.url), d: p.summary, date: p.date })),
  ...D.COLUMNS.map(c => ({ t: c.title, u: abs(`/column/${c.id}/`), d: c.summary, date: S.seriesStart }))].sort((a, b) => b.date.localeCompare(a.date));
const rfc = d => new Date(d + 'T09:00:00+09:00').toUTCString();
fs.writeFileSync(path.join(ROOT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n<title>${esc(S.name)}</title><link>${BASE}/</link><description>${esc(S.desc)}</description><language>ko</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items.map(it => `<item><title>${esc(it.t)}</title><link>${it.u}</link><guid>${it.u}</guid><description>${esc(it.d)}</description><pubDate>${rfc(it.date)}</pubDate></item>`).join('\n')}\n</channel></rss>\n`);

console.log(`기준일 ${TODAY} · 페이지 ${written.length}개 · 연재 공개 ${POSTS.length}/${ALL_POSTS.length}화`);
written.forEach(p => console.log('  ' + p));
if (warn.length) { console.log('⚠ 확인:'); warn.forEach(w => console.log('  - ' + w)); }
