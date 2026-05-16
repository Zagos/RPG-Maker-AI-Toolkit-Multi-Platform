import type { IProjectReader } from "../../../core/types/reader.js";
import type { IProjectWriter } from "../../../core/types/writer.js";
import type { RPGMakerDebugBridge } from "../debug-bridge.js";
import type { ChangeLog } from "../../../core/change-log.js";

export interface HandlerContext {
  reader: IProjectReader;
  writer: IProjectWriter;
  input: Record<string, unknown>;
  projectPath: string;
  debugBridge: RPGMakerDebugBridge;
  changeLog: ChangeLog;
  debug: boolean;
}
