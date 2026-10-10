// 확장이 그리는 문구. 언어는 블루스카이 앱의 언어 설정을 따르므로 브라우저 UI 언어를 쓰는 chrome.i18n 대신
// <html lang>으로 정한다. 새 문구는 모든 언어에 같이 추가한다. (타입이 빠진 키를 잡아 준다)

export interface Messages {
  /** 섹션 제목 */
  title: string;
  /** 선택지 라벨. 키는 LightThemeId와 같다. */
  comfort: string;
  light: string;
}

export const MESSAGES = {
  en: { title: "Light theme", comfort: "Comfort", light: "Light" },
  ko: { title: "밝은 테마", comfort: "편안", light: "밝음" },
} satisfies Record<string, Messages>;

export type Locale = keyof typeof MESSAGES;

export const FALLBACK_LOCALE: Locale = "en";

const isLocale = (v: string | undefined): v is Locale => v !== undefined && Object.hasOwn(MESSAGES, v);

/** `<html lang>` 값에서 지원하는 언어를 고른다. "ko-KR"은 "ko"로 보고, 지원하지 않거나 없으면 en이다. */
export function resolveLocale(lang: string | null | undefined): Locale {
  const primary = lang?.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(primary) ? primary : FALLBACK_LOCALE;
}
