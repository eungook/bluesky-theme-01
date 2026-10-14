// 확장을 실제로 올린 브라우저에서, 로그인한 설정 > 모양 화면에 우리가 만든 "색상 테마" 섹션이 주입되는지 확인한다.
// 블루스카이가 설정 화면의 구조를 바꾸면 우리 확장은 색상 모드 섹션을 못 찾고 오류 없이 아무것도 안 넣는다.
// 그래서 확장을 바꾸지 않고 실제 코드 그대로 돌려서 결과(주입된 섹션)만 본다.
//
// 로그인이 필요하다. .env의 BLUESKY_USERNAME / BLUESKY_PASSWORD를 쓰고 세션은 .auth/에 남긴다. (docs/testing.md 참고)
// 테스트가 시작할 때 `bun run build`로 dist/를 새로 만든다.
//
// 실행: bun run test:live   (처음 한 번 `bunx playwright install chromium`이 필요하다)
import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { $ } from "bun";
import type { Page } from "playwright";
import { APPEARANCE_PATH, INJECTED_ATTR } from "../../src/content/selectors";
import { THEMES } from "../../src/content/themes";
import { openLoggedInWithExtension } from "./support";

const URL = `https://bsky.app${APPEARANCE_PATH}`;

/** 섹션이 안 나타났을 때, 왜 그런지 구분할 수 있도록 화면 상태를 요약한다. */
async function explainMissing(page: Page): Promise<string> {
  const state = await page.evaluate((attr) => {
    const groups = [...document.querySelectorAll('[role="radiogroup"]')].filter((g) => !g.closest(`[${attr}]`));
    const first = groups[0];
    return {
      path: location.pathname,
      htmlClass: document.documentElement.className,
      contentScriptRan: document.documentElement.hasAttribute("data-bt-theme"),
      radiogroups: groups.length,
      firstGroupRadios: first ? first.querySelectorAll('[role="radio"]').length : 0,
      firstGroupHasGrandparent: Boolean(first?.parentElement?.parentElement),
    };
  }, INJECTED_ATTR);

  const facts = JSON.stringify(state);
  if (!state.contentScriptRan) {
    return `확장의 콘텐츠 스크립트가 이 페이지에서 실행되지 않았다. 테스트 환경(확장 로드)이나 manifest의 matches 문제일 수 있다.\n${facts}`;
  }
  if (state.path !== APPEARANCE_PATH) {
    return `${APPEARANCE_PATH}가 아니라 ${state.path}에 있다. 설정 주소가 바뀌었을 수 있다.\n${facts}`;
  }
  if (!/\btheme--(light|dim|dark)\b/.test(state.htmlClass)) {
    return `<html>에 theme--light/dim/dark 중 아무것도 없어서 확장이 섹션을 넣지 않는다. 테마 클래스가 바뀌었을 수 있다.\n${facts}`;
  }
  if (state.radiogroups === 0) {
    return `화면에서 role="radiogroup"을 찾지 못했다. 블루스카이가 설정 화면의 구조를 바꿨을 가능성이 크다. 우리는 첫 radiogroup을 색상 모드 섹션으로 삼는다.\n${facts}`;
  }
  if (!state.firstGroupHasGrandparent) {
    return `첫 radiogroup의 부모의 부모가 없다. 우리는 그 요소를 색상 모드 섹션으로 보고 그 뒤에 넣는다.\n${facts}`;
  }
  return `색상 모드 섹션으로 보이는 요소는 찾았지만 섹션이 주입되지 않았다. 확장 코드나 구조 변화를 확인한다.\n${facts}`;
}

test(
  "확장이 로그인한 설정 > 모양 화면의 색상 모드 바로 뒤에 '색상 테마' 섹션을 주입한다",
  async () => {
    await $`bun run build.ts`.quiet();

    const { context, page } = await openLoggedInWithExtension(resolve("dist"), URL);
    try {
      // 로그인하면서 이미 열렸으므로 처음부터 다시 연다. 사용자가 주소로 들어오는 것과 같다.
      await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

      const injected = page.locator(`[${INJECTED_ATTR}]`);
      try {
        await injected.first().waitFor({ state: "visible", timeout: 30_000 });
      } catch {
        throw new Error(`"색상 테마" 섹션이 나타나지 않았다.\n${await explainMissing(page)}`);
      }

      // 중복해서 들어가지 않고, 들어간 뒤 사라지지도 않아야 한다.
      const count = await injected.count();
      if (count !== 1) {
        throw new Error(`"색상 테마" 섹션이 ${count}개다(1개여야 한다). 주입된 뒤 사라졌거나 중복 주입되었다.\n${await explainMissing(page)}`);
      }

      const placement = await page.evaluate((attr) => {
        const ours = document.querySelector(`[${attr}]`);
        // 색상 모드 섹션은 우리 것을 뺀 첫 radiogroup이 들어 있는 섹션이다. 우리는 그 바로 뒤에 들어가야 한다.
        const colorMode = [...document.querySelectorAll('[role="radiogroup"]')].find((g) => !g.closest(`[${attr}]`));
        const previous = ours?.previousElementSibling;
        return {
          afterColorMode: Boolean(previous && colorMode && previous.contains(colorMode)),
          radios: ours?.querySelectorAll('[role="radio"]').length ?? 0,
        };
      }, INJECTED_ATTR);

      if (!placement.afterColorMode) {
        throw new Error('"색상 테마" 섹션이 색상 모드 섹션 바로 뒤에 있지 않다. 구조가 바뀌어 엉뚱한 곳에 들어갔을 수 있다.');
      }
      expect(placement.radios).toBe(THEMES.length); // 테마 선택지가 모두 그려졌다
    } finally {
      await context.close();
    }
  },
  180_000,
);
