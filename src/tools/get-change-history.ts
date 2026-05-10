import { z } from "zod";

export const getChangeHistorySchema = {
  name: "get-change-history",
  description: "Read the MCP change log. Returns a newest-first list of all tool calls that modified RPG Maker project data.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(500).optional().describe("Maximum number of entries to return (default 50)"),
    entity_type: z.string().optional().describe("Filter by entity type: Actor, Item, Weapon, Armor, Skill, Class, State, Enemy, MapEvent, CommonEvent, Plugin, Story"),
    tool: z.string().optional().describe("Filter by tool name (e.g. 'edit-actor', 'create-map-event')"),
    action: z.enum(["create", "update", "delete"]).optional().describe("Filter by action"),
    since: z.string().optional().describe("ISO 8601 datetime — only entries on or after this timestamp"),
  }),
};
