/**
 * Herramienta: Crear Evento de Mapa
 */

export const CreateMapEventTool = {
  name: "create-map-event",
  description:
    "Create a complex map event with multiple pages, conditions, and scripted actions",
  inputSchema: {
    type: "object" as const,
    properties: {
      map_id: {
        type: "number",
        description: "Map ID where to create the event",
      },
      event_name: {
        type: "string",
        description: "Event name",
      },
      x: {
        type: "number",
        description: "X coordinate on the map",
      },
      y: {
        type: "number",
        description: "Y coordinate on the map",
      },
      event_type: {
        type: "string",
        enum: ["npc", "enemy", "chest", "door", "trigger", "script"],
        description: "Type of event",
      },
      character: {
        type: "object",
        description: "Character/sprite settings",
        properties: {
          name: {
            type: "string",
            description: "Character sprite name",
          },
          index: {
            type: "number",
            description: "Character sprite index",
          },
        },
      },
      pages: {
        type: "array",
        description: "Event pages with conditions",
        items: {
          type: "object",
          properties: {
            condition: {
              type: "string",
              description:
                "Activation condition (always, switch, variable, item, actor)",
            },
            move_type: {
              type: "string",
              enum: ["fixed", "random", "approach", "custom"],
              description: "How the event moves",
            },
            move_speed: {
              type: "number",
              description: "Movement speed (1=slowest, 6=fastest)",
            },
            animation: {
              type: "number",
              description: "Animation ID to play",
            },
            commands: {
              type: "array",
              description: "Event commands to execute",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["message", "choice", "wait", "transfer", "script"],
                    description: "Command type",
                  },
                  data: {
                    type: "string",
                    description: "Command data (varies by type)",
                  },
                },
                required: ["type"],
              },
            },
          },
        },
      },
      treasure: {
        type: "object",
        description: "If type is 'chest', what it contains",
        properties: {
          item_type: {
            type: "string",
            enum: ["item", "weapon", "armor"],
            description: "Type of treasure",
          },
          item_id: {
            type: "number",
            description: "Item ID",
          },
          quantity: {
            type: "number",
            description: "Quantity (default 1)",
          },
        },
      },
      troop_id: {
        type: "number",
        description: "Troop ID to use for enemy battle events",
      },
      dialogue: {
        type: "string",
        description: "Initial dialogue when interacting",
      },
    },
    required: ["map_id", "event_name", "x", "y", "event_type"],
  },
};
