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
let current: (LightThemeSection & { signature: string }) | null = null;

const isLightThemeId = (v: unknown): v is LightThemeId => LIGHT_THEMES.some((t) => t.id === v);

function applySelection(id: LightThemeId) {
  selected = id;
  document.documentElement.setAttribute(ROOT_ATTR, id);
}

function removeInjected() {
  document.querySelector(`[${INJECTED_ATTR}]`)?.remove();
  current = null;
}

/** 설정 > 모양 화면이 밝은 테마일 때만 "밝은 테마" 섹션이 색상 모드 섹션 바로 뒤에 있도록 맞춘다. */
function sync() {
  const root = document.documentElement;
  if (location.pathname !== APPEARANCE_PATH || !root.classList.contains(LIGHT_THEME_CLASS)) {
    removeInjected();
    return;
  }

  // 가장 먼저 나오는 radiogroup이 "색상 모드"이다. (aria-label은 번역되므로 쓰지 않는다)
  const group = [...document.querySelectorAll<HTMLElement>(RADIOGROUP)].find(
    (el) => !el.closest(`[${INJECTED_ATTR}]`),
  );
  const source = group?.parentElement?.parentElement;
  if (!group || !source) {
    removeInjected();
    return;
  }

  // 복제본의 색은 복제 시점에 고정되므로, 원본 색이 바뀌었거나 React가 원본을 다시 그렸으면 새로 만든다.
  const signature = group.style.backgroundColor;
  if (
    current &&
    current.signature === signature &&
    current.element.previousElementSibling === source &&
    current.element.isConnected
  ) {
    return;
  }
  removeInjected();

  const section = createLightThemeSection(source, selected, (id) => {
    applySelection(id);
    section?.update(id);
    void chrome.storage.sync.set({ [STORAGE_KEY]: id });
  });
  if (!section) return;
  source.after(section.element);
  current = { ...section, signature };
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
