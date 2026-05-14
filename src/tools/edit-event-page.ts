import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditEventPageTool: Tool = {
  name: "edit-event-page",
  description:
    "Add a new page to an existing map event, replace a specific page, or remove a page. " +
    "Use this to build multi-state NPCs (quest progression, day/night, locked states) " +
    "without recreating the entire event. Each page can have its own conditions, sprite, movement, trigger, and command list.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID containing the event",
      },
      event_id: {
        type: "integer",
        description: "Event ID to edit",
      },
      mode: {
        type: "string",
        enum: ["add", "replace", "remove"],
        description: "add=append a new page, replace=overwrite a specific page, remove=delete a specific page",
      },
      page_index: {
        type: "integer",
        description: "0-based page index. Required for replace and remove; ignored for add.",
      },
      page: {
        type: "object",
        description: "Page definition. Required for add and replace.",
        properties: {
          trigger: {
            type: "integer",
            description: "0=action button, 1=player touch, 2=event touch, 3=autorun, 4=parallel process",
          },
          priority_type: {
            type: "integer",
            description: "Rendering layer: 0=below characters, 1=same as characters, 2=above characters",
          },
          move_type: {
            type: "integer",
            description: "0=fixed, 1=random, 2=approach player, 3=custom route",
          },
          move_speed: {
            type: "integer",
            description: "Movement speed 1-6 (default: 3)",
          },
          move_frequency: {
            type: "integer",
            description: "Movement frequency 1-5 (default: 3)",
          },
          direction_fix: {
            type: "boolean",
            description: "Prevent the event from changing facing direction",
          },
          walk_anime: {
            type: "boolean",
            description: "Enable walking animation",
          },
          step_anime: {
            type: "boolean",
            description: "Enable stepping animation (even when not moving)",
          },
          through: {
            type: "boolean",
            description: "Allow the event to pass through obstacles",
          },
          character_name: {
            type: "string",
            description: "Sprite sheet filename from img/characters/ (empty string for invisible)",
          },
          character_index: {
            type: "integer",
            description: "Sprite index within the sheet (0-7)",
          },
          conditions: {
            type: "object",
            description: "Page activation conditions (all disabled by default)",
            properties: {
              switch1Valid: { type: "boolean" },
              switch1Id: { type: "integer" },
              switch2Valid: { type: "boolean" },
              switch2Id: { type: "integer" },
              variableValid: { type: "boolean" },
              variableId: { type: "integer" },
              variableValue: { type: "integer" },
              selfSwitchValid: { type: "boolean" },
              selfSwitchCh: { type: "string", enum: ["A", "B", "C", "D"] },
              actorValid: { type: "boolean" },
              actorId: { type: "integer" },
              itemValid: { type: "boolean" },
              itemId: { type: "integer" },
            },
          },
          commands: {
            type: "array",
            description: "Event commands for this page. Same format as create-map-event: [{type, data}]",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["message", "choice", "wait", "transfer", "script", "switch", "variable", "common-event", "battle", "animation"],
                },
                data: { type: "string" },
              },
              required: ["type"],
            },
          },
        },
      },
    },
    required: ["map_id", "event_id", "mode"],
  },
};
