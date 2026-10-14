// 로그인이 필요한 라이브 테스트가 같이 쓰는 도우미.
//
// 자격 증명은 .env의 BLUESKY_USERNAME / BLUESKY_PASSWORD에서만 읽는다(Bun이 .env를 자동으로 읽는다).
// 값은 어디에도 출력하지 않고, 오류 메시지에 섞여 나올 수 있는 값은 가려서 던진다.
// 매번 로그인하지 않도록 세션을 .auth/bluesky.json에 저장해 다시 쓴다. 이 파일에는 토큰이 들어 있어서
// .gitignore에 있고 권한을 본인만 읽을 수 있게 둔다. 세션이 만료되면 지우고 다시 로그인한다.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { type Browser, type BrowserContext, type Page } from "playwright";

const STATE_PATH = ".auth/bluesky.json";

// 로그인 화면의 문구를 쓰므로 언어를 영어로 고정한다.
const CONTEXT_OPTIONS = { colorScheme: "light", locale: "en-US", viewport: { width: 1280, height: 900 } } as const;

function readCredentials(): { username: string; password: string } {
  const username = Bun.env.BLUESKY_USERNAME;
  const password = Bun.env.BLUESKY_PASSWORD;
  if (!username || !password) {
    throw new Error(".env에 BLUESKY_USERNAME과 BLUESKY_PASSWORD가 있어야 한다. (로그인이 필요한 라이브 테스트다)");
  }
  return { username, password };
}

const redact = (text: string, secrets: string[]) => secrets.reduce((t, s) => (s ? t.split(s).join("***") : t), text);

/** 로그아웃 상태라면 true, 로그인 상태이거나 알 수 없으면 false. 로그아웃 화면에는 "Sign in" 버튼이 있다. */
async function looksSignedOut(page: Page): Promise<boolean> {
  const signIn = page.getByRole("button", { name: "Sign in" }).first();
  const settled = page.locator('[role="radiogroup"]').first();
  return Promise.race([
    signIn.waitFor({ timeout: 15_000 }).then(() => true),
    settled.waitFor({ timeout: 15_000 }).then(() => false),
  ]).catch(() => false);
}

async function signIn(page: Page, username: string, password: string) {
  await page.getByRole("button", { name: "Sign in" }).first().click();
  await page.getByLabel("Username or email address").fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).last().click();
  // 성공하면 로그인 화면(비밀번호 칸)이 사라진다.
  try {
    await page.locator('input[type="password"]').waitFor({ state: "detached", timeout: 30_000 });
  } catch {
    throw new Error(
      "로그인에 실패했다. 로그인 화면이 그대로 남아 있다. .env의 계정 정보, 2단계 인증(이메일 코드), 요청 제한을 확인한다.",
    );
  }
}

export interface VisitResult {
  /** 첫 응답의 HTTP 상태. 응답이 없으면 null */
  status: number | null;
  /** 서버가 리다이렉트로 보냈는지(HTTP 3xx) */
  httpRedirect: boolean;
  /** 메인 프레임이 거쳐 간 주소들(JS가 주소를 바꾸는 경우도 들어간다) */
  visited: string[];
  finalUrl: string;
}

/** url을 열고, JS가 뒤늦게 주소를 바꾸는 경우까지 보려고 잠깐 기다린다. */
export async function visit(page: Page, url: string, settleMs = 4_000): Promise<VisitResult> {
  const visited: string[] = [];
  const onNavigated = (frame: { url(): string }) => {
    if (frame === page.mainFrame()) visited.push(frame.url());
  };
  page.on("framenavigated", onNavigated);
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(settleMs);
    return {
      status: response?.status() ?? null,
      httpRedirect: Boolean(response?.request().redirectedFrom()),
      visited,
      finalUrl: page.url(),
    };
  } finally {
    page.off("framenavigated", onNavigated);
  }
}

/** 열려는 주소 그대로 정상 접근되었는지 보고, 아니면 이유를 돌려준다. 문제가 없으면 빈 배열이다. */
export function accessProblems(result: VisitResult, expectedUrl: string): string[] {
  const problems: string[] = [];
  if (result.status === null) problems.push("응답이 없다.");
  else if (result.status >= 400) problems.push(`HTTP ${result.status} 응답이다.`);
  if (result.httpRedirect) problems.push("서버가 다른 주소로 리다이렉트했다.");
  const unexpected = [...new Set([...result.visited, result.finalUrl])].filter((u) => u !== expectedUrl);
  if (unexpected.length > 0) problems.push(`다른 주소로 이동했다: ${unexpected.join(" → ")}`);
  return problems;
}

/**
 * 로그인된 상태로 url을 연 페이지를 돌려준다. 저장된 세션이 있으면 쓰고, 없거나 만료되었으면 로그인한다.
 * 호출한 쪽이 context를 닫는다.
 */
export async function openLoggedIn(browser: Browser, url: string): Promise<{ context: BrowserContext; page: Page }> {
  const { username, password } = readCredentials();
  const secrets = [username, password];

  if (await Bun.file(STATE_PATH).exists()) {
    const context = await browser.newContext({ ...CONTEXT_OPTIONS, storageState: STATE_PATH });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!(await looksSignedOut(page))) return { context, page };
    await context.close();
    await rm(STATE_PATH, { force: true }); // 만료된 세션
  }

  const context = await browser.newContext(CONTEXT_OPTIONS);
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await signIn(page, username, password);
    await mkdir(".auth", { recursive: true });
    await writeFile(STATE_PATH, JSON.stringify(await context.storageState()), { mode: 0o600 });
  } catch (error) {
    await context.close();
    throw new Error(redact(error instanceof Error ? error.message : String(error), secrets));
  }
  return { context, page };
}
