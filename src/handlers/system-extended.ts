import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleReadSystemExtended(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const section = (input.section as string | undefined) ?? "all";
  try {
    const filePath = path.join(projectPath, "data", "System.json");
    if (!fs.existsSync(filePath)) return JSON.stringify({ error: "System.json not found" });
    const system = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;

    const result: Record<string, unknown> = {};
    if (section === "terms" || section === "all") result.terms = system.terms;
    if (section === "vehicles" || section === "all") result.vehicles = { boat: system.boat, ship: system.ship, airship: system.airship };
    if (section === "sounds" || section === "all") result.sounds = system.sounds;
    if (section === "basic" || section === "all") {
      result.basic = {
        gameTitle: system.gameTitle,
        currencyUnit: system.currencyUnit,
        windowTone: system.windowTone,
        locale: system.locale,
        optSideView: system.optSideView,
        optTransparent: system.optTransparent,
        optFollowers: system.optFollowers,
        optDisplayTp: system.optDisplayTp,
        optExtraExp: system.optExtraExp,
        optKeyItemsNumber: system.optKeyItemsNumber,
        optFloorDeath: system.optFloorDeath,
        optAutosave: system.optAutosave,
        battleCount: system.battleCount,
        winCount: system.winCount,
        escapeCount: system.escapeCount,
      };
    }
    return JSON.stringify({ success: true, section, data: result });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
