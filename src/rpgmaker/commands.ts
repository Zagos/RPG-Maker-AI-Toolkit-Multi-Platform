import type { RPGEventCommand, RPGEventPage } from "../types/rpgmaker.js";

export type MapEventCommandInput = {
  type:
    | "message"
    | "choice"
    | "wait"
    | "transfer"
    | "script"
    | "switch"
    | "variable"
    | "common-event"
    | "battle"
    | "animation"
    | "conditional-branch"
    | "loop"
    | "break-loop"
    | "exit-event"
    | "label"
    | "jump-to-label"
    | "control-self-switch"
    | "change-gold"
    | "change-item"
    | "change-weapon"
    | "change-armor"
    | "add-party-member"
    | "remove-party-member"
    | "change-hp"
    | "change-mp"
    | "change-tp"
    | "recover-all"
    | "change-state"
    | "shop"
    | "show-picture"
    | "erase-picture"
    | "play-bgm"
    | "play-se"
    | "play-me"
    | "stop-bgm"
    | "fade-out"
    | "fade-in"
    | "comment"
    | "change-variable"
    | "input-number"
    | "select-item"
    | "show-scrolling-text"
    | "name-input"
    | "tint-screen"
    | "shake-screen"
    | "flash-screen"
    | "play-bgs"
    | "change-exp"
    | "change-level"
    | "change-skill"
    | "change-equipment"
    | "change-class"
    | "save-bgm"
    | "resume-bgm"
    | "fade-out-bgs"
    | "stop-se"
    | "change-parameter"
    | "change-name"
    | "change-nickname"
    | "change-profile"
    | "scroll-map"
    | "change-map-name-display"
    | "change-tileset"
    | "change-battle-back"
    | "control-timer"
    | "change-transparency"
    | "erase-event"
    | "open-menu"
    | "open-save"
    | "game-over"
    | "return-to-title"
    | "plugin-command";
  data?: string | Record<string, unknown>;
};

export type DialogueChoiceInput = {
  text: string;
  next_node?: string;
  nextNode?: string;
  condition?: string;
  action?: string;
};

export type DialogueNodeInput = {
  node_id?: string;
  nodeId?: string;
  speaker: string;
  text: string;
  choices?: DialogueChoiceInput[];
  actions?: string[];
  end_dialogue?: boolean;
  endDialogue?: boolean;
};

export function textCommands(text: string, speaker = ""): RPGEventCommand[] {
  const lines = text.split(/\r?\n/).flatMap((line) => {
    if (line.length <= 60) return [line];
    const chunks: string[] = [];
    for (let i = 0; i < line.length; i += 60) chunks.push(line.slice(i, i + 60));
    return chunks;
  });

  return [
    { code: 101, indent: 0, parameters: ["", 0, 0, 2, speaker] },
    ...lines.map((line) => ({ code: 401, indent: 0, parameters: [line] })),
  ];
}

export function scriptCommands(script: string): RPGEventCommand[] {
  return script.split(/\r?\n/).map((line, i) => ({
    code: i === 0 ? 355 : 655,
    indent: 0,
    parameters: [line],
  }));
}

export function actionCommands(action?: string): RPGEventCommand[] {
  if (!action) return [];

  const [command, ...args] = action.split(":");

  switch (command) {
    case "setSwitch":
      return [{ code: 121, indent: 0, parameters: [Number(args[0]), Number(args[0]), args[1] === "false" ? 1 : 0] }];
    case "setVariable":
      return [{ code: 122, indent: 0, parameters: [Number(args[0]), Number(args[0]), 0, 0, Number(args[1]) || 0] }];
    case "addItem":
      return [{ code: 126, indent: 0, parameters: [Number(args[0]), 0, 0, Number(args[1]) || 1] }];
    case "addGold":
      return [{ code: 125, indent: 0, parameters: [0, 0, Number(args[0]) || 0] }];
    case "commonEvent":
      return [{ code: 117, indent: 0, parameters: [Number(args[0])] }];
    case "script":
      return scriptCommands(args.join(":"));
    default:
      return [{ code: 108, indent: 0, parameters: [`Unsupported action: ${action}`] }];
  }
}

export function commandInputToEventCommands(command: MapEventCommandInput): RPGEventCommand[] {
  const rawData = command.data ?? "";
  // Resolve a string value for commands that still use plain string data
  const data = typeof rawData === "string" ? rawData : "";
  // Resolve object data for structured commands
  const obj: Record<string, unknown> = typeof rawData === "object" && rawData !== null ? rawData : {};

  switch (command.type) {
    // ── Existing types ────────────────────────────────────────────────────────
    case "message":
      return textCommands(data);

    case "choice": {
      const choices = data.split("|").map((c) => c.trim()).filter(Boolean);
      return [
        { code: 102, indent: 0, parameters: [choices, 0, -1, 2, 0] },
        ...choices.map((c, i) => ({ code: 402, indent: 0, parameters: [i, c] })),
        { code: 404, indent: 0, parameters: [] },
      ];
    }

    case "wait":
      return [{ code: 230, indent: 0, parameters: [Number(data) || 60] }];

    case "transfer": {
      const [mapId, x, y, direction = "2", fade = "0"] = data.split(":");
      return [{ code: 201, indent: 0, parameters: [0, Number(mapId), Number(x), Number(y), Number(direction), Number(fade)] }];
    }

    case "script":
      return scriptCommands(data);

    case "switch":
      return actionCommands(`setSwitch:${data}`);

    case "variable":
      return actionCommands(`setVariable:${data}`);

    case "common-event":
      return actionCommands(`commonEvent:${data}`);

    case "battle":
      return [{ code: 301, indent: 0, parameters: [0, Number(data), true, false] }];

    case "animation":
      return [{ code: 212, indent: 0, parameters: [0, Number(data), true] }];

    // ── New types ─────────────────────────────────────────────────────────────

    case "conditional-branch": {
      const condType = String(obj["type"] ?? "script");
      let params: unknown[];

      if (condType === "switch") {
        const id = Number(obj["id"] ?? 1);
        const value = obj["value"] !== false && obj["value"] !== 1;
        params = [0, id, 0, value ? 0 : 1];
      } else if (condType === "variable") {
        const id = Number(obj["id"] ?? 1);
        const operator = Number(obj["operator"] ?? 0);
        const value = Number(obj["value"] ?? 0);
        params = [1, id, 0, operator, value];
      } else {
        // default: script condition
        const condition = String(obj["condition"] ?? "true");
        params = [12, condition];
      }

      return [
        { code: 111, indent: 0, parameters: params },
        { code: 411, indent: 0, parameters: [] },
        { code: 412, indent: 0, parameters: [] },
      ];
    }

    case "loop":
      return [
        { code: 112, indent: 0, parameters: [] },
        { code: 413, indent: 0, parameters: [] },
      ];

    case "break-loop":
      return [{ code: 113, indent: 0, parameters: [] }];

    case "exit-event":
      return [{ code: 115, indent: 0, parameters: [] }];

    case "label": {
      const name = typeof rawData === "string" ? rawData : String(obj["name"] ?? "");
      return [{ code: 118, indent: 0, parameters: [name] }];
    }

    case "jump-to-label": {
      const name = typeof rawData === "string" ? rawData : String(obj["name"] ?? "");
      return [{ code: 119, indent: 0, parameters: [name] }];
    }

    case "control-self-switch": {
      const key = String(obj["key"] ?? "A");
      const value = obj["value"] !== false && obj["value"] !== 0;
      return [{ code: 123, indent: 0, parameters: [key, value ? 0 : 1] }];
    }

    case "change-gold": {
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      return [{ code: 125, indent: 0, parameters: [0, 0, operation, amount] }];
    }

    case "change-item": {
      const item_id = Number(obj["item_id"] ?? 1);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 1);
      return [{ code: 126, indent: 0, parameters: [item_id, operation, 0, amount] }];
    }

    case "change-weapon": {
      const weapon_id = Number(obj["weapon_id"] ?? 1);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 1);
      const include_equip = Boolean(obj["include_equip"] ?? false);
      return [{ code: 127, indent: 0, parameters: [weapon_id, operation, 0, amount, include_equip] }];
    }

    case "change-armor": {
      const armor_id = Number(obj["armor_id"] ?? 1);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 1);
      const include_equip = Boolean(obj["include_equip"] ?? false);
      return [{ code: 128, indent: 0, parameters: [armor_id, operation, 0, amount, include_equip] }];
    }

    case "add-party-member": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      return [{ code: 129, indent: 0, parameters: [actor_id, 0] }];
    }

    case "remove-party-member": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      return [{ code: 129, indent: 0, parameters: [actor_id, 1] }];
    }

    case "change-hp": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      const allow_death = Boolean(obj["allow_death"] ?? false);
      return [{ code: 311, indent: 0, parameters: [0, actor_id, 0, 0, operation, amount, allow_death] }];
    }

    case "change-mp": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      return [{ code: 312, indent: 0, parameters: [0, actor_id, 0, 0, operation, amount] }];
    }

    case "change-tp": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      return [{ code: 326, indent: 0, parameters: [0, actor_id, 0, 0, operation, amount] }];
    }

    case "recover-all": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      return [{ code: 314, indent: 0, parameters: [0, actor_id] }];
    }

    case "change-state": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const state_id = Number(obj["state_id"] ?? 1);
      return [{ code: 313, indent: 0, parameters: [0, actor_id, operation, state_id] }];
    }

    case "shop": {
      const goods = Array.isArray(obj["goods"]) ? obj["goods"] as Array<Record<string, unknown>> : [];
      const purchase_only = Boolean(obj["purchase_only"] ?? false);
      if (goods.length === 0) return [];

      const firstGood = [
        Number(goods[0]["type"] ?? 0),
        Number(goods[0]["id"] ?? 1),
        Number(goods[0]["price_type"] ?? 0),
        Number(goods[0]["price"] ?? 0),
      ];

      const cmds: RPGEventCommand[] = [
        { code: 302, indent: 0, parameters: [firstGood, purchase_only ? 1 : 0] },
      ];

      for (let i = 1; i < goods.length; i++) {
        const g = goods[i];
        cmds.push({
          code: 605,
          indent: 0,
          parameters: [[Number(g["type"] ?? 0), Number(g["id"] ?? 1), Number(g["price_type"] ?? 0), Number(g["price"] ?? 0)]],
        });
      }

      return cmds;
    }

    case "show-picture": {
      const picture_id = Number(obj["picture_id"] ?? 1);
      const name = String(obj["name"] ?? "");
      const origin = Number(obj["origin"] ?? 0);
      const x = Number(obj["x"] ?? 0);
      const y = Number(obj["y"] ?? 0);
      const scale_x = Number(obj["scale_x"] ?? 100);
      const scale_y = Number(obj["scale_y"] ?? 100);
      const opacity = Number(obj["opacity"] ?? 255);
      const blend_mode = Number(obj["blend_mode"] ?? 0);
      return [{ code: 231, indent: 0, parameters: [picture_id, name, origin, 0, x, y, scale_x, scale_y, opacity, blend_mode] }];
    }

    case "erase-picture": {
      const picture_id = Number(obj["picture_id"] ?? 1);
      return [{ code: 235, indent: 0, parameters: [picture_id] }];
    }

    case "play-bgm": {
      const name = typeof rawData === "string" && rawData ? rawData : String(obj["name"] ?? "");
      return [{
        code: 241,
        indent: 0,
        parameters: [{ name, volume: Number(obj["volume"] ?? 90), pitch: Number(obj["pitch"] ?? 100), pan: Number(obj["pan"] ?? 0) }],
      }];
    }

    case "play-se": {
      const name = typeof rawData === "string" && rawData ? rawData : String(obj["name"] ?? "");
      return [{
        code: 250,
        indent: 0,
        parameters: [{ name, volume: Number(obj["volume"] ?? 90), pitch: Number(obj["pitch"] ?? 100), pan: Number(obj["pan"] ?? 0) }],
      }];
    }

    case "play-me": {
      const name = typeof rawData === "string" && rawData ? rawData : String(obj["name"] ?? "");
      return [{
        code: 249,
        indent: 0,
        parameters: [{ name, volume: Number(obj["volume"] ?? 90), pitch: Number(obj["pitch"] ?? 100), pan: 0 }],
      }];
    }

    case "stop-bgm":
      return [{ code: 243, indent: 0, parameters: [] }];

    case "fade-out": {
      const duration = Number(obj["duration"] ?? (typeof rawData === "string" && rawData ? rawData : 24)) || 24;
      return [{ code: 221, indent: 0, parameters: [duration] }];
    }

    case "fade-in": {
      const duration = Number(obj["duration"] ?? (typeof rawData === "string" && rawData ? rawData : 24)) || 24;
      return [{ code: 222, indent: 0, parameters: [duration] }];
    }

    case "comment": {
      const text = typeof rawData === "string" ? rawData : String(obj["text"] ?? "");
      return [{ code: 108, indent: 0, parameters: [text] }];
    }

    case "change-variable": {
      const id = Number(obj["id"] ?? 1);
      const operandRaw = obj["operand"] ?? 0;
      const operand = typeof operandRaw === "number" ? operandRaw : Number(operandRaw) || 0;
      const opMap: Record<string, number> = { set: 0, add: 1, sub: 2, mul: 3, div: 4, mod: 5 };
      const operation = opMap[String(obj["operation"] ?? "set")] ?? 0;
      return [{ code: 122, indent: 0, parameters: [id, id, operation, 0, operand] }];
    }

    case "input-number": {
      const variable_id = Number(obj["variable_id"] ?? 1);
      const digits = Number(obj["digits"] ?? 1);
      return [{ code: 103, indent: 0, parameters: [variable_id, digits] }];
    }

    case "select-item": {
      const variable_id = Number(obj["variable_id"] ?? 1);
      const item_type = Number(obj["item_type"] ?? 2);
      return [{ code: 104, indent: 0, parameters: [variable_id, item_type] }];
    }

    case "show-scrolling-text": {
      const speed = Number(obj["speed"] ?? 2);
      const no_fast = Boolean(obj["no_fast"] ?? false);
      const text = typeof rawData === "string" ? rawData : String(obj["text"] ?? "");
      const lines = text.split(/\r?\n/);
      return [
        { code: 105, indent: 0, parameters: [speed, no_fast] },
        ...lines.map((line) => ({ code: 405, indent: 0, parameters: [line] })),
      ];
    }

    case "name-input": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const max_chars = Number(obj["max_chars"] ?? 8);
      return [{ code: 303, indent: 0, parameters: [actor_id, max_chars] }];
    }

    case "tint-screen": {
      const tone = Array.isArray(obj["tone"]) ? obj["tone"] as number[] : [-68, -68, 0, 68];
      const duration = Number(obj["duration"] ?? 60);
      const wait = Boolean(obj["wait"] ?? false);
      return [{ code: 223, indent: 0, parameters: [tone, duration, wait] }];
    }

    case "shake-screen": {
      const power = Number(obj["power"] ?? 5);
      const speed = Number(obj["speed"] ?? 5);
      const duration = Number(obj["duration"] ?? 60);
      const wait = Boolean(obj["wait"] ?? false);
      return [{ code: 225, indent: 0, parameters: [power, speed, duration, wait] }];
    }

    case "flash-screen": {
      const color = Array.isArray(obj["color"]) ? obj["color"] as number[] : [255, 255, 255, 68];
      const duration = Number(obj["duration"] ?? 60);
      const wait = Boolean(obj["wait"] ?? false);
      return [{ code: 224, indent: 0, parameters: [color, duration, wait] }];
    }

    case "play-bgs": {
      const name = typeof rawData === "string" && rawData ? rawData : String(obj["name"] ?? "");
      return [{
        code: 245,
        indent: 0,
        parameters: [{ name, volume: Number(obj["volume"] ?? 90), pitch: Number(obj["pitch"] ?? 100), pan: Number(obj["pan"] ?? 0) }],
      }];
    }

    case "change-exp": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      const show_level_up = Boolean(obj["show_level_up"] ?? true);
      return [{ code: 315, indent: 0, parameters: [0, actor_id, 0, 0, operation, amount, show_level_up] }];
    }

    case "change-level": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 1);
      const show_level_up = Boolean(obj["show_level_up"] ?? true);
      return [{ code: 316, indent: 0, parameters: [0, actor_id, 0, 0, operation, amount, show_level_up] }];
    }

    case "change-skill": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const operation = String(obj["operation"] ?? "learn") === "forget" ? 1 : 0;
      const skill_id = Number(obj["skill_id"] ?? 1);
      return [{ code: 318, indent: 0, parameters: [0, actor_id, operation, skill_id] }];
    }

    case "change-equipment": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const slot_id = Number(obj["slot_id"] ?? 0);
      const equip_id = Number(obj["equip_id"] ?? 0);
      return [{ code: 319, indent: 0, parameters: [actor_id, slot_id, equip_id] }];
    }

    case "change-class": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const class_id = Number(obj["class_id"] ?? 1);
      const keep_exp = Boolean(obj["keep_exp"] ?? false);
      return [{ code: 321, indent: 0, parameters: [actor_id, class_id, keep_exp] }];
    }

    case "save-bgm":
      return [{ code: 243, indent: 0, parameters: [] }];

    case "resume-bgm":
      return [{ code: 244, indent: 0, parameters: [] }];

    case "fade-out-bgs": {
      const duration = Number(obj["duration"] ?? 60);
      return [{ code: 246, indent: 0, parameters: [duration] }];
    }

    case "stop-se":
      return [{ code: 251, indent: 0, parameters: [] }];

    case "change-parameter": {
      const actor_id = Number(obj["actor_id"] ?? 0);
      const parameter_id = Number(obj["parameter_id"] ?? 0);
      const operation = String(obj["operation"] ?? "add") === "remove" ? 1 : 0;
      const amount = Number(obj["amount"] ?? 0);
      return [{ code: 317, indent: 0, parameters: [0, actor_id, parameter_id, 0, 0, operation, amount] }];
    }

    case "change-name": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const name = String(obj["name"] ?? "");
      return [{ code: 320, indent: 0, parameters: [actor_id, name] }];
    }

    case "change-nickname": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const nickname = String(obj["nickname"] ?? "");
      return [{ code: 324, indent: 0, parameters: [actor_id, nickname] }];
    }

    case "change-profile": {
      const actor_id = Number(obj["actor_id"] ?? 1);
      const profile = String(obj["profile"] ?? "");
      return [{ code: 325, indent: 0, parameters: [actor_id, profile] }];
    }

    case "scroll-map": {
      const direction = Number(obj["direction"] ?? 6);
      const distance = Number(obj["distance"] ?? 3);
      const speed = Number(obj["speed"] ?? 4);
      const wait = Boolean(obj["wait"] ?? false);
      return [{ code: 204, indent: 0, parameters: [direction, distance, speed, wait] }];
    }

    case "change-map-name-display": {
      const show = Boolean(obj["show"] ?? true);
      return [{ code: 281, indent: 0, parameters: [show ? 0 : 1] }];
    }

    case "change-tileset": {
      const tileset_id = Number(obj["tileset_id"] ?? 1);
      return [{ code: 282, indent: 0, parameters: [tileset_id] }];
    }

    case "change-battle-back": {
      const back1 = String(obj["back1"] ?? "");
      const back2 = String(obj["back2"] ?? "");
      return [{ code: 283, indent: 0, parameters: [back1, back2] }];
    }

    case "control-timer": {
      const operation = String(obj["operation"] ?? "start");
      if (operation === "stop") {
        return [{ code: 124, indent: 0, parameters: [1] }];
      }
      const frames = Number(obj["frames"] ?? 600);
      return [{ code: 124, indent: 0, parameters: [0, frames] }];
    }

    case "change-transparency": {
      const transparent = Boolean(obj["transparent"] ?? false);
      return [{ code: 211, indent: 0, parameters: [transparent ? 0 : 1] }];
    }

    case "erase-event":
      return [{ code: 214, indent: 0, parameters: [] }];

    case "open-menu":
      return [{ code: 351, indent: 0, parameters: [] }];

    case "open-save":
      return [{ code: 352, indent: 0, parameters: [] }];

    case "game-over":
      return [{ code: 353, indent: 0, parameters: [] }];

    case "return-to-title":
      return [{ code: 354, indent: 0, parameters: [] }];

    case "plugin-command": {
      const plugin_name = String(obj["plugin_name"] ?? "");
      const command_name = String(obj["command_name"] ?? "");
      const args = (obj["args"] ?? {}) as Record<string, string>;
      return [{ code: 357, indent: 0, parameters: [plugin_name, command_name, args] }];
    }

    default:
      return [];
  }
}

export function defaultEventPage(overrides: Partial<RPGEventPage> = {}): RPGEventPage {
  return {
    conditions: {
      actorId: 1, actorValid: false,
      itemId: 1, itemValid: false,
      selfSwitchCh: "A", selfSwitchValid: false,
      switch1Id: 1, switch1Valid: false,
      switch2Id: 1, switch2Valid: false,
      variableId: 1, variableValid: false, variableValue: 0,
    },
    directionFix: false,
    image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
    moveFrequency: 3,
    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
    moveSpeed: 3,
    moveType: 0,
    priorityType: 1,
    stepAnime: false,
    through: false,
    trigger: 0,
    walkAnime: true,
    list: [{ code: 0, indent: 0, parameters: [] }],
    ...overrides,
  };
}

export function createDialogueEventCommands(nodes: DialogueNodeInput[]): RPGEventCommand[] {
  const commands: RPGEventCommand[] = [];

  for (const node of nodes) {
    const nodeId = node.node_id || node.nodeId || "node";
    commands.push({ code: 118, indent: 0, parameters: [nodeId] });
    commands.push(...textCommands(node.text, node.speaker));

    for (const action of node.actions || []) {
      commands.push(...actionCommands(action));
    }

    const choices = node.choices || [];
    if (choices.length > 0) {
      commands.push({ code: 102, indent: 0, parameters: [choices.map((c) => c.text), 0, -1, 2, 0] });

      for (const [index, choice] of choices.entries()) {
        const nextNode = choice.next_node || choice.nextNode;
        commands.push({ code: 402, indent: 0, parameters: [index, choice.text] });
        if (choice.condition) {
          commands.push({ code: 108, indent: 1, parameters: [`Choice condition: ${choice.condition}`] });
        }
        commands.push(...actionCommands(choice.action).map((cmd) => ({ ...cmd, indent: 1 })));
        if (nextNode) {
          commands.push({ code: 119, indent: 1, parameters: [nextNode] });
        }
      }
      commands.push({ code: 404, indent: 0, parameters: [] });
    } else if (!(node.end_dialogue || node.endDialogue)) {
      commands.push({ code: 115, indent: 0, parameters: [] });
    }
  }

  commands.push({ code: 0, indent: 0, parameters: [] });
  return commands;
}
