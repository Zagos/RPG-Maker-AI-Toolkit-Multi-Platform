import { describe, it, expect, beforeEach } from "vitest";
import { DialogueManager } from "../../src/rpgmaker/dialogue-manager.js";
import type { DialogueTree } from "../../src/rpgmaker/dialogue-manager.js";

function buildTree(): DialogueTree {
  return {
    name: "Test Dialogue",
    startNodeId: "start",
    variables: { gold: 10 },
    nodes: [
      {
        nodeId: "start",
        speaker: "NPC",
        text: "Hola {name}! Tienes {gold} monedas.",
        choices: [
          { text: "Comprar", nextNode: "buy", condition: "gold>=5", action: "setVariable:gold:0" },
          { text: "Salir", nextNode: "end", condition: "hasVariable:gold" },
          { text: "Pobre", nextNode: "poor", condition: "gold>=100" },
        ],
      },
      {
        nodeId: "buy",
        speaker: "NPC",
        text: "Aquí tienes.",
        actions: ["setVariable:gold:0"],
        endDialogue: true,
      },
      {
        nodeId: "end",
        speaker: "NPC",
        text: "Hasta luego.",
        endDialogue: true,
      },
      {
        nodeId: "poor",
        speaker: "NPC",
        text: "No tienes suficiente.",
        endDialogue: true,
      },
    ],
  };
}

let manager: DialogueManager;

beforeEach(() => {
  manager = new DialogueManager(buildTree());
});

describe("getCurrentNode", () => {
  it("retorna el nodo de inicio", () => {
    expect(manager.getCurrentNode()?.nodeId).toBe("start");
  });
});

describe("getAvailableChoices", () => {
  it("muestra opciones con condición cumplida", () => {
    const choices = manager.getAvailableChoices();
    const texts = choices.map((c) => c.text);
    expect(texts).toContain("Comprar"); // gold=10 >= 5 ✓
    expect(texts).toContain("Salir");   // hasVariable:gold ✓
  });

  it("oculta opciones con condición no cumplida", () => {
    const choices = manager.getAvailableChoices();
    expect(choices.map((c) => c.text)).not.toContain("Pobre"); // gold=10 < 100
  });
});

describe("selectChoice", () => {
  it("avanza al nodo correcto", () => {
    manager.selectChoice(0); // "Comprar" → "buy"
    expect(manager.getCurrentNode()?.nodeId).toBe("buy");
  });

  it("retorna false para índice inválido", () => {
    expect(manager.selectChoice(99)).toBe(false);
  });
});

describe("executeAction via selectChoice", () => {
  it("setVariable del choice actualiza la variable interna", () => {
    manager.selectChoice(0); // "Comprar" → action: setVariable:gold:0
    expect(manager.getVariables()["gold"]).toBe("0");
  });
});

describe("getCurrentText", () => {
  it("reemplaza variables en el texto del nodo actual", () => {
    const text = manager.getCurrentText();
    expect(text).toContain("10 monedas");
    expect(text).not.toContain("{gold}");
  });
});

describe("replaceVariables", () => {
  it("reemplaza todas las variables definidas", () => {
    const result = manager.replaceVariables("gold={gold}, name={name}");
    expect(result).toBe("gold=10, name={name}"); // {name} no definida, no se reemplaza
  });
});

describe("isEnded", () => {
  it("no está terminado en el nodo de inicio", () => {
    expect(manager.isEnded()).toBe(false);
  });

  it("está terminado al llegar a nodo con endDialogue=true", () => {
    manager.selectChoice(1); // "Salir" → "end" con endDialogue=true
    expect(manager.isEnded()).toBe(true);
  });
});

describe("reset", () => {
  it("vuelve al nodo de inicio y limpia variables", () => {
    manager.selectChoice(0); // Comprar → gold=0
    manager.reset();
    expect(manager.getCurrentNode()?.nodeId).toBe("start");
    expect(manager.getVariables()["gold"]).toBeUndefined();
  });
});
