// 블루스카이가 바뀌어도 우리 확장이 동작하는지 사용자보다 먼저 알기 위한 테스트다. 실제 사이트를 연다.
//
// 블루스카이는 프로필 탭에 마우스를 올리면 CSS가 아니라 JS로 인라인 style에 배경색을 넣는다.
// 우리 theme.css는 그 인라인 값(`style="background-color: rgb(249, 250, 251)"`)을 보고 테마 색으로 바꾼다.
// 그래서 블루스카이가 hover 색을 바꾸거나 인라인이 아닌 방식으로 옮기면 확장이 조용히 안 먹는다.
// 이 테스트는 그것 하나만 확인한다. 확장은 올리지 않고, 블루스카이의 인라인 style만 본다.
//
// 실행: bun run test:live   (처음 한 번 `bunx playwright install chromium`이 필요하다)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Browser, chromium } from "playwright";

const URL = "https://bsky.app/profile/bsky.app";

// 라이트 모드에서 hover 때 블루스카이가 넣는 배경색. theme.css의 `html.theme--light ... -25` 규칙의 키와 같아야 한다.
const EXPECTED_HOVER_BACKGROUND = "rgb(249, 250, 251)";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

test(
  "라이트 모드에서 각 프로필 탭에 hover하면 인라인 background-color가 우리가 키로 쓰는 색이다",
  async () => {
    // 이 테스트가 보는 값을 theme.css도 같은 키로 쓰고 있어야 의미가 있다. (한쪽만 바뀌면 여기서 알린다)
    const css = await Bun.file("src/content/theme.css").text();
    expect(css).toContain(`html.theme--light[data-bt-theme] [style*="background-color: ${EXPECTED_HOVER_BACKGROUND}"]`);

    const context = await browser.newContext({ colorScheme: "light", viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    try {
      try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
      } catch (error) {
        throw new Error(`${URL}에 접속하지 못했다. 네트워크 문제일 수 있다. (${error})`);
      }

      const tabs = page.locator('[role="tab"]');
      try {
        await tabs.first().waitFor({ timeout: 30_000 });
      } catch {
        throw new Error('프로필 화면에서 role="tab" 요소를 찾지 못했다. 블루스카이의 화면 구조가 바뀌었을 수 있다.');
      }

      const htmlClass = await page.evaluate(() => document.documentElement.className);
      if (!htmlClass.split(/\s+/).includes("theme--light")) {
        throw new Error(`라이트 모드로 열리지 않았다. <html class="${htmlClass}">. 이 테스트의 전제가 어긋났다.`);
      }

      const count = await tabs.count();
      const results: { name: string; actual: string }[] = [];
      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        const name = (await tab.innerText()).trim() || `(${i + 1}번째 탭)`;
        try {
          await tab.hover({ timeout: 5_000 });
        } catch {
          results.push({ name, actual: "(hover하지 못함)" });
          continue;
        }
        // hover 뒤 블루스카이의 JS가 style을 바꿀 때까지 잠깐 기다린다.
        let actual = "";
        for (let waited = 0; waited < 2_000; waited += 100) {
          actual = await tab.evaluate((el) => (el as HTMLElement).style.backgroundColor);
          if (actual === EXPECTED_HOVER_BACKGROUND) break;
          await page.waitForTimeout(100);
        }
        results.push({ name, actual: actual || "(인라인 background-color 없음)" });
      }

      const wrong = results.filter((r) => r.actual !== EXPECTED_HOVER_BACKGROUND);
      if (wrong.length > 0) {
        const lines = wrong.map((r) => `  - "${r.name}": ${r.actual}`).join("\n");
        throw new Error(
          `hover했을 때 인라인 background-color가 ${EXPECTED_HOVER_BACKGROUND}이 아닌 탭이 있다 (${wrong.length}/${count}).\n${lines}\n` +
            "블루스카이가 hover 색이나 방식을 바꿨다면 theme.css의 치환 규칙을 고쳐야 한다.",
        );
      }
      expect(results.length).toBe(count);
    } finally {
      await context.close();
    }
  },
  90_000,
);
