import { describe, it, expect, beforeEach } from "vitest";
import { StoryManager } from "../../src/rpgmaker/story-manager.js";
import type { Story } from "../../src/rpgmaker/story-manager.js";

function buildStory(): Story {
  return {
    title: "Test Story",
    description: "A test story",
    theme: "adventure",
    difficulty: "normal",
    currentSceneId: "scene1",
    completedEvents: new Set(),
    scenes: [
      {
        sceneId: "scene1",
        sceneName: "Act 1",
        mapId: 1,
        events: [
          { eventId: "e1", type: "dialogue", content: "Hello" },
          { eventId: "e2", type: "battle", content: "1", prerequisites: ["e1"] },
        ],
        branches: [
          { condition: "eventsCompleted:2", nextScene: "scene2" },
        ],
      },
      {
        sceneId: "scene2",
        sceneName: "Act 2",
        mapId: 2,
        events: [
          { eventId: "e3", type: "dialogue", content: "Fin", reward: { exp: 100, gold: 50 } },
        ],
      },
    ],
  };
}

let manager: StoryManager;

beforeEach(() => {
  manager = new StoryManager(buildStory());
});

describe("getScene", () => {
  it("retorna la escena correcta por ID", () => {
    expect(manager.getScene("scene1")?.sceneId).toBe("scene1");
    expect(manager.getScene("scene2")?.sceneId).toBe("scene2");
  });

  it("retorna null para ID inexistente", () => {
    expect(manager.getScene("nope")).toBeNull();
  });
});

describe("getAvailableEvents", () => {
  it("devuelve evento sin prerequisitos inmediatamente", () => {
    const events = manager.getAvailableEvents();
    expect(events.map((e) => e.eventId)).toContain("e1");
  });

  it("no devuelve evento con prerequisito no completado", () => {
    const events = manager.getAvailableEvents();
    expect(events.map((e) => e.eventId)).not.toContain("e2");
  });

  it("devuelve evento con prerequisito completado", () => {
    manager.completeEvent("e1");
    const events = manager.getAvailableEvents();
    expect(events.map((e) => e.eventId)).toContain("e2");
  });
});

describe("completeEvent", () => {
  it("retorna true si el evento existe", () => {
    expect(manager.completeEvent("e1")).toBe(true);
  });

  it("retorna false si el evento no existe", () => {
    expect(manager.completeEvent("noexiste")).toBe(false);
  });
});

describe("advanceScene", () => {
  it("no avanza si la condición no se cumple", () => {
    expect(manager.advanceScene()).toBe(false);
    expect(manager.getCurrentScene()?.sceneId).toBe("scene1");
  });

  it("avanza a la siguiente escena cuando eventsCompleted se cumple", () => {
    manager.completeEvent("e1");
    manager.completeEvent("e2");
    expect(manager.advanceScene()).toBe(true);
    expect(manager.getCurrentScene()?.sceneId).toBe("scene2");
  });
});

describe("getProgress", () => {
  it("visitedScenes empieza en 1", () => {
    expect(manager.getProgress().visitedScenes).toBe(1);
  });

  it("visitedScenes aumenta al avanzar de escena", () => {
    manager.completeEvent("e1");
    manager.completeEvent("e2");
    manager.advanceScene();
    expect(manager.getProgress().visitedScenes).toBe(2);
  });

  it("calcula percentage correctamente", () => {
    manager.completeEvent("e1");
    const { completedEvents, totalEvents, percentage } = manager.getProgress();
    expect(completedEvents).toBe(1);
    expect(totalEvents).toBe(3);
    expect(percentage).toBe(33);
  });
});

describe("getAccumulatedRewards", () => {
  it("acumula exp y gold de eventos completados", () => {
    manager.completeEvent("e1");
    manager.completeEvent("e2");
    manager.advanceScene();
    manager.completeEvent("e3");
    const rewards = manager.getAccumulatedRewards();
    expect(rewards.totalExp).toBe(100);
    expect(rewards.totalGold).toBe(50);
  });

  it("devuelve vacío si no hay eventos completados", () => {
    const rewards = manager.getAccumulatedRewards();
    expect(rewards.totalExp).toBe(0);
    expect(rewards.totalGold).toBe(0);
    expect(rewards.items).toHaveLength(0);
  });
});

describe("reset", () => {
  it("reinicia la historia al estado inicial", () => {
    manager.completeEvent("e1");
    manager.completeEvent("e2");
    manager.advanceScene();
    manager.reset();
    expect(manager.getCurrentScene()?.sceneId).toBe("scene1");
    expect(manager.getProgress().completedEvents).toBe(0);
  });
});
