import type { RPGDataType } from "../types/rpgmaker.js";
import type { HandlerContext } from "./types.js";

const RPG_DATA_TYPES = [
  "Actors", "Classes", "Skills", "Items", "Weapons", "Armors",
  "Enemies", "Troops", "States", "Animations", "Tilesets", "Maps", "CommonEvents",
] as const satisfies readonly RPGDataType[];

function isRpgDataType(value: unknown): value is RPGDataType {
  return typeof value === "string" && (RPG_DATA_TYPES as readonly string[]).includes(value);
}

export async function handleHealthCheck(ctx: HandlerContext): Promise<string> {
  return JSON.stringify({
    status: "ok",
    rpgmaker_path: ctx.projectPath,
    debug_mode: ctx.debug,
    timestamp: new Date().toISOString(),
  });
}

export async function handleListGameData(ctx: HandlerContext): Promise<string> {
  const { input, reader } = ctx;
  const dataType = input.data_type;

  if (!isRpgDataType(dataType)) {
    return JSON.stringify({ error: "Invalid data_type", allowed_values: RPG_DATA_TYPES });
  }

  const info = reader.getDataInfo(dataType);
  return JSON.stringify({ success: true, data_type: dataType, count: info.count, preview: info.preview });
}
