# 검증 결과

## Google 로그인 추가
- 프로덕션 빌드 및 테스트 8개 통과: 로컬 키로 JWT 서명·대상·발급자·만료·nonce 검증, 교차 출처/입력 거부, 로그인 UI 성공·실패·재시도·로그아웃·늦은 응답 처리.
- Cloudflare Functions 번들링 성공.
- Vite 개발 서버 실응답: 화면 200, health 200, 잘못된 인증 401, 교차 출처 403 확인.
- Google SDK는 테스트에서 모의 구현했습니다. 실제 Google 계정의 팝업 로그인 및 실제 브라우저 시각 검증은 미실시입니다.
- 새 기능의 외부 배포 반영 여부는 별도로 확인해야 합니다.

## 초기 사이트 구현 당시

- `npm run check`: 프로덕션 클라이언트/SSG 빌드 성공, 테스트 4개 통과.
- `npm run pages:check`: Cloudflare Functions 번들링 성공.
- Vite preview: `/` HTTP 200, 최초 HTML에 소개 본문 포함 확인.
- Wrangler Pages 로컬 런타임: `/` 200, `/api/health` 200, `/api/missing` 404, `/missing-page` 404, `/robots.txt` 200 및 색인 차단 확인.
- DOM 테스트: hydration 복구 오류 없음, 메뉴 열기/닫기/Escape 및 포커스 복귀 확인.
- 브라우저 자동화 호스트 연결 불가로 데스크톱/모바일 실제 시각 검증은 미실시.
- 외부 GitHub 업로드 및 Cloudflare 배포는 미실시.

이 환경에서는 Wrangler가 기본 로그/설정 디렉터리 접근 제한을 받았습니다. 로그 경로를 작업 폴더로 지정하고, 로컬 런타임은 승인된 권한 확장 실행으로 검증했습니다. 배포는 수행하지 않았습니다.
