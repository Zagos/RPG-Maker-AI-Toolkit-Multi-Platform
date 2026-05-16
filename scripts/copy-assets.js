#!/usr/bin/env node
// Copies non-TypeScript assets (e.g. .rb files) from src/ to dist/ after tsc build.
import { readdirSync, statSync, mkdirSync, copyFileSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR   = join(__dirname, "..", "src");
const DIST_DIR  = join(__dirname, "..", "dist");
const EXTENSIONS = [".rb"];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      const rel = relative(SRC_DIR, full);
      const dst = join(DIST_DIR, rel);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(full, dst);
      console.log(`  copied: ${rel}`);
    }
  }
}

console.log("Copying assets to dist/...");
walk(SRC_DIR);
console.log("Done.");
