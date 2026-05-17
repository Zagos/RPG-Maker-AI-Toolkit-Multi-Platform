# RPG Maker AI Toolkit v2.1 — Usage Examples

> Natural-language prompts you can give an AI agent, plus JSON reference inputs for each macro tool.
> Spanish equivalents follow each English section.
> Supported engines: **MZ · MV · VX Ace · VX · XP**

---

## Navigation

- [runtime-control — Control running game](#runtime-control)
- [runtime-inspect — Read live game state](#runtime-inspect)
- [query-data — Read project files](#query-data)
- [game-entity — Create / edit / delete entities](#game-entity)
- [game-map — Maps, tiles, events, tilesets](#game-map)
- [dialogue-tools — Dialogue authoring](#dialogue-tools)
- [battle-sim — Battle simulation](#battle-sim)
- [project-tools — Maintenance & bulk edits](#project-tools)
- [plugin-manage — Plugins (MZ/MV) and scripts (Ruby)](#plugin-manage)
- [game-setup — Setup and launch](#game-setup)
- [manage-backups — Backup management](#manage-backups)
- [batch-edit — Escape hatch for multi-tool operations](#batch-edit)

---

## runtime-control

> Controls a **running** game through the live debug bridge.
> Fields are at the **top level** — no `data` wrapper.

---

### Set a switch or variable

**EN:** "Turn on switch 1 in the running game."
**ES:** "Activa el interruptor 1 en el juego en ejecución."

```json
{ "action": "set-switch", "id": 1, "value": true }
```

**EN:** "Set variable 2 to 50 while the game is running."
**ES:** "Establece la variable 2 a 50 mientras el juego está en marcha."

```json
{ "action": "set-variable", "id": 2, "value": 50 }
```

---

### Teleport the player

**EN:** "Move the player to map 3, coordinates (10, 5), facing left."
**ES:** "Mueve al jugador al mapa 3, coordenadas (10, 5), mirando a la izquierda."

```json
{ "action": "teleport", "map_id": 3, "x": 10, "y": 5, "direction": 4 }
```

---

### Save and load

**EN:** "Save the game to slot 1."
**ES:** "Guarda la partida en el slot 1."

```json
{ "action": "save", "slot": 1 }
```

```json
{ "action": "load", "slot": 1 }
```

---

### Modify inventory

**EN:** "Give the party 5 of item 1 and remove 2 of weapon 3."
**ES:** "Dale al grupo 5 unidades del objeto 1 y quita 2 del arma 3."

```json
{
  "action": "modify-inventory",
  "operations": [
    { "action": "add",    "type": "item",   "id": 1, "amount": 5 },
    { "action": "remove", "type": "weapon", "id": 3, "amount": 2 }
  ]
}
```

---

### Set party state

**EN:** "Restore actor 1 to full HP and half MP."
**ES:** "Restaura al actor 1 con HP completo y la mitad de MP."

```json
{ "action": "set-party-state", "actor_id": 1, "hp_percent": 1.0, "mp_percent": 0.5 }
```

---

### Other runtime actions

**EN:** "Call common event 7 / set actor 1's level to 10 / add actor 3 to the party."
**ES:** "Llama al evento común 7 / establece nivel 10 al actor 1 / añade el actor 3 al grupo."

```json
{ "action": "call-common-event", "event_id": 7 }
```
```json
{ "action": "modify-actor", "actor_id": 1, "field": "level", "value": 10, "mode": "set" }
```
```json
{ "action": "manage-party", "party_action": "add", "actor_id": 3 }
```

**EN:** "Start rain at power 5 for 60 frames / play BGM 'Battle1' / start a 5-second timer / show a message / run a script."
**ES:** "Inicia lluvia intensidad 5 por 60 fotogramas / reproduce BGM 'Battle1' / temporizador 5 s / mensaje / script."

```json
{ "action": "control-weather", "weather_type": "rain", "power": 5, "duration": 60 }
```
```json
{ "action": "play-audio", "audio_type": "bgm", "name": "Battle1", "volume": 90 }
```
```json
{ "action": "control-timer", "timer_action": "start", "frames": 300 }
```
```json
{ "action": "show-message", "text": "Hello world", "speaker": "Hero" }
```
```json
{ "action": "execute-script", "code": "$game_switches[1] = true" }
```

---

## runtime-inspect

> Reads live state from a **running** game.
> Fields are at the **top level** — no `data` wrapper.

---

### Read overall game state

**EN:** "Show me the current game state — map, position, gold."
**ES:** "Muéstrame el estado actual del juego: mapa, posición, oro."

```json
{ "type": "game-state" }
```

---

### Read switches, variables, inventory, party, actors

**EN:** "Read switch 1 / variable 2 / full inventory / actor 1's stats / current party."
**ES:** "Lee el interruptor 1 / variable 2 / inventario completo / estadísticas del actor 1 / grupo actual."

```json
{ "type": "switch", "id": 1 }
```
```json
{ "type": "variable", "id": 2 }
```
```json
{ "type": "inventory", "category": "all" }
```
```json
{ "type": "actor", "id": 1 }
```
```json
{ "type": "party" }
```

---

### Read map, battle, and timer state

**EN:** "What map is the player on? What is the current battle state? Is the timer running?"
**ES:** "¿En qué mapa está el jugador? ¿Cuál es el estado del combate? ¿Está activo el temporizador?"

```json
{ "type": "map" }
```
```json
{ "type": "battle" }
```
```json
{ "type": "timer" }
```

---

## query-data

> Reads project files (no running game required).
> All calls use `{ "type": "...", "data": { ...fields } }`.

---

### List entities

**EN:** "Show me all actors in the project with their IDs."
**ES:** "Muéstrame todos los actores del proyecto con sus IDs."

```json
{ "type": "list", "data": { "data_type": "Actors" } }
```

Valid `data_type` values: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `CommonEvents`

---

### Read entities, maps, system, and resources

**EN:** "Read actor 1 / all maps / map 1 with events / system terms / animation 3 / tileset 1 / all BGM files."
**ES:** "Lee el actor 1 / todos los mapas / mapa 1 con eventos / términos del sistema / animación 3 / tileset 1 / BGMs."

```json
{ "type": "entity", "data": { "entity_type": "Actor", "id": 1 } }
```
```json
{ "type": "maps", "data": {} }
```
```json
{ "type": "map", "data": { "id": 1, "include_events": true } }
```
```json
{ "type": "system", "data": { "section": "terms" } }
```
```json
{ "type": "animation", "data": { "id": 3 } }
```
```json
{ "type": "tileset", "data": { "id": 1, "include_flags": false } }
```
```json
{ "type": "resources", "data": { "category": "bgm" } }
```

---

### Search entities

**EN:** "Find all items whose name contains 'potion'."
**ES:** "Encuentra todos los objetos cuyo nombre contiene 'potion'."

```json
{ "type": "search", "data": { "entity_type": "Item", "query": "potion", "field": "name", "limit": 10 } }
```

---

### Export project summary

**EN:** "Give me a compact overview of the whole project."
**ES:** "Dame un resumen compacto de todo el proyecto."

```json
{ "type": "summary", "data": {} }
```

---

## game-entity

> Creates, edits, deletes, or duplicates any game entity.
> All calls use `{ "action": "...", "type": "...", "data": { ...fields } }`.

---

### Create and edit entities

**EN:** "Create a warrior actor 'Hero' at level 1 / create enemy 'Goblin' / rename actor 1 / change game title / update boat sprite."
**ES:** "Crea el actor guerrero 'Hero' en nivel 1 / crea enemigo 'Goblin' / renombra actor 1 / cambia título / actualiza sprite del bote."

```json
{ "action": "create", "type": "actor", "data": { "name": "Hero", "class_id": 1, "initial_level": 1 } }
```
```json
{ "action": "create", "type": "enemy", "data": { "name": "Goblin", "params": [80, 0, 10, 8, 8, 8, 10, 10] } }
```
```json
{ "action": "edit", "type": "actor", "id": 1, "data": { "name": "Aria", "max_level": 99 } }
```
```json
{ "action": "edit", "type": "system", "data": { "game_title": "My Epic Adventure" } }
```
```json
{ "action": "edit", "type": "vehicle", "data": { "vehicle": "boat", "character_name": "Vehicle" } }
```

---

### Edit traits and effects

**EN:** "Append two elemental resistance traits to actor 1."
**ES:** "Añade dos rasgos de resistencia elemental al actor 1."

```json
{
  "action": "edit",
  "type": "traits",
  "data": {
    "entity_type": "Actor",
    "entity_id": 1,
    "mode": "append",
    "traits": [
      { "code": 11, "data_id": 1, "value": 1.5 },
      { "code": 11, "data_id": 2, "value": 0.5 }
    ]
  }
}
```

**EN:** "Replace the effects on skill 3 with a single HP-recovery effect."
**ES:** "Reemplaza los efectos de la habilidad 3 con un único efecto de recuperación de HP."

```json
{
  "action": "edit",
  "type": "effects",
  "data": {
    "entity_type": "Skill",
    "entity_id": 3,
    "mode": "replace",
    "effects": [
      { "code": 11, "data_id": 0, "value1": 0.3, "value2": 50 }
    ]
  }
}
```

---

### Edit class learnings

**EN:** "Add a spell for class 1 to learn skill 2 at level 5."
**ES:** "Haz que la clase 1 aprenda la habilidad 2 al nivel 5."

```json
{
  "action": "edit",
  "type": "class-learnings",
  "data": {
    "class_id": 1,
    "mode": "append",
    "learnings": [{ "level": 5, "skill_id": 2 }]
  }
}
```

---

### Edit enemy actions and drops

**EN:** "Replace enemy 1's action list with a basic attack."
**ES:** "Reemplaza la lista de acciones del enemigo 1 con un ataque básico."

```json
{
  "action": "edit",
  "type": "enemy-actions",
  "data": {
    "enemy_id": 1,
    "mode": "replace",
    "actions": [{ "skill_id": 1, "condition_type": 0, "rating": 5 }]
  }
}
```

**EN:** "Set enemy 2's drop table to include a potion and some gold."
**ES:** "Establece la tabla de botín del enemigo 2 con una poción y algo de oro."

```json
{
  "action": "edit",
  "type": "drop-items",
  "data": {
    "enemy_id": 2,
    "mode": "replace",
    "drops": [
      { "kind": 1, "data_id": 1, "denominator": 2 },
      { "kind": 0, "data_id": 0, "denominator": 1 }
    ]
  }
}
```

---

### Delete and duplicate

**EN:** "Delete enemy 5 from the database."
**ES:** "Elimina el enemigo 5 de la base de datos."

```json
{ "action": "delete", "type": "enemy", "id": 5, "data": {} }
```

**EN:** "Duplicate actor 1 and name the copy 'Hero Copy'."
**ES:** "Duplica el actor 1 y llama a la copia 'Copia de Héroe'."

```json
{ "action": "duplicate", "type": "actor", "id": 1, "data": { "new_name": "Hero Copy" } }
```

---

### AI character generation

**EN:** "Generate a complete mage character named 'Aria' with all stats and traits."
**ES:** "Genera un personaje mago completo llamado 'Aria' con todas sus estadísticas y rasgos."

```json
{ "action": "generate", "type": "character", "data": { "name": "Aria", "archetype": "mage" } }
```

---

## game-map

> All map, tile, event, and tileset operations.
> All calls use `{ "action": "...", "data": { ...fields } }`.

---

### Create, edit, and delete maps

**EN:** "Create a 20×15 town map called 'Town Square' using tileset 1."
**ES:** "Crea un mapa de ciudad 20×15 llamado 'Plaza del Pueblo' con el tileset 1."

```json
{ "action": "create", "data": { "name": "Town Square", "width": 20, "height": 15, "tileset_id": 1 } }
```

**EN:** "Rename map 2 to 'Forest' and enable autoplay BGM 'Forest1'."
**ES:** "Renombra el mapa 2 a 'Bosque' y activa el BGM automático 'Forest1'."

```json
{ "action": "edit", "data": { "map_id": 2, "name": "Forest", "autoplay_bgm": true, "bgm_name": "Forest1" } }
```

**EN:** "Delete map 5 permanently."
**ES:** "Elimina el mapa 5 de forma permanente."

```json
{ "action": "delete", "data": { "map_id": 5, "confirm": true } }
```

**EN:** "Copy map 3 and name it 'Town Copy'."
**ES:** "Copia el mapa 3 y llámalo 'Copia del Pueblo'."

```json
{ "action": "copy", "data": { "source_map_id": 3, "new_name": "Town Copy" } }
```

**EN:** "Rename map 2 in the map tree without changing its content."
**ES:** "Renombra el mapa 2 en el árbol sin cambiar su contenido."

```json
{ "action": "edit-info", "data": { "map_id": 2, "name": "Renamed", "parent_id": 0 } }
```

---

### Read and paint tiles

**EN:** "Read the top-left 10×10 tile region of map 1."
**ES:** "Lee la región de 10×10 tiles en la esquina superior izquierda del mapa 1."

```json
{ "action": "read-tiles", "data": { "map_id": 1, "x": 0, "y": 0, "width": 10, "height": 10 } }
```

**EN:** "Paint a single tile at (3, 3) on layer 0 of map 1."
**ES:** "Pinta un tile en (3, 3) en la capa 0 del mapa 1."

```json
{ "action": "paint-tiles", "data": { "map_id": 1, "tiles": [{ "x": 3, "y": 3, "layer": 0, "tile_id": 2816 }] } }
```

**EN:** "Fill the entire map 1 ground layer with tile 2816."
**ES:** "Rellena toda la capa de suelo del mapa 1 con el tile 2816."

```json
{ "action": "fill", "data": { "map_id": 1, "x": 0, "y": 0, "width": 20, "height": 15, "layer": 0, "tile_id": 2816 } }
```

---

### Create and edit map events

**EN:** "Create an NPC guard event at position (5, 5) on map 1."
**ES:** "Crea un evento de guardia NPC en la posición (5, 5) del mapa 1."

```json
{ "action": "create-event", "data": { "map_id": 1, "event_name": "Guard", "x": 5, "y": 5, "event_type": "npc" } }
```

**EN:** "Rename event 1 on map 1 to 'Inn Keeper' and move it to (3, 4)."
**ES:** "Renombra el evento 1 del mapa 1 a 'Posadero' y muévelo a (3, 4)."

```json
{ "action": "edit-event", "data": { "map_id": 1, "event_id": 1, "name": "Inn Keeper", "x": 3, "y": 4 } }
```

**EN:** "Delete event 3 from map 1."
**ES:** "Elimina el evento 3 del mapa 1."

```json
{ "action": "delete-event", "data": { "map_id": 1, "event_id": 3 } }
```

**EN:** "Add a new page to event 1 on map 1."
**ES:** "Añade una nueva página al evento 1 del mapa 1."

```json
{ "action": "edit-event-page", "data": { "map_id": 1, "event_id": 1, "mode": "add", "page": {} } }
```

---

### Troop events and tilesets

**EN:** "Replace all battle event pages for troop 1 / create a 'World Map' tileset / override tile flags / rename tileset 1."
**ES:** "Reemplaza páginas de eventos del grupo 1 / crea tileset 'Mapa Mundial' / sobreescribe flags / renombra tileset 1."

```json
{ "action": "edit-troop-events", "data": { "troop_id": 1, "mode": "replace_all", "pages": [] } }
```
```json
{ "action": "create-tileset", "data": { "name": "World Map" } }
```
```json
{ "action": "edit-tileset", "data": { "tileset_id": 1, "flag_overrides": [{ "tile_id": 2816, "flags": 0 }] } }
```
```json
{ "action": "edit-tileset-properties", "data": { "tileset_id": 1, "name": "Updated", "mode": 0 } }
```

---

## dialogue-tools

> Authors dialogue and cutscene content.
> All calls use `{ "action": "...", "data": { ...fields } }`.

---

### Add simple dialogue

**EN:** "Add an intro conversation between Hero and the Elder to a new event."
**ES:** "Añade una conversación de introducción entre el Héroe y el Anciano a un nuevo evento."

```json
{
  "action": "add",
  "data": {
    "dialogue_lines": [
      { "speaker": "Elder", "text": "The ancient evil has returned." },
      { "speaker": "Hero",  "text": "I'll stop it, no matter what!" }
    ],
    "event_name": "Intro"
  }
}
```

---

### Create advanced branching dialogue

**EN:** "Create a multi-branch dialogue with choices for the shop keeper."
**ES:** "Crea un diálogo de múltiples ramas con opciones para el tendero."

```json
{
  "action": "create-advanced",
  "data": {
    "dialogue_name": "Shop Talk",
    "dialogue_nodes": [
      { "id": 1, "speaker": "Merchant", "text": "What can I do for you?", "choices": ["Buy", "Sell", "Leave"] },
      { "id": 2, "speaker": "Hero", "text": "Just browsing, thanks.", "parent": 1, "choice_index": 2 }
    ]
  }
}
```

---

### Generate a story

**EN:** "Write a multi-scene story called 'The Lost Crown' and add it to the project."
**ES:** "Escribe una historia de varias escenas llamada 'La Corona Perdida' y añádela al proyecto."

```json
{
  "action": "generate-story",
  "data": {
    "story_title": "The Lost Crown",
    "story_description": "A young hero sets out to recover the stolen crown of the kingdom.",
    "scenes": ["Prologue", "Journey", "Climax", "Epilogue"]
  }
}
```

---

### Export and import dialogue

**EN:** "Export all dialogue from the project for review."
**ES:** "Exporta todos los diálogos del proyecto para revisarlos."

```json
{ "action": "export", "data": { "include_maps": true, "include_common_events": true } }
```

**EN:** "Import updated dialogue entries back into the project."
**ES:** "Importa las entradas de diálogo actualizadas de vuelta al proyecto."

```json
{ "action": "import", "data": { "entries": [], "confirm": true } }
```

---

## battle-sim

> Simulates battles using project data (no running game required).
> All calls use `{ "action": "...", "data": { ...fields } }`.

---

### Single encounter

**EN:** "Simulate one battle against troop 1 with the current party."
**ES:** "Simula un combate contra el grupo 1 con el grupo actual."

```json
{ "action": "encounter", "data": { "troop_id": 1 } }
```

**EN:** "Simulate a fight against 2 copies of enemy 3, all using Attack."
**ES:** "Simula un combate contra 2 copias del enemigo 3, todos usando Atacar."

```json
{
  "action": "encounter",
  "data": {
    "enemy_id": 3,
    "count": 2,
    "actions": [[{ "type": "attack" }]]
  }
}
```

---

### Battle suite (statistics)

**EN:** "Run 20 simulated battles against troop 1 and show me win/loss stats."
**ES:** "Ejecuta 20 combates simulados contra el grupo 1 y muéstrame estadísticas de victorias/derrotas."

```json
{ "action": "suite", "data": { "troop_id": 1, "runs": 20 } }
```

**EN:** "Run 50 simulations against enemy 5 starting at full HP and MP."
**ES:** "Ejecuta 50 simulaciones contra el enemigo 5 comenzando con HP y MP al máximo."

```json
{
  "action": "suite",
  "data": {
    "enemy_id": 5,
    "count": 1,
    "runs": 50,
    "party_state": { "hp_percent": 1.0, "mp_percent": 1.0 }
  }
}
```

---

## project-tools

> Project maintenance, bulk edits, and change history.
> All calls use `{ "action": "...", "data": { ...fields } }`.

---

### Validate the project

**EN:** "Validate actors and enemies and show warnings too."
**ES:** "Valida actores y enemigos e incluye también las advertencias."

```json
{ "action": "validate", "data": { "entity_types": ["Actor", "Enemy"], "include_warnings": true } }
```

---

### Cleanup orphaned data

**EN:** "Clean up unused or orphaned data in the project."
**ES:** "Limpia datos no utilizados u huérfanos del proyecto."

```json
{ "action": "cleanup", "data": {} }
```

---

### Find and replace text

**EN:** "Replace every occurrence of 'Old Name' with 'New Name' across the project."
**ES:** "Reemplaza todas las ocurrencias de 'Nombre Antiguo' por 'Nombre Nuevo' en todo el proyecto."

```json
{ "action": "find-replace", "data": { "search": "Old Name", "replace": "New Name", "confirm": true } }
```

---

### Bulk update, create, and delete

**EN:** "Set enemy 1's max HP to 500 and enemy 2's to 300 in one call."
**ES:** "Establece el HP máximo del enemigo 1 a 500 y el del enemigo 2 a 300 en una sola llamada."

```json
{
  "action": "batch-update",
  "data": {
    "entity_type": "Enemy",
    "updates": [
      { "id": 1, "data": { "max_hp": 500 } },
      { "id": 2, "data": { "max_hp": 300 } }
    ]
  }
}
```

**EN:** "Create a Health Potion and a Mana Potion in one call."
**ES:** "Crea una Poción de Salud y una Poción de Maná en una sola llamada."

```json
{
  "action": "batch-create",
  "data": {
    "entity_type": "Item",
    "entities": [
      { "name": "Health Potion" },
      { "name": "Mana Potion" }
    ]
  }
}
```

**EN:** "Delete items 5, 6, and 7."
**ES:** "Elimina los objetos 5, 6 y 7."

```json
{ "action": "batch-delete", "data": { "entity_type": "Item", "ids": [5, 6, 7], "confirm": true } }
```

---

### Change history

**EN:** "Show me the last 20 create operations from the change log."
**ES:** "Muéstrame las últimas 20 operaciones de creación del historial de cambios."

```json
{ "action": "history", "data": { "limit": 20, "action": "create" } }
```

---

## plugin-manage

> Manages plugins on **MZ/MV** or scripts on **VX Ace/VX/XP**.
> All calls use `{ "action": "...", "data": { ...fields } }`.

---

### Plugin operations (MZ/MV)

**EN:** "Create a new plugin called 'MyPlugin' using the simple-hook template."
**ES:** "Crea un nuevo plugin llamado 'MyPlugin' usando la plantilla simple-hook."

```json
{ "action": "create", "data": { "plugin_name": "MyPlugin", "code_type": "simple-hook" } }
```

**EN:** "List all plugins currently in the project."
**ES:** "Lista todos los plugins del proyecto."

```json
{ "action": "manage", "data": { "action": "list" } }
```

**EN:** "Enable the plugin 'YEP_CoreEngine'."
**ES:** "Activa el plugin 'YEP_CoreEngine'."

```json
{ "action": "manage", "data": { "action": "enable", "plugin_name": "YEP_CoreEngine" } }
```

**EN:** "Update YEP_CoreEngine parameters."
**ES:** "Actualiza los parámetros de YEP_CoreEngine."

```json
{ "action": "edit-parameters", "data": { "plugin_name": "YEP_CoreEngine", "parameters": { "Param": "value" } } }
```

**EN:** "Move MyPlugin to the top of the plugin list."
**ES:** "Mueve MyPlugin al principio de la lista de plugins."

```json
{ "action": "reorder", "data": { "plugin_name": "MyPlugin", "new_index": 0 } }
```

---

### Script operations (VX Ace / VX / XP only)

**EN:** "List all scripts in this VX Ace project."
**ES:** "Lista todos los scripts de este proyecto VX Ace."

```json
{ "action": "list-scripts", "data": {} }
```

**EN:** "Create a new Ruby module called 'CustomModule' in the scripts."
**ES:** "Crea un nuevo módulo Ruby llamado 'CustomModule' en los scripts."

```json
{
  "action": "create-script",
  "data": {
    "name": "CustomModule",
    "code": "module CustomModule\nend"
  }
}
```

---

## game-setup

> One-time project setup and game launching.
> Fields are at the **top level** — no `data` wrapper (except `launch`).

---

### Health check

**EN:** "Check that the server is configured correctly and can reach my project."
**ES:** "Comprueba que el servidor está configurado correctamente y puede acceder al proyecto."

```json
{ "action": "health-check" }
```

---

### Setup debug bridge

**EN:** "Install the debug plugin so I can control the game at runtime."
**ES:** "Instala el plugin de depuración para poder controlar el juego en tiempo de ejecución."

```json
{ "action": "setup-debug" }
```

---

### Launch game

**EN:** "Launch the game executable."
**ES:** "Lanza el ejecutable del juego."

```json
{ "action": "launch", "data": { "game_path": "C:/Games/MyGame/Game.exe" } }
```

---

## manage-backups

> Lists, restores, and prunes backup files.
> Fields are at the **top level** — no `data` wrapper.

---

### List backups

**EN:** "Show all backup files currently stored."
**ES:** "Muestra todos los archivos de copia de seguridad almacenados."

```json
{ "action": "list" }
```

**EN:** "Show only backups of Actors.json."
**ES:** "Muestra solo las copias de seguridad de Actors.json."

```json
{ "action": "list", "filename": "Actors.json" }
```

---

### Restore a backup

**EN:** "Restore Actors.json from the backup taken on 2025-01-01."
**ES:** "Restaura Actors.json desde la copia de seguridad del 2025-01-01."

```json
{
  "action": "restore",
  "filename": "Actors.json",
  "backup_name": "Actors_2025-01-01T00-00-00-000_0001.json"
}
```

---

### Prune old backups

**EN:** "Keep only the 5 most recent backups for every file."
**ES:** "Conserva solo las 5 copias de seguridad más recientes de cada archivo."

```json
{ "action": "prune", "max_count": 5 }
```

---

## batch-edit

> Escape hatch — calls multiple **internal** handlers in a single request.
> Use only when no single macro tool covers the operation.
> Pass internal tool names directly in the `operations` array.

---

**EN:** "Rename actor 1 to 'Aria' and update the Potion item description in one call."
**ES:** "Renombra al actor 1 como 'Aria' y actualiza la descripción del objeto Poción en una sola llamada."

```json
{
  "operations": [
    { "tool": "edit-actor", "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-item",  "input": { "item_id": 1, "description": "Restores 50 HP." } }
  ]
}
```

**EN:** "Create three new states at once: Poison, Blind, and Silence."
**ES:** "Crea tres nuevos estados de una vez: Veneno, Ceguera y Silencio."

```json
{
  "operations": [
    { "tool": "create-state", "input": { "name": "Poison"  } },
    { "tool": "create-state", "input": { "name": "Blind"   } },
    { "tool": "create-state", "input": { "name": "Silence" } }
  ]
}
```

> **Note:** nested `batch-edit` calls are rejected at runtime.
