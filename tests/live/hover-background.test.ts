// 블루스카이가 바뀌어도 우리 확장이 동작하는지 사용자보다 먼저 알기 위한 테스트다. 실제 사이트를 연다.
//
// 블루스카이는 프로필 탭에 마우스를 올리면 CSS가 아니라 JS로 인라인 style에 배경색을 넣는다.
// 우리 theme.css는 그 인라인 값(`style="background-color: rgb(249, 250, 251)"`)을 보고 테마 색으로 바꾼다.
// 그래서 블루스카이가 hover 색을 바꾸거나 인라인이 아닌 방식으로 옮기면 확장이 조용히 안 먹는다.
// 이 테스트는 그것 하나만 확인한다. 확장은 올리지 않고, 블루스카이의 인라인 style만 본다.
//
// 블루스카이는 기본이 "시스템" 모드라서 Playwright의 colorScheme(브라우저의 prefers-color-scheme 에뮬레이션)로
// 라이트/다크를 정한다. 테스트 러너의 설정이 아니다. 시스템 다크는 theme--dark가 아니라 theme--dim이 된다.
//
// 실행: bun run test:live   (처음 한 번 `bunx playwright install chromium`이 필요하다)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Browser, chromium } from "playwright";

const URL = "https://bsky.app/profile/bsky.app";

interface Scenario {
  label: string;
  colorScheme: "light" | "dark";
  /** 이 모드에서 블루스카이가 <html>에 붙이는 클래스 */
  htmlClass: string;
  /** 이 모드에서 hover 때 블루스카이가 인라인 style에 넣는 배경색. theme.css의 `html.<htmlClass> ... -25` 규칙의 키와 같아야 한다. */
  hoverBackground: string;
}

const SCENARIOS: Scenario[] = [
  { label: "라이트 모드", colorScheme: "light", htmlClass: "theme--light", hoverBackground: "rgb(249, 250, 251)" },
  { label: "다크 모드(시스템 다크 = 어둑함)", colorScheme: "dark", htmlClass: "theme--dim", hoverBackground: "rgb(28, 39, 54)" },
];

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

for (const scenario of SCENARIOS) {
  const { label, colorScheme, htmlClass, hoverBackground } = scenario;

  test(
    `${label}에서 각 프로필 탭에 hover하면 인라인 background-color가 우리가 키로 쓰는 색이다`,
    async () => {
      // 이 테스트가 보는 값을 theme.css도 같은 키로 쓰고 있어야 의미가 있다. (한쪽만 바뀌면 여기서 알린다)
      const css = await Bun.file("src/content/theme.css").text();
      expect(css).toContain(`html.${htmlClass}[data-bt-theme] [style*="background-color: ${hoverBackground}"]`);

      const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } });
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

        const actualClass = await page.evaluate(() => document.documentElement.className);
        if (!actualClass.split(/\s+/).includes(htmlClass)) {
          throw new Error(
            `${label}로 열었는데 <html>에 ${htmlClass}가 없다. <html class="${actualClass}">. ` +
              "블루스카이가 시스템 모드의 테마 클래스를 바꿨거나 모드를 따르지 않는다. 확장의 themeBaseOf도 영향을 받는다.",
          );
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
            if (actual === hoverBackground) break;
            await page.waitForTimeout(100);
          }
          results.push({ name, actual: actual || "(인라인 background-color 없음)" });
        }

        const wrong = results.filter((r) => r.actual !== hoverBackground);
        if (wrong.length > 0) {
          const lines = wrong.map((r) => `  - "${r.name}": ${r.actual}`).join("\n");
          throw new Error(
            `${label}에서 hover했을 때 인라인 background-color가 ${hoverBackground}이 아닌 탭이 있다 (${wrong.length}/${count}).\n${lines}\n` +
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
}
