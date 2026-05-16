import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ControlTimerRuntimeTool: Tool = {
  name: "control-timer-runtime",
  description: "Start, stop, or query the in-game countdown timer at runtime. Game must be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["start", "stop", "get"], description: "Timer action" },
      frames: { type: "integer", description: "Duration in frames for 'start' (60 frames = 1 second)" },
    },
    required: ["action"],
  },
};
