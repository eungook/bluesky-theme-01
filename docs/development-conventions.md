# 개발 규칙

사람과 에이전트가 이 저장소에서 작업할 때 따르는 기본 약속.

## 도구

- 런타임, 패키지 매니저, 번들러, 테스트 러너는 모두 **Bun**을 쓴다. `node`, `npm`, `yarn`, `pnpm`, `npx`, `vite`, `jest`, `vitest`는 쓰지 않는다. 명령어 대응표는 루트 [CLAUDE.md](../CLAUDE.md)를 따른다.
- 의존성 추가는 `bun add`, 설치는 `bun install`. 잠금 파일은 `bun.lock`을 커밋한다.
- 스크립트는 `package.json`의 `scripts`에 등록하고 `bun run <script>`로 실행한다.

## 파일 수정 (에이전트)

- 파일은 **Edit/Write 도구**로 수정한다. `python3`, `sed`, `perl`, 셸 리다이렉션(`>`, `<<EOF`) 등 Bash로 파일 내용을 바꾸지 않는다. 수정 내용이 도구 호출에 그대로 드러나야 검토할 수 있고, 권한 규칙도 이 도구를 기준으로 적용된다.
- Edit은 먼저 Read한 파일에만 쓸 수 있다. 파일이 외부에서 바뀌었다는 알림이 오면 다시 Read한 뒤 Edit한다. 여러 군데를 바꿔야 하면 Edit을 여러 번 호출한다.
- Bash는 `git`, `bun` 같은 명령 실행에 쓴다. 커밋은 파일 수정과 한 명령으로 묶지 않고 `git` 명령만 따로 실행한다.
- 예외: 자동 생성물(`bun.lock`, `dist/`)과 `bun add` 같은 도구가 직접 바꾸는 파일은 해당 명령으로 바뀌는 것이 맞다.

## 커밋

- 커밋 시점과 크기는 작업자(사람 또는 에이전트)가 판단한다. 하나의 논리적 변경이 하나의 커밋이 되도록 적당한 크기로 나눈다. 관련 없는 변경을 한 커밋에 섞지 않는다.
- 커밋 메시지는 **한국어**로 쓰고 [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/) 형식을 따른다.

  ```
  <type>(<scope>): <한국어 요약>

  <필요하면 본문: 무엇을, 왜 바꿨는지>
  ```

  - `type`: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `build`, `chore`, `perf`, `ci`
  - `scope`는 선택. 예: `content`, `popup`, `background`, `build`
  - 요약은 짧게, 마침표 없이. 예: `feat(content): 다크 테마 CSS 변수 오버라이드 추가`
  - 호환성을 깨는 변경은 `!`를 붙이거나 본문에 `BREAKING CHANGE:`를 적는다.
- 사용자가 요청하기 전까지는 `main` 브랜치만 사용한다. 에이전트는 브랜치를 만들거나 옮기지 않고, 변경 크기와 상관없이 `main`에 커밋한다.
- 커밋 전에 빌드와 테스트가 통과하는지 확인한다 (`bun run build`, `bun test`). 해당 스크립트가 아직 없으면 생략한다.

## 문서

- 설계나 방향이 바뀌면 코드와 같은 커밋에서 관련 문서([extension-guidelines.md](extension-guidelines.md) 등)를 함께 고친다.
