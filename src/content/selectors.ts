// 블루스카이 DOM에 의존하는 값은 이 파일에만 모은다. 사이트가 바뀌어 깨지면 여기부터 확인한다.
// 클래스명은 react-native-web 원자 클래스라 불안정하므로 role/구조로만 찾는다.

export const APPEARANCE_PATH = "/settings/appearance";

// <html class="theme--light | theme--dim | ..."> 로 현재 테마가 표시된다. 시스템 모드도 여기에 반영된다.
export const LIGHT_THEME_CLASS = "theme--light";

export const RADIOGROUP = '[role="radiogroup"]';
export const RADIO = '[role="radio"]';

// 우리가 삽입한 요소 표시용
export const INJECTED_ATTR = "data-bt-theme-section";
