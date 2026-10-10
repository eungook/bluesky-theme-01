import { watch } from "node:fs";
import { rm } from "node:fs/promises";

const SRC = "src";
const OUT = "dist";

async function build() {
  await rm(OUT, { recursive: true, force: true });

  // 콘텐츠 스크립트는 ES 모듈로 로드되지 않으므로 iife로 낸다. 서비스 워커는 manifest에서 "type": "module"을
  // 주지 않았으니 같은 iife로 충분하다.
  // root를 src로 두어 dist/content/index.js, theme.css 경로가 manifest와 일치한다.
  //
  // CSS는 따로 빌드한다. Bun 1.3.10에서 JS 진입점 둘과 CSS 진입점을 한 번의 Bun.build에 같이 주면 Bun이
  // 세그폴트로 죽는다. (JS 둘만, 또는 JS 하나와 CSS는 괜찮다.) 버전을 올린 뒤에는 합쳐 봐도 된다.
  const jobs = [
    [`${SRC}/content/index.ts`, `${SRC}/background/index.ts`],
    [`${SRC}/content/theme.css`],
  ];
  for (const entrypoints of jobs) {
    const result = await Bun.build({ entrypoints, outdir: OUT, root: SRC, target: "browser", format: "iife" });
    if (!result.success) {
      for (const log of result.logs) console.error(log);
      return false;
    }
  }

  // bun build가 처리하지 않는 정적 파일은 직접 복사한다.
  await Bun.write(`${OUT}/manifest.json`, Bun.file(`${SRC}/manifest.json`));
  // manifest의 icons가 가리키는 PNG만 복사한다. 원본 SVG는 스토어/확장에 필요 없어 싣지 않는다.
  for await (const file of new Bun.Glob("icons/*.png").scan(SRC)) {
    await Bun.write(`${OUT}/${file}`, Bun.file(`${SRC}/${file}`));
  }
  console.log(`[build] ${new Date().toLocaleTimeString()} done`);
  return true;
}

const ok = await build();

if (process.argv.includes("--watch")) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => void build(), 50);
  });
  console.log(`[build] watching ${SRC}/ ...`);
} else if (!ok) {
  process.exit(1);
}
