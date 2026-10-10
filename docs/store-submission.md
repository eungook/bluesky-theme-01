# 크롬 웹 스토어 등록

버전 1.0.0을 스토어에 올리는 데 필요한 것을 정리한다. 스토어 대시보드의 항목 이름과 요구 규격은 바뀔 수 있어서, 아래 내용 중 스토어 쪽 사실은 대시보드에서 다시 확인한다. (이 문서를 쓴 시점에 대시보드를 직접 열어 보지는 못했다.)

## 제출 파일

```bash
bun run package     # out/bluesky-theme-<version>.zip
```

`scripts/package.ts`가 `src/manifest.json`을 점검(name 45자, description 132자, 버전 형식, 128px 아이콘)한 뒤 `dist/`를 새로 빌드해 zip의 맨 위에 담는다. 업데이트를 올릴 때는 `src/manifest.json`의 `version`을 먼저 올린다. 같은 버전은 업로드가 거절된다.

## 사람이 해야 하는 일

에이전트가 할 수 없는 일이다.

1. **개발자 계정 등록.** Chrome 웹 스토어 개발자 대시보드에서 계정을 만들고 등록비(1회)를 낸다.
2. **스크린샷.** 로그인이 필요한 실제 bsky.app 화면에서 직접 찍는다(설정 > 모양의 색상 테마, 테마를 적용한 타임라인 등). 가짜 화면으로 만든 이미지는 스토어가 요구하는 "실제 모습"이 아니므로 쓰지 않는다. 규격은 대시보드에서 확인한다(보통 1280×800 또는 640×400).
3. **개인정보 처리방침 URL.** 이 확장은 정보를 수집하지 않지만 대시보드가 URL을 요구할 수 있다. 아래 "개인정보" 초안을 어디엔가 공개해 그 주소를 넣는다. (예: 저장소의 문서)
4. **연락처 이메일**과 필요하면 지원 페이지.
5. **제출**, 그리고 검토 결과 대응.

## 등록정보 초안

이름과 아이콘은 아래 "제출 전에 정할 것"의 결정에 따라 달라진다. 아래 텍스트의 이름은 현재 manifest의 값이다.

### 한국어

- **요약(132자 이내):** bsky.app 설정에 색상 테마 선택을 더합니다. 흑백, 소프트, 노랑, 숲, 라벤더, 노을 중에서 고르세요.
- **설명:**

  > bsky.app의 설정 > 모양에 "색상 테마"를 추가합니다. 밝음과 어두움을 한 묶음으로 묶은 테마를 고르면 화면의 배경색이 그 테마의 색으로 바뀝니다.
  >
  > - 흑백, 소프트, 노랑, 숲, 라벤더, 노을
  > - 밝은 화면, 어둑한 화면, 어두운 화면 모두에 적용
  > - 고른 테마는 크롬 계정에 동기화됩니다
  > - 한국어, 영어, 일본어 지원
  >
  > 참고: 어두운 쪽 색은 이 확장이 정하므로 블루스카이의 "어두운 테마"(어둑함/어두움) 선택은 숨겨집니다.
  >
  > 비공식 확장 프로그램입니다. 블루스카이(Bluesky)와 관련이 없습니다.
  > 개인정보를 수집하지 않습니다. 고른 테마 하나만 브라우저에 저장합니다.

### English

- **Summary:** Adds a color theme picker to Bluesky on the web: Mono, Soft, Yellow, Forest, Lavender, Sunset.
- **Description:**

  > Adds a "Color theme" section to Settings > Appearance on bsky.app. Pick a theme that bundles a light and a dark look, and the page backgrounds change to that theme's colors.
  >
  > - Mono, Soft, Yellow, Forest, Lavender, Sunset
  > - Works in the light, dim and dark themes
  > - Your choice syncs through your Chrome account
  > - Korean, English and Japanese
  >
  > Note: because this extension sets the dark colors, Bluesky's own "Dark theme" (Dim / Dark) picker is hidden.
  >
  > This is an unofficial extension and is not affiliated with Bluesky.
  > It collects no personal data. It only stores the one theme you pick in your browser.

### 日本語

일본어는 원어민 검수를 받지 않았다. 블루스카이의 설정 용어를 확인해서 다듬는다.

- **요약:** bsky.app にカラーテーマの選択を追加します。白黒・ソフト・イエロー・森・ラベンダー・夕焼けから選べます。
- **설명:**

  > bsky.app の設定にある外観の画面に「カラーテーマ」を追加します。ライトとダークを組み合わせたテーマを選ぶと、画面の背景色がそのテーマの色に変わります。
  >
  > 注: ダーク側の色はこの拡張機能が決めるため、Bluesky の「ダークテーマ」の選択は非表示になります。
  >
  > 非公式の拡張機能であり、Bluesky とは関係ありません。個人情報は収集せず、選んだテーマだけをブラウザに保存します。

## 권한 설명(대시보드 입력용)

- **단일 목적:** 블루스카이 웹(bsky.app)에서 색상 테마를 고를 수 있게 한다.
- **`storage`:** 사용자가 고른 테마 이름 하나를 `chrome.storage.sync`에 저장해 다음 방문과 다른 기기에서도 쓰기 위해서다.
- **호스트 권한 `https://bsky.app/*`:** 콘텐츠 스크립트로 설정 > 모양에 선택 화면을 넣고, 페이지 배경색을 CSS로 바꾸기 위해서다. 다른 사이트에는 접근하지 않는다.
- **원격 코드:** 사용하지 않는다. 모든 코드는 패키지 안에 있다.

## 개인정보

대시보드의 개인정보 항목에서 수집하는 데이터가 없다고 답할 수 있는지 확인한다(이 확장이 하는 일은 아래와 같다). 처리방침 초안:

> **Color Themes for Bluesky 개인정보 처리방침**
>
> 이 확장 프로그램은 개인정보를 수집하거나 외부 서버로 전송하지 않습니다.
> 사용자가 고른 테마 이름 한 개만 브라우저의 `chrome.storage.sync`에 저장하며, 이 값은 사용자의 크롬 계정을 통해 사용자의 기기 사이에서 동기화됩니다.
> 확장은 bsky.app에서만 동작하고, 페이지의 내용을 읽어 전송하지 않습니다.
> 문의: (연락처 이메일)

## 제출 전에 정할 것

[pending.md](pending.md)에 있다. 남은 큰 것은 아이콘의 상표 문제다.

- **이름은 정했다(2026-10-10): "Color Themes for Bluesky".** 하는 일이 드러나고 블루스카이를 "for Bluesky"로 뒤에 둬서 공식 확장처럼 읽히지 않게 했다. 스토어에서 같은 이름이 쓰이지 않는 것은 사용자가 확인했다.
- **블루스카이 나비 아이콘.** 스토어는 다른 서비스의 이름이나 로고로 공식 확장처럼 보이는 것을 막는 정책이 있고, 블루스카이의 로고는 그쪽의 상표다. 정책을 이 문서를 쓴 시점에 직접 확인하지 못했다. 거절되거나 나중에 삭제될 수 있다.
- **나비 경로가 기억으로 옮긴 것이다.** 공식 에셋과 다를 수 있으므로 그대로 올리지 않는다. ([extension-guidelines.md](extension-guidelines.md)의 아이콘 항목)
- **설명에 비공식임을 밝힌다.** 위 초안에는 이미 넣었다.

## 제출 뒤

- 검토에 보통 며칠이 걸린다고 알려져 있으나 정해진 시간은 아니다.
- 거절되면 사유가 메일과 대시보드에 나온다. 사유를 이 문서에 적어 둔다.
- 업데이트: `src/manifest.json`의 `version`을 올리고 `bun run package`로 만든 zip을 올린다.
