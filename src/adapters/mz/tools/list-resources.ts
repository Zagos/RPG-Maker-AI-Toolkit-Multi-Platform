import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ListResourcesTool: Tool = {
  name: "list-resources",
  description:
    "List available asset files in the project's img/ and audio/ directories. " +
    "Use this before assigning filenames in edit-actor (face_name, character_name), edit-map (parallax), " +
    "create-map-event (character), or edit-tileset-properties (tilesetNames) to ensure the file exists.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: [
          "characters",
          "faces",
          "battlers",
          "sv_actors",
          "tilesets",
          "parallaxes",
          "pictures",
          "bgm",
          "bgs",
          "se",
          "me",
          "all",
        ],
        description:
          "Asset category to list. 'all' returns every category at once. " +
          "Image categories: characters, faces, battlers, sv_actors, tilesets, parallaxes, pictures. " +
          "Audio categories: bgm, bgs, se, me.",
      },
    },
    required: ["category"],
  },
};
