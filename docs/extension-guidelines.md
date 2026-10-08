# 크롬 확장 개발 가이드라인

블루스카이 웹(`bsky.app`)의 테마 기능을 강화하는 크롬 확장(Manifest V3)을 만들 때의 주의사항과 설계 시 고려사항. 사람과 에이전트 모두 코드를 작성하기 전에 읽는다.

> 상태: 아직 구현 전. 아래 구조와 결정은 초기 방향이며, 실제 구현과 달라지면 이 문서를 같이 고친다.

## 기본 방침

- 런타임/번들러/패키지 매니저는 Bun (자세한 규칙은 루트 [CLAUDE.md](../CLAUDE.md)).
- 확장은 **빌드해서 `dist/`를 로드**하는 방식으로 제공한다. 개발 중에는 `chrome://extensions`에서 "압축해제된 확장 프로그램 로드"로 `dist/`를 가리킨다. 배포 시에는 `dist/`를 zip으로 묶는다.
- Manifest V3는 원격 코드 실행을 금지한다. 모든 코드는 빌드 시점에 번들에 포함해야 하며, CDN 스크립트를 런타임에 불러오지 않는다.

## 권장 구조

```
src/
  content/index.ts      # 콘텐츠 스크립트: 테마 스타일 주입 (iife)
  background/index.ts   # 서비스 워커 (필요할 때만)
  popup/index.html      # 팝업 UI
  popup/popup.ts
  manifest.json
build.ts                # Bun.build + 정적 파일 복사
dist/                   # 빌드 산출물 (git 제외)
```

## 빌드 시 주의할 점

1. **정적 파일은 직접 복사한다.** `bun build`는 JS/CSS/HTML만 처리한다. `manifest.json`, 아이콘 등은 `build.ts`에서 `dist/`로 복사한다. 빌드는 CLI보다 `Bun.build()`를 호출하는 `build.ts`로 통일한다.
2. **출력 파일명을 고정한다.** manifest가 번들 경로를 참조하므로 해시 파일명이 붙으면 깨진다. `naming` 옵션으로 고정하고, HTML 진입점(팝업/옵션)은 번들 후 경로 참조가 맞는지 확인한다.
3. **포맷과 타깃.** 모든 진입점은 `target: "browser"`. 콘텐츠 스크립트는 ES 모듈로 로드되지 않으므로 `format: "iife"`로 낸다. 서비스 워커는 manifest에서 `"type": "module"`을 지정했을 때만 `esm`을 쓴다.
4. **Bun 런타임 API를 확장 코드에 쓰지 않는다.** `Bun.serve`, `bun:sqlite`, `Bun.file` 등은 브라우저에서 동작하지 않는다. 빌드 스크립트(`build.ts`)에서만 쓴다.
5. **개발 중 리로드.** `Bun.serve`의 HMR은 확장 페이지에서 쓸 수 없다. `bun build --watch` 또는 `build.ts`의 watch 모드로 재빌드하고, 확장 새로고침은 `chrome://extensions`에서 하거나 별도 리로드 스크립트를 둔다.
6. **타입.** `@types/chrome`를 설치해 `chrome.*` API 타입을 쓴다.

## 테마 기능 설계 시 고려할 점

- **블루스카이 웹앱의 DOM은 불안정하다.** React Native Web 기반이라 클래스명이 해시되거나 배포마다 바뀔 수 있다. 클래스 선택자에 의존하지 않는다.
- **선택자 우선순위:** CSS 변수 오버라이드(`:root`) → `data-testid` → `aria-*` 속성 → (최후) 구조 선택자. 블루스카이가 자체 테마(라이트/다크/다임)를 CSS 변수로 관리하므로 변수를 덮어쓰는 방식이 가장 견고하다.
- **깜빡임(FOUC) 방지.** 콘텐츠 스크립트는 `run_at: "document_start"`로 두고, `<style>`을 가능한 빨리 주입한다.
- **설정 저장.** `chrome.storage.sync`에 저장한다. 팝업/옵션 페이지에서 바꾸면 콘텐츠 스크립트가 `chrome.storage.onChanged`로 즉시 반영한다. 별도 메시지 패싱은 필요할 때만 쓴다.
- **권한 최소화.** `host_permissions`는 `https://bsky.app/*`로 한정하고, `permissions`는 `storage` 등 꼭 필요한 것만 선언한다.
- **깨짐에 대비한다.** 블루스카이 쪽 변경으로 선택자가 깨질 수 있다. 선택자는 한 곳(상수 모듈)에 모아 두고, 깨졌을 때 고칠 위치가 명확하도록 한다.

## 수정 시 규칙

- 위 내용과 다른 방향으로 구현하게 되면 코드만 고치지 말고 이 문서도 함께 갱신한다.
- 새로 알게 된 블루스카이 DOM/변수 정보(안정적인 선택자, CSS 변수 이름 등)는 이 문서나 `docs/` 아래 별도 문서에 기록한다.
