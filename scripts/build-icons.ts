// src/icons/icon.svg에서 확장 아이콘 PNG(16/32/48/128)를 만든다. `bun run icons`
//
// SVG를 로컬 Chrome(헤드리스)으로 512px에 투명 배경으로 그린 뒤 macOS의 sips로 줄인다.
// 그래서 macOS와 설치된 Chrome이 필요하다. 다른 환경이면 CHROME 환경 변수로 Chrome 경로를 주거나
// 직접 PNG를 만들어 src/icons/에 넣는다. 아이콘 모양을 바꿀 때만 다시 실행하고 결과 PNG는 커밋한다.
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SIZES = [16, 32, 48, 128];
const SOURCE = "src/icons/icon.svg";
const OUT_DIR = "src/icons";
const WORK_SIZE = 512;

if (process.platform !== "darwin" || !(await Bun.file(CHROME).exists())) {
  console.error("macOS와 Chrome이 필요합니다. CHROME 환경 변수로 Chrome 경로를 줄 수 있습니다.");
  process.exit(1);
}

const svg = await Bun.file(SOURCE).text();
const work = await mkdtemp(join(tmpdir(), "bt-icons-"));
try {
  // SVG를 그대로 인라인해서 그린다. 배경은 투명하게 둔다.
  await Bun.write(
    join(work, "icon.html"),
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block;width:${WORK_SIZE}px;height:${WORK_SIZE}px}</style>${svg}`,
  );
  const big = join(work, "icon-big.png");
  await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --window-size=${WORK_SIZE},${WORK_SIZE} --screenshot=${big} file://${join(work, "icon.html")}`.quiet();

  await mkdir(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const out = join(OUT_DIR, `icon-${size}.png`);
    await $`sips -z ${size} ${size} ${big} --out ${out}`.quiet();
    console.log(`[icons] ${out}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
