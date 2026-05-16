import * as fs from "fs";
import * as path from "path";
import { VXAceReader, type VXAceReaderOptions } from "../vxace/reader.js";

export class VXReader extends VXAceReader {
  protected override ext = ".rvdata";

  constructor(opts: VXAceReaderOptions) {
    const dataPath = path.join(opts.projectPath, "data");
    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `Data directory not found at: ${dataPath}. Is this a valid RPG Maker VX project?`
      );
    }
    super(opts);
    // Override ext after super() since class field initializers run after super() in JS
    this.ext = ".rvdata";
  }
}
