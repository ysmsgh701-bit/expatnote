'use strict';
/** HTML 렌더링 템플릿 (base / post / category / home / static). 외부 의존성 없음. */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function attr(s) { return esc(s); }

// 광고 슬롯: adsenseClient가 채워지면 자동 광고 코드, 아니면 자리표시 주석만
function adSlot(config, where) {
  if (!config.adsenseClient) return `<!-- ad-slot:${where} (애드센스 승인 후 config.adsenseClient 채우면 활성화) -->`;
  return `<div class="ad-slot ad-${where}">
  <ins class="adsbygoogle" style="display:block" data-ad-client="${attr(config.adsenseClient)}" data-ad-format="auto" data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;
}

function analytics(config) {
  if (!config.analyticsId) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${attr(config.analyticsId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${attr(config.analyticsId)}');</script>`;
}

function adsenseHead(config) {
  if (!config.adsenseClient) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${attr(config.adsenseClient)}" crossorigin="anonymous"></script>`;
}

function nav(config, current) {
  const links = config.menu.map(m => {
    const active = current && m.path.startsWith('/' + current) ? ' class="active"' : '';
    return `<a href="${attr(m.path)}"${active}>${esc(m.label)}</a>`;
  }).join('');
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${esc(config.siteName)}</a>
    <nav class="site-nav">${links}</nav>
  </div>
</header>`;
}

function footer(config) {
  const year = (config.updated || '2026').slice(0, 4);
  return `<footer class="site-footer">
  <div class="wrap">
    <p class="foot-links">
      <a href="/about">소개</a> ·
      <a href="/privacy">개인정보처리방침</a> ·
      <a href="/contact">연락처</a>
    </p>
    <p class="foot-copy">© ${esc(year)} ${esc(config.siteName)}. 이 사이트의 정보는 저자의 실제 경험을 바탕으로 하며, 개별 사안은 전문가 확인을 권장합니다.</p>
  </div>
</footer>`;
}

// 공통 레이아웃
function base(config, { title, description, url, current, jsonld, bodyHtml, ogType }) {
  const fullTitle = title === config.siteName ? title : `${title} — ${config.siteName}`;
  const canonical = `${config.siteUrl}${url}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:type" content="${attr(ogType || 'website')}">
<meta property="og:title" content="${attr(fullTitle)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:site_name" content="${attr(config.siteName)}">
<meta property="og:locale" content="${attr(config.locale || 'ko_KR')}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
${config.googleSiteVerification ? `<meta name="google-site-verification" content="${attr(config.googleSiteVerification)}">` : ''}
${config.naverSiteVerification ? `<meta name="naver-site-verification" content="${attr(config.naverSiteVerification)}">` : ''}
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
${adsenseHead(config)}
${analytics(config)}
</head>
<body>
${nav(config, current)}
<main class="wrap">
${bodyHtml}
</main>
${footer(config)}
</body>
</html>
`;
}

function catLabel(config, key) {
  return (config.categories[key] && config.categories[key].label) || key;
}

function postCard(config, p) {
  const cat = catLabel(config, p.category);
  const cty = p.country && p.country.length ? `<span class="card-country">${p.country.map(esc).join('·')}</span>` : '';
  return `<li class="post-card">
  <a href="${attr(p.url)}">
    <span class="card-cat">${esc(cat)}</span>
    <span class="card-title">${esc(p.title)}</span>
    <span class="card-desc">${esc(p.description)}</span>
    <span class="card-meta">${cty}${p.updated ? `<time datetime="${attr(p.updated)}">${esc(p.updated)}</time>` : ''}</span>
  </a>
</li>`;
}

// 글 페이지
function postPage(config, post, related) {
  const isMoney = post.category === 'money' || (post.tags || []).includes('세금');
  const disclaimer = isMoney
    ? `<aside class="disclaimer">본 글은 저자의 실무 경험을 바탕으로 한 일반 정보입니다. 세금·법률·비자 등 개별 사안은 관할 세무서, 세무사·회계사·법률 전문가 또는 대사관에 반드시 확인하시기 바랍니다.</aside>`
    : '';
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    dateModified: post.updated || post.date || undefined,
    author: { '@type': 'Person', name: config.author },
    publisher: { '@type': 'Organization', name: config.siteName },
    mainEntityOfPage: `${config.siteUrl}${post.url}`,
  });
  const cty = post.country && post.country.length
    ? `<span class="meta-country">${post.country.map(esc).join(' · ')} 경험 기준</span>` : '';
  const relatedHtml = related.length ? `
<section class="related">
  <h2>관련 글</h2>
  <ul class="post-list">${related.map(p => postCard(config, p)).join('')}</ul>
</section>` : '';

  const body = `
<article class="post">
  <nav class="breadcrumb"><a href="/">홈</a> › <a href="/${post.category}/">${esc(catLabel(config, post.category))}</a></nav>
  <h1>${esc(post.title)}</h1>
  <div class="post-meta">
    ${post.updated ? `<time datetime="${attr(post.updated)}">최종 수정 ${esc(post.updated)}</time>` : ''}
    ${cty}
  </div>
  ${adSlot(config, 'top')}
  <div class="post-body">
${post.bodyHtml}
  </div>
  ${adSlot(config, 'bottom')}
  ${disclaimer}
  <div class="author-box">
    <strong>글쓴이 · ${esc(config.author)}</strong>
    <p>${esc(config.authorBio)}</p>
  </div>
</article>
${relatedHtml}`;

  return base(config, {
    title: post.title, description: post.description, url: post.url,
    current: post.category, jsonld, bodyHtml: body, ogType: 'article',
  });
}

// 카테고리 페이지
function categoryPage(config, key, meta, posts) {
  const list = posts.length
    ? `<ul class="post-list">${posts.map(p => postCard(config, p)).join('')}</ul>`
    : `<p class="empty">준비 중입니다.</p>`;
  const body = `
<section class="category-head">
  <nav class="breadcrumb"><a href="/">홈</a> › ${esc(meta.label)}</nav>
  <h1>${esc(meta.label)}</h1>
  <p class="lead">${esc(meta.desc)}</p>
</section>
${list}`;
  return base(config, {
    title: meta.label, description: meta.desc, url: `/${key}/`, current: key, bodyHtml: body,
  });
}

// 홈
function homePage(config, posts) {
  const featured = posts.filter(p => p.featured).slice(0, 2);
  const latest = posts.slice(0, 8);
  const featuredHtml = featured.length ? `
<section class="featured">
  <h2>먼저 읽어보세요</h2>
  <ul class="post-list feature-list">${featured.map(p => postCard(config, p)).join('')}</ul>
</section>` : '';

  const catCards = Object.entries(config.categories).map(([k, m]) => {
    const n = posts.filter(p => p.category === k).length;
    return `<a class="cat-card" href="/${k}/">
      <span class="cat-label">${esc(m.label)}</span>
      <span class="cat-desc">${esc(m.desc)}</span>
      <span class="cat-count">${n}개 글</span>
    </a>`;
  }).join('');

  const heroSvg = `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="세계 지도와 항로">
  <g fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.4">
    <circle cx="110" cy="110" r="80"/>
    <ellipse cx="110" cy="110" rx="31" ry="80"/>
    <ellipse cx="110" cy="110" rx="61" ry="80"/>
    <line x1="30" y1="110" x2="190" y2="110"/>
    <path d="M46 70 H174"/>
    <path d="M46 150 H174"/>
  </g>
  <path d="M50 152 Q108 54 174 92" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round" opacity="0.95"/>
  <circle cx="50" cy="152" r="5.5" fill="#e67e22"/>
  <circle cx="174" cy="92" r="5.5" fill="#ffffff"/>
</svg>`;
  const body = `
<section class="hero-band">
  <div class="hero-card">
    <span class="hero-eyebrow">대만 · 멕시코 · 폴란드 3개국 주재원 기록</span>
    <h1>해외 주재원 부임,<br>무엇부터 준비할까요?</h1>
    <p>${esc(config.description)}</p>
    <div class="hero-actions">
      <a class="hero-cta" href="/before/checklist-d90">부임 준비 체크리스트</a>
      <a class="hero-link" href="/before/compare-three-countries">3개국 생활 비교 →</a>
    </div>
  </div>
  <div class="hero-visual" aria-hidden="true">${heroSvg}</div>
</section>
<!-- Pitch Master 게임 배너 -->
<a class="pm-banner" href="https://claude.ai/code/artifact/37c23348-9819-4e06-a3c5-f1c8f7324788" target="_blank" rel="noopener">
  <span class="pm-banner__glow" aria-hidden="true"></span>
  <span class="pm-banner__icon" aria-hidden="true">⚽</span>
  <span class="pm-banner__text">
    <span class="pm-banner__title">Pitch Master</span>
    <span class="pm-banner__sub">직접 만든 축구 매니저 게임 — 구단을 맡아 시즌을 이끌어 보세요</span>
  </span>
  <span class="pm-banner__cta">지금 플레이 →</span>
</a>
<style>
.pm-banner{display:flex;align-items:center;gap:16px;max-width:720px;margin:20px auto;padding:16px 20px;border-radius:14px;text-decoration:none;color:#e8edf7;background:linear-gradient(135deg,#12351f 0%,#0f1420 60%,#1a2233 100%);border:1px solid #2e5b3b;box-shadow:0 6px 24px rgba(0,0,0,.25);position:relative;overflow:hidden;transition:transform .15s ease,box-shadow .15s ease;font-family:'Pretendard','Segoe UI','Malgun Gothic',system-ui,sans-serif}
.pm-banner:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.pm-banner__glow{position:absolute;inset:0;background:radial-gradient(circle at 12% 30%,rgba(74,222,128,.18),transparent 45%);pointer-events:none}
.pm-banner__icon{font-size:34px;line-height:1;flex:0 0 auto}
.pm-banner__text{display:flex;flex-direction:column;gap:3px;flex:1 1 auto;min-width:0}
.pm-banner__title{font-size:19px;font-weight:800;color:#4ade80;letter-spacing:.2px}
.pm-banner__sub{font-size:13px;color:#8a97b1}
.pm-banner__cta{flex:0 0 auto;background:#4ade80;color:#06210f;font-weight:800;font-size:14px;padding:10px 16px;border-radius:9px;white-space:nowrap}
@media(max-width:560px){.pm-banner{flex-wrap:wrap;padding:14px;gap:12px}.pm-banner__sub{font-size:12px}.pm-banner__cta{width:100%;text-align:center}}
</style>
<!-- /Pitch Master 게임 배너 -->
<section class="cat-grid">${catCards}</section>
${featuredHtml}
${adSlot(config, 'home')}
<section class="latest">
  <h2>최신 글</h2>
  <ul class="post-list">${latest.map(p => postCard(config, p)).join('')}</ul>
</section>`;
  return base(config, {
    title: config.siteName, description: config.description, url: '/', current: '', bodyHtml: body,
  });
}

// 고정 페이지
function staticPage(config, page) {
  const body = `
<article class="page">
  <h1>${esc(page.title)}</h1>
  <div class="post-body">
${page.bodyHtml}
  </div>
</article>`;
  return base(config, {
    title: page.title, description: page.description, url: page.url, current: '', bodyHtml: body,
  });
}

// 404
function notFoundPage(config) {
  const body = `
<section class="notfound">
  <h1>페이지를 찾을 수 없습니다</h1>
  <p>주소가 바뀌었거나 삭제된 글일 수 있습니다. <a href="/">홈으로 돌아가기</a></p>
</section>`;
  return base(config, {
    title: '페이지를 찾을 수 없습니다', description: config.description, url: '/404.html', current: '', bodyHtml: body,
  });
}

module.exports = { postPage, categoryPage, homePage, staticPage, notFoundPage };
