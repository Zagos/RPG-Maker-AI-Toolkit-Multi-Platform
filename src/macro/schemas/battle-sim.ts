import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const BattleSimTool: Tool = {
  name: "battle-sim",
  description:
    "Battle simulation and testing tools. Requires a running game connected via the debug bridge.\n\n" +
    "Actions:\n" +
    "  encounter — run a single battle and return the full battle log (data: troop_id?, enemy_id?, count?, actions?)\n" +
    "  suite — run multiple battles and return aggregate statistics (data: troop_id?, enemy_id?, count?, runs?, party_state?, actions?)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["encounter", "suite"],
        description: "Battle simulation operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields — passed directly to the internal handler",
        properties: {},
      },
    },
    required: ["action", "data"],
  },
};
