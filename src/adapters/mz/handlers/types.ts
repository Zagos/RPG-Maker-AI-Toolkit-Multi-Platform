import type { RPGMakerReader } from "../reader.js";
import type { RPGMakerWriter } from "../writer.js";
import type { RPGMakerDebugBridge } from "../debug-bridge.js";
import type { ChangeLog } from "../../../core/change-log.js";

export interface HandlerContext {
  reader: RPGMakerReader;
  writer: RPGMakerWriter;
  input: Record<string, unknown>;
  projectPath: string;
  debugBridge: RPGMakerDebugBridge;
  changeLog: ChangeLog;
  debug: boolean;
}
