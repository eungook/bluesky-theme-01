// 통합 테마: 밝음과 어두움을 한 묶음으로 고른다. 왼쪽부터 표시된다.
// id는 <html data-bt-theme> 값이며 theme.css의 선택자와 i18n의 Messages 키와 맞춰야 한다.
// 색은 theme.css에 있다. (--bt-<id>-light-0/25/50, --bt-<id>-dark-0/25/50/100)
// 어두운 쪽은 블루스카이의 어둑함/어두움 선택과 상관없이 이 테마의 어두운 색으로 칠한다.
export const THEMES = [
  { id: "mono" }, // 흑백: 블루스카이 기본 (밝음 + 어두움)
  { id: "soft" }, // 소프트: 편안 + 어둑함
  { id: "yellow" }, // 노랑: 아주 옅은 겨자색 / 밝은 겨자색
  { id: "forest" }, // 숲: 옅은 세이지 그린 / 그 색상을 어둡게 한 녹색
  { id: "lavender" }, // 라벤더: 옅은 보라 / 그 색상을 어둡게 한 보라
  { id: "sunset" }, // 노을: 옅은 복숭아색 / 그 색상을 어둡게 한 갈색
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

// 저장된 선택이 없을 때(최초 설치 등)의 값. theme.css는 "mono"에는 아무것도 덮어쓰지 않으므로 기본은 블루스카이 그대로다.
export const DEFAULT_THEME: ThemeId = "mono";
