# 용문동 마을 소개

승인된 `yongmundong-preview/index.html` 시안을 React로 구현했습니다. 일러스트는 창작물이며 지역 설명은 기획 예시입니다.

## 실행

Node.js 24 LTS 권장.

```sh
npm ci
npm run dev
```

개발 화면: http://127.0.0.1:5173

```sh
npm run check
npm run preview
```

빌드 화면: http://127.0.0.1:4173. Vite 개발·미리보기 서버는 화면만 제공합니다. Hono API까지 함께 확인하려면 빌드 후 `npm run preview:pages`를 실행하고 출력된 주소에서 `/api/health`를 확인하세요. `npm run pages:check`는 Functions 번들링 검증입니다.

## 구조

- `src/components/`: 시안 섹션별 React 컴포넌트 및 메뉴 상태
- `src/styles/`: Tailwind와 시안 스타일, 제공된 Pretendard 정의
- `public/images/`: 창작 SVG 일러스트
- `scripts/prerender.mjs`: React 본문을 초기 HTML에 포함하는 SSG
- `server/app.js`, `functions/api/[[path]].js`: Hono API와 Pages 연결
- `tests/`: 초기 HTML, hydration·메뉴, SEO 설정, API 검증
- `.github/workflows/ci.yml`: GitHub push/PR 시 빌드 및 테스트

## 검색 노출

화면은 React로 작성하지만 배포 HTML에 제목·본문·내부 링크가 이미 포함됩니다. 클라이언트는 기존 HTML을 hydrate하여 메뉴 이벤트를 연결합니다. 메인 페이지 하나이므로 sitemap에는 메인 URL 하나만 포함됩니다. 향후 검증된 관광지·이야기를 상세 페이지로 추가할 때 각 URL도 사전 생성해야 합니다.

공개 주소는 `https://yongmunintro-2.pages.dev/`입니다. `.env.production`에 도메인과 색인 활성화를 설정했습니다. 빌드하면 메인 페이지 한 개를 포함하는 `/sitemap.xml`과 해당 사이트맵을 안내하는 `/robots.txt`가 생성됩니다. `#scenery` 등 섹션 링크는 별도 페이지가 아니므로 포함하지 않습니다. 도메인 변경 시 `.env.production` 또는 Cloudflare 빌드 환경변수를 수정하고 다시 빌드합니다.

```dotenv
SITE_URL=https://yongmunintro-2.pages.dev/
SITE_INDEXABLE=true
```

활성화하면 canonical, og:url, robots.txt, sitemap.xml에 실제 주소가 반영됩니다. Cloudflare의 `main` 이외 브랜치 배포는 자동으로 색인을 차단합니다. Cloudflare에 기존 `SITE_INDEXABLE=false` 환경변수가 있으면 파일 설정보다 우선하므로 Production 설정을 `true`로 변경해야 합니다. Google Search Console 및 네이버 서치어드바이저에 제출할 주소는 `https://yongmunintro-2.pages.dev/sitemap.xml`입니다. 폰트는 사용자가 지정한 jsDelivr URL에서 로드하며 연결 실패 시 시스템 sans-serif를 사용합니다.

## GitHub + Cloudflare Pages 배포

배포는 아직 수행하지 않았습니다. 사용자 승인 후 GitHub 저장소에 소스를 올리고 Cloudflare Pages에서 해당 저장소를 연결합니다.

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 저장소 루트
- Node version: `24`
- Production 환경변수: 실제 `SITE_URL`, 콘텐츠 확정 후 `SITE_INDEXABLE=true`
- Preview 환경변수: `SITE_INDEXABLE=false`

저장소의 `functions` 폴더가 API로 배포됩니다. `/api/*`만 Functions로 처리하며 나머지는 정적 파일입니다. 최상위 `404.html`을 제공해 없는 URL을 메인 페이지로 보내지 않습니다. GitHub CI는 검증만 수행하며 외부 배포 권한은 포함하지 않습니다.

공식 참고: [Vite SSR/사전 렌더링](https://vite.dev/guide/ssr.html), [React hydration](https://react.dev/reference/react-dom/client/hydrateRoot), [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite), [Hono Pages](https://hono.dev/docs/getting-started/cloudflare-pages). Hono의 deprecated Pages 어댑터 대신 표준 `app.fetch`를 Functions 진입점에서 직접 호출합니다.
