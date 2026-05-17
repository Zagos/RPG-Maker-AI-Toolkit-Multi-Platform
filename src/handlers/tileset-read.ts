import type { HandlerContext } from "./types.js";

export async function handleReadTileset(ctx: HandlerContext): Promise<string> {
  const { input, reader } = ctx;

  try {
    const tilesetId = input.tileset_id as number | undefined;
    const includeFlags = (input.include_flags as boolean | undefined) ?? false;

    if (tilesetId !== undefined) {
      if (typeof tilesetId !== "number" || tilesetId < 1) {
        return JSON.stringify({ error: "tileset_id must be a positive integer" });
      }

      const tileset = reader.readTileset(tilesetId);
      if (!tileset) return JSON.stringify({ error: `Tileset ${tilesetId} not found` });

      const result: Record<string, unknown> = {
        id: tileset.id,
        name: tileset.name,
        mode: tileset.mode,
        tilesetNames: tileset.tilesetNames,
      };

      if (includeFlags) {
        result.flags = tileset.flags;
      } else {
        const flags = tileset.flags as number[];
        const allBlocked = flags.filter((f) => (f & 0x000f) === 0x000f).length;
        const fullyPassable = flags.filter((f) => (f & 0x000f) === 0x0000).length;
        result.flags_summary = {
          total: flags.length,
          all_blocked: allBlocked,
          fully_passable: fullyPassable,
          partial: flags.length - allBlocked - fullyPassable,
        };
      }

      return JSON.stringify(result);
    }

    // List all tilesets
    const tilesets = reader.readTilesets();
    return JSON.stringify({
      tilesets: tilesets.map((t) => ({
        id: t.id,
        name: t.name,
        mode: t.mode,
        tilesetNames: t.tilesetNames,
      })),
      count: tilesets.length,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
