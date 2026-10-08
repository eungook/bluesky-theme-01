import { watch } from "node:fs";
import { rm } from "node:fs/promises";

const SRC = "src";
const OUT = "dist";

async function build() {
  await rm(OUT, { recursive: true, force: true });

  // 콘텐츠 스크립트는 ES 모듈로 로드되지 않으므로 iife로 낸다.
  // root를 src로 두어 dist/content/index.js, theme.css 경로가 manifest와 일치한다.
  const result = await Bun.build({
    entrypoints: [`${SRC}/content/index.ts`, `${SRC}/content/theme.css`],
    outdir: OUT,
    root: SRC,
    target: "browser",
    format: "iife",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    return false;
  }

  // bun build가 처리하지 않는 정적 파일은 직접 복사한다.
  await Bun.write(`${OUT}/manifest.json`, Bun.file(`${SRC}/manifest.json`));
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
