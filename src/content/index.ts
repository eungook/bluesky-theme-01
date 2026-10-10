import { type Locale, MESSAGES, resolveLocale } from "./i18n";
import { APPEARANCE_PATH, HIDDEN_ATTR, INJECTED_ATTR, RADIOGROUP, type ThemeBase, themeBaseOf } from "./selectors";
import { createThemeSection, type ThemeSection } from "./theme-section";
import { DEFAULT_THEME, THEMES, type ThemeId } from "./themes";

const STORAGE_KEY = "theme";
const ROOT_ATTR = "data-bt-theme";

let selected: ThemeId = DEFAULT_THEME;
let current: (ThemeSection & { locale: Locale; base: ThemeBase }) | null = null;

const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

function applySelection(id: ThemeId) {
  selected = id;
  document.documentElement.setAttribute(ROOT_ATTR, id);
}

// 블루스카이는 이전에 방문한 화면을 숨긴 채 DOM에 남겨 둘 수 있다. 화면에 보이는 요소만 대상으로 한다.
const isVisible = (el: HTMLElement) => el.checkVisibility?.() ?? el.getClientRects().length > 0;

function showHidden() {
  document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((el) => el.removeAttribute(HIDDEN_ATTR));
}

function removeInjected() {
  document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) => el.remove());
  showHidden(); // 화면을 떠나면 숨겼던 블루스카이 요소를 되돌린다.
  current = null;
}

/**
 * 어두운 쪽에서는 통합 테마가 어두운 색을 정하므로 블루스카이의 "어두운 테마"(어둑함/어두움) 선택은
 * 효과가 없다. 그래서 숨긴다. 우리 섹션 바로 뒤 형제 중 radiogroup이 하나인 것이 그 선택이다.
 * (뒤따르는 글꼴 묶음에는 radiogroup이 둘이다. aria-label은 번역되므로 쓰지 않는다)
 * 밝은 테마에는 이 선택이 렌더링되지 않는다.
 */
function syncHiddenDarkThemeSection(ours: HTMLElement, base: ThemeBase) {
  showHidden();
  if (base === "light") return;
  const next = ours.nextElementSibling;
  if (next && next.querySelectorAll(RADIOGROUP).length === 1) next.setAttribute(HIDDEN_ATTR, "");
}

/** 설정 > 모양 화면에서 "색상 테마" 섹션이 색상 모드 섹션 바로 뒤에 있도록 맞춘다. */
function sync() {
  const root = document.documentElement;
  const base = themeBaseOf(root);
  if (location.pathname !== APPEARANCE_PATH || !base) {
    removeInjected();
    return;
  }

  // 보이는 화면에서 가장 먼저 나오는 radiogroup이 "색상 모드"이다. (aria-label은 번역되므로 쓰지 않는다)
  const group = [...document.querySelectorAll<HTMLElement>(RADIOGROUP)].find(
    (el) => !el.closest(`[${INJECTED_ATTR}]`) && isVisible(el),
  );
  const source = group?.parentElement?.parentElement;
  if (!group || !source) {
    removeInjected();
    return;
  }

  // 블루스카이의 언어 설정은 <html lang>에 반영된다. 언어가 바뀌면 문구를 새로 그린다.
  // 바탕(밝음/어둑함/어두움)이 바뀌면 섹션의 색도 그 바탕에 맞게 새로 만든다.
  const locale = resolveLocale(root.lang);

  // 이미 원본 바로 뒤에 같은 언어와 바탕으로 보이는 상태로 있으면 그대로 둔다. React가 원본을 다시 그렸으면 새로 만든다.
  const reusable =
    current &&
    current.locale === locale &&
    current.base === base &&
    current.element.previousElementSibling === source &&
    current.element.isConnected &&
    isVisible(current.element);

  if (!reusable) {
    removeInjected();
    const section = createThemeSection(MESSAGES[locale], base, selected, (id) => {
      applySelection(id);
      section.update(id);
      void chrome.storage.sync.set({ [STORAGE_KEY]: id });
    });
    source.after(section.element);
    current = { ...section, locale, base };
  }

  // 블루스카이가 해당 부분을 다시 그렸을 수 있으므로 섹션이 그대로여도 매번 맞춘다.
  if (current) syncHiddenDarkThemeSection(current.element, base);
}

let scheduled = false;
function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    sync();
  });
}

// run_at: document_start 이므로 body가 없을 수 있다. documentElement를 관찰한다.
new MutationObserver(scheduleSync).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "style", "lang"],
});

chrome.storage.onChanged.addListener((changes, area) => {
  const next = changes[STORAGE_KEY]?.newValue;
  if (area !== "sync" || !isThemeId(next) || next === selected) return;
  applySelection(next);
  removeInjected();
  scheduleSync();
});

void chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_THEME }).then((stored) => {
  const value = stored[STORAGE_KEY];
  applySelection(isThemeId(value) ? value : DEFAULT_THEME);
  removeInjected();
  scheduleSync();
});
