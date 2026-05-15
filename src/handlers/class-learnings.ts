import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditClassLearnings(ctx: HandlerContext): Promise<string> {
  const { input, projectPath, changeLog } = ctx;
  const classId = input.class_id as number;
  const mode = input.mode as string;
  try {
    const filePath = path.join(projectPath, "data", "Classes.json");
    if (!fs.existsSync(filePath)) return JSON.stringify({ error: "Classes.json not found" });
    const classes = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
    const idx = classes.findIndex(c => c !== null && (c as Record<string, unknown>).id === classId);
    if (idx === -1) return JSON.stringify({ error: `Class ${classId} not found` });
    const cls = classes[idx] as Record<string, unknown>;

    type Learning = { level: number; skillId: number; note: string };
    let learnings: Learning[] = Array.isArray(cls.learnings)
      ? (cls.learnings as Learning[]).slice()
      : [];

    if (mode === "replace") {
      const newL = (input.learnings as Array<{ level: number; skill_id: number; note?: string }> | undefined) ?? [];
      learnings = newL.map(l => ({ level: l.level, skillId: l.skill_id, note: l.note ?? "" }));
    } else if (mode === "append") {
      const newL = (input.learnings as Array<{ level: number; skill_id: number; note?: string }> | undefined) ?? [];
      for (const nl of newL) {
        const existing = learnings.findIndex(l => l.level === nl.level);
        const entry = { level: nl.level, skillId: nl.skill_id, note: nl.note ?? "" };
        if (existing !== -1) learnings[existing] = entry; else learnings.push(entry);
      }
      learnings.sort((a, b) => a.level - b.level);
    } else if (mode === "remove_at_level") {
      const lvl = input.level as number | undefined;
      if (lvl === undefined) return JSON.stringify({ error: "remove_at_level mode requires level parameter" });
      learnings = learnings.filter(l => l.level !== lvl);
    }

    classes[idx] = { ...cls, learnings };
    fs.writeFileSync(filePath, JSON.stringify(classes), "utf-8");
    changeLog.append({ tool: "edit-class-learnings", entityType: "Class", entityId: classId, action: "update", summary: `Class ${classId} learnings updated (mode=${mode}, count=${learnings.length})` });
    return JSON.stringify({ success: true, class_id: classId, learnings_count: learnings.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
