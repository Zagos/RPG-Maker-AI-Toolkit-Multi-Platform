import * as fs from "fs";
import * as path from "path";
import { VXAceWriter, type VXAceWriterOptions } from "../vxace/writer.js";

export class XPWriter extends VXAceWriter {
  protected override ext = ".rxdata";

  constructor(opts: VXAceWriterOptions) {
    const dataPath = path.join(opts.projectPath, "data");
    if (!fs.existsSync(dataPath)) {
      throw new Error(
        `Data directory not found at: ${dataPath}. Is this a valid RPG Maker XP project?`
      );
    }
    super(opts);
    // Override ext after super() since class field initializers run after super() in JS
    this.ext = ".rxdata";
  }
}
