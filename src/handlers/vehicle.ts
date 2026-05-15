import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditVehicle(ctx: HandlerContext): Promise<string> {
  const { input, projectPath, changeLog } = ctx;
  const vehicle = input.vehicle as string;
  try {
    const filePath = path.join(projectPath, "data", "System.json");
    if (!fs.existsSync(filePath)) return JSON.stringify({ error: "System.json not found" });
    const system = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    const vehicleData = (system[vehicle] ?? {}) as Record<string, unknown>;
    const changes: string[] = [];

    if (input.character_name !== undefined) { vehicleData.characterName = input.character_name; changes.push(`characterName='${input.character_name}'`); }
    if (input.character_index !== undefined) { vehicleData.characterIndex = input.character_index; changes.push(`characterIndex=${input.character_index}`); }
    if (input.bgm !== undefined) {
      const bgm = input.bgm as Record<string, unknown>;
      vehicleData.bgm = { name: bgm.name ?? "", volume: bgm.volume ?? 90, pitch: bgm.pitch ?? 100, pan: bgm.pan ?? 0 };
      changes.push(`bgm='${bgm.name}'`);
    }
    if (input.start_map_id !== undefined) { vehicleData.startMapId = input.start_map_id; changes.push(`startMapId=${input.start_map_id}`); }
    if (input.start_x !== undefined) { vehicleData.startX = input.start_x; changes.push(`startX=${input.start_x}`); }
    if (input.start_y !== undefined) { vehicleData.startY = input.start_y; changes.push(`startY=${input.start_y}`); }

    if (changes.length === 0) return JSON.stringify({ error: "No fields to update" });

    system[vehicle] = vehicleData;
    fs.writeFileSync(filePath, JSON.stringify(system), "utf-8");
    changeLog.append({ tool: "edit-vehicle", entityType: "Vehicle", action: "update", summary: `Vehicle '${vehicle}' updated: ${changes.join(", ")}` });
    return JSON.stringify({ success: true, vehicle, changes: changes.join(", ") });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
