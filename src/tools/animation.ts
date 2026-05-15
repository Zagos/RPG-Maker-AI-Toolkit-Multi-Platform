import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadAnimationTool: Tool = {
  name: "read-animation",
  description:
    "Read animation data from Animations.json. When animation_id is provided, returns the full animation object " +
    "(name, effectName, displayType, offset, speed, flashTimings, soundTimings). " +
    "When animation_id is omitted, lists all animations with id and name.",
  inputSchema: {
    type: "object",
    properties: {
      animation_id: {
        type: "integer",
        description: "Animation ID to read. Omit to list all animations.",
      },
    },
  },
};

export const EditAnimationTool: Tool = {
  name: "edit-animation",
  description:
    "Edit the metadata of an existing animation in Animations.json. " +
    "Editable fields: name, effectName (Effekseer effect file from effects/), " +
    "displayType (0=head, 1=center, 2=screen, -1=front), offsetX, offsetY, speed. " +
    "Full frame/timing editing is out of scope — use this to reassign effect assets.",
  inputSchema: {
    type: "object",
    properties: {
      animation_id: {
        type: "integer",
        description: "ID of the animation to edit",
      },
      name: {
        type: "string",
        description: "Display name of the animation",
      },
      effect_name: {
        type: "string",
        description: "Effekseer effect file name from the effects/ folder (without extension)",
      },
      display_type: {
        type: "integer",
        description: "Display position: 0=on target head, 1=on target center, 2=full screen, -1=front of screen",
      },
      offset_x: {
        type: "integer",
        description: "Horizontal offset in pixels",
      },
      offset_y: {
        type: "integer",
        description: "Vertical offset in pixels",
      },
      speed: {
        type: "integer",
        description: "Playback speed as a percentage (100 = normal)",
      },
    },
    required: ["animation_id"],
  },
};
