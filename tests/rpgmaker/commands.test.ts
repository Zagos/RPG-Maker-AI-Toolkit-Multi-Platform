import { describe, it, expect } from "vitest";
import {
  textCommands,
  scriptCommands,
  actionCommands,
  commandInputToEventCommands,
  createDialogueEventCommands,
  defaultEventPage,
} from "../../src/rpgmaker/commands.js";

describe("textCommands", () => {
  it("genera header 101 + línea 401 para texto corto", () => {
    const cmds = textCommands("Hola mundo");
    expect(cmds).toHaveLength(2);
    expect(cmds[0].code).toBe(101);
    expect(cmds[1].code).toBe(401);
    expect(cmds[1].parameters[0]).toBe("Hola mundo");
  });

  it("incluye el speaker en el header", () => {
    const cmds = textCommands("Texto", "Alice");
    expect(cmds[0].parameters[4]).toBe("Alice");
  });

  it("divide líneas de más de 60 caracteres", () => {
    const long = "A".repeat(70);
    const cmds = textCommands(long);
    // header + 2 chunks (60 + 10)
    expect(cmds).toHaveLength(3);
    expect(cmds[1].parameters[0]).toBe("A".repeat(60));
    expect(cmds[2].parameters[0]).toBe("A".repeat(10));
  });

  it("mantiene múltiples líneas separadas por \\n", () => {
    const cmds = textCommands("Línea 1\nLínea 2");
    expect(cmds).toHaveLength(3); // 101 + 401 + 401
    expect(cmds[1].parameters[0]).toBe("Línea 1");
    expect(cmds[2].parameters[0]).toBe("Línea 2");
  });

  it("usa speaker vacío por defecto", () => {
    const cmds = textCommands("Texto");
    expect(cmds[0].parameters[4]).toBe("");
  });
});

describe("scriptCommands", () => {
  it("genera código 355 para la primera línea", () => {
    const cmds = scriptCommands("var x = 1;");
    expect(cmds[0].code).toBe(355);
    expect(cmds[0].parameters[0]).toBe("var x = 1;");
  });

  it("genera código 655 para líneas adicionales", () => {
    const cmds = scriptCommands("var x = 1;\nvar y = 2;");
    expect(cmds).toHaveLength(2);
    expect(cmds[0].code).toBe(355);
    expect(cmds[1].code).toBe(655);
  });
});

describe("actionCommands", () => {
  it("retorna array vacío si action es undefined", () => {
    expect(actionCommands(undefined)).toEqual([]);
  });

  it("setSwitch genera código 121", () => {
    const cmds = actionCommands("setSwitch:5:true");
    expect(cmds[0].code).toBe(121);
    expect(cmds[0].parameters[0]).toBe(5);
  });

  it("setSwitch false pone valor 1", () => {
    const cmds = actionCommands("setSwitch:3:false");
    expect(cmds[0].parameters[2]).toBe(1);
  });

  it("setVariable genera código 122 con valor", () => {
    const cmds = actionCommands("setVariable:2:10");
    expect(cmds[0].code).toBe(122);
    expect(cmds[0].parameters[4]).toBe(10);
  });

  it("addItem genera código 126", () => {
    const cmds = actionCommands("addItem:3:2");
    expect(cmds[0].code).toBe(126);
    expect(cmds[0].parameters[0]).toBe(3);
    expect(cmds[0].parameters[3]).toBe(2);
  });

  it("addGold genera código 125", () => {
    const cmds = actionCommands("addGold:500");
    expect(cmds[0].code).toBe(125);
    expect(cmds[0].parameters[2]).toBe(500);
  });

  it("commonEvent genera código 117", () => {
    const cmds = actionCommands("commonEvent:7");
    expect(cmds[0].code).toBe(117);
    expect(cmds[0].parameters[0]).toBe(7);
  });

  it("script delega en scriptCommands", () => {
    const cmds = actionCommands("script:$gameVariables.setValue(1,99)");
    expect(cmds[0].code).toBe(355);
  });

  it("acción desconocida genera comentario 108", () => {
    const cmds = actionCommands("unknownAction:1");
    expect(cmds[0].code).toBe(108);
  });
});

describe("commandInputToEventCommands", () => {
  it("message devuelve textCommands", () => {
    const cmds = commandInputToEventCommands({ type: "message", data: "Hola" });
    expect(cmds[0].code).toBe(101);
    expect(cmds[1].code).toBe(401);
  });

  it("choice genera 102 + 402 por opción + 404", () => {
    const cmds = commandInputToEventCommands({ type: "choice", data: "Sí|No" });
    expect(cmds[0].code).toBe(102);
    expect(cmds[1].code).toBe(402);
    expect(cmds[2].code).toBe(402);
    expect(cmds[3].code).toBe(404);
  });

  it("wait genera código 230 con duración", () => {
    const cmds = commandInputToEventCommands({ type: "wait", data: "30" });
    expect(cmds[0].code).toBe(230);
    expect(cmds[0].parameters[0]).toBe(30);
  });

  it("wait usa 60 frames por defecto si data está vacío", () => {
    const cmds = commandInputToEventCommands({ type: "wait" });
    expect(cmds[0].parameters[0]).toBe(60);
  });

  it("transfer genera código 201 con mapId, x, y", () => {
    const cmds = commandInputToEventCommands({ type: "transfer", data: "1:5:3" });
    expect(cmds[0].code).toBe(201);
    expect(cmds[0].parameters[1]).toBe(1); // mapId
    expect(cmds[0].parameters[2]).toBe(5); // x
    expect(cmds[0].parameters[3]).toBe(3); // y
  });

  it("battle genera código 301", () => {
    const cmds = commandInputToEventCommands({ type: "battle", data: "2" });
    expect(cmds[0].code).toBe(301);
    expect(cmds[0].parameters[1]).toBe(2);
  });

  it("animation genera código 212", () => {
    const cmds = commandInputToEventCommands({ type: "animation", data: "5" });
    expect(cmds[0].code).toBe(212);
    expect(cmds[0].parameters[1]).toBe(5);
  });

  it("switch delega en setSwitch", () => {
    const cmds = commandInputToEventCommands({ type: "switch", data: "3:true" });
    expect(cmds[0].code).toBe(121);
  });

  it("common-event delega en commonEvent", () => {
    const cmds = commandInputToEventCommands({ type: "common-event", data: "4" });
    expect(cmds[0].code).toBe(117);
  });
});

describe("createDialogueEventCommands", () => {
  it("genera label 118 + texto + terminador por nodo simple", () => {
    const cmds = createDialogueEventCommands([
      { node_id: "intro", speaker: "Alice", text: "Hola", end_dialogue: true },
    ]);
    expect(cmds[0].code).toBe(118); // label
    expect(cmds[0].parameters[0]).toBe("intro");
    expect(cmds[1].code).toBe(101); // text header
    // último es terminador
    expect(cmds[cmds.length - 1].code).toBe(0);
  });

  it("genera opciones 102+402 cuando hay choices", () => {
    const cmds = createDialogueEventCommands([
      {
        node_id: "q",
        speaker: "NPC",
        text: "¿Eres héroe?",
        choices: [
          { text: "Sí", next_node: "yes_node" },
          { text: "No", next_node: "no_node" },
        ],
      },
    ]);
    const codes = cmds.map((c) => c.code);
    expect(codes).toContain(102);
    expect(codes).toContain(402);
    expect(codes).toContain(119); // jump to label
    expect(codes).toContain(404);
  });

  it("inserta 115 (exit event) si no es end_dialogue y no hay choices", () => {
    const cmds = createDialogueEventCommands([
      { node_id: "n1", speaker: "Bob", text: "Texto" },
    ]);
    const codes = cmds.map((c) => c.code);
    expect(codes).toContain(115);
  });
});

describe("tint-picture command", () => {
  it("generates code 234 with picture_id, tone, duration, wait", () => {
    const cmds = commandInputToEventCommands({
      type: "tint-picture",
      data: { picture_id: 3, tone: [-68, -68, 0, 68], duration: 30, wait: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(234);
    expect(cmds[0].parameters[0]).toBe(3);
    expect(cmds[0].parameters[1]).toEqual([-68, -68, 0, 68]);
    expect(cmds[0].parameters[2]).toBe(30);
    expect(cmds[0].parameters[3]).toBe(true);
  });

  it("uses defaults when optional fields are omitted", () => {
    const cmds = commandInputToEventCommands({
      type: "tint-picture",
      data: { picture_id: 1 },
    });
    expect(cmds[0].code).toBe(234);
    expect(cmds[0].parameters[0]).toBe(1);
    expect(cmds[0].parameters[1]).toEqual([0, 0, 0, 0]);
    expect(cmds[0].parameters[2]).toBe(60);
    expect(cmds[0].parameters[3]).toBe(false);
  });
});

describe("battle event commands", () => {
  it("change-enemy-hp (331): enemy_index, operation, operand, allow_ko", () => {
    const cmds = commandInputToEventCommands({
      type: "change-enemy-hp",
      data: { enemy_index: 2, operation: 1, operand: 50, allow_ko: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(331);
    expect(cmds[0].parameters[0]).toBe(2);   // enemy_index
    expect(cmds[0].parameters[2]).toBe(1);   // operation
    expect(cmds[0].parameters[4]).toBe(50);  // operand
    expect(cmds[0].parameters[5]).toBe(true); // allow_ko
  });

  it("change-enemy-mp (332): enemy_index, operation, operand", () => {
    const cmds = commandInputToEventCommands({
      type: "change-enemy-mp",
      data: { enemy_index: 0, operation: 0, operand: 20 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(332);
    expect(cmds[0].parameters[0]).toBe(0);  // enemy_index
    expect(cmds[0].parameters[2]).toBe(0);  // operation
    expect(cmds[0].parameters[4]).toBe(20); // operand
  });

  it("change-enemy-state (333): enemy_index, action, state_id", () => {
    const cmds = commandInputToEventCommands({
      type: "change-enemy-state",
      data: { enemy_index: 1, action: 1, state_id: 4 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(333);
    expect(cmds[0].parameters[0]).toBe(1); // enemy_index
    expect(cmds[0].parameters[1]).toBe(1); // action
    expect(cmds[0].parameters[2]).toBe(4); // state_id
  });

  it("recover-all-enemies (334): enemy_index -1 means all", () => {
    const cmds = commandInputToEventCommands({
      type: "recover-all-enemies",
      data: { enemy_index: -1 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(334);
    expect(cmds[0].parameters[0]).toBe(-1);
  });

  it("recover-all-enemies (334): defaults to -1 when enemy_index omitted", () => {
    const cmds = commandInputToEventCommands({
      type: "recover-all-enemies",
      data: {},
    });
    expect(cmds[0].code).toBe(334);
    expect(cmds[0].parameters[0]).toBe(-1);
  });

  it("enemy-appear (335): enemy_index in parameters", () => {
    const cmds = commandInputToEventCommands({
      type: "enemy-appear",
      data: { enemy_index: 3 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(335);
    expect(cmds[0].parameters[0]).toBe(3);
  });

  it("enemy-transform (336): enemy_index and enemy_id", () => {
    const cmds = commandInputToEventCommands({
      type: "enemy-transform",
      data: { enemy_index: 0, enemy_id: 5 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(336);
    expect(cmds[0].parameters[0]).toBe(0); // enemy_index
    expect(cmds[0].parameters[1]).toBe(5); // enemy_id
  });

  it("show-battle-animation (337): animation_id and enemy_index", () => {
    const cmds = commandInputToEventCommands({
      type: "show-battle-animation",
      data: { animation_id: 7, enemy_index: 2 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(337);
    expect(cmds[0].parameters[0]).toBe(7);  // animation_id
    expect(cmds[0].parameters[1]).toBe(2);  // enemy_index
  });

  it("show-battle-animation (337): enemy_index defaults to -1 (all enemies)", () => {
    const cmds = commandInputToEventCommands({
      type: "show-battle-animation",
      data: { animation_id: 3 },
    });
    expect(cmds[0].parameters[1]).toBe(-1);
  });

  it("force-action (338): subject_type, subject_index, skill_id, target_index", () => {
    const cmds = commandInputToEventCommands({
      type: "force-action",
      data: { subject_type: 1, subject_index: 0, skill_id: 10, target_index: -1 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(338);
    expect(cmds[0].parameters[0]).toBe(1);   // subject_type
    expect(cmds[0].parameters[1]).toBe(0);   // subject_index
    expect(cmds[0].parameters[2]).toBe(10);  // skill_id
    expect(cmds[0].parameters[3]).toBe(-1);  // target_index
  });
});

describe("defaultEventPage", () => {
  it("retorna estructura completa con valores por defecto", () => {
    const page = defaultEventPage();
    expect(page.trigger).toBe(0);
    expect(page.moveType).toBe(0);
    expect(page.priorityType).toBe(1);
    expect(page.list).toHaveLength(1);
    expect(page.list[0].code).toBe(0);
  });

  it("aplica overrides correctamente", () => {
    const page = defaultEventPage({ trigger: 2, moveType: 1 });
    expect(page.trigger).toBe(2);
    expect(page.moveType).toBe(1);
    expect(page.priorityType).toBe(1); // default no cambia
  });
});
