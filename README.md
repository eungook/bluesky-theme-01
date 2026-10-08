# bluesky-theme-01

블루스카이 웹(`bsky.app`)의 테마 기능을 강화하는 크롬 확장(Manifest V3).

## 기능

- 설정 > 모양(`/settings/appearance`)에서 밝은 테마일 때 "밝은 테마" (편안 / 밝음) 선택 버튼을 추가한다. 선택값은 `chrome.storage.sync`에 저장되고 `<html data-bt-light-theme="comfort|light">`로 반영된다.
  - **편안** (기본): 밝은 테마의 흰색 배경을 살짝 톤다운한다. ([theme.css](src/content/theme.css))
  - **밝음**: 블루스카이 밝은 테마 그대로.

## 개발

```bash
bun install
bun run build       # dist/ 생성
bun run dev         # 변경 시 자동 재빌드
bun run typecheck
```

`dist/`를 `chrome://extensions`의 "압축해제된 확장 프로그램을 로드합니다"로 불러온다.

더 자세한 내용은 [docs/](docs/)를 참고한다.

- [extension-guidelines.md](docs/extension-guidelines.md): 빌드 주의사항, 블루스카이 DOM 메모
- [development-conventions.md](docs/development-conventions.md): 도구와 커밋 규칙
