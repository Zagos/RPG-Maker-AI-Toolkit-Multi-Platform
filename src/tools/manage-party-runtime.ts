export const ManagePartyRuntimeTool = {
  name: "manage-party-runtime",
  description: "Manage the player party in a running RPG Maker MZ game: add or remove actors, or get the current party members",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["add", "remove", "get"],
        description: "Action to perform: add an actor to the party, remove an actor, or get the current party list",
      },
      actor_id: {
        type: "number",
        description: "Actor ID to add or remove (required for add/remove actions)",
      },
    },
    required: ["action"],
  },
};
