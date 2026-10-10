// 크롬 웹 스토어에 올릴 zip을 만든다. `bun run package`
//
// 빌드(dist/)를 새로 하고, 스토어가 거절하는 흔한 문제를 먼저 확인한 뒤 dist/의 내용을 zip의 맨 위에 담는다.
// (manifest.json이 zip 안의 폴더가 아니라 맨 위에 있어야 한다.) 결과는 out/에 생기고 git에는 올리지 않는다.
// 버전은 src/manifest.json의 version이 기준이다. 올릴 때마다 먼저 올려야 업데이트로 받아들여진다.
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { $ } from "bun";

const NAME_MAX = 45; // 스토어가 manifest name에 허용하는 길이
const DESCRIPTION_MAX = 132; // manifest description에 허용하는 길이

const manifest = await Bun.file("src/manifest.json").json();

const problems: string[] = [];
if (typeof manifest.name !== "string" || manifest.name.length > NAME_MAX) problems.push(`name은 ${NAME_MAX}자 이하여야 한다.`);
if (typeof manifest.description !== "string" || manifest.description.length > DESCRIPTION_MAX) {
  problems.push(`description은 ${DESCRIPTION_MAX}자 이하여야 한다. (지금 ${manifest.description?.length}자)`);
}
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version ?? "")) problems.push(`version 형식이 올바르지 않다: ${manifest.version}`);
if (manifest.manifest_version !== 3) problems.push("manifest_version은 3이어야 한다.");
for (const [size, path] of Object.entries<string>(manifest.icons ?? {})) {
  if (!existsSync(`src/${path}`)) problems.push(`icons[${size}]가 가리키는 src/${path}가 없다.`);
}
if (!manifest.icons?.["128"]) problems.push("스토어는 128px 아이콘이 필요하다.");

if (problems.length) {
  console.error(problems.map((p) => `- ${p}`).join("\n"));
  process.exit(1);
}

await $`bun run build.ts`.quiet();

await mkdir("out", { recursive: true });
const zip = resolve("out", `bluesky-theme-${manifest.version}.zip`);
await rm(zip, { force: true });
await $`zip -r -X ${zip} . -x "*.DS_Store"`.cwd("dist").quiet();

const size = Bun.file(zip).size;
console.log(`[package] ${zip} (${(size / 1024).toFixed(1)} KB), version ${manifest.version}`);
