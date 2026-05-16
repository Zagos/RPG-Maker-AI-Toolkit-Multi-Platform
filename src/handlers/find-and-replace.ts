import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const ENTITY_FILES = [
  "Actors.json", "Items.json", "Skills.json", "States.json",
  "Weapons.json", "Armors.json", "Classes.json", "Enemies.json",
  "Troops.json", "CommonEvents.json",
];

function countReplace(s: string, find: string, replace: string): [string, number] {
  const count = s.split(find).length - 1;
  return [s.split(find).join(replace), count];
}

export async function handleFindAndReplace(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;
  const find = input.find as string;
  const replace = input.replace as string;
  const confirm = input.confirm as boolean;
  const targets = (input.targets as string[] | undefined) ?? ["names", "notes", "event_commands"];

  if (!find) return JSON.stringify({ error: "find is required" });
  if (replace === undefined || replace === null) return JSON.stringify({ error: "replace is required" });
  if (confirm !== true) return JSON.stringify({ error: "confirm must be true to write changes" });

  const doNames = targets.includes("names");
  const doNotes = targets.includes("notes");
  const doEvents = targets.includes("event_commands");

  let totalReplacements = 0;
  const filesChanged: string[] = [];

  try {
    for (const filename of ENTITY_FILES) {
      const filePath = path.join(projectPath, "data", filename);
      if (!fs.existsSync(filePath)) continue;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
      let fileChanged = false;

      for (const entry of data) {
        if (!entry) continue;
        if (doNames && typeof entry.name === "string") {
          const [newVal, count] = countReplace(entry.name, find, replace);
          if (count > 0) { entry.name = newVal; totalReplacements += count; fileChanged = true; }
        }
        if (doNotes && typeof entry.note === "string") {
          const [newVal, count] = countReplace(entry.note, find, replace);
          if (count > 0) { entry.note = newVal; totalReplacements += count; fileChanged = true; }
        }
        if (doEvents && Array.isArray(entry.list)) {
          for (const cmd of entry.list as Array<Record<string, unknown>>) {
            if ((cmd.code === 401 || cmd.code === 405) && Array.isArray(cmd.parameters)) {
              const params = cmd.parameters as unknown[];
              if (typeof params[0] === "string") {
                const [newVal, count] = countReplace(params[0] as string, find, replace);
                if (count > 0) { params[0] = newVal; totalReplacements += count; fileChanged = true; }
              }
            }
          }
        }
      }

      if (fileChanged) {
        writer.writeDataFile(filename, data);
        filesChanged.push(filename);
      }
    }

    if (doEvents) {
      const dataDir = path.join(projectPath, "data");
      const mapFiles = fs.readdirSync(dataDir).filter((f) => /^Map\d+\.json$/.test(f));
      for (const filename of mapFiles) {
        const mapData = JSON.parse(fs.readFileSync(path.join(dataDir, filename), "utf-8")) as Record<string, unknown>;
        let fileChanged = false;
        const events = mapData.events as Array<Record<string, unknown> | null> | undefined;
        if (!Array.isArray(events)) continue;
        for (const ev of events) {
          if (!ev) continue;
          const pages = ev.pages as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(pages)) continue;
          for (const page of pages) {
            const list = page.list as Array<Record<string, unknown>> | undefined;
            if (!Array.isArray(list)) continue;
            for (const cmd of list) {
              if ((cmd.code === 401 || cmd.code === 405) && Array.isArray(cmd.parameters)) {
                const params = cmd.parameters as unknown[];
                if (typeof params[0] === "string") {
                  const [newVal, count] = countReplace(params[0] as string, find, replace);
                  if (count > 0) { params[0] = newVal; totalReplacements += count; fileChanged = true; }
                }
              }
            }
          }
        }
        if (fileChanged) {
          writer.writeDataFile(filename, mapData);
          filesChanged.push(filename);
        }
      }
    }

    if (filesChanged.length > 0) {
      changeLog.append({
        tool: "find-and-replace",
        entityType: "Multiple",
        action: "update",
        summary: `Replaced '${find}' → '${replace}' in ${filesChanged.length} files (${totalReplacements} replacements)`,
      });
    }

    return JSON.stringify({ success: true, total_replacements: totalReplacements, files_changed: filesChanged });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
