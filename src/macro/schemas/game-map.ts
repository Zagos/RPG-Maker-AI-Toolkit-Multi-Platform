import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GameMapTool: Tool = {
  name: "game-map",
  description:
    "All map and tileset operations: create/edit/delete maps, paint tiles, manage map events, manage tilesets. " +
    "Use 'action' to select the operation and 'data' to pass all operation-specific fields.\n\n" +
    "Actions:\n" +
    "  create — create a new map (data: name required, map_id?, width?, height?, tileset_id?, parent_id?, ...)\n" +
    "  edit — edit map metadata/settings (data: map_id required, name?, tileset_id?, bgm settings, ...)\n" +
    "  delete — delete a map (data: map_id required, confirm: true required)\n" +
    "  copy — copy an existing map (data: source_map_id required, new_name required, parent_id?)\n" +
    "  edit-info — edit MapInfos entry only, no map file I/O (data: map_id required, name?, parent_id?, order?, ...)\n" +
    "  read-tiles — read raw tile data (data: map_id required, x?, y?, width?, height?, layers?)\n" +
    "  paint-tiles — paint tiles at specific positions (data: map_id required, tiles array required)\n" +
    "  fill — fill a rectangular region with a tile (data: map_id, x, y, width, height, layer, tile_id required)\n" +
    "  paint-region — paint a region with tile pattern (data: map_id, layer, x, y, width, height required)\n" +
    "  create-event — create a map event (data: map_id, event_name, x, y, event_type required)\n" +
    "  edit-event — edit an existing map event (data: map_id, event_id required)\n" +
    "  delete-event — delete a map event (data: map_id, event_id required)\n" +
    "  edit-event-page — edit a specific event page (data: map_id, event_id, mode required)\n" +
    "  edit-troop-events — edit troop battle event pages (data: troop_id, mode required)\n" +
    "  create-tileset — create a new tileset (data: name required)\n" +
    "  edit-tileset — edit tileset graphics assignments (data: tileset_id required)\n" +
    "  edit-tileset-properties — edit tileset passage/terrain flags (data: tileset_id required)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create", "edit", "delete", "copy", "edit-info",
          "read-tiles", "paint-tiles", "fill", "paint-region",
          "create-event", "edit-event", "delete-event", "edit-event-page",
          "edit-troop-events",
          "create-tileset", "edit-tileset", "edit-tileset-properties",
        ],
        description: "Map/tileset operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields — passed directly to the internal handler. See action descriptions for required/optional fields.",
        properties: {},
      },
    },
    required: ["action", "data"],
  },
};
