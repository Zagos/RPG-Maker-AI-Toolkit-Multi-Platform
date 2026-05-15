export const PlayAudioRuntimeTool = {
  name: "play-audio-runtime",
  description: "Play or stop audio (BGM, BGS, SE, ME) in a running RPG Maker MZ game",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["bgm", "bgs", "se", "me", "stop_bgm", "stop_bgs"],
        description: "Audio type: bgm (background music), bgs (background sound), se (sound effect), me (music effect), stop_bgm, stop_bgs",
      },
      name: {
        type: "string",
        description: "Audio file name without extension (required for bgm, bgs, se, me). E.g. 'Battle1', 'Rain'",
      },
      volume: {
        type: "number",
        description: "Volume level 0-100. Default: 90",
        minimum: 0,
        maximum: 100,
      },
      pitch: {
        type: "number",
        description: "Pitch adjustment 50-150. Default: 100",
        minimum: 50,
        maximum: 150,
      },
      pan: {
        type: "number",
        description: "Stereo pan -100 (left) to 100 (right). Default: 0",
        minimum: -100,
        maximum: 100,
      },
    },
    required: ["type"],
  },
};
