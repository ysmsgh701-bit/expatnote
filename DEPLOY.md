# 배포 · 검색등록 · 애드센스 절차

주재원노트를 실제로 공개하고 애드센스 심사까지 넣는 전체 순서다. 위에서부터 차례로 진행하면 된다.

---

## 0. 준비물

- 구글 계정 (서치콘솔·애드센스·애널리틱스 공용)
- 네이버 계정 (서치어드바이저)
- 도메인 구매 비용 (연 1~2만 원)
- (권장) GitHub 계정 — 글 추가 후 자동 재배포용

---

## 1. 도메인 구매

1. 짧고 발음 가능한 도메인을 산다. 후보: `jujaewonnote.com`, `expatnote.kr` 등.
2. 구매처: **Cloudflare Registrar**(원가, 마진 없음) 또는 가비아·후이즈.
   - Cloudflare에서 사면 이후 3단계 연결이 가장 매끄럽다.
3. 산 뒤 `config.json`의 `siteUrl`을 실제 도메인으로 교체한다.
   ```json
   "siteUrl": "https://내가산도메인.com"
   ```
4. 저장 후 반드시 다시 빌드: `node build.js` (sitemap·canonical에 도메인이 반영됨)

---

## 2. Cloudflare Pages 배포

### 방법 A — GitHub 연동 (권장: 글 추가 시 자동 재배포)

1. 이 폴더를 GitHub 저장소로 올린다. (`dist/`는 올리지 않아도 됨 — Cloudflare가 빌드함)
   - `.gitignore`에 `dist/`, `node_modules/` 추가 권장.
2. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. 저장소 선택 후 빌드 설정:
   - **Build command**: `node build.js`
   - **Build output directory**: `dist`
   - Framework preset: None
4. Deploy를 누르면 몇 분 뒤 `*.pages.dev` 주소로 사이트가 뜬다.

### 방법 B — 직접 업로드 (가장 빠름, git 불필요)

1. 로컬에서 `node build.js` 실행.
2. Cloudflare Pages → **Upload assets** → `dist` 폴더 통째로 드래그.
   - 단, 이 방식은 글을 추가할 때마다 수동 재업로드해야 한다.

### 커스텀 도메인 연결

1. Pages 프로젝트 → **Custom domains** → **Set up a domain** → 산 도메인 입력.
2. Cloudflare에서 산 도메인이면 자동 연결. 외부 등록업체면 안내되는 DNS(CNAME) 설정.
3. HTTPS는 Cloudflare가 자동 발급한다.

> 배포 후 `https://내도메인/sitemap.xml`, `/robots.txt`, `/about.html`이 열리는지 확인.

---

## 3. 구글 서치 콘솔 등록

1. [search.google.com/search-console](https://search.google.com/search-console) 접속.
2. 속성 추가 → **URL 접두어**에 `https://내도메인/` 입력.
3. 소유권 확인 (둘 중 하나):
   - **DNS TXT (권장, Cloudflare면 제일 쉬움)**: 안내된 TXT 레코드를 Cloudflare DNS에 추가.
   - **HTML 파일**: 내려받은 `google...html` 파일을 이 프로젝트의 `static/` 폴더에 넣고 → `node build.js` → 재배포. (static/ 파일은 사이트 루트로 복사됨)
4. 확인되면 좌측 **Sitemaps** → `sitemap.xml` 제출.
5. **URL 검사**로 홈·주요 글 몇 개 색인 요청.

---

## 4. 네이버 서치 어드바이저 등록

1. [searchadvisor.naver.com](https://searchadvisor.naver.com) → 웹마스터 도구.
2. 사이트 등록 → `https://내도메인/` 입력.
3. 소유 확인:
   - **HTML 파일 업로드**: 받은 `naver...html`을 `static/`에 넣고 → `node build.js` → 재배포.
   - 또는 메타태그 방식(이 경우 알려주면 템플릿 head에 넣어줌).
4. 확인 후 **요청 → 사이트맵 제출**에 `sitemap.xml` 등록.
5. **웹페이지 수집** 요청으로 주요 URL 색인 유도.

---

## 5. 구글 애드센스 신청

> 심사에 2주~1개월 걸린다. 3~4단계 등록이 끝나고 콘텐츠가 안정적으로 보이면 바로 신청한다.

1. [adsense.google.com](https://adsense.google.com) 가입 → 사이트 `내도메인` 추가.
2. 애드센스가 주는 확인 스니펫을 head에 넣어야 한다:
   - `config.json`의 `adsenseClient`에 발급된 게시자 ID(`ca-pub-XXXX…`)를 넣고 → `node build.js` → 재배포.
   - (템플릿이 자동으로 head에 애드센스 스크립트를 넣도록 이미 만들어져 있다.)
3. `ads.txt` 요구 시: 애드센스가 준 한 줄을 담은 `ads.txt` 파일을 `static/`에 넣고 재배포.
4. 필수 페이지가 있는지 재확인: **소개 / 개인정보처리방침 / 연락처** — 이미 만들어져 있음.
5. 심사 신청 후 대기. **대기 중에도 백로그에서 주 2개씩 글을 추가**한다(기획서 3장 참고).

### 승인된 뒤

- 자동 광고로 시작 (`adsenseClient`만 채워져 있으면 글마다 광고 슬롯이 자동 활성화됨).
- 서치콘솔에서 유입 키워드를 보고, 수요 있는 주제로 글을 늘린다.

---

## 6. (선택) 구글 애널리틱스

1. [analytics.google.com](https://analytics.google.com)에서 속성 생성 → 측정 ID(`G-XXXX`) 발급.
2. `config.json`의 `analyticsId`에 넣고 → `node build.js` → 재배포. (자동으로 head에 삽입됨)

---

## 글 추가하는 법 (운영)

1. `content/{카테고리}/새글.md` 파일 하나 추가 (front matter 규격은 CLAUDE.md 참고).
2. `node build.js` 실행.
3. GitHub 연동(방법 A)이면 push만 하면 자동 재배포. 직접 업로드(방법 B)면 `dist` 재업로드.

---

## 체크리스트

- [ ] 도메인 구매 + `config.json` siteUrl 교체 + 재빌드
- [ ] Cloudflare Pages 배포 + 커스텀 도메인 연결 + HTTPS 확인
- [ ] sitemap.xml / robots.txt / 필수 3페이지 접속 확인
- [ ] 서치콘솔 등록 + 사이트맵 제출
- [ ] 네이버 서치어드바이저 등록 + 사이트맵 제출
- [ ] 각 글의 경험 내용 최종 검토 (사실 확인)
- [ ] 애드센스 신청
- [ ] (승인 후) adsenseClient 입력 + ads.txt + 재배포
