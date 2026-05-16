import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

type ImportEntry = {
  source_type: "map" | "common_event";
  source_id: number;
  event_id: number;
  page: number;
  command_index: number;
  lines: string[];
};

export async function handleImportDialogue(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;
  const entries = input.entries as ImportEntry[] | undefined;
  const confirm = input.confirm as boolean;

  if (!Array.isArray(entries) || entries.length === 0) {
    return JSON.stringify({ error: "entries must be a non-empty array" });
  }
  if (confirm !== true) {
    return JSON.stringify({ error: "confirm must be true to write changes" });
  }

  const dataDir = path.join(projectPath, "data");
  // Group entries by file to minimize reads/writes
  const byFile = new Map<string, ImportEntry[]>();

  for (const entry of entries) {
    const filename = entry.source_type === "map"
      ? `Map${String(entry.source_id).padStart(3, "0")}.json`
      : "CommonEvents.json";
    if (!byFile.has(filename)) byFile.set(filename, []);
    byFile.get(filename)!.push(entry);
  }

  let totalLinesUpdated = 0;
  const filesChanged: string[] = [];
  const errors: string[] = [];

  try {
    for (const [filename, fileEntries] of byFile) {
      const filePath = path.join(dataDir, filename);
      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${filename}`);
        continue;
      }

      const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
      let fileChanged = false;

      for (const entry of fileEntries) {
        let list: Array<Record<string, unknown>> | undefined;

        if (entry.source_type === "map") {
          const mapData = fileData as Record<string, unknown>;
          const events = mapData.events as Array<Record<string, unknown> | null> | undefined;
          const ev = events?.find((e) => e && (e.id as number) === entry.event_id);
          if (!ev) { errors.push(`Event ${entry.event_id} not found in ${filename}`); continue; }
          const pages = ev.pages as Array<Record<string, unknown>> | undefined;
          const page = pages?.[entry.page];
          if (!page) { errors.push(`Page ${entry.page} not found in event ${entry.event_id}`); continue; }
          list = page.list as Array<Record<string, unknown>> | undefined;
        } else {
          const ceData = fileData as Array<Record<string, unknown> | null>;
          const ce = ceData.find((e) => e && (e.id as number) === entry.source_id);
          if (!ce) { errors.push(`CommonEvent ${entry.source_id} not found`); continue; }
          list = ce.list as Array<Record<string, unknown>> | undefined;
        }

        if (!Array.isArray(list)) { errors.push(`No command list found for entry`); continue; }

        const headerCmd = list[entry.command_index];
        if (!headerCmd || (headerCmd.code !== 101 && headerCmd.code !== 105)) {
          errors.push(`command_index ${entry.command_index} is not a message command in ${filename}`);
          continue;
        }

        const contCode = headerCmd.code === 101 ? 401 : 405;
        let j = entry.command_index + 1;
        let lineIdx = 0;
        while (j < list.length && list[j].code === contCode && lineIdx < entry.lines.length) {
          (list[j].parameters as unknown[])[0] = entry.lines[lineIdx];
          lineIdx++;
          j++;
          fileChanged = true;
          totalLinesUpdated++;
        }
      }

      if (fileChanged) {
        writer.writeDataFile(filename, fileData);
        filesChanged.push(filename);
      }
    }

    if (filesChanged.length > 0) {
      changeLog.append({
        tool: "import-dialogue",
        entityType: "Multiple",
        action: "update",
        summary: `import-dialogue: updated ${totalLinesUpdated} lines in ${filesChanged.length} files`,
      });
    }

    return JSON.stringify({
      success: errors.length === 0,
      total_lines_updated: totalLinesUpdated,
      files_changed: filesChanged,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
