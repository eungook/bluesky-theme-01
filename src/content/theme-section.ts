import type { Messages } from "./i18n";
import { INJECTED_ATTR, RADIO } from "./selectors";
import { THEMES, type ThemeId } from "./themes";

const THUMB_PADDING = 4;

// 이 섹션은 지금 밝은 테마(theme--light)에서만 보이므로 밝은 테마 팔레트만 가진다.
// 값은 블루스카이의 "색상 모드" 섹션(밝은 테마)에서 가져왔다. 원본을 복제하면 테마 전환 도중의
// 어두운 색이 그대로 복사되는 문제가 있어 직접 만든다. (docs/extension-guidelines.md 참고)
const COLOR = {
  active: "rgb(0, 0, 0)",
  inactive: "rgb(135, 152, 176)",
  track: "rgb(239, 242, 246)",
  thumb: "rgb(255, 255, 255)", // theme.css가 선택한 테마의 배경색으로 바꾼다.
};

const FONT_FAMILY =
  'InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

// react-native-web View/Text의 기본 스타일. 블루스카이의 다른 화면과 같은 레이아웃 규칙을 따르기 위해 맞춘다.
const VIEW =
  "display:flex;flex-direction:column;align-items:stretch;flex-shrink:0;position:relative;box-sizing:border-box;min-height:0;min-width:0;margin:0;padding:0;border:0 solid black;";
const TEXT_STYLE =
  "display:inline;box-sizing:border-box;margin:0;white-space:pre-wrap;overflow-wrap:break-word;letter-spacing:0;";

// 팔레트 아이콘. 색은 svg의 color(currentColor)를 따른다.
const PALETTE_ICON = `
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="8.5" cy="10.5" r="1.4" fill="currentColor"/>
  <circle cx="12" cy="7.8" r="1.4" fill="currentColor"/>
  <circle cx="15.5" cy="10.5" r="1.4" fill="currentColor"/>
`;

function view(style: string, attrs: Record<string, string> = {}): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("style", VIEW + style);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

function text(content: string, style: string): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("dir", "auto");
  el.setAttribute("style", TEXT_STYLE + `font-family:${FONT_FAMILY};font-size:15px;line-height:20px;` + style);
  el.textContent = content;
  return el;
}

/**
 * 테마의 색을 보여 주는 작은 원. 왼쪽 위는 밝음, 오른쪽 아래는 어두움의 기본 배경색이다.
 * 색은 theme.css의 변수에서 가져와 색을 한 곳에서만 관리한다. (배경은 background-color가 아니라
 * background-image로 칠한다. theme.css가 인라인 background-color를 치환하기 때문이다.)
 */
function swatch(id: ThemeId): HTMLDivElement {
  const el = view(
    "width:14px;height:14px;border-radius:7px;flex-shrink:0;border:1px solid rgba(0, 0, 0, 0.2);" +
      `background-image:linear-gradient(135deg, var(--bt-${id}-light-0) 50%, var(--bt-${id}-dark-0) 50%);`,
    { "aria-hidden": "true" },
  );
  return el;
}

export interface ThemeSection {
  element: HTMLElement;
  update(selected: ThemeId): void;
}

/** "색상 테마" 섹션을 만든다. 블루스카이의 "색상 모드" 섹션과 같은 모양이다. */
export function createThemeSection(
  messages: Messages,
  initial: ThemeId,
  onSelect: (id: ThemeId) => void,
): ThemeSection {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("style", `color:${COLOR.active}`);
  icon.innerHTML = PALETTE_ICON;

  const iconBox = view("z-index:20;width:24px;height:24px;");
  iconBox.append(icon);
  const header = view("padding:8px 20px 2px;align-items:center;gap:8px;width:100%;flex-direction:row;min-height:42px;");
  header.append(iconBox, text(messages.title, `color:${COLOR.active};text-align:left;font-weight:400;flex:1 1 0%;`));

  // 썸의 크기와 위치는 옵션 개수에 맞춘 비율로 계산한다.
  const thumb = view(
    // theme.css가 style 속성 문자열로 흰 배경을 찾으므로 "background-color: rgb(...)" 형식(콜론 뒤 공백)을 지킨다.
    `position:absolute;background-color: ${COLOR.thumb};top:${THUMB_PADDING}px;bottom:${THUMB_PADDING}px;left:0;` +
      `width:calc((100% - ${THUMB_PADDING * 2}px) / ${THEMES.length});border-radius:10px;` +
      "box-shadow:rgba(0, 0, 0, 0.05) 0px 2px 4px 0px;transition-property:transform;transition-duration:100ms;" +
      "transition-timing-function:cubic-bezier(0.17, 0.73, 0.14, 1);",
  );

  const group = view(
    `width:100%;flex:1 1 0%;flex-direction:row;background-color: ${COLOR.track};border-radius:14px;padding:${THUMB_PADDING}px;`,
    { role: "radiogroup", "aria-label": messages.title },
  );
  group.append(thumb);

  const items = THEMES.map((theme) => {
    const name = messages[theme.id];
    // 좁은 화면에서도 줄바꿈 없이 한 줄로 두고, 넘치면 말줄임으로 줄인다.
    const label = text(
      name,
      "text-align:center;font-weight:500;padding-left:0;padding-right:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
    );
    const radio = view(
      "flex-direction:row;align-items:center;justify-content:center;gap:8px;flex:1 1 0%;background-color:transparent;padding:4px 8px;min-height:40px;cursor:pointer;",
      { role: "radio", "aria-label": name, tabindex: "0" },
    );
    radio.append(swatch(theme.id), label);
    const wrapper = view("flex:1 1 0%;flex-direction:row;min-width:0;");
    wrapper.append(radio);
    group.append(wrapper);
    return { id: theme.id, radio, label };
  });

  const body = view("padding:2px 20px 8px;width:100%;min-height:48px;align-items:flex-start;gap:8px;");
  body.append(group);
  const section = view("width:100%;");
  section.append(header, body);
  const element = view("");
  element.setAttribute(INJECTED_ATTR, "");
  element.append(section);

  function update(selected: ThemeId) {
    const index = Math.max(0, items.findIndex((item) => item.id === selected));
    thumb.style.transform = `translateX(calc(${THUMB_PADDING}px + ${index * 100}%))`;
    items.forEach((item, i) => {
      item.radio.setAttribute("aria-checked", String(i === index));
      item.label.style.color = i === index ? COLOR.active : COLOR.inactive;
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
  return { element, update };
}
