export const ControlWeatherRuntimeTool = {
  name: "control-weather-runtime",
  description: "Control the weather effect in a running RPG Maker MZ game (rain, storm, snow, or clear)",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["none", "rain", "storm", "snow"],
        description: "Weather type: none (clear), rain, storm, or snow",
      },
      power: {
        type: "number",
        description: "Weather intensity from 0 (lightest) to 9 (heaviest). Default: 5",
        minimum: 0,
        maximum: 9,
      },
      duration: {
        type: "number",
        description: "Transition duration in frames (60 frames = 1 second). Default: 60",
        minimum: 0,
      },
    },
    required: ["type"],
  },
};
