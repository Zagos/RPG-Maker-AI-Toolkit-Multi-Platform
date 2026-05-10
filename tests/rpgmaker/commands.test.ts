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
