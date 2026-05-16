import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

type DialogueEntry = {
  source_type: "map" | "common_event";
  source_id: number;
  source_name: string;
  event_id: number;
  event_name: string;
  page: number;
  command_index: number;
  speaker: string;
  lines: string[];
};

function extractFromCommandList(
  list: Array<Record<string, unknown>>,
  entry: Omit<DialogueEntry, "command_index" | "speaker" | "lines">
): DialogueEntry[] {
  const results: DialogueEntry[] = [];
  let i = 0;
  while (i < list.length) {
    const cmd = list[i];
    if (cmd.code === 101 || cmd.code === 105) {
      const params = cmd.parameters as unknown[];
      const speaker = cmd.code === 101 && params.length >= 5 ? String(params[4] ?? "") : "";
      const lines: string[] = [];
      const contCode = cmd.code === 101 ? 401 : 405;
      let j = i + 1;
      while (j < list.length && list[j].code === contCode) {
        const contParams = list[j].parameters as unknown[];
        lines.push(String(contParams[0] ?? ""));
        j++;
      }
      if (lines.length > 0) {
        results.push({ ...entry, command_index: i, speaker, lines });
      }
      i = j;
    } else {
      i++;
    }
  }
  return results;
}

export async function handleExportDialogue(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const includeMaps = (input.include_maps as boolean | undefined) ?? true;
  const includeCommonEvents = (input.include_common_events as boolean | undefined) ?? true;
  const filterMapIds = input.map_ids as number[] | undefined;

  const entries: DialogueEntry[] = [];

  try {
    const dataDir = path.join(projectPath, "data");

    // Read MapInfos for map names
    const mapInfosPath = path.join(dataDir, "MapInfos.json");
    const mapInfos = fs.existsSync(mapInfosPath)
      ? (JSON.parse(fs.readFileSync(mapInfosPath, "utf-8")) as Array<Record<string, unknown> | null>)
      : [];

    if (includeMaps) {
      const mapFiles = fs.readdirSync(dataDir)
        .filter((f) => /^Map\d+\.json$/.test(f))
        .sort();

      for (const filename of mapFiles) {
        const mapId = parseInt(filename.replace("Map", "").replace(".json", ""), 10);
        if (filterMapIds?.length && !filterMapIds.includes(mapId)) continue;

        const mapData = JSON.parse(fs.readFileSync(path.join(dataDir, filename), "utf-8")) as Record<string, unknown>;
        const mapName = (mapInfos[mapId] as Record<string, unknown> | null)?.name as string ?? filename;
        const events = mapData.events as Array<Record<string, unknown> | null> | undefined;
        if (!Array.isArray(events)) continue;

        for (const ev of events) {
          if (!ev) continue;
          const eventId = ev.id as number;
          const eventName = (ev.name as string) || "";
          const pages = ev.pages as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(pages)) continue;

          for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const list = pages[pageIdx].list as Array<Record<string, unknown>> | undefined;
            if (!Array.isArray(list)) continue;
            const found = extractFromCommandList(list, {
              source_type: "map", source_id: mapId, source_name: mapName,
              event_id: eventId, event_name: eventName, page: pageIdx,
            });
            entries.push(...found);
          }
        }
      }
    }

    if (includeCommonEvents) {
      const cePath = path.join(dataDir, "CommonEvents.json");
      if (fs.existsSync(cePath)) {
        const ceData = JSON.parse(fs.readFileSync(cePath, "utf-8")) as Array<Record<string, unknown> | null>;
        for (const ce of ceData) {
          if (!ce) continue;
          const list = ce.list as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(list)) continue;
          const found = extractFromCommandList(list, {
            source_type: "common_event", source_id: ce.id as number,
            source_name: (ce.name as string) || "",
            event_id: 0, event_name: (ce.name as string) || "", page: 0,
          });
          entries.push(...found);
        }
      }
    }

    const totalLines = entries.reduce((sum, e) => sum + e.lines.length, 0);
    return JSON.stringify({ success: true, total_lines: totalLines, total_entries: entries.length, entries });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
