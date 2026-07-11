#!/usr/bin/env node
/**
 * 주재원노트 정적 사이트 빌드 스크립트 (외부 의존성 없음, Node 18+)
 *
 *   node build.js
 *
 * content/{category}/{slug}.md  → dist/{category}/{slug}.html
 * pages/{slug}.md               → dist/{slug}.html
 * 카테고리 인덱스, 홈, sitemap.xml, robots.txt 자동 생성.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const T = require('./templates.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function writeFile(rel, content) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ────────────────────────────────────────────────────────────
// front matter 파서 (YAML 부분집합: 문자열, [배열], 불리언)
// ────────────────────────────────────────────────────────────
function parseFrontMatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    const key = mm[1];
    let val = mm[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (val === 'true' || val === 'false') {
      val = val === 'true';
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    data[key] = val;
  }
  return { data, body: m[2] };
}

// ────────────────────────────────────────────────────────────
// 마크다운 → HTML (지원 문법: CLAUDE.md 명시 범위)
// ────────────────────────────────────────────────────────────
function inline(text) {
  let s = esc(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (mm, label, url) => {
    const u = url.trim();
    const ext = /^https?:\/\//.test(u) && !u.includes(config.siteUrl);
    const attr = ext ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(u)}"${attr}>${label}</a>`;
  });
  return s;
}

function markdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isTableRow = l => /^\s*\|.*\|\s*$/.test(l);
  const isTableSep = l => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes('-');

  while (i < lines.length) {
    let line = lines[i];

    // 빈 줄
    if (/^\s*$/.test(line)) { i++; continue; }

    // 구분선
    if (/^---+\s*$/.test(line)) { html.push('<hr>'); i++; continue; }

    // 제목
    let h = line.match(/^(#{2,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugifyHeading(text);
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++; continue;
    }

    // 표
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip separator
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      html.push(renderTable(header, rows));
      continue;
    }

    // 인용
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      html.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    // 순서 목록
    if (/^\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\d+\.\s+/, '')); i++; }
      html.push('<ol>' + buf.map(x => `<li>${inline(x)}</li>`).join('') + '</ol>');
      continue;
    }

    // 비순서 목록
    if (/^[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^[-*]\s+/, '')); i++; }
      html.push('<ul>' + buf.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>');
      continue;
    }

    // 문단 (다음 빈 줄/블록 시작 전까지)
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
           !/^(#{2,3}\s|>|---+\s*$|\d+\.\s|[-*]\s)/.test(lines[i]) &&
           !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      para.push(lines[i]); i++;
    }
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return html.join('\n');
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}
function renderTable(header, rows) {
  const th = '<tr>' + header.map(c => `<th>${inline(c)}</th>`).join('') + '</tr>';
  const trs = rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('');
  return `<div class="table-wrap"><table><thead>${th}</thead><tbody>${trs}</tbody></table></div>`;
}
function slugifyHeading(text) {
  return 'h-' + text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// ────────────────────────────────────────────────────────────
// 콘텐츠 로드
// ────────────────────────────────────────────────────────────
function loadPosts() {
  return walk(path.join(ROOT, 'content')).map(file => {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const category = data.category || path.basename(path.dirname(file));
    const slug = path.basename(file, '.md');
    const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    const country = Array.isArray(data.country) ? data.country : (data.country ? [data.country] : []);
    return {
      slug, category, tags, country,
      title: data.title || slug,
      description: data.description || config.description,
      featured: data.featured === true,
      date: data.date || '',
      updated: data.updated || data.date || '',
      url: `/${category}/${slug}.html`,
      bodyHtml: markdown(body),
      rawBody: body,
    };
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function loadPages() {
  return walk(path.join(ROOT, 'pages')).map(file => {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const slug = path.basename(file, '.md');
    return {
      slug,
      title: data.title || slug,
      description: data.description || config.description,
      url: `/${slug}.html`,
      bodyHtml: markdown(body),
    };
  });
}

// 관련 글 3개: 같은 카테고리 최신 → 부족하면 태그 매칭
function relatedFor(post, all) {
  const others = all.filter(p => p.url !== post.url);
  const sameCat = others.filter(p => p.category === post.category);
  const picked = [...sameCat];
  if (picked.length < 3) {
    const byTag = others
      .filter(p => p.category !== post.category && p.tags.some(t => post.tags.includes(t)))
      .filter(p => !picked.includes(p));
    picked.push(...byTag);
  }
  if (picked.length < 3) {
    picked.push(...others.filter(p => !picked.includes(p)));
  }
  return picked.slice(0, 3);
}

// ────────────────────────────────────────────────────────────
// 빌드
// ────────────────────────────────────────────────────────────
function build() {
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  const posts = loadPosts();
  const pages = loadPages();

  // 정적 파일 복사
  const staticDir = path.join(ROOT, 'static');
  if (fs.existsSync(staticDir)) {
    for (const f of fs.readdirSync(staticDir)) {
      fs.copyFileSync(path.join(staticDir, f), path.join(DIST, f));
    }
  }

  // 글 페이지
  for (const post of posts) {
    const related = relatedFor(post, posts);
    writeFile(post.url.replace(/^\//, ''), T.postPage(config, post, related));
  }

  // 고정 페이지
  for (const page of pages) {
    writeFile(page.url.replace(/^\//, ''), T.staticPage(config, page));
  }

  // 카테고리 인덱스
  for (const [key, meta] of Object.entries(config.categories)) {
    const catPosts = posts.filter(p => p.category === key);
    writeFile(`${key}/index.html`, T.categoryPage(config, key, meta, catPosts));
  }

  // 홈
  writeFile('index.html', T.homePage(config, posts));

  // sitemap.xml
  const urls = [
    '/',
    ...Object.keys(config.categories).map(k => `/${k}/`),
    ...posts.map(p => p.url),
    ...pages.map(p => p.url),
  ];
  writeFile('sitemap.xml', renderSitemap(urls, posts));

  // robots.txt
  writeFile('robots.txt',
    `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);

  // 404
  writeFile('404.html', T.notFoundPage(config));

  console.log(`✅ 빌드 완료: 글 ${posts.length}개, 고정 ${pages.length}개, 카테고리 ${Object.keys(config.categories).length}개`);
  console.log(`   출력: ${path.relative(ROOT, DIST)}/`);
  console.log(`   미리보기: npx serve dist`);
}

function renderSitemap(urls, posts) {
  const lastmodOf = u => {
    const p = posts.find(x => x.url === u);
    return p ? (p.updated || p.date) : '';
  };
  const items = urls.map(u => {
    const loc = `${config.siteUrl}${u}`;
    const lm = lastmodOf(u);
    return `  <url>\n    <loc>${esc(loc)}</loc>${lm ? `\n    <lastmod>${lm}</lastmod>` : ''}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

build();
