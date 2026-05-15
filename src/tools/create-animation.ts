import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateAnimationTool: Tool = {
  name: "create-animation",
  description:
    "Create a new animation entry in Animations.json. The name is required. " +
    "The effectName references an Effekseer effect file from effects/ (without extension). " +
    "flash timings and sound timings default to empty arrays and can be configured via the editor. " +
    "Returns the new animation_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Animation name shown in the editor (required)",
      },
      effect_name: {
        type: "string",
        description:
          "Effekseer effect filename from effects/ (without extension). Leave empty for a blank animation.",
      },
      display_type: {
        type: "integer",
        description:
          "Display type: 0=on target, 1=on screen center (default 0)",
      },
      offset_x: {
        type: "integer",
        description: "Horizontal offset in pixels relative to the target (default 0)",
      },
      offset_y: {
        type: "integer",
        description: "Vertical offset in pixels relative to the target (default 0)",
      },
      speed: {
        type: "integer",
        description: "Playback speed percentage (100=normal, default 100)",
      },
    },
    required: ["name"],
  },
};
