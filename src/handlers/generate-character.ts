import type { HandlerContext } from "./types.js";

type Archetype = "warrior" | "mage" | "rogue" | "healer" | "paladin" | "ranger";

interface ArchetypeConfig {
  classKeywords: string[];
  weaponKeywords: string[];
  armorKeywords: string[];
  defaultCharacter: string;
  defaultCharacterIndex: number;
  defaultFace: string;
  defaultFaceIndex: number;
  traits: Array<{ code: number; dataId: number; value: number }>;
}

const ARCHETYPES: Record<Archetype, ArchetypeConfig> = {
  warrior: {
    classKeywords: ["warrior", "fighter", "knight", "soldier", "swordsman", "hero", "barbarian", "gladiator"],
    weaponKeywords: ["sword", "axe", "lance", "spear", "blade", "great"],
    armorKeywords: ["heavy", "plate", "mail", "shield", "iron", "steel"],
    defaultCharacter: "Actor1",
    defaultCharacterIndex: 0,
    defaultFace: "Actor1",
    defaultFaceIndex: 0,
    traits: [],
  },
  mage: {
    classKeywords: ["mage", "wizard", "sorcerer", "magician", "witch", "black mage", "scholar", "sage"],
    weaponKeywords: ["staff", "rod", "wand", "cane", "tome"],
    armorKeywords: ["robe", "cloth", "magic", "mystic"],
    defaultCharacter: "Actor2",
    defaultCharacterIndex: 0,
    defaultFace: "Actor2",
    defaultFaceIndex: 0,
    traits: [],
  },
  rogue: {
    classKeywords: ["rogue", "thief", "assassin", "ninja", "scoundrel", "bandit", "spy"],
    weaponKeywords: ["dagger", "knife", "shuriken", "claw", "short"],
    armorKeywords: ["leather", "light", "thief", "ninja"],
    defaultCharacter: "Actor3",
    defaultCharacterIndex: 0,
    defaultFace: "Actor3",
    defaultFaceIndex: 0,
    traits: [],
  },
  healer: {
    classKeywords: ["healer", "cleric", "priest", "white mage", "oracle", "bishop", "monk", "paladin"],
    weaponKeywords: ["staff", "mace", "rod", "hammer", "holy"],
    armorKeywords: ["robe", "cloth", "sacred", "light", "divine"],
    defaultCharacter: "Actor2",
    defaultCharacterIndex: 2,
    defaultFace: "Actor2",
    defaultFaceIndex: 2,
    traits: [],
  },
  paladin: {
    classKeywords: ["paladin", "holy knight", "templar", "crusader", "guardian"],
    weaponKeywords: ["sword", "lance", "holy", "blessed"],
    armorKeywords: ["heavy", "plate", "holy", "sacred", "divine", "shield"],
    defaultCharacter: "Actor1",
    defaultCharacterIndex: 2,
    defaultFace: "Actor1",
    defaultFaceIndex: 2,
    traits: [],
  },
  ranger: {
    classKeywords: ["ranger", "archer", "hunter", "scout", "marksman", "sniper"],
    weaponKeywords: ["bow", "crossbow", "gun", "rifle", "arrow"],
    armorKeywords: ["leather", "light", "hunter", "scout"],
    defaultCharacter: "Actor3",
    defaultCharacterIndex: 2,
    defaultFace: "Actor3",
    defaultFaceIndex: 2,
    traits: [],
  },
};

function matchByKeywords(name: string, keywords: string[]): number {
  const lower = name.toLowerCase();
  return keywords.reduce((score, kw) => (lower.includes(kw) ? score + 1 : score), 0);
}

function findBestMatch<T extends { name?: unknown; id?: unknown }>(
  items: T[],
  keywords: string[]
): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const item of items) {
    if (!item || typeof item.name !== "string") continue;
    const score = matchByKeywords(item.name, keywords);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

export async function handleGenerateCharacter(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const name = input.name as string;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return JSON.stringify({ error: "name is required and must be a non-empty string" });
    }

    const archetypeKey = input.archetype as string;
    if (!(archetypeKey in ARCHETYPES)) {
      return JSON.stringify({
        error: `archetype must be one of: ${Object.keys(ARCHETYPES).join(", ")}`,
      });
    }
    const archetype = ARCHETYPES[archetypeKey as Archetype];

    const initialLevel = Math.max(1, Math.min(99, (input.initial_level as number | undefined) ?? 1));
    const maxLevel = Math.max(initialLevel, Math.min(99, (input.max_level as number | undefined) ?? 99));
    const nickname = (input.nickname as string | undefined) ?? "";
    const profile = (input.profile as string | undefined) ?? "";
    const note = (input.note as string | undefined) ?? "";

    // --- Pick class ---
    let classId = 1;
    try {
      const classes = reader.readClasses();
      const bestClass = findBestMatch(classes, archetype.classKeywords);
      if (bestClass && typeof bestClass.id === "number") classId = bestClass.id;
    } catch {
      // no classes available — keep default
    }

    // --- Pick weapons (slot 0) ---
    let weaponId = 0;
    try {
      const weapons = reader.readWeapons();
      const best = findBestMatch(weapons, archetype.weaponKeywords);
      if (best && typeof best.id === "number") weaponId = best.id;
      else if (weapons.length > 0 && typeof weapons[0].id === "number") weaponId = weapons[0].id;
    } catch {
      // no weapons
    }

    // --- Pick armor (body slot = index 3) ---
    let armorId = 0;
    try {
      const armors = reader.readArmors();
      const best = findBestMatch(armors, archetype.armorKeywords);
      if (best && typeof best.id === "number") armorId = best.id;
      else if (armors.length > 0 && typeof armors[0].id === "number") armorId = armors[0].id;
    } catch {
      // no armors
    }

    // equips: [weapon, shield, head, body, accessory]
    const equips = [weaponId, 0, 0, armorId, 0];

    // --- Sprite & face ---
    const characterName = (input.character_name as string | undefined) ?? archetype.defaultCharacter;
    const characterIndex = (input.character_index as number | undefined) ?? archetype.defaultCharacterIndex;
    const faceName = (input.face_name as string | undefined) ?? archetype.defaultFace;
    const faceIndex = (input.face_index as number | undefined) ?? archetype.defaultFaceIndex;

    const actorData: Record<string, unknown> = {
      battlerName: "",
      characterIndex,
      characterName,
      classId,
      equips,
      faceIndex,
      faceName,
      traits: archetype.traits,
      initialLevel,
      maxLevel,
      name,
      nickname,
      note,
      profile,
    };

    const newId = writer.addActor(actorData);

    changeLog.append({
      tool: "generate-character",
      entityType: "Actor",
      entityId: newId,
      action: "create",
      summary: `Actor ${newId} generated: name='${name}' archetype=${archetypeKey} classId=${classId}`,
    });

    return JSON.stringify({
      success: true,
      actor_id: newId,
      name,
      archetype: archetypeKey,
      class_id: classId,
      equips: {
        weapon: equips[0],
        shield: equips[1],
        head: equips[2],
        body: equips[3],
        accessory: equips[4],
      },
      sprite: { characterName, characterIndex, faceName, faceIndex },
      initial_level: initialLevel,
      max_level: maxLevel,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
