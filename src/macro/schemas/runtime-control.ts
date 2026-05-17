export const RuntimeControlTool = {
  name: "runtime-control",
  description:
    "Control the running RPG Maker game: set switches/variables, teleport, save/load, manage inventory, party state, actor stats, weather, audio, timer, messages, and execute scripts. Game must be running with the debug plugin active.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: [
          "set-switch",
          "set-variable",
          "teleport",
          "save",
          "load",
          "modify-inventory",
          "set-party-state",
          "call-common-event",
          "modify-actor",
          "manage-party",
          "control-weather",
          "play-audio",
          "control-timer",
          "show-message",
          "execute-script",
        ],
        description: "Runtime control action to perform",
      },
      // set-switch / set-variable
      id: { type: "number", description: "Switch ID or variable ID (1-based)" },
      value: { description: "Value to assign (boolean for switches, number/string for variables)" },
      // teleport
      map_id: { type: "number", description: "Target map ID (teleport)" },
      x: { type: "number", description: "Target X coordinate (teleport)" },
      y: { type: "number", description: "Target Y coordinate (teleport)" },
      direction: { type: "number", enum: [0, 2, 4, 6, 8], description: "Facing direction: 2=down 4=left 6=right 8=up (teleport)" },
      // save / load
      slot: { type: "number", description: "Save slot number (default: 98)" },
      // modify-inventory
      operations: {
        type: "array",
        description: "Inventory changes (for modify-inventory) or actor stat operations (for modify-actor)",
        items: { type: "object" },
      },
      // set-party-state
      actor_id: { type: "number", description: "Actor ID to target (set-party-state, modify-actor, manage-party)" },
      hp_percent: { type: "number", description: "HP as fraction of max HP 0.0–1.0 (set-party-state)" },
      mp_percent: { type: "number", description: "MP as fraction of max MP 0.0–1.0 (set-party-state)" },
      add_states: { type: "array", items: { type: "number" }, description: "State IDs to add (set-party-state)" },
      remove_states: { type: "array", items: { type: "number" }, description: "State IDs to remove (set-party-state)" },
      // call-common-event
      event_id: { type: "integer", description: "Common event ID to trigger (call-common-event)" },
      // manage-party
      party_action: { type: "string", enum: ["add", "remove"], description: "Add or remove an actor from the party (manage-party)" },
      // control-weather
      weather_type: { type: "string", enum: ["none", "rain", "storm", "snow"], description: "Weather type (control-weather)" },
      power: { type: "number", minimum: 0, maximum: 9, description: "Weather intensity 0–9 (control-weather)" },
      duration: { type: "number", minimum: 0, description: "Transition frames; 60 frames = 1 s (control-weather)" },
      // play-audio
      audio_type: {
        type: "string",
        enum: ["bgm", "bgs", "se", "me", "stop_bgm", "stop_bgs"],
        description: "Audio type (play-audio)",
      },
      name: { type: "string", description: "Audio filename without extension, e.g. 'Battle1' (play-audio)" },
      volume: { type: "number", minimum: 0, maximum: 100, description: "Volume 0–100 (play-audio)" },
      pitch: { type: "number", minimum: 50, maximum: 150, description: "Pitch 50–150 (play-audio)" },
      pan: { type: "number", minimum: -100, maximum: 100, description: "Stereo pan -100 to 100 (play-audio)" },
      // control-timer
      timer_action: { type: "string", enum: ["start", "stop"], description: "Timer action (control-timer)" },
      frames: { type: "integer", description: "Timer duration in frames; 60 frames = 1 s (control-timer start)" },
      // show-message
      text: { type: "string", description: "Message text to display (show-message)" },
      speaker: { type: "string", description: "Speaker name above the message window (show-message)" },
      // execute-script
      code: { type: "string", description: "JavaScript/Ruby code to run in the game (execute-script)" },
      timeout: { type: "integer", description: "Milliseconds to wait for confirmation (execute-script, default: 5000)" },
    },
    required: ["action"],
  },
};
