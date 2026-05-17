// Migrates src/adapters/mz/handlers/ → src/handlers/
// Updates all import paths in the moved files and all external references.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const src = join(root, "src", "adapters", "mz", "handlers");
const dst = join(root, "src", "handlers");

if (!existsSync(dst)) mkdirSync(dst, { recursive: true });

// --- Step 1: Copy handler files with updated imports ---
// In handler files, parent-dir imports need updating:
const HANDLER_REPLACEMENTS = [
  // mz-specific (from src/adapters/mz/)
  ['"../commands.js"',            '"../adapters/mz/commands.js"'],
  ['"../debug-bridge.js"',        '"../adapters/mz/debug-bridge.js"'],
  ['"../validator.js"',           '"../adapters/mz/validator.js"'],
  ['"../types/rpgmaker.js"',      '"../adapters/mz/types/rpgmaker.js"'],
  ['"../templates/plugin-template.js"', '"../adapters/mz/templates/plugin-template.js"'],
  // core (was 3 levels up from src/adapters/mz/handlers/, now 1 level up from src/handlers/)
  ['"../../../core/',             '"../core/'],
  // ruby-bridge (was 2 levels up from src/adapters/mz/handlers/, now through adapters/)
  ['"../../ruby-bridge/',         '"../adapters/ruby-bridge/'],
  ['"../../../adapters/ruby-bridge/', '"../adapters/ruby-bridge/'],
];

const files = readdirSync(src);
for (const file of files) {
  let content = readFileSync(join(src, file), "utf-8");
  for (const [from, to] of HANDLER_REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  writeFileSync(join(dst, file), content, "utf-8");
  console.log(`  copied: ${file}`);
}

// --- Step 2: Update external references ---
// Files outside src/adapters/mz/handlers/ that import from it.
const EXTERNAL_REPLACEMENTS = [
  // In src/ files
  ['./adapters/mz/handlers/',    './handlers/'],
  ['../adapters/mz/handlers/',   '../handlers/'],
  ['../../adapters/mz/handlers/', '../../handlers/'],
  // In test files (tests/ is 2 levels above src/)
  ['../../src/adapters/mz/handlers/', '../../src/handlers/'],
];

function patchFile(filePath) {
  let content = readFileSync(filePath, "utf-8");
  let changed = false;
  for (const [from, to] of EXTERNAL_REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(filePath, content, "utf-8");
    console.log(`  patched: ${filePath.replace(root, "")}`);
  }
}

function walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", ".git"].includes(entry.name)) walkDir(full);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      patchFile(full);
    }
  }
}

console.log("\nPatching external references...");
walkDir(join(root, "src"));
walkDir(join(root, "tests"));

// --- Step 3: Remove old handler directory ---
rmSync(src, { recursive: true, force: true });
console.log("\n✓ Removed src/adapters/mz/handlers/");
console.log("✓ Migration complete");
