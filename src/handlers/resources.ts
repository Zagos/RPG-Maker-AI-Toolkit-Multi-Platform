import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const ASSET_DIRS: Record<string, string> = {
  characters: path.join("img", "characters"),
  faces: path.join("img", "faces"),
  battlers: path.join("img", "battlers"),
  sv_actors: path.join("img", "sv_actors"),
  tilesets: path.join("img", "tilesets"),
  parallaxes: path.join("img", "parallaxes"),
  pictures: path.join("img", "pictures"),
  bgm: path.join("audio", "bgm"),
  bgs: path.join("audio", "bgs"),
  se: path.join("audio", "se"),
  me: path.join("audio", "me"),
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const AUDIO_EXTS = new Set([".ogg", ".m4a", ".mp3", ".wav"]);

function listDir(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXTS.has(ext) || AUDIO_EXTS.has(ext);
    })
    .map((f) => path.basename(f, path.extname(f)))
    .sort();
}

export async function handleListResources(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;

  try {
    const category = input.category as string;

    if (category === "all") {
      const result: Record<string, string[]> = {};
      for (const [cat, rel] of Object.entries(ASSET_DIRS)) {
        result[cat] = listDir(path.join(projectPath, rel));
      }
      return JSON.stringify({ success: true, category: "all", resources: result });
    }

    if (!(category in ASSET_DIRS)) {
      return JSON.stringify({ error: `category must be one of: ${Object.keys(ASSET_DIRS).join(", ")}, all` });
    }

    const files = listDir(path.join(projectPath, ASSET_DIRS[category]));
    return JSON.stringify({ success: true, category, files, count: files.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
