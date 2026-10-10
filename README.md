# bluesky-theme-01

블루스카이 웹(`bsky.app`)의 테마 기능을 강화하는 크롬 확장(Manifest V3).

## 기능

- 설정 > 모양(`/settings/appearance`)에 "색상 테마" 선택을 추가한다. 테마는 밝음과 어두움을 묶은 하나의 선택이고, 각 선택지에는 지금 바탕(밝음 또는 어두움)에서 그 테마의 기본 배경색을 보여 주는 작은 원이 붙는다. 선택값은 `chrome.storage.sync`에 저장되고 `<html data-bt-theme="mono|soft|yellow|forest|lavender|sunset">`로 반영된다. ([themes.ts](src/content/themes.ts), [theme.css](src/content/theme.css))
  - **흑백** (기본): 블루스카이 그대로. 선택이 없을 때(최초 설치 등)는 이 값이다.
  - **소프트**: 편안(흰색 배경을 톤다운) + 어둑함.
  - **노랑**: 아주 옅은 겨자색 / 밝은 겨자색. (어두운 쪽이 밝아서 글자색이 바뀌지 않는 한 흰 글자가 잘 안 보인다. [docs/extension-guidelines.md](docs/extension-guidelines.md) 참고)
  - **숲**: 옅은 세이지 그린 / 그 색상을 어둡게 한 녹색.
  - **라벤더**: 옅은 보라 / 그 색상을 어둡게 한 보라.
  - **노을**: 옅은 복숭아색 / 그 색상을 어둡게 한 갈색.
  - 선택지는 한 줄에 3개씩 격자로 놓이고, 테마가 늘면 줄이 늘어난다.
  - 밝음, 어둑함, 어두움 세 바탕의 배경색을 모두 선택한 테마의 색으로 바꾼다. 어두운 쪽은 블루스카이의 "어두운 테마"(어둑함/어두움) 선택과 상관없이 선택한 테마의 어두운 색으로 칠하므로, 그 선택은 숨긴다. 배경만 바꾸고 테두리, 글자 등은 아직 건드리지 않는다.
- 문구는 한국어(ko), 영어(en), 일본어(ja)를 지원한다. `<html lang>`을 보고 고르며, 지원하지 않는 언어는 영어로 표시한다. ([i18n.ts](src/content/i18n.ts))

## 개발

```bash
bun install
bun run build       # dist/ 생성
bun run dev         # 변경 시 자동 재빌드
bun run typecheck
bun run icons       # src/icons/icon.svg에서 아이콘 PNG를 다시 만든다 (macOS + Chrome 필요)
bun run package     # 스토어에 올릴 out/bluesky-theme-<version>.zip을 만든다
```

`dist/`를 `chrome://extensions`의 "압축해제된 확장 프로그램을 로드합니다"로 불러온다.

확장 아이콘은 [src/icons/](src/icons/)에 있다. 원본은 `icon.svg`이고 16/32/48/128px PNG는 `bun run icons`로 만든다. 모양을 바꿀 때만 다시 만들고 PNG를 같이 커밋한다.

현재 버전은 1.0.0이다(`src/manifest.json`의 `version`). 스토어에 올리는 방법은 [store-submission.md](docs/store-submission.md)에 있고, 올릴 때마다 `version`을 먼저 올린다.

더 자세한 내용은 [docs/](docs/)를 참고한다.

- [extension-guidelines.md](docs/extension-guidelines.md): 빌드 주의사항, 블루스카이 DOM 메모
- [store-submission.md](docs/store-submission.md): 크롬 웹 스토어 등록
- [development-conventions.md](docs/development-conventions.md): 도구와 커밋 규칙
