// 블루스카이 DOM에 의존하는 값은 이 파일에만 모은다. 사이트가 바뀌어 깨지면 여기부터 확인한다.
// 클래스명은 react-native-web 원자 클래스라 불안정하므로 role/구조로만 찾는다.

export const APPEARANCE_PATH = "/settings/appearance";

// <html class="theme--light | theme--dim | theme--dark">로 블루스카이의 현재 바탕이 표시된다.
// 시스템 모드도 여기에 반영된다. theme.css의 선택자(html.theme--<base>)와 맞춰야 한다.
export const THEME_BASES = ["light", "dim", "dark"] as const;
export type ThemeBase = (typeof THEME_BASES)[number];

/** 지금 적용 중인 블루스카이의 바탕(밝음/어둑함/어두움). 알 수 없으면 null이다. */
export const themeBaseOf = (root: HTMLElement): ThemeBase | null =>
  THEME_BASES.find((base) => root.classList.contains(`theme--${base}`)) ?? null;

export const RADIOGROUP = '[role="radiogroup"]';
export const RADIO = '[role="radio"]';

// 우리가 삽입한 요소 표시용
export const INJECTED_ATTR = "data-bt-theme-section";

// 숨긴 블루스카이 요소 표시용. theme.css가 이 속성이 있는 요소를 display:none으로 만든다.
export const HIDDEN_ATTR = "data-bt-hidden";
