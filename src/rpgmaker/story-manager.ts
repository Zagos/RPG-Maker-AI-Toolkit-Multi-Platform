/**
 * Gestor de narrativas complejas
 */

export interface StoryEvent {
  eventId: string;
  type: "dialogue" | "battle" | "choice" | "animation" | "transfer";
  content: string;
  prerequisites?: string[];
  reward?: {
    exp?: number;
    gold?: number;
    items?: Array<{ id: number; quantity: number }>;
  };
}

export interface StoryScene {
  sceneId: string;
  sceneName: string;
  mapId: number;
  events: StoryEvent[];
  branches?: Array<{
    condition: string;
    nextScene: string;
  }>;
}

export interface Story {
  title: string;
  description: string;
  scenes: StoryScene[];
  theme: "mystery" | "adventure" | "romance" | "horror" | "comedy" | "epic";
  difficulty: "easy" | "normal" | "hard";
  currentSceneId: string;
  completedEvents: Set<string>;
}

export class StoryManager {
  private story: Story;
  private currentScene: StoryScene | null;
  private visitedSceneIds: Set<string> = new Set();

  constructor(story: Story) {
    this.story = story;
    this.currentScene = this.getScene(story.currentSceneId);
    if (this.currentScene) this.visitedSceneIds.add(story.currentSceneId);
  }

  /**
   * Obtiene una escena por ID
   */
  getScene(sceneId: string): StoryScene | null {
    return this.story.scenes.find((s) => s.sceneId === sceneId) || null;
  }

  /**
   * Obtiene los eventos disponibles en la escena actual
   */
  getAvailableEvents(): StoryEvent[] {
    if (!this.currentScene) return [];

    return this.currentScene.events.filter((event) => {
      // Si no tiene prerequisitos, está disponible
      if (!event.prerequisites || event.prerequisites.length === 0) {
        return true;
      }

      // Si tiene prerequisitos, todos deben estar completados
      return event.prerequisites.every((prereq) =>
        this.story.completedEvents.has(prereq)
      );
    });
  }

  /**
   * Completa un evento
   */
  completeEvent(eventId: string): boolean {
    const event = this.currentScene?.events.find((e) => e.eventId === eventId);
    if (!event) return false;

    this.story.completedEvents.add(eventId);
    return true;
  }

  /**
   * Avanza a la siguiente escena basada en condiciones
   */
  advanceScene(): boolean {
    if (!this.currentScene || !this.currentScene.branches) {
      return false;
    }

    for (const branch of this.currentScene.branches) {
      if (this.evaluateCondition(branch.condition)) {
        const nextScene = this.getScene(branch.nextScene);
        if (nextScene) {
          this.currentScene = nextScene;
          this.story.currentSceneId = branch.nextScene;
          this.visitedSceneIds.add(branch.nextScene);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evalúa una condición de rama
   */
  private evaluateCondition(condition: string): boolean {
    // Parsear condición: "eventsCompleted:3" (al menos 3 eventos completados)
    if (condition.includes("eventsCompleted:")) {
      const required = Number(condition.split(":")[1]);
      return this.story.completedEvents.size >= required;
    }

    // Condición simple: verificar si un evento está completado
    return this.story.completedEvents.has(condition);
  }

  /**
   * Obtiene la escena actual
   */
  getCurrentScene(): StoryScene | null {
    return this.currentScene;
  }

  /**
   * Obtiene el progreso de la historia
   */
  getProgress(): {
    totalScenes: number;
    visitedScenes: number;
    totalEvents: number;
    completedEvents: number;
    percentage: number;
  } {
    const totalEvents = this.story.scenes.reduce((sum, s) => sum + s.events.length, 0);
    const completedEvents = this.story.completedEvents.size;

    return {
      totalScenes: this.story.scenes.length,
      visitedScenes: this.visitedSceneIds.size,
      totalEvents,
      completedEvents,
      percentage: Math.round((completedEvents / totalEvents) * 100),
    };
  }

  /**
   * Obtiene recompensas acumuladas
   */
  getAccumulatedRewards(): {
    totalExp: number;
    totalGold: number;
    items: Array<{ id: number; quantity: number }>;
  } {
    let totalExp = 0;
    let totalGold = 0;
    const itemsMap = new Map<number, number>();

    for (const eventId of this.story.completedEvents) {
      const event = this.story.scenes
        .flatMap((s) => s.events)
        .find((e) => e.eventId === eventId);

      if (event?.reward) {
        totalExp += event.reward.exp || 0;
        totalGold += event.reward.gold || 0;

        if (event.reward.items) {
          for (const item of event.reward.items) {
            itemsMap.set(
              item.id,
              (itemsMap.get(item.id) || 0) + item.quantity
            );
          }
        }
      }
    }

    const items = Array.from(itemsMap.entries()).map(([id, quantity]) => ({
      id,
      quantity,
    }));

    return { totalExp, totalGold, items };
  }

  /**
   * Reinicia la historia
   */
  reset(): void {
    this.story.completedEvents.clear();
    this.currentScene = this.getScene(this.story.scenes[0].sceneId);
  }

  /**
   * Obtiene la historia actual (para persistencia)
   */
  getState(): Story {
    return this.story;
  }
}
