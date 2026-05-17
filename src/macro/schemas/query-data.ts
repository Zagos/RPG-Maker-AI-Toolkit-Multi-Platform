export const QueryDataTool = {
  name: "query-data",
  description:
    "Read data from the RPG Maker project: list entities, read a specific entity, read map details, list maps, browse assets, query the game system config, read animations or tilesets, search entities, or get a full project summary.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["list", "entity", "map", "maps", "resources", "system", "animation", "tileset", "search", "summary"],
        description:
          "What to query. " +
          "list: list all entities of a given type (requires data_type). " +
          "entity: read one entity by type+id (requires entity_type, id). " +
          "map: read map details (requires id). " +
          "maps: list all maps. " +
          "resources: list asset files (requires category). " +
          "system: read System.json sections (optional section). " +
          "animation: read one animation (requires id) or list all (omit id). " +
          "tileset: read one tileset (requires id) or list all (omit id). " +
          "search: text search across entities (requires entity_type, query). " +
          "summary: full project overview.",
      },
      // for "list"
      data_type: {
        type: "string",
        enum: ["Actors","Classes","Skills","Items","Weapons","Armors","Enemies","Troops","States","Animations","Tilesets","Maps","CommonEvents"],
        description: "Entity type to list (required for type=list)",
      },
      // for "entity" and "search"
      entity_type: {
        type: "string",
        enum: ["Actor","Item","Enemy","Weapon","Armor","Skill","Class","State","Troop","CommonEvent","Animation","Tileset"],
        description: "Entity type (required for type=entity and type=search)",
      },
      // generic id for entity / map / animation / tileset
      id: { type: "integer", description: "Entity/map/animation/tileset ID" },
      // for "resources"
      category: {
        type: "string",
        enum: ["characters","faces","battlers","sv_actors","tilesets","parallaxes","pictures","bgm","bgs","se","me","all"],
        description: "Asset category to list (required for type=resources)",
      },
      // for "system"
      section: {
        type: "string",
        enum: ["terms","vehicles","sounds","basic","all"],
        description: "System.json section to return (for type=system, default: all)",
      },
      // for "tileset"
      include_flags: {
        type: "boolean",
        description: "Include the full 8192-entry flags array (for type=tileset, default: false)",
      },
      // for "map"
      include_events: {
        type: "boolean",
        description: "Include event list in the map read (for type=map, default: true)",
      },
      include_encounters: {
        type: "boolean",
        description: "Include encounter list in the map read (for type=map, default: true)",
      },
      // for "search"
      query: { type: "string", description: "Case-insensitive search string (required for type=search)" },
      field: { type: "string", description: "Field to match within each entity (for type=search, default: name)" },
      limit: { type: "number", minimum: 1, maximum: 200, description: "Max results to return (for type=search, default: 20)" },
    },
    required: ["type"],
  },
};
