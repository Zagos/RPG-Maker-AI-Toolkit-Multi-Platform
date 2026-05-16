import { RPGMakerWriter, type WriteOptions } from "../mz/writer.js";
import * as fs from "fs";
import * as path from "path";

export class MVWriter extends RPGMakerWriter {
  constructor(options: WriteOptions) {
    // Patch the error message before calling super by checking existence first
    const dataPath = path.join(options.projectPath, "data");
    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `Data directory not found at: ${dataPath}. Is this a valid RPG Maker MV project?`
      );
    }
    super(options);
  }
}
