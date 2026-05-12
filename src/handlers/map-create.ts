import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

function nextAvailableMapId(dataPath: string): number {
  const mapInfosPath = path.join(dataPath, "MapInfos.json");
  if (!fs.existsSync(mapInfosPath)) return 1;

  try {
    const raw = JSON.parse(fs.readFileSync(mapInfosPath, "utf-8")) as Array<Record<string, unknown> | null>;
    let max = 0;
    for (let i = 1; i < raw.length; i++) {
      if (raw[i] != null) max = i;
    }
    return max + 1;
  } catch {
    return 1;
  }
}

export async function handleCreateMap(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const name = input.name as string;
    const width = (input.width as number | undefined) ?? 17;
    const height = (input.height as number | undefined) ?? 13;
    const tilesetId = (input.tileset_id as number | undefined) ?? 1;
    const parentId = (input.parent_id as number | undefined) ?? 0;
    const scrollType = (input.scroll_type as number | undefined) ?? 0;
    const encounterStep = (input.encounter_step as number | undefined) ?? 30;
    const note = (input.note as string | undefined) ?? "";
    const enableNameDisplay = (input.enable_name_display as boolean | undefined) ?? false;
    const autoplayBgm = (input.autoplay_bgm as boolean | undefined) ?? false;
    const bgmName = (input.bgm_name as string | undefined) ?? "";
    const autoplayBgs = (input.autoplay_bgs as boolean | undefined) ?? false;
    const bgsName = (input.bgs_name as string | undefined) ?? "";

    if (!name || typeof name !== "string" || name.trim() === "") {
      return JSON.stringify({ error: "name is required and must be a non-empty string" });
    }
    if (width < 1 || width > 256) {
      return JSON.stringify({ error: "width must be between 1 and 256" });
    }
    if (height < 1 || height > 256) {
      return JSON.stringify({ error: "height must be between 1 and 256" });
    }

    const dataPath = path.join(projectPath, "data");
    const mapId = (input.map_id as number | undefined) ?? nextAvailableMapId(dataPath);

    if (mapId < 1 || mapId > 999) {
      return JSON.stringify({ error: "map_id must be between 1 and 999" });
    }

    // tile data: width * height * 6 layers, all zeros (empty map)
    const tileData = new Array(width * height * 6).fill(0);

    const mapData = {
      autoplayBgm,
      autoplayBgs,
      battleback1Name: "",
      battleback2Name: "",
      bgm: { name: bgmName, pan: 0, pitch: 100, volume: 90 },
      bgs: { name: bgsName, pan: 0, pitch: 100, volume: 90 },
      data: tileData,
      displayName: name,
      encounterList: [],
      enableNameDisplay,
      encounterStep,
      height,
      note,
      parallaxLoopX: false,
      parallaxLoopY: false,
      parallaxName: "",
      parallaxShow: true,
      parallaxSx: 0,
      parallaxSy: 0,
      scrollType,
      specifyBattleback: false,
      tilesetId,
      width,
      events: [null],
    };

    const mapInfo = {
      id: mapId,
      name,
      parentId,
      order: mapId,
      expanded: false,
      scrollX: 0,
      scrollY: 0,
    };

    writer.writeMap(mapId, mapData, mapInfo);

    changeLog.append({
      tool: "create-map",
      entityType: "Map",
      entityId: mapId,
      action: "create",
      summary: `Map ${mapId} created: name='${name}' size=${width}x${height} tileset=${tilesetId}`,
    });

    return JSON.stringify({
      success: true,
      map_id: mapId,
      name,
      width,
      height,
      tileset_id: tilesetId,
      parent_id: parentId,
      filename: `Map${String(mapId).padStart(3, "0")}.json`,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
