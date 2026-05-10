import { PluginTemplates } from "../dist/templates/plugin-template.js";
import * as fs from "fs";

const code = PluginTemplates.debugBridge(9001);
fs.writeFileSync(
  "C:\\Users\\tcl_m\\Documents\\RMMZ\\Project1\\js\\plugins\\RPGMakerDebugger.js",
  code,
  "utf-8",
);
console.log("✓ Plugin written (" + code.length + " bytes)");
