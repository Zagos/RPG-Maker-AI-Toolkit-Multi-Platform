# RPG Maker MCP — Usage Examples / Ejemplos de uso

You never write JSON directly. Just describe what you want to your AI assistant in plain language — it reads your project, calls the right tools, and confirms what it changed. The JSON shown under each tool is what the AI builds internally; it's here for reference when you want to be precise.

No escribes JSON directamente. Describe lo que quieres a tu asistente IA en lenguaje natural — él lee tu proyecto, llama a las herramientas adecuadas y confirma los cambios. El JSON que aparece bajo cada herramienta es lo que la IA construye internamente; está aquí como referencia cuando quieres ser más preciso.

---

## Workflow examples / Ejemplos por flujo de trabajo

These show how a real conversation with your AI assistant looks. The AI figures out which tools to call — you just describe the goal.  
Así es como se ve una conversación real con tu asistente IA. La IA decide qué herramientas usar — tú solo describes el objetivo.

---

### Getting to know your project / Conocer tu proyecto

**EN**
> *"What actors do I have in my game?"* → The AI lists every actor with their ID and name.  
> *"Show me everything on map 3 — events, encounters, BGM."* → The AI reads the map and gives you a human-readable summary.  
> *"What character sprite files are available?"* → The AI scans `img/characters/` and lists all spritesheets.  
> *"What changes has the AI made to my project in the last hour?"* → The AI queries the change log with a timestamped list.

**ES**
> *"¿Qué actores tengo en mi juego?"* → La IA lista todos los actores con su ID y nombre.  
> *"Muéstrame todo lo que hay en el mapa 3: eventos, encuentros, BGM."* → La IA lee el mapa y da un resumen legible.  
> *"¿Qué archivos de sprites de personaje hay disponibles?"* → La IA escanea `img/characters/` y lista todas las hojas de sprites.  
> *"¿Qué cambios ha hecho la IA en mi proyecto en la última hora?"* → La IA consulta el historial con marca de tiempo.

---

### Creating and editing characters / Crear y editar personajes

**EN**
> *"Create a mage character called Elara. She's a gifted sorceress who abandoned the Academy to seek forbidden magic. Start her at level 1."* → The AI reads your project's classes, weapons, and armors, picks the best fit for a mage archetype, creates the actor, assigns equipment, and returns the new actor ID.  
> *"Rename actor 1 to Garrett and make him a knight starting at level 5."* → The AI finds actor 1 and updates the name, class, and level.  
> *"Give the Forest Troll a weakness to fire — 50% more damage."* → The AI adds a fire-element rate trait (×1.5).  
> *"The Dark Wizard boss should be immune to sleep and paralysis."* → The AI adds state-resistance traits for both effects.  
> *"Enemy 7 is the final boss. Below 50% HP it uses its ultimate, below 25% it uses it every turn."* → The AI sets up a conditional action table.

**ES**
> *"Crea una maga llamada Elara. Es una hechicera prodigiosa que abandonó la Academia para buscar magia prohibida. Empieza en nivel 1."* → La IA elige clase, armas y armadura para el arquetipo mago, crea el actor y confirma el nuevo ID.  
> *"Renombra al actor 1 como Garrett y conviértelo en un caballero que empieza en nivel 5."* → La IA actualiza el nombre, la clase y el nivel inicial.  
> *"Dale al Troll del Bosque debilidad al fuego: un 50% más de daño."* → La IA añade el trait de tasa de elemento fuego (×1.5).  
> *"El Mago Oscuro debe ser inmune al sueño y la parálisis."* → La IA añade resistencia a ambos estados.  
> *"El enemigo 7 es el jefe final. Por debajo del 50% HP usa su definitiva, por debajo del 25% la usa cada turno."* → La IA configura la tabla de acciones condicional.

---

### Building the world / Construir el mundo

**EN**
> *"Create a 20×15 town map called Riverside Town with tileset 1 and Town1 as BGM."* → The AI creates the map file, registers it in MapInfos.json, and sets the BGM.  
> *"Fill the entire bottom row of map 3 with a stone floor tile on layer 0."* → The AI paints that row across the full width.  
> *"Add a treasure chest at (8, 6) on map 3 with a Potion inside."* → The AI creates a chest event with the item reward.  
> *"Add a second dialogue page to the Old Man NPC on map 3 that shows after quest flag A is set."* → The AI adds an event page conditioned on self-switch A.  
> *"Create a dungeon entrance on map 2 at (5, 10) that teleports to map 7 at (3, 14)."* → The AI creates a trigger event with a transfer command.

**ES**
> *"Crea un mapa de ciudad 20×15 llamado Pueblo Ribereño con el tileset 1 y Town1 como BGM."* → La IA crea el mapa, lo registra en MapInfos.json y configura el BGM.  
> *"Rellena toda la última fila del mapa 3 con un tile de suelo de piedra en la capa 0."* → La IA pinta esa fila a todo el ancho.  
> *"Añade un cofre en (8, 6) del mapa 3 con una Poción dentro."* → La IA crea el evento de cofre con el ítem configurado.  
> *"Añade una segunda página al NPC Anciano en el mapa 3 que aparezca tras activar el flag A."* → La IA añade la página condicionada al auto-switch A.  
> *"Crea una entrada de mazmorra en (5, 10) del mapa 2 que lleve al mapa 7 en (3, 14)."* → La IA crea el evento trigger con el comando de transferencia.

---

### Dialogue and story / Diálogos e historia

**EN**
> *"Write a quick dialogue for the Old Man: he warns that the northern ruins are cursed and no one should go alone."* → The AI creates a message event with the NPC as speaker.  
> *"Make a gate guard that asks the player's business. 'I'm a traveler' → reluctant pass. 'I have a permit' → waves them through."* → The AI creates a branching dialogue with two choice paths.  
> *"Generate a three-scene intro: kingdom falls, hero escapes, wakes in a village."* → The AI creates maps, events, dialogue, and transitions for all three scenes.

**ES**
> *"Escribe un diálogo rápido para el Anciano: que avise de que las ruinas del norte están malditas y nadie debería ir solo."* → La IA crea el evento de mensaje con el NPC como interlocutor.  
> *"Crea un guardia que pregunta el asunto del jugador. 'Soy un viajero' → deja pasar a regañadientes. 'Tengo un permiso' → pasa sin problema."* → La IA crea el diálogo con rama de opciones.  
> *"Genera una intro en tres escenas: el reino cae, el héroe escapa, se despierta en una aldea."* → La IA crea mapas, eventos, diálogos y transiciones para las tres escenas.

---

### Combat mechanics / Mecánicas de combate

**EN**
> *"Create a Goblin Ambush with two regular goblins and one archer."* → The AI creates a troop with those enemies auto-spaced.  
> *"The Healing Herb should restore 25% of the user's max HP."* → The AI updates the item's effects array.  
> *"Add a battle event to troop 3: at turn 0 display 'The bandits laugh at you!'"* → The AI adds a battle event page with a show-message command.  
> *"Create a Fireball skill: all enemies, 12 MP, 90% success rate."* → The AI creates the skill with the right scope, MP cost, and success rate.

**ES**
> *"Crea una Emboscada Goblin con dos goblins normales y un arquero."* → La IA crea la tropa con los enemigos distribuidos automáticamente.  
> *"La Hierba Curativa debe restaurar el 25% del HP máximo del usuario."* → La IA actualiza el array de efectos del ítem.  
> *"Añade un evento de batalla a la tropa 3: en el turno 0 muestra '¡Los bandidos se ríen de ti!'"* → La IA añade la página de evento con el comando de mensaje.  
> *"Crea una habilidad Bola de Fuego: todos los enemigos, 12 MP, 90% de éxito."* → La IA crea la habilidad con el alcance, coste y tasa correctos.

---

### Live game debugging / Depuración en vivo

*Requires the game to be running with the debug plugin active. / Requiere el juego en ejecución con el plugin de depuración activo.*

**EN**
> *"Is the game connected? What map is the player on and how's the party HP?"* → The AI pings the bridge and returns current game state.  
> *"Teleport the player to map 5 at (10, 8)."* → The AI sends the transfer command and waits for confirmation.  
> *"Turn on switch 12 so I can test the quest branch."* → The AI flips the switch instantly in the live game.  
> *"Set the whole party to 30% HP to test low-health triggers."* → The AI adjusts party HP via the debug bridge.  
> *"Run the final boss battle 30 times and tell me the win rate."* → The AI simulates 30 runs and returns aggregated stats.  
> *"Save to slot 98 as a test snapshot."* → Saved. Restore any time with *"load slot 98"*.  
> *"What is the current value of variable 5?"* → The AI runs a script in the live game and returns the value.

**ES**
> *"¿Está conectado el juego? ¿En qué mapa está el jugador y cómo está el HP del grupo?"* → La IA hace ping al bridge y devuelve el estado actual.  
> *"Teletransporta al jugador al mapa 5 en (10, 8)."* → La IA envía el comando y espera confirmación.  
> *"Activa el switch 12 para probar la rama de misión."* → La IA cambia el switch en tiempo real.  
> *"Pon al grupo al 30% de HP para probar los diálogos de poca vida."* → La IA ajusta el HP a través del bridge.  
> *"Ejecuta la batalla del jefe final 30 veces y dime el porcentaje de victorias."* → La IA simula 30 combates y devuelve estadísticas.  
> *"Guarda en el slot 98 como snapshot de prueba."* → Guardado. Restaura cuando quieras con *"carga el slot 98"*.  
> *"¿Cuál es el valor actual de la variable 5?"* → La IA ejecuta un script en el juego y devuelve el valor.

---

### Making many changes at once / Hacer muchos cambios a la vez

**EN**
> *"Rename all four heroes: actor 1 Aria the Swift, actor 2 Roland the Bold, actor 3 Yuna the Wise, actor 4 Kane the Silent."* → The AI sends all four edits in a single batch call.  
> *"Set up the Shadow Drake completely: 800 XP, 300 gold, immune to lightning, aggressive AI with a powerful bite below 40% HP."* → The AI chains edit-enemy + edit-traits + edit-enemy-actions in sequence.

**ES**
> *"Renombra a los cuatro héroes: actor 1 Aria la Veloz, actor 2 Roland el Audaz, actor 3 Yuna la Sabia, actor 4 Kane el Silencioso."* → La IA envía los cuatro cambios en una única llamada batch.  
> *"Configura el Drake Oscuro completamente: 800 XP, 300 de oro, inmune al rayo, IA agresiva con mordida potente por debajo del 40% HP."* → La IA encadena edit-enemy + edit-traits + edit-enemy-actions en secuencia.

---

## Tool reference / Referencia por herramienta

> **Navigation / Navegación**
> [Data & System](#data--system) · [Characters & Enemies](#characters--enemies) · [Traits & Effects](#traits--effects) · [Equipment & Items](#equipment--items) · [Skills, Classes & States](#skills-classes--states) · [Troops](#troops) · [Common Events](#common-events) · [Maps & Events](#maps--events) · [Tile Painting](#tile-painting) · [Tilesets](#tilesets) · [Plugins](#plugins) · [Animations](#animations) · [Runtime Control](#runtime-control) · [Backups](#backups) · [Batch](#batch)

---

## Data & System

### `health-check`

**EN:** *"Is the MCP server running?"*  
**ES:** *"¿Está funcionando el servidor MCP?"*

```json
{}
```

---

### `list-game-data`

**EN:** *"List all the enemies in my game."*  
**ES:** *"Lista todos los enemigos de mi juego."*

```json
{ "data_type": "Enemies" }
```

> `data_type` options: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

---

### `list-maps`

**EN:** *"Show me all the maps in the project."*  
**ES:** *"Muéstrame todos los mapas del proyecto."*

```json
{}
```

---

### `read-map`

**EN:** *"What events and encounters are on map 5?"*  
**ES:** *"¿Qué eventos y encuentros hay en el mapa 5?"*

```json
{ "map_id": 5 }
```

---

### `read-entity`

**EN:** *"Show me the full data for actor 3."*  
**ES:** *"Muéstrame los datos completos del actor 3."*

```json
{ "entity_type": "Actor", "entity_id": 3 }
```

> `entity_type` options: `Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent`

---

### `list-resources`

**EN:** *"What character sprite sheets do I have available?"*  
**ES:** *"¿Qué hojas de sprites de personaje tengo disponibles?"*

```json
{ "category": "characters" }
```

> `category` options: `characters` `faces` `battlers` `sv_actors` `tilesets` `parallaxes` `pictures` `bgm` `bgs` `se` `me` `all`

---

### `delete-entity`

**EN:** *"Delete enemy number 8. I no longer need it."*  
**ES:** *"Elimina al enemigo número 8. Ya no lo necesito."*

```json
{ "entity_type": "Enemy", "entity_id": 8, "confirm": true }
```

> Requires `confirm: true` as a safety guard. The slot is set to null (not spliced) to preserve existing ID references.

---

### `get-change-history`

**EN:** *"What changes has the AI made to actors in the last session?"*  
**ES:** *"¿Qué cambios hizo la IA a los actores en la última sesión?"*

```json
{ "entity_type": "Actor", "limit": 20 }
```

```json
{ "action": "create", "limit": 10 }
```

```json
{ "since": "2025-06-01T00:00:00Z", "tool": "edit-enemy" }
```

---

### `edit-system`

**EN:** *"Set the game title to 'Echoes of Eternity', the currency to Gil, and start the game on map 1 at position (5, 8)."*  
**ES:** *"Pon el título del juego como 'Ecos de la Eternidad', la moneda como Gil, y que empiece en el mapa 1 en la posición (5, 8)."*

```json
{
  "game_title": "Echoes of Eternity",
  "currency_unit": "Gil",
  "start_map_id": 1,
  "start_x": 5,
  "start_y": 8
}
```

**EN:** *"Name switch 1 'Quest Started' and variable 1 'Player Score'."*  
**ES:** *"Llama al switch 1 'Misión Iniciada' y a la variable 1 'Puntuación del Jugador'."*

```json
{
  "switch_names": { "1": "Quest Started" },
  "variable_names": { "1": "Player Score" }
}
```

---

## Characters & Enemies

### `generate-character`

**EN:** *"Create a healer character called Lyra. She's a gentle priestess with long silver hair. Start her at level 1, max level 99."*  
**ES:** *"Crea una personaje curandera llamada Lyra. Es una sacerdotisa amable de cabello plateado largo. Empieza en nivel 1, nivel máximo 99."*

```json
{
  "name": "Lyra",
  "archetype": "healer",
  "nickname": "The Gentle",
  "initial_level": 1,
  "max_level": 99,
  "profile": "A gentle priestess devoted to healing the wounds of war."
}
```

> Archetypes: `warrior` `mage` `rogue` `healer` `paladin` `ranger`  
> The AI automatically picks the best matching class, weapon, armor, and sprite from your project.

---

### `edit-actor`

**EN:** *"Rename actor 2 to Roland. He should be a knight starting at level 5."*  
**ES:** *"Renombra al actor 2 como Roland. Debe ser un caballero que empiece en nivel 5."*

```json
{
  "actor_id": 2,
  "name": "Roland",
  "nickname": "The Bold",
  "class_id": 3,
  "initial_level": 5
}
```

**EN:** *"Create a new actor called Zara the Rogue with face Actor3."*  
**ES:** *"Crea un nuevo actor llamado Zara la Pícara con la cara Actor3."*

```json
{
  "name": "Zara",
  "nickname": "The Rogue",
  "class_id": 4,
  "initial_level": 1,
  "max_level": 99,
  "face_name": "Actor3",
  "face_index": 0,
  "character_name": "Actor3",
  "character_index": 0
}
```

---

### `edit-enemy`

**EN:** *"Make the Forest Troll (enemy 4) drop 80 gold and 200 XP."*  
**ES:** *"Haz que el Troll del Bosque (enemigo 4) suelte 80 de oro y 200 XP."*

```json
{
  "enemy_id": 4,
  "name": "Forest Troll",
  "gold": 80,
  "exp": 200
}
```

**EN:** *"Create a new enemy called Shadow Bat with 50 XP and 20 gold."*  
**ES:** *"Crea un nuevo enemigo llamado Murciélago Sombra con 50 XP y 20 de oro."*

```json
{
  "name": "Shadow Bat",
  "exp": 50,
  "gold": 20
}
```

---

### `edit-enemy-actions`

**EN:** *"The Dark Wizard (enemy 7) should always attack normally, but below 50% HP switches to its Fireball skill, and below 25% HP it uses its ultimate Meteor ability."*  
**ES:** *"El Mago Oscuro (enemigo 7) siempre ataca normalmente, pero por debajo del 50% HP cambia a su habilidad Bola de Fuego, y por debajo del 25% HP usa su definitiva Meteoro."*

```json
{
  "enemy_id": 7,
  "mode": "replace",
  "actions": [
    { "skill_id": 1, "rating": 5, "condition_type": 0 },
    { "skill_id": 9, "rating": 9, "condition_type": 2, "condition_param1": 50 },
    { "skill_id": 12, "rating": 9, "condition_type": 2, "condition_param1": 25 }
  ]
}
```

> `condition_type`: 0=always, 1=turn X/Y, 2=HP≤%, 3=MP≤%, 4=state applied, 5=party level≥, 6=switch ON  
> `rating` 1–9: higher = used more often when multiple actions are eligible.

---

## Traits & Effects

### `edit-traits`

**EN:** *"Give the Forest Troll a 50% weakness to fire and immunity to sleep."*  
**ES:** *"Dale al Troll del Bosque una debilidad del 50% al fuego e inmunidad al sueño."*

```json
{
  "entity_type": "Enemy",
  "entity_id": 4,
  "mode": "append",
  "traits": [
    { "code": 11, "data_id": 2, "value": 1.5 },
    { "code": 14, "data_id": 2, "value": 0 }
  ]
}
```

**EN:** *"Make the Warrior class deal bonus fire damage with all attacks."*  
**ES:** *"Haz que la clase Guerrero inflija daño adicional de fuego con todos sus ataques."*

```json
{
  "entity_type": "Class",
  "entity_id": 2,
  "mode": "append",
  "traits": [
    { "code": 31, "data_id": 2, "value": 0 }
  ]
}
```

**EN:** *"Clear all traits from the Iron Shield armor."*  
**ES:** *"Borra todos los traits del Escudo de Hierro."*

```json
{
  "entity_type": "Armor",
  "entity_id": 5,
  "mode": "clear",
  "traits": []
}
```

> `entity_type`: `Actor` `Class` `Enemy` `Weapon` `Armor` `State`  
> Common codes — 11: element rate · 13: state rate · 14: state resist · 21: param rate · 31: attack element · 43: add skill · 51: equip weapon type

---

### `edit-effects`

**EN:** *"Make the Healing Herb restore 30% of max HP and 10 flat MP."*  
**ES:** *"Haz que la Hierba Curativa restaure el 30% del HP máximo y 10 MP fijos."*

```json
{
  "entity_type": "Item",
  "entity_id": 1,
  "mode": "replace",
  "effects": [
    { "code": 11, "data_id": 0, "value1": 0.30, "value2": 0 },
    { "code": 12, "data_id": 0, "value1": 0.00, "value2": 10 }
  ]
}
```

**EN:** *"The Poison Blade skill should inflict the Poison state with 60% chance."*  
**ES:** *"La habilidad Hoja Venenosa debe infligir el estado Veneno con un 60% de probabilidad."*

```json
{
  "entity_type": "Skill",
  "entity_id": 8,
  "mode": "append",
  "effects": [
    { "code": 21, "data_id": 3, "value1": 0.60, "value2": 0 }
  ]
}
```

> `entity_type`: `Skill` `Item`  
> Common codes — 11: recover HP · 12: recover MP · 13: gain TP · 21: add state · 22: remove state · 31-34: buff/debuff · 41: learn skill · 42: call common event

---

## Equipment & Items

### `edit-item`

**EN:** *"Create a new item called Ether that costs 200 gold."*  
**ES:** *"Crea un ítem llamado Éter que cueste 200 de oro."*

```json
{
  "name": "Ether",
  "description": "Restores a small amount of MP.",
  "price": 200,
  "icon_index": 64
}
```

**EN:** *"Update the Potion price to 150 gold and write a better description."*  
**ES:** *"Actualiza el precio de la Poción a 150 de oro y escribe una descripción mejor."*

```json
{
  "item_id": 1,
  "price": 150,
  "description": "A small vial of red liquid that restores 100 HP."
}
```

---

### `edit-weapon`

**EN:** *"Create a new sword called Blazeblade that adds 45 attack power."*  
**ES:** *"Crea una espada llamada Filo Llameante que añada 45 de ataque."*

```json
{
  "name": "Blazeblade",
  "wtype_id": 1,
  "price": 1200,
  "icon_index": 96,
  "attack": 45,
  "animation_id": 6
}
```

**EN:** *"Make weapon 3 deal 10 more attack and 5 more agility."*  
**ES:** *"Haz que el arma 3 dé 10 de ataque adicional y 5 de agilidad adicional."*

```json
{
  "weapon_id": 3,
  "attack": 10,
  "agility": 5
}
```

---

### `edit-armor`

**EN:** *"Create a new heavy armor called Iron Plate with 30 defense."*  
**ES:** *"Crea una armadura pesada llamada Placa de Hierro con 30 de defensa."*

```json
{
  "name": "Iron Plate",
  "atype_id": 4,
  "price": 800,
  "icon_index": 128,
  "defense": 30
}
```

**EN:** *"Update armor 2 to give 15 magic defense and 50 max HP."*  
**ES:** *"Actualiza la armadura 2 para dar 15 de defensa mágica y 50 de HP máximo."*

```json
{
  "armor_id": 2,
  "magic_defense": 15,
  "max_hp": 50
}
```

---

## Skills, Classes & States

### `edit-skill`

**EN:** *"Create a Fireball skill that hits all enemies, costs 12 MP, and has 90% success rate."*  
**ES:** *"Crea una habilidad Bola de Fuego que golpee a todos los enemigos, cueste 12 MP y tenga 90% de éxito."*

```json
{
  "name": "Fireball",
  "description": "Engulfs all foes in raging flames.",
  "mp_cost": 12,
  "scope": 2,
  "occasion": 1,
  "success_rate": 90,
  "damage_type": 1,
  "icon_index": 64,
  "animation_id": 51
}
```

**EN:** *"Update skill 5 to cost 20 MP instead of 10."*  
**ES:** *"Actualiza la habilidad 5 para que cueste 20 MP en lugar de 10."*

```json
{
  "skill_id": 5,
  "mp_cost": 20
}
```

---

### `edit-class`

**EN:** *"Create a new class called Arcane Knight with balanced EXP growth."*  
**ES:** *"Crea una nueva clase llamada Caballero Arcano con crecimiento de EXP equilibrado."*

```json
{
  "name": "Arcane Knight",
  "exp_basis": 35,
  "exp_extra": 150,
  "exp_acc_a": 2.0,
  "exp_acc_b": 2.0
}
```

**EN:** *"Make class 2 level up faster by reducing the EXP requirement."*  
**ES:** *"Haz que la clase 2 suba de nivel más rápido reduciendo el requisito de EXP."*

```json
{
  "class_id": 2,
  "exp_basis": 20,
  "exp_extra": 100
}
```

---

### `edit-state`

**EN:** *"Create a Burning state with medium priority that lasts 3 to 5 turns and is removed when the battle ends."*  
**ES:** *"Crea un estado Ardiendo con prioridad media que dure de 3 a 5 turnos y se elimine al terminar la batalla."*

```json
{
  "name": "Burning",
  "icon_index": 48,
  "priority": 50,
  "restriction": 0,
  "min_turns": 3,
  "max_turns": 5,
  "remove_at_battle_end": true,
  "remove_by_recover": true
}
```

**EN:** *"Update the Poison state so it removes itself if the target takes 30% of max HP as damage."*  
**ES:** *"Actualiza el estado Veneno para que se elimine si el objetivo recibe el 30% de su HP máximo como daño."*

```json
{
  "state_id": 3,
  "remove_by_damage": true,
  "damage_rate": 30
}
```

---

## Troops

### `create-troop`

**EN:** *"Create a Goblin Ambush encounter with two regular goblins and one goblin archer."*  
**ES:** *"Crea un encuentro de Emboscada Goblin con dos goblins normales y un arquero goblin."*

```json
{
  "name": "Goblin Ambush",
  "members": [
    { "enemy_id": 1 },
    { "enemy_id": 1 },
    { "enemy_id": 2 }
  ]
}
```

**EN:** *"Create a boss fight against the Shadow Dragon, positioned in the center of the screen."*  
**ES:** *"Crea un combate contra el Dragón Sombra, posicionado en el centro de la pantalla."*

```json
{
  "name": "Shadow Dragon Boss",
  "members": [
    { "enemy_id": 12, "x": 408, "y": 280 }
  ]
}
```

---

### `edit-troop`

**EN:** *"Rename troop 5 to 'Elite Guard Patrol'."*  
**ES:** *"Renombra la tropa 5 como 'Patrulla de Guardia de Élite'."*

```json
{
  "troop_id": 5,
  "name": "Elite Guard Patrol"
}
```

**EN:** *"Replace the members of troop 3 with two wolves and a dire wolf."*  
**ES:** *"Reemplaza los miembros de la tropa 3 con dos lobos y un lobo temible."*

```json
{
  "troop_id": 3,
  "members": [
    { "enemy_id": 5 },
    { "enemy_id": 5 },
    { "enemy_id": 6 }
  ]
}
```

---

### `edit-troop-events`

**EN:** *"Add a battle event to troop 3: at the start of the fight, display 'The wolves howl in unison!' Then when only one wolf remains (enemy 0 HP below 100%), show 'The pack leader snarls!'"*  
**ES:** *"Añade eventos de batalla a la tropa 3: al inicio del combate muestra '¡Los lobos aúllan al unísono!' Y cuando solo quede un lobo (HP enemigo 0 por debajo del 100%), muestra '¡El líder de la manada gruñe!'"*

```json
{
  "troop_id": 3,
  "mode": "replace_all",
  "pages": [
    {
      "conditions": { "turnValid": true, "turnA": 0, "turnB": 0 },
      "span": 0,
      "commands": [
        { "type": "message", "data": "The wolves howl in unison!" }
      ]
    },
    {
      "conditions": { "enemyValid": true, "enemyIndex": 0, "enemyHp": 100 },
      "span": 0,
      "commands": [
        { "type": "message", "data": "The pack leader snarls!" }
      ]
    }
  ]
}
```

---

## Common Events

### `create-common-event`

**EN:** *"Create a common event called 'Play Victory Fanfare' that plays a sound and shows a message."*  
**ES:** *"Crea un evento común llamado 'Reproducir Fanfarria Victoria' que reproduzca un sonido y muestre un mensaje."*

```json
{
  "name": "Play Victory Fanfare",
  "trigger": 0,
  "commands": [
    { "type": "message", "data": "Victory! The enemies have been defeated." }
  ]
}
```

**EN:** *"Create a parallel common event called 'Day Night Cycle' that runs while switch 10 is ON."*  
**ES:** *"Crea un evento común paralelo llamado 'Ciclo Día Noche' que se ejecute mientras el switch 10 esté ON."*

```json
{
  "name": "Day Night Cycle",
  "trigger": 2,
  "switch_id": 10
}
```

---

### `edit-common-event`

**EN:** *"Update common event 3 to also teleport the player to map 1 at position (5, 5) after the message."*  
**ES:** *"Actualiza el evento común 3 para que también teletransporte al jugador al mapa 1 en la posición (5, 5) después del mensaje."*

```json
{
  "event_id": 3,
  "commands": [
    { "type": "message", "data": "You have returned to the village." },
    { "type": "transfer", "data": "1,5,5" }
  ]
}
```

---

## Maps & Events

### `create-map`

**EN:** *"Create a 30×20 dungeon map called Dark Catacombs. Use tileset 3, loop it vertically, and play Dungeon1 as BGM."*  
**ES:** *"Crea un mapa de mazmorra de 30×20 llamado Catacumbas Oscuras. Usa el tileset 3, haz que se repita verticalmente y pon Dungeon1 como BGM."*

```json
{
  "name": "Dark Catacombs",
  "width": 30,
  "height": 20,
  "tileset_id": 3,
  "scroll_type": 2,
  "autoplay_bgm": true,
  "bgm_name": "Dungeon1",
  "enable_name_display": true
}
```

---

### `edit-map`

**EN:** *"Change map 4 to use tileset 5 and set the battle background to dungeon walls."*  
**ES:** *"Cambia el mapa 4 para usar el tileset 5 y pon el fondo de batalla como paredes de mazmorra."*

```json
{
  "map_id": 4,
  "tileset_id": 5,
  "specify_battleback": true,
  "battleback1": "DungeonStone",
  "battleback2": "DungeonWall"
}
```

**EN:** *"Add slimes and bats to map 6's random encounters, with slimes appearing more often."*  
**ES:** *"Añade babosas y murciélagos a los encuentros aleatorios del mapa 6, con las babosas apareciendo más a menudo."*

```json
{
  "map_id": 6,
  "encounters": [
    { "enemy_id": 1, "weight": 10 },
    { "enemy_id": 2, "weight": 5 }
  ]
}
```

---

### `delete-map`

**EN:** *"Delete map 15 — it's an old test map I no longer need."*  
**ES:** *"Elimina el mapa 15 — es un mapa de prueba antiguo que ya no necesito."*

```json
{ "map_id": 15, "confirm": true }
```

---

### `create-map-event`

**EN:** *"Add a chest at position (8, 6) on map 3 containing a Potion."*  
**ES:** *"Añade un cofre en la posición (8, 6) del mapa 3 que contenga una Poción."*

```json
{
  "map_id": 3,
  "event_name": "Chest",
  "x": 8,
  "y": 6,
  "event_type": "chest",
  "character": "!Chest",
  "treasure": { "type": "item", "id": 1, "amount": 1 }
}
```

**EN:** *"Create an NPC called Old Man at (12, 5) on map 2 who says: 'The ruins to the north are cursed. Best not go alone.'"*  
**ES:** *"Crea un NPC llamado Anciano en (12, 5) del mapa 2 que diga: 'Las ruinas del norte están malditas. Es mejor no ir solo.'"*

```json
{
  "map_id": 2,
  "event_name": "Old Man",
  "x": 12,
  "y": 5,
  "event_type": "npc",
  "character": "People1",
  "dialogue": [
    { "speaker": "Old Man", "text": "The ruins to the north are cursed." },
    { "text": "Best not go alone." }
  ]
}
```

**EN:** *"Place a battle trigger at (10, 10) on map 3 that starts a fight against troop 5."*  
**ES:** *"Coloca un disparador de batalla en (10, 10) del mapa 3 que inicie un combate contra la tropa 5."*

```json
{
  "map_id": 3,
  "event_name": "Battle Trigger",
  "x": 10,
  "y": 10,
  "event_type": "enemy",
  "troop_id": 5
}
```

---

### `edit-map-event`

**EN:** *"Move the Old Man NPC on map 2 to position (14, 7)."*  
**ES:** *"Mueve al NPC Anciano del mapa 2 a la posición (14, 7)."*

```json
{
  "map_id": 2,
  "event_id": 3,
  "x": 14,
  "y": 7
}
```

**EN:** *"Add a line to the guard event on map 1: after he lets the player pass, he says 'Stay out of trouble.'"*  
**ES:** *"Añade una línea al evento del guardia en el mapa 1: después de dejar pasar al jugador, dice 'Mantente alejado de los problemas.'"*

```json
{
  "map_id": 1,
  "event_id": 5,
  "append_commands": [
    { "type": "message", "data": "Stay out of trouble." }
  ]
}
```

---

### `delete-map-event`

**EN:** *"Remove the old test trigger event (ID 12) from map 3."*  
**ES:** *"Elimina el viejo evento de prueba (ID 12) del mapa 3."*

```json
{ "map_id": 3, "event_id": 12 }
```

---

### `edit-event-page`

**EN:** *"Add a second page to the NPC on map 3, event 5. After self-switch A is on, she should say 'Thank you for saving us!' and face the player."*  
**ES:** *"Añade una segunda página al NPC del mapa 3, evento 5. Cuando el auto-switch A esté activo, debe decir '¡Gracias por salvarnos!' y mirar al jugador."*

```json
{
  "map_id": 3,
  "event_id": 5,
  "mode": "add",
  "page": {
    "conditions": { "selfSwitchValid": true, "selfSwitchCh": "A" },
    "trigger": 0,
    "character_name": "People1",
    "character_index": 2,
    "commands": [
      { "type": "message", "data": "Thank you for saving us!" }
    ]
  }
}
```

**EN:** *"Remove page 2 from event 7 on map 4."*  
**ES:** *"Elimina la página 2 del evento 7 en el mapa 4."*

```json
{ "map_id": 4, "event_id": 7, "mode": "remove", "page_index": 1 }
```

---

### `add-dialogue`

**EN:** *"Write a quick dialogue for the Innkeeper: she greets the player and tells them the room costs 10 gold."*  
**ES:** *"Escribe un diálogo rápido para la Posadrera: saluda al jugador y le dice que la habitación cuesta 10 de oro."*

```json
{
  "event_name": "Innkeeper",
  "dialogue_lines": [
    { "speaker": "Innkeeper", "text": "Welcome, traveler! Rest your weary bones." },
    { "text": "A room for the night costs 10 gold. Interested?" }
  ]
}
```

---

### `create-dialogue-advanced`

**EN:** *"Create a branching dialogue for the gate guard. He asks the player's business. 'I'm a traveler' → he lets them pass reluctantly. 'I have a permit' → he waves them through."*  
**ES:** *"Crea un diálogo con ramas para el guardia de la puerta. Pregunta el asunto del jugador. 'Soy un viajero' → deja pasar a regañadientes. 'Tengo un permiso' → los deja pasar sin problema."*

```json
{
  "dialogue_name": "Gate Guard",
  "dialogue_nodes": [
    {
      "id": "start",
      "text": "Halt! State your business.",
      "choices": [
        { "label": "I'm a traveler",  "next": "traveler" },
        { "label": "I have a permit", "next": "permit" }
      ]
    },
    { "id": "traveler", "text": "Move along then. Stay out of trouble." },
    { "id": "permit",   "text": "Very well. You may pass." }
  ]
}
```

---

### `story-generator`

**EN:** *"Generate a three-scene intro: the kingdom falls under attack, the hero escapes through a secret passage, and wakes up in a small village."*  
**ES:** *"Genera una intro de tres escenas: el reino cae bajo ataque, el héroe escapa por un pasaje secreto y se despierta en una aldea pequeña."*

```json
{
  "story_title": "The Fall of Elyndor",
  "story_description": "An epic tale of a kingdom's fall and a hero's journey.",
  "scenes": [
    {
      "name": "The Attack",
      "description": "The capital burns. The king falls. The hero must flee.",
      "map_name": "Castle Throne Room"
    },
    {
      "name": "The Escape",
      "description": "The hero dashes through a secret underground tunnel.",
      "map_name": "Secret Passage"
    },
    {
      "name": "The Awakening",
      "description": "The hero wakes up in a peaceful village, alone and without memories.",
      "map_name": "Millhaven Village"
    }
  ]
}
```

---

## Tile Painting

### `read-map-tiles`

**EN:** *"Show me the tile IDs in the top-left 5×5 area of map 3 on layer 0."*  
**ES:** *"Muéstrame los IDs de tile en el área 5×5 superior izquierda del mapa 3 en la capa 0."*

```json
{
  "map_id": 3,
  "x": 0,
  "y": 0,
  "width": 5,
  "height": 5,
  "layers": [0]
}
```

**EN:** *"Read all tiles on map 2, layers 0 through 3."*  
**ES:** *"Lee todos los tiles del mapa 2, capas 0 a 3."*

```json
{
  "map_id": 2,
  "layers": [0, 1, 2, 3]
}
```

---

### `paint-map-tiles`

**EN:** *"Paint three specific tiles on map 3: put a stone wall (ID 2816) at (3, 2), (4, 2) and (5, 2) on layer 1."*  
**ES:** *"Pinta tres tiles específicos en el mapa 3: pon una pared de piedra (ID 2816) en (3, 2), (4, 2) y (5, 2) en la capa 1."*

```json
{
  "map_id": 3,
  "tiles": [
    { "x": 3, "y": 2, "layer": 1, "tile_id": 2816 },
    { "x": 4, "y": 2, "layer": 1, "tile_id": 2816 },
    { "x": 5, "y": 2, "layer": 1, "tile_id": 2816 }
  ]
}
```

---

### `fill-map-region`

**EN:** *"Fill the entire top row of map 3 with a ceiling tile (ID 2048) on layer 0."*  
**ES:** *"Rellena toda la fila superior del mapa 3 con un tile de techo (ID 2048) en la capa 0."*

```json
{
  "map_id": 3,
  "x": 0,
  "y": 0,
  "width": 30,
  "height": 1,
  "layer": 0,
  "tile_id": 2048
}
```

**EN:** *"Clear a 5×5 area starting at (10, 5) on layer 1 of map 2."*  
**ES:** *"Borra un área 5×5 desde (10, 5) en la capa 1 del mapa 2."*

```json
{
  "map_id": 2,
  "x": 10,
  "y": 5,
  "width": 5,
  "height": 5,
  "layer": 1,
  "tile_id": 0
}
```

---

### `paint-map-region`

**EN:** *"Fill a 10×6 room area at (5, 4) on map 3, layer 0, with a stone floor tile (ID 2816)."*  
**ES:** *"Rellena un área de habitación 10×6 en (5, 4) del mapa 3, capa 0, con un tile de suelo de piedra (ID 2816)."*

```json
{
  "map_id": 3,
  "layer": 0,
  "x": 5,
  "y": 4,
  "width": 10,
  "height": 6,
  "tile_id": 2816
}
```

**EN:** *"Stamp a 3×3 corner pattern at (2, 2) on map 3, layer 1."*  
**ES:** *"Estampa un patrón de esquina 3×3 en (2, 2) del mapa 3, capa 1."*

```json
{
  "map_id": 3,
  "layer": 1,
  "x": 2,
  "y": 2,
  "width": 3,
  "height": 3,
  "tiles": [2048, 2049, 2050, 2112, 2113, 2114, 2176, 2177, 2178]
}
```

> `tiles` is a flat row-major array of exactly `width × height` tile IDs.

---

## Tilesets

### `read-tileset`

**EN:** *"Show me what graphic files tileset 2 uses."*  
**ES:** *"Muéstrame qué archivos gráficos usa el tileset 2."*

```json
{ "tileset_id": 2 }
```

**EN:** *"List all tilesets in the project."*  
**ES:** *"Lista todos los tilesets del proyecto."*

```json
{}
```

**EN:** *"Show me the full passability flags for tileset 1."*  
**ES:** *"Muéstrame los flags de pasabilidad completos del tileset 1."*

```json
{ "tileset_id": 1, "include_flags": true }
```

---

### `create-tileset`

**EN:** *"Create a new tileset called Forest Overworld using TileA1, TileA2, TileA5 and Forest_B."*  
**ES:** *"Crea un nuevo tileset llamado Bosque Exterior usando TileA1, TileA2, TileA5 y Forest_B."*

```json
{
  "name": "Forest Overworld",
  "mode": 0,
  "tilesetNames": ["TileA1", "TileA2", "", "", "TileA5", "Forest_B", "", "", ""]
}
```

> `tilesetNames` has 9 slots: A1 A2 A3 A4 A5 B C D E. Leave unused slots as empty strings.  
> `mode`: 0 = World map, 1 = Area map.

---

### `edit-tileset-properties`

**EN:** *"Rename tileset 3 to 'Ice Cave' and assign IceCave_A1 to slot A1."*  
**ES:** *"Renombra el tileset 3 como 'Cueva de Hielo' y asigna IceCave_A1 al slot A1."*

```json
{
  "tileset_id": 3,
  "name": "Ice Cave",
  "tilesetNames": ["IceCave_A1", "TileA2", "", "", "TileA5", "IceCave_B", "", "", ""]
}
```

---

### `edit-tileset`

**EN:** *"In tileset 2, mark the deep water tile (ID 2816) as impassable and tag it as terrain type 1."*  
**ES:** *"En el tileset 2, marca el tile de agua profunda (ID 2816) como impasable y etiquétalo como tipo de terreno 1."*

```json
{
  "tileset_id": 2,
  "flag_overrides": [
    { "tile_id": 2816, "passable": false, "terrain_tag": 1 }
  ]
}
```

**EN:** *"Make tiles 3072 and 3073 in tileset 1 passable and remove their terrain tag."*  
**ES:** *"Haz que los tiles 3072 y 3073 del tileset 1 sean pasables y elimina su etiqueta de terreno."*

```json
{
  "tileset_id": 1,
  "flag_overrides": [
    { "tile_id": 3072, "passable": true, "terrain_tag": 0 },
    { "tile_id": 3073, "passable": true, "terrain_tag": 0 }
  ]
}
```

---

## Plugins

### `create-plugin`

**EN:** *"Create a simple plugin called QuestLog that adds a quest journal accessible from the menu."*  
**ES:** *"Crea un plugin sencillo llamado DiarioMisiones que añade un diario de misiones accesible desde el menú."*

```json
{
  "plugin_name": "QuestLog",
  "description": "Adds a quest journal to the game menu.",
  "author": "MyStudio",
  "version": "1.0.0",
  "code_type": "command"
}
```

> `code_type`: `empty` `simple-hook` `command` `skill-modifier`

---

### `create-plugin-advanced`

**EN:** *"Create an advanced plugin called ActorCustomHP that modifies actor HP behavior."*  
**ES:** *"Crea un plugin avanzado llamado ActorCustomHP que modifica el comportamiento del HP del actor."*

```json
{
  "plugin_name": "ActorCustomHP",
  "template_type": "game-actor"
}
```

> `template_type`: `with-parameters` `game-actor` `game-enemy` `event-handler` `custom-ui`

---

### `setup-debug-plugin`

**EN:** *"Install the debug plugin so I can control the game in real time."*  
**ES:** *"Instala el plugin de depuración para poder controlar el juego en tiempo real."*

```json
{}
```

> Safe to run multiple times. Never overwrites existing plugins.

---

### `manage-plugins`

**EN:** *"List all plugins in my project."*  
**ES:** *"Lista todos los plugins de mi proyecto."*

```json
{ "action": "list" }
```

**EN:** *"Enable the VisuMZ_1_ItemsEquipsCore plugin."*  
**ES:** *"Activa el plugin VisuMZ_1_ItemsEquipsCore."*

```json
{ "action": "enable", "plugin_name": "VisuMZ_1_ItemsEquipsCore" }
```

**EN:** *"Delete the old test plugin called MyTestPlugin."*  
**ES:** *"Elimina el viejo plugin de prueba llamado MyTestPlugin."*

```json
{ "action": "delete", "plugin_name": "MyTestPlugin" }
```

---

### `edit-plugin-parameters`

**EN:** *"Change the screen resolution in VisuMZ CoreEngine to 1280×720."*  
**ES:** *"Cambia la resolución de pantalla en VisuMZ CoreEngine a 1280×720."*

```json
{
  "plugin_name": "VisuMZ_0_CoreEngine",
  "parameters": {
    "ScreenWidth": "1280",
    "ScreenHeight": "720"
  }
}
```

> All parameter values are strings (RPG Maker MZ format). Only the keys you provide are changed; the rest are preserved.

---

## Animations

### `read-animation`

**EN:** *"Show me all animations in the project."*  
**ES:** *"Muéstrame todas las animaciones del proyecto."*

```json
{}
```

**EN:** *"Show me the full details of animation 51."*  
**ES:** *"Muéstrame los detalles completos de la animación 51."*

```json
{ "animation_id": 51 }
```

---

### `edit-animation`

**EN:** *"Rename animation 12 to 'Grand Fireball' and point it to the FireBig Effekseer effect."*  
**ES:** *"Renombra la animación 12 como 'Gran Bola de Fuego' y apúntala al efecto Effekseer FireBig."*

```json
{
  "animation_id": 12,
  "name": "Grand Fireball",
  "effect_name": "FireBig",
  "display_type": 1
}
```

> `display_type`: 0 = target head · 1 = target center · 2 = full screen · -1 = front of screen  
> `effect_name` references a `.efkefc` file in the project's `effects/` folder (without extension).

---

## Runtime Control

> All tools in this section require the game to be running with the debug plugin active.

### `launch-game`

**EN:** *"Launch the game."*  
**ES:** *"Lanza el juego."*

```json
{}
```

---

### `get-game-state`

**EN:** *"What's the current state of the game? Where is the player and how is the party?"*  
**ES:** *"¿Cuál es el estado actual del juego? ¿Dónde está el jugador y cómo está el grupo?"*

```json
{}
```

---

### `set-switch`

**EN:** *"Turn on switch 5 so the bridge event activates."*  
**ES:** *"Activa el switch 5 para que el evento del puente se active."*

```json
{ "id": 5, "value": true }
```

**EN:** *"Turn off switch 12."*  
**ES:** *"Desactiva el switch 12."*

```json
{ "id": 12, "value": false }
```

---

### `set-variable`

**EN:** *"Set variable 3 to 100 to simulate the player has 100 quest points."*  
**ES:** *"Pon la variable 3 en 100 para simular que el jugador tiene 100 puntos de misión."*

```json
{ "id": 3, "value": 100 }
```

---

### `teleport-player`

**EN:** *"Teleport the player to map 7 at position (15, 10), facing south."*  
**ES:** *"Teletransporta al jugador al mapa 7 en la posición (15, 10), mirando al sur."*

```json
{ "map_id": 7, "x": 15, "y": 10, "direction": 2 }
```

> `direction`: 2 = south · 4 = west · 6 = east · 8 = north

---

### `save-game`

**EN:** *"Save the current game state to slot 98 as a test snapshot."*  
**ES:** *"Guarda el estado actual del juego en el slot 98 como snapshot de prueba."*

```json
{ "slot": 98 }
```

---

### `load-game`

**EN:** *"Load the test snapshot from slot 98."*  
**ES:** *"Carga el snapshot de prueba del slot 98."*

```json
{ "slot": 98 }
```

---

### `set-party-state`

**EN:** *"Set the whole party to 30% HP to test low-health dialogue triggers."*  
**ES:** *"Pon a todo el grupo al 30% de HP para probar los diálogos que se activan con poca vida."*

```json
{ "mode": "party", "hp_percent": 30 }
```

**EN:** *"Set actor 1 to full HP and MP, and remove all status effects."*  
**ES:** *"Pon al actor 1 con HP y MP al máximo, y elimina todos los efectos de estado."*

```json
{ "mode": "actor", "actor_id": 1, "hp_percent": 100, "mp_percent": 100, "clear_states": true }
```

---

### `start-encounter`

**EN:** *"Start a battle against troop 8."*  
**ES:** *"Inicia una batalla contra la tropa 8."*

```json
{ "troop_id": 8 }
```

**EN:** *"Trigger a fight against 3 slimes with a predefined AI turn plan."*  
**ES:** *"Desencadena un combate contra 3 babosas con un plan de turnos de IA predefinido."*

```json
{
  "enemy_id": 1,
  "count": 3,
  "actions": [
    { "turn": 1, "actor": 0, "skill": 5 },
    { "turn": 2, "actor": 0, "skill": 1 },
    { "turn": 3, "actor": 0, "skill": 5 }
  ]
}
```

---

### `run-battle-suite`

**EN:** *"Run the final boss battle 50 times and give me the win rate and average HP remaining."*  
**ES:** *"Ejecuta la batalla del jefe final 50 veces y dime el porcentaje de victorias y el HP medio restante."*

```json
{
  "troop_id": 12,
  "runs": 50,
  "strategy": "max_damage"
}
```

---

### `execute-script`

**EN:** *"What is the current value of variable 5 in the running game?"*  
**ES:** *"¿Cuál es el valor actual de la variable 5 en el juego en ejecución?"*

```json
{ "code": "return $gameVariables.value(5);", "timeout": 3000 }
```

**EN:** *"Give the player 500 gold right now."*  
**ES:** *"Dale al jugador 500 de oro ahora mismo."*

```json
{ "code": "$gameParty.gainGold(500);" }
```

---

### `show-message`

**EN:** *"Display a test message in the running game: 'Checkpoint reached!'"*  
**ES:** *"Muestra un mensaje de prueba en el juego en ejecución: '¡Punto de control alcanzado!'"*

```json
{ "text": "Checkpoint reached!", "speaker": "System" }
```

---

## Backups

### `manage-backups`

**EN:** *"List all backups for Actors.json."*  
**ES:** *"Lista todos los backups de Actors.json."*

```json
{ "action": "list", "filename": "Actors.json" }
```

**EN:** *"Restore Actors.json from a specific backup."*  
**ES:** *"Restaura Actors.json desde un backup específico."*

```json
{
  "action": "restore",
  "filename": "Actors.json",
  "backup_name": "Actors_2025-06-01T10-30-00-000_0001.json"
}
```

**EN:** *"Delete all old backups, keeping only the latest 5 per file."*  
**ES:** *"Elimina todos los backups antiguos, conservando solo los últimos 5 por archivo."*

```json
{ "action": "prune", "max_count": 5 }
```

---

## Batch

### `batch-edit`

**EN:** *"Rename all four heroes and change the currency to Gil in one go."*  
**ES:** *"Renombra a los cuatro héroes y cambia la moneda a Gil de una vez."*

```json
{
  "operations": [
    { "tool": "edit-actor",  "input": { "actor_id": 1, "name": "Aria",   "nickname": "The Swift" } },
    { "tool": "edit-actor",  "input": { "actor_id": 2, "name": "Roland", "nickname": "The Bold" } },
    { "tool": "edit-actor",  "input": { "actor_id": 3, "name": "Yuna",   "nickname": "The Wise" } },
    { "tool": "edit-actor",  "input": { "actor_id": 4, "name": "Kane",   "nickname": "The Silent" } },
    { "tool": "edit-system", "input": { "currency_unit": "Gil" } }
  ]
}
```

**EN:** *"Set up the Shadow Drake enemy completely in one call: stats, AI, and immunity to lightning."*  
**ES:** *"Configura el enemigo Drake Oscuro completamente en una sola llamada: estadísticas, IA e inmunidad al rayo."*

```json
{
  "stop_on_error": true,
  "operations": [
    {
      "tool": "edit-enemy",
      "input": { "enemy_id": 5, "name": "Shadow Drake", "exp": 800, "gold": 300 }
    },
    {
      "tool": "edit-enemy-actions",
      "input": {
        "enemy_id": 5,
        "mode": "replace",
        "actions": [
          { "skill_id": 1, "rating": 5, "condition_type": 0 },
          { "skill_id": 7, "rating": 9, "condition_type": 2, "condition_param1": 40 }
        ]
      }
    },
    {
      "tool": "edit-traits",
      "input": {
        "entity_type": "Enemy",
        "entity_id": 5,
        "mode": "append",
        "traits": [
          { "code": 11, "data_id": 4, "value": 0.0 }
        ]
      }
    }
  ]
}
```

> Max 50 operations per call. Use `stop_on_error: true` to abort the sequence on the first failure.
