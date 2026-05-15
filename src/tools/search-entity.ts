export const SearchEntityTool = {
  name: "search-entity",
  description: "Search for RPG Maker MZ entities (actors, items, skills, etc.) by a text query. Returns matching entries with their IDs and names.",
  inputSchema: {
    type: "object" as const,
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Item", "Skill", "Weapon", "Armor", "Class", "State", "Enemy", "Troop", "CommonEvent", "Animation"],
        description: "The type of entity to search",
      },
      query: {
        type: "string",
        description: "Search string (case-insensitive substring match)",
      },
      field: {
        type: "string",
        description: "Field to search within the entity (default: 'name'). E.g. 'name', 'note', 'description'",
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return (default: 20)",
        minimum: 1,
        maximum: 200,
      },
    },
    required: ["entity_type", "query"],
  },
};
