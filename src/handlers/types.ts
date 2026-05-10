import type { RPGMakerReader } from "../rpgmaker/reader.js";
import type { RPGMakerWriter } from "../rpgmaker/writer.js";
import type { RPGMakerDebugBridge } from "../rpgmaker/debug-bridge.js";
import type { ChangeLog } from "../rpgmaker/change-log.js";

export interface HandlerContext {
  reader: RPGMakerReader;
  writer: RPGMakerWriter;
  input: Record<string, unknown>;
  projectPath: string;
  debugBridge: RPGMakerDebugBridge;
  changeLog: ChangeLog;
  debug: boolean;
}
