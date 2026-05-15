import type { HandlerContext } from "./types.js";

export async function handleEditMap(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number | undefined;
    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id is required and must be a positive integer" });
    }

    const mapData = reader.readMap(mapId);
    if (!mapData) {
      return JSON.stringify({ error: `Map ${mapId} not found` });
    }

    // Work with a mutable plain-object copy to avoid RPGMap index-signature errors
    const map = mapData as unknown as Record<string, unknown>;
    const updated: string[] = [];

    if (input.name !== undefined) {
      const name = (input.name as string).trim();
      if (!name) return JSON.stringify({ error: "name must not be empty" });
      map.displayName = name;
      updated.push("name");
    }
    if (input.tileset_id !== undefined) { map.tilesetId = input.tileset_id; updated.push("tileset_id"); }
    if (input.scroll_type !== undefined) { map.scrollType = input.scroll_type; updated.push("scroll_type"); }
    if (input.encounter_step !== undefined) { map.encounterStep = input.encounter_step; updated.push("encounter_step"); }
    if (input.note !== undefined) { map.note = input.note; updated.push("note"); }
    if (input.enable_name_display !== undefined) { map.enableNameDisplay = input.enable_name_display; updated.push("enable_name_display"); }
    if (input.autoplay_bgm !== undefined) { map.autoplayBgm = input.autoplay_bgm; updated.push("autoplay_bgm"); }

    if (input.bgm_name !== undefined || input.bgm_volume !== undefined || input.bgm_pitch !== undefined) {
      const bgm = { ...((map.bgm ?? { name: "", pan: 0, pitch: 100, volume: 90 }) as Record<string, unknown>) };
      if (input.bgm_name !== undefined) bgm.name = input.bgm_name;
      if (input.bgm_volume !== undefined) bgm.volume = input.bgm_volume;
      if (input.bgm_pitch !== undefined) bgm.pitch = input.bgm_pitch;
      map.bgm = bgm;
      updated.push("bgm");
    }

    if (input.autoplay_bgs !== undefined) { map.autoplayBgs = input.autoplay_bgs; updated.push("autoplay_bgs"); }

    if (input.bgs_name !== undefined || input.bgs_volume !== undefined || input.bgs_pitch !== undefined) {
      const bgs = { ...((map.bgs ?? { name: "", pan: 0, pitch: 100, volume: 90 }) as Record<string, unknown>) };
      if (input.bgs_name !== undefined) bgs.name = input.bgs_name;
      if (input.bgs_volume !== undefined) bgs.volume = input.bgs_volume;
      if (input.bgs_pitch !== undefined) bgs.pitch = input.bgs_pitch;
      map.bgs = bgs;
      updated.push("bgs");
    }

    if (input.specify_battleback !== undefined) { map.specifyBattleback = input.specify_battleback; updated.push("specify_battleback"); }
    if (input.battleback1 !== undefined) { map.battleback1Name = input.battleback1; updated.push("battleback1"); }
    if (input.battleback2 !== undefined) { map.battleback2Name = input.battleback2; updated.push("battleback2"); }
    if (input.parallax_name !== undefined) { map.parallaxName = input.parallax_name; updated.push("parallax_name"); }
    if (input.parallax_show !== undefined) { map.parallaxShow = input.parallax_show; updated.push("parallax_show"); }
    if (input.parallax_loop_x !== undefined) { map.parallaxLoopX = input.parallax_loop_x; updated.push("parallax_loop_x"); }
    if (input.parallax_loop_y !== undefined) { map.parallaxLoopY = input.parallax_loop_y; updated.push("parallax_loop_y"); }
    if (input.parallax_sx !== undefined) { map.parallaxSx = input.parallax_sx; updated.push("parallax_sx"); }
    if (input.parallax_sy !== undefined) { map.parallaxSy = input.parallax_sy; updated.push("parallax_sy"); }
    if (input.disable_dashing !== undefined) { map.disableDashing = input.disable_dashing; updated.push("disable_dashing"); }

    if (input.encounters !== undefined) {
      const encounters = input.encounters as Array<{ enemy_id: number; weight?: number }>;
      map.encounterList = encounters.map((e) => ({
        troopId: e.enemy_id,
        weight: e.weight ?? 5,
        regionSet: [],
      }));
      updated.push("encounters");
    }

    if (updated.length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one editable property." });
    }

    // Only pass mapInfo to writeMap when the name changed (requires 7 required fields)
    let mapInfo: Record<string, unknown> | undefined;
    if (updated.includes("name")) {
      mapInfo = {
        id: mapId,
        name: map.displayName as string,
        parentId: 0,
        order: mapId,
        expanded: false,
        scrollX: 0,
        scrollY: 0,
      };
    }

    writer.writeMap(mapId, map, mapInfo);

    changeLog.append({
      tool: "edit-map",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `Map ${mapId} updated: ${updated.join(", ")}`,
    });

    return JSON.stringify({ success: true, map_id: mapId, updated });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
