import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildRegistry } from "./registry/index.ts";
import { renderDocsMd } from "./webui/page-docs.ts";

const { entries } = buildRegistry();
const md = renderDocsMd(entries);

const outPath = join(import.meta.dirname!, "..", "OSC-REFERENCE.md");
await writeFile(outPath, md, "utf8");
console.log(`Generated ${outPath}`);
