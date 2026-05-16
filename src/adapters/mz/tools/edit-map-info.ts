export const EditMapInfoTool = {
  name: "edit-map-info",
  description: "Edit MapInfos.json metadata for a map (name, parent, order, scroll position) without modifying the map file itself",
  inputSchema: {
    type: "object" as const,
    properties: {
      map_id: {
        type: "number",
        description: "The map ID to update in MapInfos.json",
      },
      name: {
        type: "string",
        description: "New display name for the map",
      },
      parent_id: {
        type: "number",
        description: "Parent map ID (0 for root level)",
      },
      order: {
        type: "number",
        description: "Display order in the editor tree",
      },
      expanded: {
        type: "boolean",
        description: "Whether the map is expanded in the editor tree",
      },
      scroll_x: {
        type: "number",
        description: "Horizontal scroll offset in the editor",
      },
      scroll_y: {
        type: "number",
        description: "Vertical scroll offset in the editor",
      },
    },
    required: ["map_id"],
  },
};
