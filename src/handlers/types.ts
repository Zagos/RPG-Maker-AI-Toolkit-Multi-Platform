import type { IProjectReader } from "../core/types/reader.js";
import type { IProjectWriter } from "../core/types/writer.js";
import type { RPGMakerDebugBridge } from "../adapters/mz/debug-bridge.js";
import type { RPGMakerRubyBridge } from "../adapters/ruby-bridge/tcp-bridge.js";
import type { ChangeLog } from "../core/change-log.js";

export interface HandlerContext {
  reader: IProjectReader;
  writer: IProjectWriter;
  input: Record<string, unknown>;
  projectPath: string;
  engine: string;
  debugBridge: RPGMakerDebugBridge;
  rubyBridge: RPGMakerRubyBridge;
  changeLog: ChangeLog;
  debug: boolean;
}
