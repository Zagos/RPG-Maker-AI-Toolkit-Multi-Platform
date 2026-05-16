import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ShowMessageTool: Tool = {
  name: "show-message",
  description:
    "Display a message in the running game using $gameMessage (the same system as in-game dialogue). Requires the game to be running with RPGMakerDebugger plugin enabled.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Message text to display",
      },
      speaker: {
        type: "string",
        description: "Speaker name shown above the message window (optional)",
      },
    },
    required: ["text"],
  },
};
