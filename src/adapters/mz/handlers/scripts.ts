import type { HandlerContext } from "./types.js";

export async function handleListScripts(ctx: HandlerContext): Promise<string> {
  try {
    const scripts = ctx.writer.listScripts();
    return JSON.stringify({ success: true, count: scripts.length, scripts });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleReadScript(ctx: HandlerContext): Promise<string> {
  const { input } = ctx;
  const id   = input.id   as number | undefined;
  const name = input.name as string | undefined;

  if (id === undefined && name === undefined) {
    return JSON.stringify({ error: "Provide either 'id' or 'name'" });
  }

  try {
    const script = ctx.writer.readScript(id ?? name!);
    if (!script) {
      return JSON.stringify({ error: `Script not found: ${id ?? name}` });
    }
    return JSON.stringify({ success: true, script });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleCreateScript(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;
  const name   = input.name   as string;
  const source = input.source as string;
  const insertBeforeMain = input.insert_before_main !== false;

  if (!name) return JSON.stringify({ error: "'name' is required" });
  if (source === undefined) return JSON.stringify({ error: "'source' is required" });

  try {
    const id = writer.addScript(name, source, insertBeforeMain);
    changeLog.append({ tool: "create-script", entityType: "Script", entityId: id, action: "create", summary: `Script '${name}' created (id: ${id})` });
    return JSON.stringify({ success: true, script_id: id, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleEditScript(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;
  const id     = input.id     as number;
  const name   = input.name   as string | undefined;
  const source = input.source as string | undefined;

  if (!id) return JSON.stringify({ error: "'id' is required" });
  if (name === undefined && source === undefined) {
    return JSON.stringify({ error: "Provide at least 'name' or 'source' to update" });
  }

  try {
    writer.updateScript(id, { name, source });
    const updated = [name !== undefined && "name", source !== undefined && "source"].filter(Boolean);
    changeLog.append({ tool: "edit-script", entityType: "Script", entityId: id, action: "update", summary: `Script ${id} updated: ${updated.join(", ")}` });
    return JSON.stringify({ success: true, script_id: id, updated });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleDeleteScript(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;
  const id = input.id as number;

  if (!id) return JSON.stringify({ error: "'id' is required" });

  try {
    writer.deleteScript(id);
    changeLog.append({ tool: "delete-script", entityType: "Script", entityId: id, action: "delete", summary: `Script ${id} deleted` });
    return JSON.stringify({ success: true, script_id: id });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
