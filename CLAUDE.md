# 주재원노트 — 수익형 정적 사이트

## 목적
해외 주재원·해외이주 준비자를 위한 한국어 정보 사이트. 검색 유입 → 애드센스 수익. 완전 방치형 운영이 목표.
전체 기획은 `기획서.md`, 배포·등록 이력은 `DEPLOY.md` 참조.

## 현재 상태 (2026-07-12 기준)
- **라이브**: https://expatnote.cloud (커스텀 도메인, SSL 자동) / 예비 주소: https://expatnote.ysmsgh701.workers.dev
- **저장소**: github.com/ysmsgh701-bit/expatnote (비공개, main 브랜치)
- **검색 등록**: 구글 서치콘솔 + 네이버 서치어드바이저 모두 expatnote.cloud로 소유확인·sitemap 제출 완료
- **콘텐츠**: 글 23편 + 고정 3페이지. 전부 저자 실제 경험 반영·존댓말 완료
- **남은 일**: 색인 축적(1~2주) → 애드센스 신청 → 승인 후 `config.json`의 `adsenseClient`에 게시자 ID 입력(광고 자동 활성화)

## 저자 (콘텐츠의 근거 — 항상 이 관점 유지)
- 대만·멕시코·폴란드 3개국 주재원을 실제로 겪은 재무 담당자. 재무·세무·인사·총무를 현지에서 단독 총괄한 경험 보유.
- 강점 영역: 세금·환율·송금·자금 등 "돈" 콘텐츠 = 진짜 전문. 3개국 비교 = 경쟁자 없음.
- **회사 실명은 쓰지 않는다.** "제조 대기업", "렌탈·물류 법인" 식으로 익명화. 단 역할·국가·기간·전문 배경(재무·MBA)은 유지.
- 회사 내부정보·특정 수치는 쓰지 않는다. 일반화된 절차·기준·본인 판단만 서술.

## 톤
- 직접 겪은 사람이 후배에게 알려주는 톤. 단정하고 실용적. 과장·감탄사 금지.
- **존댓말(합니다체)**: "~했습니다 / ~하면 됩니다 / ~입니다" 체로 씁니다. 광고성 표현 금지.

## 구조
- 글 = `content/{category}/{slug}.md` 파일 1개. 글 추가 = md 파일 1개 추가로 끝.
- 카테고리 4개: `before`(부임 전 준비) · `settle`(현지 정착) · `money`(돈·세금, 차별화 핵심) · `family`(가족·생활)
- 고정 페이지 = `pages/{slug}.md` (about, privacy, contact).
- 빌드: `node build.js` → `dist/` 생성. 로컬 미리보기: `npx serve dist`.
- 설정 변경은 `config.json` 만 수정 (사이트명·도메인·색상·메뉴·저자·인증코드·광고ID).
- 디자인: 토큰·스타일은 `static/style.css`, HTML 구조는 `templates.js`. 폰트는 Pretendard(웹폰트, jsdelivr CDN).

## 배포 파이프라인 (자동)
- **push → 배포**: main에 push하면 Cloudflare가 `node build.js`(빌드) → `npx wrangler deploy`(배포) 실행. 손댈 것 없음.
- 배포 설정은 `wrangler.jsonc` — 정적 에셋 `dist/`, 커스텀 도메인 routes(expatnote.cloud, www). **name(`expatnote`) 변경 금지.**
- **매일 자동 재배포**: GitHub Actions(`.github/workflows/scheduled-deploy.yml`)가 매일 KST 0시에 Cloudflare Deploy Hook 호출(저장소 시크릿 `CF_DEPLOY_HOOK` 설정 완료). 예약 글이 이때 자동 공개됨.
- 검색엔진 인증은 `config.json`의 `googleSiteVerification` / `naverSiteVerification` → head 메타태그 자동 삽입. 도메인이 바뀌면 새 코드로 교체 후 재등록.
- 서치콘솔/네이버 확인 파일이나 `ads.txt`가 필요하면 `static/`에 넣으면 빌드 시 사이트 루트로 복사됨.

## 글 작성 규칙
- front matter 필수: `title, description, category, tags, country, featured, date, updated`
- `description`은 120~155자, 글마다 고유하게. `<title>`은 `{제목} — 주재원노트` 자동 생성.
- h1은 빌드가 title로 자동 생성 → 본문은 `##`(h2)부터 시작. `#`(h1) 쓰지 말 것.
- 세금·제도 글은 `category: money` 또는 tags에 `세금` 포함 시 하단 면책 고지 자동 삽입.
- **경험 원칙**: AI 초안 그대로 게시 금지. 초안에는 `[여기에 본인 경험 추가]` 마커를 본문 2곳 이상 배치하고, 게시 전 반드시 실제 경험으로 교체. (기존 23편은 교체 완료)
- 국가 근거가 있으면 본문에 드러낸다 (예: "대만에서는…"). 3개국 공통이면 `country: [대만, 멕시코, 폴란드]`.
- `featured: true`는 홈 상단 "먼저 읽어보세요"에 노출 — 시그니처 비교글 전용, 2개 유지.

## 마크다운 지원 범위 (build.js가 처리하는 문법)
`##`/`###` 제목, `**굵게**`, `[링크](url)`, `- ` 목록, `1. ` 순서목록, `> ` 인용,
`| 표 |`, `---` 구분선, 빈 줄로 구분되는 문단. 이 범위 안에서 작성할 것.

## 예약 발행
- front matter의 `date`가 **미래 날짜**면 그 날짜(한국시간 0시)까지 사이트에 노출되지 않음. 날짜가 되면 매일 자동 재배포로 자동 공개.
- 미리보기(예약 글까지 전부 보기): `PREVIEW=1 node build.js`
- 운영 패턴: 글 여러 편을 미리 쓰고 `date`만 2~4일 간격으로 지정해 한 번에 push → 방치해도 주기적 갱신.

## 애드센스 (남은 단계)
1. 서치콘솔 `페이지`에서 "색인 생성됨"이 몇 개라도 잡히면(등록 후 1~2주) 신청 가능 — 방문자 수는 무관.
2. adsense.google.com에서 expatnote.cloud 추가 → 게시자 ID(ca-pub-…) 발급.
3. `config.json`의 `adsenseClient`에 입력 → push → 광고 슬롯(각 글 상·하단, 홈) 자동 활성화.
4. ads.txt 요구 시 `static/ads.txt`로 추가.
5. 반려 시: 글 5편 추가 후 2주 뒤 재신청 (흔한 사유: 콘텐츠 부족·중복).

## 주의사항
- 이 폴더의 `윤석민_이력서*.docx` 등 개인 문서는 `.gitignore`로 커밋 제외됨 — **절대 커밋·게시하지 말 것.**
- 도메인 만료 주의: expatnote.cloud는 가비아에서 구매(2026-07). 연 단위 갱신 필요.
- 사이트 검증 시 로컬 PowerShell `Invoke-WebRequest`는 한글 인코딩이 깨지므로 WebClient+UTF8 또는 curl 사용. `$home`은 PS 예약변수라 쓰지 말 것.
