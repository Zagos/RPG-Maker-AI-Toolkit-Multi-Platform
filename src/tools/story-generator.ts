/**
 * Herramienta: Generador de Narrativa
 */

export const StoryGeneratorTool = {
  name: "story-generator",
  description:
    "Generate complex story sequences with multiple events, scenes, and narrative arcs",
  inputSchema: {
    type: "object" as const,
    properties: {
      story_title: {
        type: "string",
        description: "Title of the story/quest",
      },
      story_description: {
        type: "string",
        description: "Description of the story",
      },
      scenes: {
        type: "array",
        description: "Story scenes/chapters",
        items: {
          type: "object",
          properties: {
            scene_id: {
              type: "string",
              description: "Unique scene identifier",
            },
            scene_name: {
              type: "string",
              description: "Scene title",
            },
            map_id: {
              type: "number",
              description: "Map ID for this scene",
            },
            events: {
              type: "array",
              description: "Events that happen in this scene",
              items: {
                type: "object",
                properties: {
                  event_id: {
                    type: "string",
                    description: "Event identifier",
                  },
                  type: {
                    type: "string",
                    enum: ["dialogue", "battle", "choice", "animation", "transfer"],
                    description: "Type of story event",
                  },
                  content: {
                    type: "string",
                    description: "Event content (text, dialogue, etc.)",
                  },
                  prerequisites: {
                    type: "array",
                    description: "Events that must happen first",
                    items: {
                      type: "string",
                    },
                  },
                },
                required: ["event_id", "type", "content"],
              },
            },
            branches: {
              type: "array",
              description: "Story branches (different paths based on choices)",
              items: {
                type: "object",
                properties: {
                  condition: {
                    type: "string",
                    description: "Condition for this branch",
                  },
                  next_scene: {
                    type: "string",
                    description: "Next scene ID",
                  },
                },
              },
            },
          },
          required: ["scene_id", "scene_name", "events"],
        },
      },
      theme: {
        type: "string",
        enum: ["mystery", "adventure", "romance", "horror", "comedy", "epic"],
        description: "Story theme (affects dialogue tone)",
      },
      difficulty: {
        type: "string",
        enum: ["easy", "normal", "hard"],
        description: "Story difficulty (affects enemies and puzzles)",
      },
      target_length: {
        type: "number",
        description: "Target story length in minutes (approximate)",
      },
      generate_backgrounds: {
        type: "boolean",
        description: "Generate background scenes/maps? (default true)",
      },
      create_npcs: {
        type: "boolean",
        description: "Create NPCs for the story? (default true)",
      },
      auto_balance: {
        type: "boolean",
        description: "Auto-balance enemy levels to party? (default true)",
      },
    },
    required: ["story_title", "story_description", "scenes"],
  },
};
