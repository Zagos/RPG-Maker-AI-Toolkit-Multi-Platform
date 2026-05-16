import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditVehicleTool: Tool = {
  name: "edit-vehicle",
  description: "Edit vehicle settings (boat, ship, airship) in System.json. Controls sprite, starting position, and BGM.",
  inputSchema: {
    type: "object",
    properties: {
      vehicle: { type: "string", enum: ["boat", "ship", "airship"], description: "Which vehicle to edit" },
      character_name: { type: "string", description: "Sprite sheet filename" },
      character_index: { type: "integer", description: "Sprite index (0-7)" },
      bgm: {
        type: "object",
        description: "Background music for this vehicle",
        properties: {
          name: { type: "string" },
          volume: { type: "integer" },
          pitch: { type: "integer" },
          pan: { type: "integer" },
        },
      },
      start_map_id: { type: "integer", description: "Starting map ID" },
      start_x: { type: "integer", description: "Starting X coordinate" },
      start_y: { type: "integer", description: "Starting Y coordinate" },
    },
    required: ["vehicle"],
  },
};
