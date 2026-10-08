import { INJECTED_ATTR, RADIO, RADIOGROUP, TEXT } from "./selectors";

export const LIGHT_THEMES = [
  { id: "theme1", label: "테마1" },
  { id: "theme2", label: "테마2" },
] as const;

export type LightThemeId = (typeof LIGHT_THEMES)[number]["id"];

export const DEFAULT_LIGHT_THEME: LightThemeId = "theme1";

const SECTION_TITLE = "밝은 테마";
const THUMB_PADDING = 4;

// 해(sun) 아이콘. 아이콘 색은 svg의 inline color(currentColor)를 따른다.
const SUN_ICON = `
  <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
`;

export interface LightThemeSection {
  element: HTMLElement;
  update(selected: LightThemeId): void;
}

/**
 * "색상 모드" 섹션을 복제해 "밝은 테마" 섹션을 만든다.
 * 복제본은 React 밖에 있으므로 썸 위치와 선택 상태, 클릭 처리를 직접 한다.
 * @param source 색상 모드 섹션 (제목 행 + radiogroup 행을 가진 요소)
 */
export function createLightThemeSection(
  source: HTMLElement,
  initial: LightThemeId,
  onSelect: (id: LightThemeId) => void,
): LightThemeSection | null {
  const section = source.cloneNode(true) as HTMLElement;
  const header = section.firstElementChild;
  const group = section.querySelector<HTMLElement>(RADIOGROUP);
  const title = header?.querySelector<HTMLElement>(TEXT);
  const icon = header?.querySelector<SVGElement>("svg");
  const thumb = group?.firstElementChild as HTMLElement | null | undefined;
  if (!group || !title || !icon || !thumb) return null;

  // 선택(진한) 색은 제목 글자색과 같고, 비선택 색은 그와 다른 글자색이다.
  const activeColor = title.style.color;
  const inactiveColor =
    [...group.querySelectorAll<HTMLElement>(`${RADIO} ${TEXT}`)]
      .map((el) => el.style.color)
      .find((color) => color !== activeColor) ?? activeColor;

  // 옵션 래퍼는 thumb 뒤에 오는 자식들이다. 필요한 개수만 남긴다.
  const optionWrappers = [...group.children].slice(1) as HTMLElement[];
  if (optionWrappers.length < LIGHT_THEMES.length) return null;
  optionWrappers.slice(LIGHT_THEMES.length).forEach((el) => el.remove());

  const options = optionWrappers.slice(0, LIGHT_THEMES.length).map((wrapper, i) => {
    const radio = wrapper.querySelector<HTMLElement>(RADIO);
    const text = radio?.querySelector<HTMLElement>(TEXT);
    const theme = LIGHT_THEMES[i];
    if (!radio || !text || !theme) return null;
    text.textContent = theme.label;
    radio.setAttribute("aria-label", theme.label);
    radio.removeAttribute("aria-pressed");
    return { radio, text, id: theme.id };
  });
  if (options.some((option) => option === null)) return null;
  const items = options as NonNullable<(typeof options)[number]>[];

  title.textContent = SECTION_TITLE;
  group.setAttribute("aria-label", SECTION_TITLE);
  icon.innerHTML = SUN_ICON;

  // 원본의 px 단위 썸 크기는 복제본에서 맞지 않으므로 비율로 다시 계산한다.
  thumb.style.width = `calc((100% - ${THUMB_PADDING * 2}px) / ${items.length})`;

  function update(selected: LightThemeId) {
    const index = Math.max(0, items.findIndex((item) => item.id === selected));
    thumb!.style.transform = `translateX(calc(${THUMB_PADDING}px + ${index * 100}%))`;
    items.forEach((item, i) => {
      item.radio.setAttribute("aria-checked", String(i === index));
      item.text.style.color = i === index ? activeColor : inactiveColor;
    });
  }

  function select(target: EventTarget | null) {
    const radio = (target as Element | null)?.closest(RADIO);
    const item = items.find((it) => it.radio === radio);
    if (item) onSelect(item.id);
  }

  group.addEventListener("click", (e) => select(e.target));
  group.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    select(e.target);
  });

  update(initial);

  const element = document.createElement("div");
  element.className = source.className;
  element.setAttribute(INJECTED_ATTR, "");
  element.append(section);
  return { element, update };
}
