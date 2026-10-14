// 블루스카이가 설정 > 모양의 주소를 바꾸면 우리 확장의 선택 화면이 안 뜨고, 도구 모음 아이콘은 없는 주소를 연다.
// 이 테스트는 로그인한 상태에서 `/settings/appearance`가 다른 주소로 넘어가거나 오류 없이 그대로 열리는지만 확인한다.
// 확장은 올리지 않고, 화면 안의 내용은 보지 않는다.
//
// 로그인이 필요하다. .env의 BLUESKY_USERNAME / BLUESKY_PASSWORD를 쓰고, 세션은 .auth/에 저장해 다시 쓴다.
// (docs/testing.md 참고)
//
// 실행: bun run test:live   (처음 한 번 `bunx playwright install chromium`이 필요하다)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { type Browser, chromium } from "playwright";
import { APPEARANCE_PATH } from "../../src/content/selectors";
import { accessProblems, openLoggedIn, visit } from "./support";

const URL = `https://bsky.app${APPEARANCE_PATH}`;

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
});

test(
  "로그인한 뒤 설정 > 모양의 주소가 리다이렉트 없이 그대로 열린다",
  async () => {
    // 확장의 도구 모음 아이콘이 여는 주소(background)가 이 테스트가 보는 주소와 같아야 의미가 있다.
    const background = await Bun.file("src/background/index.ts").text();
    expect(background).toContain(URL);

    const { context, page } = await openLoggedIn(browser, URL);
    try {
      // 로그인하면서 이미 한 번 열렸으므로 처음부터 다시 연다. 사용자가 주소로 들어오는 것과 같다.
      const result = await visit(page, URL);
      const problems = accessProblems(result, URL);
      if (problems.length > 0) {
        throw new Error(
          `${URL}이 정상적으로 열리지 않는다.\n${problems.map((p) => `  - ${p}`).join("\n")}\n` +
            "블루스카이가 설정 주소를 바꿨다면 src/content/selectors.ts의 APPEARANCE_PATH와 src/background/index.ts의 주소를 고쳐야 한다.",
        );
      }
    } finally {
      await context.close();
    }
  },
  120_000,
);
