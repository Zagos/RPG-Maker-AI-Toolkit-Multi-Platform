/**
 * Gestor de diálogos ramificados
 */

export interface DialogueNode {
  nodeId: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  actions?: string[];
  endDialogue?: boolean;
}

export interface DialogueChoice {
  text: string;
  nextNode: string;
  condition?: string;
  action?: string;
}

export interface DialogueTree {
  name: string;
  nodes: DialogueNode[];
  startNodeId: string;
  variables?: Record<string, unknown>;
}

export class DialogueManager {
  private dialogueTree: DialogueTree;
  private currentNodeId: string;
  private variables: Map<string, unknown> = new Map();

  constructor(tree: DialogueTree) {
    this.dialogueTree = tree;
    this.currentNodeId = tree.startNodeId;
    this.variables = new Map(Object.entries(tree.variables || {}));
  }

  /**
   * Obtiene el nodo actual
   */
  getCurrentNode(): DialogueNode | null {
    return this.dialogueTree.nodes.find((n) => n.nodeId === this.currentNodeId) || null;
  }

  /**
   * Obtiene opciones disponibles en el nodo actual
   */
  getAvailableChoices(): DialogueChoice[] {
    const node = this.getCurrentNode();
    if (!node || !node.choices) {
      return [];
    }

    return node.choices.filter((choice) => {
      if (!choice.condition) return true;
      return this.evaluateCondition(choice.condition);
    });
  }

  /**
   * Selecciona una opción y avanza en el diálogo
   */
  selectChoice(choiceIndex: number): boolean {
    const node = this.getCurrentNode();
    if (!node || !node.choices) return false;

    const choice = node.choices[choiceIndex];
    if (!choice) return false;

    // Ejecutar acción si existe
    if (choice.action) {
      this.executeAction(choice.action);
    }

    // Mover al siguiente nodo
    this.currentNodeId = choice.nextNode;
    return true;
  }

  /**
   * Ejecuta una acción del diálogo
   */
  private executeAction(action: string): void {
    // Parsear acción: "setVariable:myVar:value" o "addItem:5:1"
    const [cmd, ...args] = action.split(":");

    switch (cmd) {
      case "setVariable":
        this.variables.set(args[0], args[1]);
        break;
      case "incrementVariable": {
        const current = Number(this.variables.get(args[0])) || 0;
        this.variables.set(args[0], current + Number(args[1]));
        break;
      }
      case "addItem":
        // $gameParty.gainItem(itemId, amount)
        break;
    }
  }

  /**
   * Evalúa una condición
   */
  private evaluateCondition(condition: string): boolean {
    // Parsear condición: "hasVariable:myVar" o "level>=10"
    if (condition.includes("hasVariable:")) {
      const varName = condition.split(":")[1];
      return this.variables.has(varName);
    }

    if (condition.includes(">=")) {
      const [varName, value] = condition.split(">=");
      return Number(this.variables.get(varName)) >= Number(value);
    }

    if (condition.includes("<=")) {
      const [varName, value] = condition.split("<=");
      return Number(this.variables.get(varName)) <= Number(value);
    }

    return true;
  }

  /**
   * Reemplaza variables en texto
   */
  replaceVariables(text: string): string {
    let result = text;

    // Reemplazar {variable} con valores
    for (const [key, value] of this.variables) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }

    return result;
  }

  /**
   * Obtiene el diálogo actual con variables reemplazadas
   */
  getCurrentText(): string {
    const node = this.getCurrentNode();
    if (!node) return "";

    return this.replaceVariables(node.text);
  }

  /**
   * Verifica si el diálogo ha terminado
   */
  isEnded(): boolean {
    const node = this.getCurrentNode();
    return node ? node.endDialogue || false : true;
  }

  /**
   * Obtiene todas las variables
   */
  getVariables(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this.variables) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Reinicia el diálogo
   */
  reset(): void {
    this.currentNodeId = this.dialogueTree.startNodeId;
    this.variables.clear();
  }
}
