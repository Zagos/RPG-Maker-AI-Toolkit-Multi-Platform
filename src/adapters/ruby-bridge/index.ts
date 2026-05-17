import { spawnSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// When running via tsx (dev), __dirname points to src/adapters/ruby-bridge/.
// When running via node dist/ (prod), __dirname points to dist/adapters/ruby-bridge/.
// In both cases bridge.rb lives alongside this file.
const BRIDGE_SCRIPT = path.join(__dirname, "bridge.rb");

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_BUFFER_BYTES   = 100 * 1024 * 1024; // 100 MB

export interface BridgeOptions {
  /** Path to the ruby executable. Falls back to RUBY_PATH env var, then "ruby". */
  rubyPath?: string;
  /** Timeout in milliseconds. Default: 30 000. */
  timeout?: number;
}

function resolveRuby(opts: BridgeOptions): string {
  return opts.rubyPath ?? process.env.RUBY_PATH ?? "ruby";
}

/**
 * Reads a Ruby Marshal file (.rxdata / .rvdata / .rvdata2) and returns
 * its contents as a plain JavaScript value (JSON-compatible).
 */
export function readMarshalFile(filePath: string, opts: BridgeOptions = {}): unknown {
  const result = spawnSync(resolveRuby(opts), [BRIDGE_SCRIPT, "read", filePath], {
    encoding:  "utf-8",
    timeout:   opts.timeout ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });

  if (result.error) {
    throw new Error(`Ruby bridge failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `Ruby bridge error reading "${filePath}":\n${result.stderr}`
    );
  }

  return JSON.parse(result.stdout);
}

/**
 * Writes a plain JavaScript value as a Ruby Marshal file.
 * The value must have been previously read (or constructed) with the same
 * __class / field conventions that bridge.rb expects.
 */
export function writeMarshalFile(
  filePath: string,
  data: unknown,
  opts: BridgeOptions = {}
): void {
  const result = spawnSync(resolveRuby(opts), [BRIDGE_SCRIPT, "write", filePath], {
    input:     JSON.stringify(data),
    encoding:  "utf-8",
    timeout:   opts.timeout ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });

  if (result.error) {
    throw new Error(`Ruby bridge failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `Ruby bridge error writing "${filePath}":\n${result.stderr}`
    );
  }
}

/**
 * Returns true if the Ruby executable is available on the system.
 */
export function isRubyAvailable(ruby = resolveRuby({})): boolean {
  const result = spawnSync(ruby, ["--version"], {
    encoding: "utf-8",
    timeout:  5_000,
  });
  return !result.error && result.status === 0;
}

/** Absolute path to bridge.rb — useful for diagnostics. */
export function getBridgeScriptPath(): string {
  return BRIDGE_SCRIPT;
}

export interface ScriptEntry {
  id: number;
  name: string;
  source: string;
}

/**
 * Reads Scripts.rvdata2 / .rvdata / .rxdata and returns decompressed script entries.
 * Each entry: { id, name, source } — source is the uncompressed Ruby source code.
 */
export function readScriptsFile(filePath: string, opts: BridgeOptions = {}): ScriptEntry[] {
  const result = spawnSync(resolveRuby(opts), [BRIDGE_SCRIPT, "read-scripts", filePath], {
    encoding:  "utf-8",
    timeout:   opts.timeout ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });
  if (result.error) throw new Error(`Ruby bridge failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Ruby bridge error reading scripts "${filePath}":\n${result.stderr}`);
  return JSON.parse(result.stdout) as ScriptEntry[];
}

/**
 * Writes script entries back to a Scripts Marshal file, compressing each source with Zlib.
 */
export function writeScriptsFile(
  filePath: string,
  scripts: ScriptEntry[],
  opts: BridgeOptions = {}
): void {
  const result = spawnSync(resolveRuby(opts), [BRIDGE_SCRIPT, "write-scripts", filePath], {
    input:     JSON.stringify(scripts),
    encoding:  "utf-8",
    timeout:   opts.timeout ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER_BYTES,
  });
  if (result.error) throw new Error(`Ruby bridge failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Ruby bridge error writing scripts "${filePath}":\n${result.stderr}`);
}
