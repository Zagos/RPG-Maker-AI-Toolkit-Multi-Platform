import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CallCommonEventTool: Tool = {
  name: "call-common-event",
  description: "Trigger a common event in the running game by ID. Validates the event exists before calling. Requires the debug plugin to be active.",
  inputSchema: { type: "object", properties: { common_event_id: { type: "integer", description: "ID of the common event to trigger" } }, required: ["common_event_id"] },
};
