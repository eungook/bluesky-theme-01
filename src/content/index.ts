import {
  createLightThemeSection,
  DEFAULT_LIGHT_THEME,
  LIGHT_THEMES,
  type LightThemeId,
  type LightThemeSection,
} from "./light-theme-section";
import { APPEARANCE_PATH, INJECTED_ATTR, LIGHT_THEME_CLASS, RADIOGROUP } from "./selectors";

const STORAGE_KEY = "lightTheme";
const ROOT_ATTR = "data-bt-light-theme";

let selected: LightThemeId = DEFAULT_LIGHT_THEME;
let current: LightThemeSection | null = null;

const isLightThemeId = (v: unknown): v is LightThemeId => LIGHT_THEMES.some((t) => t.id === v);

function applySelection(id: LightThemeId) {
  selected = id;
  document.documentElement.setAttribute(ROOT_ATTR, id);
}

// 블루스카이는 이전에 방문한 화면을 숨긴 채 DOM에 남겨 둘 수 있다. 화면에 보이는 요소만 대상으로 한다.
const isVisible = (el: HTMLElement) => el.checkVisibility?.() ?? el.getClientRects().length > 0;

function removeInjected() {
  document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) => el.remove());
  current = null;
}

/** 설정 > 모양 화면이 밝은 테마일 때만 "밝은 테마" 섹션이 색상 모드 섹션 바로 뒤에 있도록 맞춘다. */
function sync() {
  const root = document.documentElement;
  if (location.pathname !== APPEARANCE_PATH || !root.classList.contains(LIGHT_THEME_CLASS)) {
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

  // 이미 원본 바로 뒤에 보이는 상태로 있으면 그대로 둔다. React가 원본을 다시 그렸으면 새로 만든다.
  if (
    current &&
    current.element.previousElementSibling === source &&
    current.element.isConnected &&
    isVisible(current.element)
  ) {
    return;
  }
  removeInjected();

  const section = createLightThemeSection(selected, (id) => {
    applySelection(id);
    section.update(id);
    void chrome.storage.sync.set({ [STORAGE_KEY]: id });
  });
  source.after(section.element);
  current = section;
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
  attributeFilter: ["class", "style"],
});

chrome.storage.onChanged.addListener((changes, area) => {
  const next = changes[STORAGE_KEY]?.newValue;
  if (area !== "sync" || !isLightThemeId(next) || next === selected) return;
  applySelection(next);
  removeInjected();
  scheduleSync();
});

void chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_LIGHT_THEME }).then((stored) => {
  const value = stored[STORAGE_KEY];
  applySelection(isLightThemeId(value) ? value : DEFAULT_LIGHT_THEME);
  removeInjected();
  scheduleSync();
});
