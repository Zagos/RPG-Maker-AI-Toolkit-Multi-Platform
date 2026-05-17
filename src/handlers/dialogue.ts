import * as path from "path";
import { textCommands, createDialogueEventCommands } from "../adapters/mz/commands.js";
import type { DialogueNodeInput } from "../adapters/mz/commands.js";
import type { HandlerContext } from "./types.js";

function safeDataName(value: string): string {
  return (
    value.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "Generated"
  );
}

export async function handleAddDialogue(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const dialogueLines = input.dialogue_lines as Array<{ speaker?: string; text: string }>;
  const eventName = (input.event_name as string | undefined) || "Dialogue";

  if (!Array.isArray(dialogueLines) || dialogueLines.length === 0) {
    return JSON.stringify({ error: "dialogue_lines must be a non-empty array" });
  }

  try {
    const list = [
      ...dialogueLines.flatMap((line) => textCommands(line.text, line.speaker || "")),
      { code: 0, indent: 0, parameters: [] },
    ];

    const newId = writer.addCommonEvent({ name: eventName, trigger: 0, switchId: 1, list });
    ctx.changeLog.append({ tool: "add-dialogue", entityType: "CommonEvent", entityId: newId, action: "create", summary: `Dialogue common event '${eventName}' created (${dialogueLines.length} lines)` });

    return JSON.stringify({
      success: true,
      message: "Dialogue event created",
      event_id: newId,
      lines_count: dialogueLines.length,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleCreateDialogueAdvanced(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath } = ctx;
  const dialogueName = input.dialogue_name as string;
  const dialogueNodes = input.dialogue_nodes as DialogueNodeInput[];

  if (!Array.isArray(dialogueNodes) || dialogueNodes.length === 0) {
    return JSON.stringify({ error: "dialogue_nodes must be a non-empty array" });
  }

  try {
    const normalizedNodes = dialogueNodes.map((node) => ({
      nodeId: node.node_id || node.nodeId,
      speaker: node.speaker,
      text: node.text,
      choices: (node.choices || []).map((choice) => ({
        text: choice.text,
        nextNode: choice.next_node || choice.nextNode,
        condition: choice.condition,
        action: choice.action,
      })),
      actions: node.actions || [],
      endDialogue: node.end_dialogue || node.endDialogue || false,
    }));

    const dialogueData = {
      name: dialogueName,
      nodes: normalizedNodes,
      startNodeId: normalizedNodes[0].nodeId,
      includeJournal: input.include_journal !== false,
      createdAt: new Date().toISOString(),
    };

    const commonEventId = writer.addCommonEvent({
      name: dialogueName,
      trigger: 0,
      switchId: 1,
      list: createDialogueEventCommands(dialogueNodes),
    });

    const dialogueFilename = `Dialogue_${safeDataName((input.script_name as string | undefined) || dialogueName)}.json`;
    writer.writeDataFile(dialogueFilename, dialogueData, false);
    ctx.changeLog.append({ tool: "create-dialogue-advanced", entityType: "CommonEvent", entityId: commonEventId, action: "create", summary: `Branching dialogue '${dialogueName}' created (${dialogueNodes.length} nodes)` });

    return JSON.stringify({
      success: true,
      message: "Branching dialogue system created",
      dialogue_name: dialogueName,
      nodes_count: dialogueNodes.length,
      common_event_id: commonEventId,
      file: path.join(projectPath, "data", dialogueFilename),
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
