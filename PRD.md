# 용문동 마을 소개 사이트

## 목표와 범위
승인된 HTML 시안의 색상, 일러스트, 문구, 반응형 구성을 유지하는 React 메인 페이지를 구현한다. 지역의 정확한 행정구역 및 명소는 미확정이므로 기존 예시 표시를 유지한다. 실제 지명 정보나 방문 경로를 임의로 추가하지 않는다.

## 구현 계획
1. 시안을 React 컴포넌트·SVG 자산·스타일로 분리하고 Pretendard를 유지한다.
2. Vite와 Tailwind를 구성하고 모바일 메뉴를 React 상태로 구현한다.
3. React 서버 렌더링으로 빌드 시 HTML을 생성하고 클라이언트에서 hydrate한다.
4. Hono 상태 API와 Cloudflare Pages Functions를 연결한다.
5. SEO 메타데이터, sitemap, robots, 404, GitHub CI 및 배포 설명을 작성한다.
6. 빌드, 정적 HTML, API, 메뉴 동작을 검증한다.

## 완료 기준
- 초기 HTML에 본문과 링크가 포함된다.
- 제공된 폰트와 승인된 데스크톱·모바일 디자인이 유지된다.
- API 정상·오류 경로, 모바일 메뉴, 빌드 산출물 검증이 통과한다.
- GitHub 및 Cloudflare 배포는 별도 승인 후 진행한다.
- 실제 도메인과 콘텐츠 확정 전에는 기본적으로 noindex를 유지하며, SITE_URL 및 SITE_INDEXABLE=true 설정으로 정식 색인을 활성화한다.
