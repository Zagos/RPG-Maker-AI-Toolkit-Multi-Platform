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
    | "animation";
  data?: string;
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
  const data = command.data || "";

  switch (command.type) {
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
