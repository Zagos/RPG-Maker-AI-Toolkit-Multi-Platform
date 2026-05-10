import * as path from "path";
import { textCommands, commandInputToEventCommands } from "../rpgmaker/commands.js";
import type { RPGEventCommand } from "../types/rpgmaker.js";
import type { HandlerContext } from "./types.js";

function safeDataName(value: string): string {
  return (
    value.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "Generated"
  );
}

type StoryScene = {
  scene_id: string;
  scene_name: string;
  map_id?: number;
  events: Array<{
    event_id: string;
    type: "dialogue" | "battle" | "choice" | "animation" | "transfer";
    content: string;
    prerequisites?: string[];
  }>;
  branches?: Array<{ condition: string; next_scene: string }>;
};

export async function handleStoryGenerator(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath } = ctx;
  const storyTitle = input.story_title as string;
  const storyDescription = input.story_description as string;
  const scenes = input.scenes as StoryScene[];

  if (!Array.isArray(scenes) || scenes.length === 0) {
    return JSON.stringify({ error: "scenes must be a non-empty array" });
  }

  try {
    const generatedCommonEvents: Array<{ scene_id: string; scene_name: string; common_event_id: number }> = [];

    for (const scene of scenes) {
      const commands: RPGEventCommand[] = [];
      commands.push(...textCommands(scene.scene_name, storyTitle));

      for (const event of scene.events) {
        if (event.prerequisites && event.prerequisites.length > 0) {
          commands.push({ code: 108, indent: 0, parameters: [`Prerequisites: ${event.prerequisites.join(", ")}`] });
        }

        switch (event.type) {
          case "dialogue":
            commands.push(...textCommands(event.content));
            break;
          case "battle":
            commands.push({ code: 301, indent: 0, parameters: [0, Number(event.content), true, false] });
            break;
          case "choice":
            commands.push(...commandInputToEventCommands({ type: "choice", data: event.content }));
            break;
          case "animation":
            commands.push({ code: 212, indent: 0, parameters: [0, Number(event.content), true] });
            break;
          case "transfer": {
            const [mapId, x, y] = event.content.split(":");
            commands.push({ code: 201, indent: 0, parameters: [0, Number(mapId), Number(x), Number(y), 2, 0] });
            break;
          }
        }
      }

      for (const branch of scene.branches || []) {
        commands.push({ code: 108, indent: 0, parameters: [`Branch if ${branch.condition}: ${branch.next_scene}`] });
      }

      commands.push({ code: 0, indent: 0, parameters: [] });

      const commonEventId = writer.addCommonEvent({
        name: `${storyTitle} - ${scene.scene_name}`,
        trigger: 0,
        switchId: 1,
        list: commands,
      });

      generatedCommonEvents.push({ scene_id: scene.scene_id, scene_name: scene.scene_name, common_event_id: commonEventId });
    }

    const storyData = {
      title: storyTitle,
      description: storyDescription,
      scenes,
      theme: input.theme || "adventure",
      difficulty: input.difficulty || "normal",
      targetLength: input.target_length || null,
      generatedCommonEvents,
      currentSceneId: scenes[0].scene_id,
      completedEvents: [],
      createdAt: new Date().toISOString(),
    };

    const storyFilename = `Story_${safeDataName(storyTitle)}.json`;
    writer.writeDataFile(storyFilename, storyData, false);
    ctx.changeLog.append({ tool: "story-generator", entityType: "Story", action: "create", summary: `Story '${storyTitle}' generated: ${scenes.length} scenes, ${generatedCommonEvents.length} common events` });

    return JSON.stringify({
      success: true,
      message: "Story generated with common events",
      story_title: storyTitle,
      scenes_count: scenes.length,
      total_events: scenes.reduce((sum, s) => sum + s.events.length, 0),
      common_event_ids: generatedCommonEvents.map((e) => e.common_event_id),
      file: path.join(projectPath, "data", storyFilename),
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
