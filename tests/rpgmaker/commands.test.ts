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

describe("system configuration commands", () => {
  it("change-battle-bgm (132): code=132, parameters[0] is audio object with name/volume/pitch/pan", () => {
    const cmds = commandInputToEventCommands({
      type: "change-battle-bgm",
      data: { name: "Battle1", volume: 80, pitch: 110, pan: 5 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(132);
    expect(cmds[0].parameters[0]).toEqual({ name: "Battle1", volume: 80, pitch: 110, pan: 5 });
  });

  it("change-battle-bgm (132): uses defaults when fields omitted", () => {
    const cmds = commandInputToEventCommands({
      type: "change-battle-bgm",
      data: { name: "Battle2" },
    });
    expect(cmds[0].code).toBe(132);
    const audio = cmds[0].parameters[0] as Record<string, unknown>;
    expect(audio.name).toBe("Battle2");
    expect(audio.volume).toBe(90);
    expect(audio.pitch).toBe(100);
    expect(audio.pan).toBe(0);
  });

  it("change-victory-me (133): code=133, parameters[0] is audio object", () => {
    const cmds = commandInputToEventCommands({
      type: "change-victory-me",
      data: { name: "Victory", volume: 100, pitch: 100, pan: 0 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(133);
    expect(cmds[0].parameters[0]).toEqual({ name: "Victory", volume: 100, pitch: 100, pan: 0 });
  });

  it("change-defeat-me (139): code=139, parameters[0] is audio object", () => {
    const cmds = commandInputToEventCommands({
      type: "change-defeat-me",
      data: { name: "Defeat", volume: 70, pitch: 95, pan: -10 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(139);
    expect(cmds[0].parameters[0]).toEqual({ name: "Defeat", volume: 70, pitch: 95, pan: -10 });
  });

  it("change-vehicle-bgm (140): code=140, parameters[0]=vehicle_index, parameters[1] is audio object", () => {
    const cmds = commandInputToEventCommands({
      type: "change-vehicle-bgm",
      data: { vehicle_index: 2, name: "Ship", volume: 85, pitch: 100, pan: 0 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(140);
    expect(cmds[0].parameters[0]).toBe(2);
    expect(cmds[0].parameters[1]).toEqual({ name: "Ship", volume: 85, pitch: 100, pan: 0 });
  });

  it("change-save-access (134): disabled=true → parameters[0]=1", () => {
    const cmds = commandInputToEventCommands({
      type: "change-save-access",
      data: { disabled: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(134);
    expect(cmds[0].parameters[0]).toBe(1);
  });

  it("change-save-access (134): disabled=false → parameters[0]=0", () => {
    const cmds = commandInputToEventCommands({
      type: "change-save-access",
      data: { disabled: false },
    });
    expect(cmds[0].code).toBe(134);
    expect(cmds[0].parameters[0]).toBe(0);
  });

  it("change-menu-access (135): disabled=true → parameters[0]=1", () => {
    const cmds = commandInputToEventCommands({
      type: "change-menu-access",
      data: { disabled: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(135);
    expect(cmds[0].parameters[0]).toBe(1);
  });

  it("change-menu-access (135): disabled=false → parameters[0]=0", () => {
    const cmds = commandInputToEventCommands({
      type: "change-menu-access",
      data: { disabled: false },
    });
    expect(cmds[0].code).toBe(135);
    expect(cmds[0].parameters[0]).toBe(0);
  });

  it("change-encounter (136): disabled=true → parameters[0]=1", () => {
    const cmds = commandInputToEventCommands({
      type: "change-encounter",
      data: { disabled: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(136);
    expect(cmds[0].parameters[0]).toBe(1);
  });

  it("change-encounter (136): disabled=false → parameters[0]=0", () => {
    const cmds = commandInputToEventCommands({
      type: "change-encounter",
      data: { disabled: false },
    });
    expect(cmds[0].code).toBe(136);
    expect(cmds[0].parameters[0]).toBe(0);
  });

  it("change-formation-access (137): disabled=true → parameters[0]=1", () => {
    const cmds = commandInputToEventCommands({
      type: "change-formation-access",
      data: { disabled: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(137);
    expect(cmds[0].parameters[0]).toBe(1);
  });

  it("change-formation-access (137): disabled=false → parameters[0]=0", () => {
    const cmds = commandInputToEventCommands({
      type: "change-formation-access",
      data: { disabled: false },
    });
    expect(cmds[0].code).toBe(137);
    expect(cmds[0].parameters[0]).toBe(0);
  });

  it("change-window-color (138): code=138, parameters[0] is [red, green, blue, 0]", () => {
    const cmds = commandInputToEventCommands({
      type: "change-window-color",
      data: { red: 50, green: -30, blue: 100 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(138);
    expect(cmds[0].parameters[0]).toEqual([50, -30, 100, 0]);
  });
});

describe("follower and vehicle commands", () => {
  it("change-followers (215): visible=true → parameters[0]=0", () => {
    const cmds = commandInputToEventCommands({
      type: "change-followers",
      data: { visible: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(215);
    expect(cmds[0].parameters[0]).toBe(0);
  });

  it("change-followers (215): visible=false → parameters[0]=1", () => {
    const cmds = commandInputToEventCommands({
      type: "change-followers",
      data: { visible: false },
    });
    expect(cmds[0].code).toBe(215);
    expect(cmds[0].parameters[0]).toBe(1);
  });

  it("gather-followers (216): code=216, parameters=[]", () => {
    const cmds = commandInputToEventCommands({ type: "gather-followers" });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(216);
    expect(cmds[0].parameters).toEqual([]);
  });

  it("set-vehicle-location (202): code=202, parameters include vehicle, map_id, x, y", () => {
    const cmds = commandInputToEventCommands({
      type: "set-vehicle-location",
      data: { vehicle: 1, map_id: 3, x: 10, y: 7 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(202);
    expect(cmds[0].parameters[0]).toBe(1);  // vehicle
    expect(cmds[0].parameters[2]).toBe(3);  // map_id
    expect(cmds[0].parameters[3]).toBe(10); // x
    expect(cmds[0].parameters[4]).toBe(7);  // y
  });

  it("vehicle-ride (206): code=206, parameters=[]", () => {
    const cmds = commandInputToEventCommands({ type: "vehicle-ride" });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(206);
    expect(cmds[0].parameters).toEqual([]);
  });
});

describe("weather and media commands", () => {
  it("change-weather (236): code=236, parameters[0]=type, [1]=power, [2]=duration, [3]=wait", () => {
    const cmds = commandInputToEventCommands({
      type: "change-weather",
      data: { type: "rain", power: 7, duration: 120, wait: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(236);
    expect(cmds[0].parameters[0]).toBe("rain");
    expect(cmds[0].parameters[1]).toBe(7);
    expect(cmds[0].parameters[2]).toBe(120);
    expect(cmds[0].parameters[3]).toBe(true);
  });

  it("change-weather (236): uses defaults when fields omitted", () => {
    const cmds = commandInputToEventCommands({
      type: "change-weather",
      data: {},
    });
    expect(cmds[0].code).toBe(236);
    expect(cmds[0].parameters[0]).toBe("none");
    expect(cmds[0].parameters[1]).toBe(5);
    expect(cmds[0].parameters[2]).toBe(60);
    expect(cmds[0].parameters[3]).toBe(false);
  });

  it("play-movie (261): code=261, parameters[0]=filename", () => {
    const cmds = commandInputToEventCommands({
      type: "play-movie",
      data: { filename: "intro_cutscene" },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(261);
    expect(cmds[0].parameters[0]).toBe("intro_cutscene");
  });
});

describe("movement and utility commands", () => {
  it("get-location-info (285): code=285, parameters[0]=variable_id, [1]=info_type, [2]=location_type", () => {
    const cmds = commandInputToEventCommands({
      type: "get-location-info",
      data: { variable_id: 5, info_type: 2, location_type: 1, x: 8, y: 4 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(285);
    expect(cmds[0].parameters[0]).toBe(5);  // variable_id
    expect(cmds[0].parameters[1]).toBe(2);  // info_type
    expect(cmds[0].parameters[2]).toBe(1);  // location_type
    expect(cmds[0].parameters[3]).toBe(8);  // x
    expect(cmds[0].parameters[4]).toBe(4);  // y
  });

  it("set-movement-route (205): code=205, parameters[0]=character_id (-1 for player), parameters[1] is route object", () => {
    const moveList = [{ code: 1, parameters: [] }, { code: 0, parameters: [] }];
    const cmds = commandInputToEventCommands({
      type: "set-movement-route",
      data: { character_id: -1, list: moveList, repeat: true, skippable: false, wait: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(205);
    expect(cmds[0].parameters[0]).toBe(-1);
    const route = cmds[0].parameters[1] as Record<string, unknown>;
    expect(route.list).toEqual(moveList);
    expect(route.repeat).toBe(true);
    expect(route.skippable).toBe(false);
    expect(route.wait).toBe(true);
  });

  it("set-movement-route (205): defaults character_id to -1 (player) when omitted", () => {
    const cmds = commandInputToEventCommands({
      type: "set-movement-route",
      data: {},
    });
    expect(cmds[0].code).toBe(205);
    expect(cmds[0].parameters[0]).toBe(-1);
    const route = cmds[0].parameters[1] as Record<string, unknown>;
    expect(route.repeat).toBe(false);
    expect(route.skippable).toBe(false);
    expect(route.wait).toBe(false);
  });

  it("set-movement-route (205): non-player character_id (event on map)", () => {
    const cmds = commandInputToEventCommands({
      type: "set-movement-route",
      data: { character_id: 3, list: [{ code: 2, parameters: [] }], repeat: false, skippable: true, wait: false },
    });
    expect(cmds[0].parameters[0]).toBe(3);
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
