import type { HandlerContext } from "./types.js";

export async function handleReadMap(ctx: HandlerContext): Promise<string> {
  const { input, reader } = ctx;
  const mapId = input.map_id as number;
  const includeEvents = input.include_events !== false;
  const includeEncounters = input.include_encounters !== false;

  try {
    const mapData = reader.readMap(mapId);
    if (!mapData) {
      return JSON.stringify({ error: `Map ${mapId} not found` });
    }

    const events = (mapData.events || []).filter(Boolean);

    const result: Record<string, unknown> = {
      success: true,
      map_id: mapId,
      display_name: mapData.displayName,
      width: mapData.width,
      height: mapData.height,
      tileset_id: mapData.tilesetId,
      note: mapData.note,
      event_count: events.length,
      bgm: mapData.bgm,
      bgs: mapData.bgs,
      autoplay_bgm: mapData.autoplayBgm,
      autoplay_bgs: mapData.autoplayBgs,
      scroll_type: mapData.scrollType,
      specify_battleback: mapData.specifyBattleback,
      battleback1: mapData.battleback1Name,
      battleback2: mapData.battleback2Name,
      parallax_name: mapData.parallaxName,
    };

    if (includeEvents) {
      result.events = events.map((e) => ({
        id: e.id,
        name: e.name,
        x: e.x,
        y: e.y,
        note: e.note,
        pages_count: e.pages?.length ?? 0,
      }));
    }

    if (includeEncounters) {
      result.encounter_step = mapData.encounterStep;
      result.encounters = mapData.encounterList || [];
    }

    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
