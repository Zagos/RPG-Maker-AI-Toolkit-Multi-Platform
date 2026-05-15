# RPG Maker MCP — Usage Examples

> Natural-language prompts you can give an AI agent, plus JSON reference inputs for each tool.
> Spanish equivalents follow each English section.

---

## Navigation

- [Data & System](#data--system)
- [Characters & Enemies](#characters--enemies)
- [Drop Tables](#drop-tables)
- [Traits & Effects](#traits--effects)
- [Equipment & Items](#equipment--items)
- [Entity Creation](#entity-creation)
- [Skills](#skills)
- [Classes & Learnings](#classes--learnings)
- [States](#states)
- [Troops](#troops)
- [Common Events](#common-events)
- [Maps & Events](#maps--events)
- [Map Tile Painting](#map-tile-painting)
- [Vehicles](#vehicles)
- [Tilesets](#tilesets)
- [Animations](#animations)
- [Utility Tools](#utility-tools)
- [Plugins](#plugins)
- [Runtime Control](#runtime-control)
- [Backups & Batch](#backups--batch)

---

## Data & System

### `health-check`

**EN:** "Check that the MCP server is running and can find my project."
**ES:** "Comprueba que el servidor MCP está activo y puede encontrar mi proyecto."

```json
{}
```

---

### `list-game-data`

**EN:** "Show me a list of all actors in the game with their IDs."
**ES:** "Muéstrame la lista de todos los actores del juego con sus IDs."

```json
{ "data_type": "Actors" }
```

**EN:** "List all skills so I can see their IDs before editing them."
**ES:** "Lista todas las habilidades para ver sus IDs antes de editarlas."

```json
{ "data_type": "Skills" }
```

Types: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

---

### `list-maps`

**EN:** "Show me all the maps in the game sorted by their display order."
**ES:** "Muéstrame todos los mapas del juego ordenados por posición de visualización."

```json
{}
```

---

### `read-map`

**EN:** "Read map 5 so I can see its events, encounters, and settings."
**ES:** "Lee el mapa 5 para ver sus eventos, encuentros y configuración."

```json
{ "map_id": 5 }
```

---

### `read-entity`

**EN:** "Read the full data for Actor 3 so I can see all its current fields."
**ES:** "Lee los datos completos del Actor 3 para ver todos sus campos actuales."

```json
{ "entity_type": "Actor", "entity_id": 3 }
```

**EN:** "Show me everything about Skill 12 — cost, scope, damage formula."
**ES:** "Muéstrame todo sobre la Habilidad 12 — coste, alcance, fórmula de daño."

```json
{ "entity_type": "Skill", "entity_id": 12 }
```

---

### `get-change-history`

**EN:** "Show me the last 10 things the AI has changed in this project."
**ES:** "Muéstrame las últimas 10 cosas que la IA ha cambiado en este proyecto."

```json
{ "limit": 10 }
```

**EN:** "Show me all the actors that were created today."
**ES:** "Muéstrame todos los actores que se crearon hoy."

```json
{ "entity_type": "Actor", "action": "create", "since": "2025-01-01T00:00:00Z" }
```

---

### `edit-system`

**EN:** "Change the game title to 'Chronicles of Aria' and set the currency to 'Gil'."
**ES:** "Cambia el título del juego a 'Crónicas de Aria' y pon la moneda como 'Gil'."

```json
{ "game_title": "Chronicles of Aria", "currency_unit": "Gil" }
```

**EN:** "Set the starting party to actors 1, 2, and 3, starting on map 2 at position 8, 6."
**ES:** "Pon el grupo inicial con los actores 1, 2 y 3, empezando en el mapa 2 en la posición 8, 6."

```json
{ "initial_party": [1, 2, 3], "start_map_id": 2, "start_x": 8, "start_y": 6 }
```

**EN:** "Name switch 1 'Story Started', variable 1 'Gold Earned', and set the battle BGM to 'Battle1'."
**ES:** "Llama al switch 1 'Historia Iniciada', a la variable 1 'Oro Ganado', y pon la BGM de batalla a 'Battle1'."

```json
{
  "switch_names": { "1": "Story Started" },
  "variable_names": { "1": "Gold Earned" },
  "battle_bgm": { "name": "Battle1", "volume": 90, "pitch": 100 }
}
```

**EN:** "Rename 'HP' to 'Life', 'MP' to 'Mana', and change the Level label to 'Rank' in the UI."
**ES:** "Renombra 'HP' a 'Vida', 'MP' a 'Maná' y cambia la etiqueta de Nivel a 'Rango' en la interfaz."

```json
{
  "terms_basic": {
    "2": "Life",
    "3": "LF",
    "4": "Mana",
    "5": "MN",
    "0": "Rank",
    "1": "Rk"
  }
}
```

**EN:** "Rename the parameter stats: Max HP → 'Vitality', ATK → 'Power', MAT → 'Magic'."
**ES:** "Renombra las estadísticas: HP Máx → 'Vitalidad', ATK → 'Poder', MAT → 'Magia'."

```json
{
  "terms_params": { "0": "Vitality", "2": "Power", "4": "Magic" }
}
```

**EN:** "Change the battle command labels: 'Fight' → 'Attack', 'Guard' → 'Defend'."
**ES:** "Cambia las etiquetas de comandos de batalla: 'Luchar' → 'Atacar', 'Guardia' → 'Defender'."

```json
{
  "terms_commands": { "0": "Attack", "3": "Defend" }
}
```

---

### `read-system-extended`

**EN:** "Read all the extended system settings so I can see vehicles, terms, and sound effects."
**ES:** "Lee toda la configuración extendida del sistema: vehículos, términos y efectos de sonido."

```json
{ "section": "all" }
```

**EN:** "Show me just the vehicle settings from System.json."
**ES:** "Muéstrame solo la configuración de vehículos de System.json."

```json
{ "section": "vehicles" }
```

**EN:** "Read the term strings (like 'HP', 'MP', 'Level') to see what the game currently uses."
**ES:** "Lee los términos del juego (como 'HP', 'MP', 'Nivel') para ver qué usa actualmente."

```json
{ "section": "terms" }
```

---

### `list-resources`

**EN:** "Show me all character sprite sheets available in the project."
**ES:** "Muéstrame todas las hojas de sprites de personajes disponibles en el proyecto."

```json
{ "category": "characters" }
```

**EN:** "List all available BGM tracks I can use for maps."
**ES:** "Lista todas las pistas BGM disponibles para usar en los mapas."

```json
{ "category": "bgm" }
```

**EN:** "Show me every graphic and audio resource in the project."
**ES:** "Muéstrame todos los recursos gráficos y de audio del proyecto."

```json
{ "category": "all" }
```

Categories: `characters` `faces` `battlers` `sv_actors` `tilesets` `parallaxes` `pictures` `bgm` `bgs` `se` `me` `all`

---

### `delete-entity`

**EN:** "Delete the unused test actor (Actor 8) from the database."
**ES:** "Elimina el actor de prueba no utilizado (Actor 8) de la base de datos."

```json
{ "entity_type": "Actor", "entity_id": 8, "confirm": true }
```

**EN:** "Remove enemy 12 — it was a duplicate that I no longer need."
**ES:** "Elimina al enemigo 12 — era un duplicado que ya no necesito."

```json
{ "entity_type": "Enemy", "entity_id": 12, "confirm": true }
```

Types: `Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent`

---

## Characters & Enemies

### `edit-actor`

**EN:** "Rename Actor 1 to 'Aria', make her a mage (class 2), starting at level 5, max level 50."
**ES:** "Renombra al Actor 1 como 'Aria', hazla maga (clase 2), empezando al nivel 5, nivel máximo 50."

```json
{
  "actor_id": 1,
  "name": "Aria",
  "class_id": 2,
  "initial_level": 5,
  "max_level": 50
}
```

**EN:** "Set Actor 2's starting equipment to a longsword (weapon 3), chain mail (body 5), and no other gear."
**ES:** "Pon el equipo inicial del Actor 2 con una espada larga (arma 3), cota de malla (cuerpo 5), sin más equipo."

```json
{ "actor_id": 2, "equips": [3, 0, 0, 5, 0] }
```

**EN:** "Update Actor 1's battler sprite to 'Actor1' and give her a profile description."
**ES:** "Actualiza el sprite de batalla del Actor 1 a 'Actor1' y ponle una descripción de perfil."

```json
{
  "actor_id": 1,
  "battler_name": "Actor1",
  "profile": "A wandering mage searching for the lost tome of fire.",
  "note": "<traits>fire_affinity</traits>"
}
```

**EN:** "Create a new actor called 'Kira the Rogue' with class 4, face graphic 'Actor3' index 2."
**ES:** "Crea un nuevo actor llamado 'Kira la Ladrona' con clase 4, gráfico de cara 'Actor3' índice 2."

```json
{
  "name": "Kira the Rogue",
  "class_id": 4,
  "initial_level": 1,
  "max_level": 99,
  "face": { "name": "Actor3", "index": 2 },
  "character": { "name": "Actor3", "index": 2 }
}
```

---

### `edit-enemy`

**EN:** "Update the Slime (enemy 1) stats: 50 HP, 0 MP, 10 attack, 5 defense. Give it 20 EXP and 5 gold."
**ES:** "Actualiza las estadísticas del Slime (enemigo 1): 50 HP, 0 MP, 10 ataque, 5 defensa. Dale 20 EXP y 5 oro."

```json
{
  "enemy_id": 1,
  "name": "Slime",
  "exp": 20,
  "gold": 5,
  "max_hp": 50,
  "max_mp": 0,
  "attack": 10,
  "defense": 5
}
```

**EN:** "Set the Dragon boss (enemy 8) to use the 'Dragon' battler sprite with a red hue (hue 350)."
**ES:** "Pon al jefe Dragón (enemigo 8) con el sprite 'Dragon' y un tono rojizo (hue 350)."

```json
{ "enemy_id": 8, "battler_name": "Dragon", "battler_hue": 350 }
```

**EN:** "Give the Forest Goblin (enemy 3) a 1-in-4 chance to drop a Potion (item 1)."
**ES:** "Dale al Goblin del Bosque (enemigo 3) una probabilidad de 1 en 4 de soltar una Poción (ítem 1)."

```json
{
  "enemy_id": 3,
  "drops": [{ "kind": 1, "data_id": 1, "denominator": 4 }]
}
```

---

### `generate-character`

**EN:** "Generate a complete warrior character named 'Gareth' starting at level 5, with a backstory about a former knight."
**ES:** "Genera un personaje guerrero completo llamado 'Gareth' empezando en nivel 5, con una historia de fondo sobre un caballero retirado."

```json
{
  "name": "Gareth",
  "archetype": "warrior",
  "nickname": "Iron Guard",
  "initial_level": 5,
  "max_level": 99,
  "profile": "A former knight who turned his back on the kingdom to protect the common people."
}
```

**EN:** "Create a healer character called 'Lyra' with the healer archetype and assign her a specific face graphic."
**ES:** "Crea un personaje sanadora llamado 'Lyra' con el arquetipo de sanadora y asígnale un gráfico de cara específico."

```json
{
  "name": "Lyra",
  "archetype": "healer",
  "nickname": "Light Weaver",
  "face_name": "Actor2",
  "face_index": 3,
  "character_name": "Actor2",
  "character_index": 3
}
```

Archetypes: `warrior` `mage` `rogue` `healer` `paladin` `ranger`

---

### `edit-enemy-actions`

**EN:** "Set the Slime (enemy 1) to always use Attack (skill 1) with high priority."
**ES:** "Haz que el Slime (enemigo 1) siempre use Ataque (habilidad 1) con alta prioridad."

```json
{
  "enemy_id": 1,
  "mode": "replace",
  "actions": [
    {
      "skill_id": 1,
      "rating": 5,
      "condition_type": 0,
      "condition_param1": 0,
      "condition_param2": 0
    }
  ]
}
```

**EN:** "Configure the Dragon boss (enemy 8) with multiple conditional actions: normal attack always, fire breath when HP > 50%, and a desperate attack when HP ≤ 25%."
**ES:** "Configura al jefe Dragón (enemigo 8) con acciones condicionales: ataque normal siempre, aliento de fuego cuando HP > 50%, y ataque desesperado cuando HP ≤ 25%."

```json
{
  "enemy_id": 8,
  "mode": "replace",
  "actions": [
    {
      "skill_id": 1,
      "rating": 5,
      "condition_type": 0,
      "condition_param1": 0,
      "condition_param2": 0
    },
    {
      "skill_id": 10,
      "rating": 7,
      "condition_type": 2,
      "condition_param1": 50,
      "condition_param2": 0
    },
    {
      "skill_id": 15,
      "rating": 9,
      "condition_type": 2,
      "condition_param1": 25,
      "condition_param2": 0
    }
  ]
}
```

**EN:** "Add a healing skill (skill 5) to enemy 4 when its HP drops below 30%, without changing its other actions."
**ES:** "Añade una habilidad de curación (habilidad 5) al enemigo 4 cuando su HP baje del 30%, sin cambiar sus otras acciones."

```json
{
  "enemy_id": 4,
  "mode": "append",
  "actions": [
    {
      "skill_id": 5,
      "rating": 8,
      "condition_type": 2,
      "condition_param1": 30,
      "condition_param2": 0
    }
  ]
}
```

`condition_type`: `0`=always `1`=turn X/Y `2`=HP≤% `3`=MP≤% `4`=state `5`=party level≥ `6`=switch ON

---

## Drop Tables

### `edit-drop-items`

**EN:** "Set the Dark Knight (enemy 5) drops: guaranteed sword (weapon 2), 50% shield (armor 3), 25% Hi-Potion (item 5)."
**ES:** "Pon las recompensas del Caballero Oscuro (enemigo 5): espada garantizada (arma 2), escudo al 50% (armadura 3), Hi-Poción al 25% (ítem 5)."

```json
{
  "enemy_id": 5,
  "mode": "replace",
  "drops": [
    { "kind": 2, "data_id": 2, "denominator": 1 },
    { "kind": 3, "data_id": 3, "denominator": 2 },
    { "kind": 1, "data_id": 5, "denominator": 4 }
  ]
}
```

**EN:** "Add a rare 1-in-10 chance to get the Rare Gem (item 20) from enemy 7, keeping its existing drops."
**ES:** "Añade una rareza de 1 en 10 de obtener la Gema Rara (ítem 20) del enemigo 7, sin borrar sus drops existentes."

```json
{
  "enemy_id": 7,
  "mode": "append",
  "drops": [{ "kind": 1, "data_id": 20, "denominator": 10 }]
}
```

**EN:** "Clear all drop items from enemy 2."
**ES:** "Borra todos los drops del enemigo 2."

```json
{ "enemy_id": 2, "mode": "clear" }
```

---

## Traits & Effects

### `edit-traits`

**EN:** "Add fire element resistance (50%) to the Dragon enemy (enemy 8) and make it immune to poison (state 4)."
**ES:** "Añade resistencia al elemento fuego (50%) al enemigo Dragón (enemigo 8) y hazlo inmune al veneno (estado 4)."

```json
{
  "entity_type": "Enemy",
  "entity_id": 8,
  "mode": "replace",
  "traits": [
    { "code": 11, "data_id": 2, "value": 0.5 },
    { "code": 14, "data_id": 4, "value": 0 }
  ]
}
```

**EN:** "Give Actor 1 a trait that equips sword types (weapon type 1) and adds +10% ATK rate."
**ES:** "Dale al Actor 1 un rasgo que permita equipar espadas (tipo arma 1) y añada +10% de tasa de ATK."

```json
{
  "entity_type": "Actor",
  "entity_id": 1,
  "mode": "append",
  "traits": [
    { "code": 55, "data_id": 1, "value": 1 },
    { "code": 21, "data_id": 2, "value": 1.1 }
  ]
}
```

**EN:** "Clear all traits from armor 5 and start fresh."
**ES:** "Borra todos los rasgos de la armadura 5 y empieza desde cero."

```json
{ "entity_type": "Armor", "entity_id": 5, "mode": "clear" }
```

`entity_type`: `Actor` `Class` `Enemy` `Weapon` `Armor` `State`

---

### `edit-effects`

**EN:** "Set Potion (item 1) to restore 20% of max HP plus 50 flat HP."
**ES:** "Haz que la Poción (ítem 1) restaure el 20% del HP máximo más 50 HP fijo."

```json
{
  "entity_type": "Item",
  "entity_id": 1,
  "mode": "replace",
  "effects": [{ "code": 11, "data_id": 0, "value1": 0.2, "value2": 50 }]
}
```

**EN:** "Add an effect to Skill 10 (Thunder Blade) that inflicts the Paralysis state (state 6) with 30% chance."
**ES:** "Añade un efecto a la Habilidad 10 (Filo del Trueno) que aplique el estado Parálisis (estado 6) con un 30% de probabilidad."

```json
{
  "entity_type": "Skill",
  "entity_id": 10,
  "mode": "append",
  "effects": [{ "code": 21, "data_id": 6, "value1": 0.3, "value2": 0 }]
}
```

**EN:** "Replace the effects on item 5 so it fully restores both HP (100%) and MP (100%)."
**ES:** "Reemplaza los efectos del ítem 5 para que restaure completamente tanto HP (100%) como MP (100%)."

```json
{
  "entity_type": "Item",
  "entity_id": 5,
  "mode": "replace",
  "effects": [
    { "code": 11, "data_id": 0, "value1": 1.0, "value2": 0 },
    { "code": 12, "data_id": 0, "value1": 1.0, "value2": 0 }
  ]
}
```

`code 11`=recover HP `code 12`=recover MP `code 13`=gain TP `code 21`=add state `code 22`=remove state `code 31`=add buff `code 32`=add debuff

---

## Equipment & Items

### `edit-item`

**EN:** "Create a new item called 'Elixir' that restores 100% HP and MP to the whole party, costs 500 gold."
**ES:** "Crea un nuevo ítem llamado 'Elixir' que restaura 100% HP y MP a todo el grupo, cuesta 500 oro."

```json
{
  "name": "Elixir",
  "description": "Restores all HP and MP to the entire party.",
  "price": 500,
  "icon_index": 176,
  "scope": 2,
  "occasion": 0,
  "consumable": true
}
```

**EN:** "Update Potion (item 1): make it usable only in battle (occasion 1), set speed to 50, success rate to 100%."
**ES:** "Actualiza la Poción (ítem 1): úsala solo en batalla (ocasión 1), velocidad 50, tasa de éxito 100%."

```json
{
  "item_id": 1,
  "occasion": 1,
  "speed": 50,
  "success_rate": 100
}
```

**EN:** "Turn item 3 into a key item (itype_id 2) that is not consumed on use."
**ES:** "Convierte el ítem 3 en un ítem clave (itype_id 2) que no se consume al usarse."

```json
{ "item_id": 3, "itype_id": 2, "consumable": false }
```

**EN:** "Set the Bomb (item 8) to deal physical damage with animation 65, hit all enemies (scope 2), repeat 2 times."
**ES:** "Configura la Bomba (ítem 8) para causar daño físico con animación 65, golpear a todos los enemigos (scope 2), 2 repeticiones."

```json
{
  "item_id": 8,
  "scope": 2,
  "hit_type": 1,
  "animation_id": 65,
  "repeats": 2,
  "tp_gain": 5,
  "note": "<damage_type>physical</damage_type>"
}
```

---

### `edit-weapon`

**EN:** "Create a 'Flame Sword' with 45 attack, 5 magic attack bonus, animation 60, price 800."
**ES:** "Crea una 'Espada Llameante' con 45 de ataque, 5 de bono en ataque mágico, animación 60, precio 800."

```json
{
  "name": "Flame Sword",
  "wtype_id": 1,
  "price": 800,
  "icon_index": 97,
  "animation_id": 60,
  "attack": 45,
  "magic_attack": 5
}
```

---

### `edit-armor`

**EN:** "Create a 'Dragon Scale Armor' with 40 defense, 15 magic defense, type body armor (atype 4), price 1200."
**ES:** "Crea una 'Armadura de Escama de Dragón' con 40 defensa, 15 defensa mágica, tipo armadura de cuerpo (atype 4), precio 1200."

```json
{
  "name": "Dragon Scale Armor",
  "atype_id": 4,
  "price": 1200,
  "icon_index": 134,
  "defense": 40,
  "magic_defense": 15
}
```

**EN:** "Create a 'Tower Shield' that goes in the shield slot (etype 2), heavy armor type (atype 2), 30 defense."
**ES:** "Crea un 'Escudo Torre' que va en el slot de escudo (etype 2), tipo armadura pesada (atype 2), 30 defensa."

```json
{
  "name": "Tower Shield",
  "atype_id": 2,
  "etype_id": 2,
  "price": 800,
  "icon_index": 130,
  "defense": 30
}
```

---

## Entity Creation

### `create-actor`

**EN:** "Create a new hero character named 'Lyra', a mage (class 2), starting at level 5, max level 99."
**ES:** "Crea un nuevo héroe llamado 'Lyra', una maga (clase 2), que empieza en nivel 5, nivel máximo 99."

```json
{
  "name": "Lyra",
  "class_id": 2,
  "initial_level": 5,
  "max_level": 99,
  "nickname": "The Archmage",
  "character_name": "Actor2",
  "character_index": 0,
  "face_name": "Actor2",
  "face_index": 0
}
```

---

### `create-item`

**EN:** "Create a 'Phoenix Down' that revives a fallen ally (scope 9, one dead ally), price 500."
**ES:** "Crea un 'Ala de Fénix' que revive a un aliado caído (scope 9, un aliado muerto), precio 500."

```json
{
  "name": "Phoenix Down",
  "description": "Revives a fallen ally with 25% HP.",
  "price": 500,
  "icon_index": 176,
  "scope": 9,
  "occasion": 0,
  "consumable": true
}
```

---

### `create-weapon`

**EN:** "Create a 'Flame Sword', sword type (wtype 1), +30 ATK, price 600, animation 97."
**ES:** "Crea una 'Espada Llama', tipo espada (wtype 1), +30 ATK, precio 600, animación 97."

```json
{
  "name": "Flame Sword",
  "description": "A blade imbued with fire.",
  "wtype_id": 1,
  "price": 600,
  "icon_index": 96,
  "animation_id": 97,
  "attack": 30
}
```

---

### `create-armor`

**EN:** "Create 'Shadow Cloak', light armor (atype 1) in the body slot (etype 4), +20 AGI +10 DEF, price 450."
**ES:** "Crea 'Capa de Sombra', armadura ligera (atype 1) en el slot de cuerpo (etype 4), +20 AGI +10 DEF, precio 450."

```json
{
  "name": "Shadow Cloak",
  "description": "A cloak woven from darkness.",
  "atype_id": 1,
  "etype_id": 4,
  "price": 450,
  "icon_index": 132,
  "defense": 10,
  "agility": 20
}
```

---

### `create-skill`

**EN:** "Create 'Meteor Strike', costs 40 MP, hits all enemies, fire element, damage formula 'a.mat*6-b.mdf*2', animation 106."
**ES:** "Crea 'Golpe Meteoro', cuesta 40 PM, golpea a todos los enemigos, elemento fuego, fórmula 'a.mat*6-b.mdf*2', animación 106."

```json
{
  "name": "Meteor Strike",
  "description": "Calls meteors down on all enemies.",
  "mp_cost": 40,
  "scope": 2,
  "occasion": 1,
  "damage_type": 1,
  "damage_formula": "a.mat * 6 - b.mdf * 2",
  "damage_element_id": 2,
  "animation_id": 106
}
```

---

### `create-class`

**EN:** "Create a 'Paladin' class with a steady EXP curve (basis 45, extra 30) and learns Holy Strike (skill 12) at level 10."
**ES:** "Crea una clase 'Paladín' con una curva de EXP constante (base 45, extra 30) y aprende Golpe Sagrado (habilidad 12) al nivel 10."

```json
{
  "name": "Paladin",
  "exp_basis": 45,
  "exp_extra": 30,
  "learnings": [
    { "level": 10, "skill_id": 12 },
    { "level": 20, "skill_id": 15 }
  ]
}
```

---

### `create-state`

**EN:** "Create a 'Poisoned' state: priority 50, lasts 3–5 turns, removes at battle end, icon 36."
**ES:** "Crea un estado 'Envenenado': prioridad 50, dura 3–5 turnos, se elimina al final de la batalla, ícono 36."

```json
{
  "name": "Poisoned",
  "icon_index": 36,
  "priority": 50,
  "restriction": 0,
  "min_turns": 3,
  "max_turns": 5,
  "remove_at_battle_end": true
}
```

---

### `create-enemy`

**EN:** "Create a 'Shadow Wolf' enemy with 300 HP, 25 ATK, 10 DEF, drops a Wolf Fang (item 5, 1-in-4 chance)."
**ES:** "Crea un enemigo 'Lobo Sombrío' con 300 HP, 25 ATK, 10 DEF, suelta un Colmillo de Lobo (ítem 5, 1 de 4)."

```json
{
  "name": "Shadow Wolf",
  "battler_name": "Wolf",
  "max_hp": 300,
  "attack": 25,
  "defense": 10,
  "agility": 18,
  "exp": 80,
  "gold": 40
}
```

---

### `create-animation`

**EN:** "Create a new animation entry called 'Holy Burst' using the Holy Effekseer effect, centered on screen."
**ES:** "Crea una nueva entrada de animación llamada 'Explosión Sagrada' usando el efecto Effekseer Holy, centrada en pantalla."

```json
{
  "name": "Holy Burst",
  "effect_name": "Holy",
  "display_type": 1
}
```

---

## Skills

### `edit-skill`

**EN:** "Create a new fire skill 'Inferno' — costs 30 MP, hits all enemies (scope 2), damage formula 'a.mat*4 - b.mdf*2', element fire (element 2)."
**ES:** "Crea una nueva habilidad de fuego 'Infierno' — cuesta 30 PM, golpea a todos los enemigos (scope 2), fórmula de daño 'a.mat*4 - b.mdf*2', elemento fuego (elemento 2)."

```json
{
  "name": "Inferno",
  "description": "Engulfs all enemies in a sea of flames.",
  "mp_cost": 30,
  "scope": 2,
  "damage_type": 1,
  "damage_formula": "a.mat * 4 - b.mdf * 2",
  "damage_element_id": 2,
  "damage_critical": false,
  "animation_id": 98
}
```

**EN:** "Update Skill 5 so it requires a sword (weapon type 1) to use, and gains 10 TP on cast."
**ES:** "Actualiza la Habilidad 5 para que requiera una espada (tipo arma 1) para usarse, y gana 10 TP al lanzarla."

```json
{ "skill_id": 5, "required_wtype_id1": 1, "tp_gain": 10 }
```

**EN:** "Make Skill 8 repeat 3 times, add 20% variance to its damage, and change it to magical hit type."
**ES:** "Haz que la Habilidad 8 se repita 3 veces, añade 20% de varianza al daño y cámbiala a tipo de golpe mágico."

```json
{ "skill_id": 8, "repeats": 3, "damage_variance": 20, "hit_type": 2 }
```

**EN:** "Move Skill 12 to skill type 3 (Special) and add a note tag for my custom plugin."
**ES:** "Mueve la Habilidad 12 al tipo 3 (Especial) y añade una etiqueta de nota para mi plugin personalizado."

```json
{ "skill_id": 12, "stype_id": 3, "note": "<custom>boss_skill</custom>" }
```

---

## Classes & Learnings

### `edit-class`

**EN:** "Update Warrior (class 1) to use a faster EXP curve — set basis to 30, extra to 20."
**ES:** "Actualiza al Guerrero (clase 1) para que use una curva de EXP más rápida — pon la base en 30, extra en 20."

```json
{ "class_id": 1, "name": "Warrior", "exp_basis": 30, "exp_extra": 20 }
```

**EN:** "Set the Mage class (class 2) learning curve: Fire at level 1, Blizzard at level 10, Thunder at level 20."
**ES:** "Define la curva de aprendizaje de la clase Maga (clase 2): Fuego al nivel 1, Ventisca al nivel 10, Rayo al nivel 20."

```json
{
  "class_id": 2,
  "learnings_mode": "replace",
  "learnings": [
    { "level": 1, "skill_id": 3 },
    { "level": 10, "skill_id": 5 },
    { "level": 20, "skill_id": 7 }
  ]
}
```

**EN:** "Add a new skill to the Warrior at level 15 without changing the rest of the learning curve."
**ES:** "Añade una nueva habilidad al Guerrero al nivel 15 sin cambiar el resto de la curva de aprendizaje."

```json
{
  "class_id": 1,
  "learnings_mode": "append",
  "learnings": [{ "level": 15, "skill_id": 14 }]
}
```

---

### `edit-class-learnings`

**EN:** "Replace the entire skill learning curve of Class 3 (Ranger) with a new set."
**ES:** "Reemplaza la curva de aprendizaje completa de la Clase 3 (Ranger) con un nuevo conjunto."

```json
{
  "class_id": 3,
  "mode": "replace",
  "learnings": [
    { "level": 1, "skill_id": 2 },
    { "level": 5, "skill_id": 8 },
    { "level": 12, "skill_id": 15 },
    { "level": 25, "skill_id": 22 }
  ]
}
```

**EN:** "Add Double Shot (skill 18) to the Ranger at level 30, keeping all existing skills."
**ES:** "Añade Doble Disparo (habilidad 18) al Ranger al nivel 30, sin tocar las habilidades existentes."

```json
{
  "class_id": 3,
  "mode": "append",
  "learnings": [{ "level": 30, "skill_id": 18 }]
}
```

**EN:** "Remove all skills learned at level 5 from Class 3."
**ES:** "Quita todas las habilidades aprendidas al nivel 5 de la Clase 3."

```json
{ "class_id": 3, "mode": "remove_at_level", "level": 5 }
```

---

## States

### `edit-state`

**EN:** "Create a Poison state that removes itself by walking (50 steps), with overlay animation row 4."
**ES:** "Crea un estado Veneno que se elimine caminando (50 pasos), con la fila de animación de overlay 4."

```json
{
  "name": "Poison",
  "description": "Slowly losing HP with each step.",
  "icon_index": 32,
  "priority": 50,
  "restriction": 0,
  "overlay": 4,
  "remove_by_walking": true,
  "steps_to_remove": 50
}
```

**EN:** "Update the Sleep state (state 2) to show a sleeping motion (motion 6) and last 3–5 turns."
**ES:** "Actualiza el estado Sueño (estado 2) para mostrar la animación de sueño (motion 6) y durar 3–5 turnos."

```json
{
  "state_id": 2,
  "motion": 6,
  "min_turns": 3,
  "max_turns": 5,
  "note": "<sleep_immune_boss>false</sleep_immune_boss>"
}
```

**EN:** "Add a note tag to state 5 for my custom plugin, and update its description text."
**ES:** "Añade una etiqueta de nota al estado 5 para mi plugin personalizado y actualiza su texto de descripción."

```json
{
  "state_id": 5,
  "description": "Cannot act. Attack may miss.",
  "note": "<paralysis_immune>false</paralysis_immune>"
}
```

---

## Troops

### `create-troop`

**EN:** "Create a new battle formation called 'Forest Ambush' with 2 goblins and 1 wolf."
**ES:** "Crea una nueva formación de batalla llamada 'Emboscada del Bosque' con 2 goblins y 1 lobo."

```json
{
  "name": "Forest Ambush",
  "members": [{ "enemy_id": 3 }, { "enemy_id": 3 }, { "enemy_id": 6 }]
}
```

**EN:** "Create a boss fight called 'Dragon Lair' with the Dragon boss positioned in the center."
**ES:** "Crea una batalla de jefe llamada 'Guarida del Dragón' con el jefe Dragón posicionado en el centro."

```json
{
  "name": "Dragon Lair",
  "members": [{ "enemy_id": 8, "x": 400, "y": 280 }]
}
```

---

### `edit-troop`

**EN:** "Rename troop 3 to 'Elite Guard' and replace its members with 3 knights."
**ES:** "Renombra la tropa 3 a 'Guardia Élite' y reemplaza sus miembros con 3 caballeros."

```json
{
  "troop_id": 3,
  "name": "Elite Guard",
  "members": [{ "enemy_id": 12 }, { "enemy_id": 12 }, { "enemy_id": 12 }]
}
```

---

### `edit-troop-events`

**EN:** "Add a battle event to troop 2 that triggers once when turn 1 ends, showing a boss introduction message."
**ES:** "Añade un evento de batalla a la tropa 2 que se dispare una vez cuando termine el turno 1, mostrando un mensaje de introducción del jefe."

```json
{
  "troop_id": 2,
  "mode": "replace_all",
  "pages": [
    {
      "span": 0,
      "conditions": { "turnValid": true, "turnA": 0, "turnB": 1 },
      "commands": [
        {
          "type": "message",
          "data": {
            "text": "You dare challenge me? Prepare to face true power!",
            "speaker": "Dragon Lord"
          }
        }
      ]
    }
  ]
}
```

**EN:** "Add a battle event page to troop 5 that activates each turn when the boss HP drops to 50% or below."
**ES:** "Añade una página de evento de batalla a la tropa 5 que se active cada turno cuando el HP del jefe baje al 50% o menos."

```json
{
  "troop_id": 5,
  "mode": "append",
  "pages": [
    {
      "span": 1,
      "conditions": { "enemyValid": true, "enemyIndex": 0, "enemyHp": 50 },
      "commands": [
        {
          "type": "message",
          "data": { "text": "Now I get serious!", "speaker": "Boss" }
        },
        { "type": "common-event", "data": { "id": 10 } }
      ]
    }
  ]
}
```

`span`: `0`=once per battle `1`=once per turn `2`=each moment

---

## Common Events

### `create-common-event`

**EN:** "Create a common event called 'Heal Party' that restores all party HP — triggered by switch 5."
**ES:** "Crea un evento común llamado 'Curar Grupo' que restaura todo el HP del grupo — activado por el switch 5."

```json
{
  "name": "Heal Party",
  "trigger": 2,
  "switch_id": 5
}
```

---

### `edit-common-event`

**EN:** "Update common event 2 to trigger as autorun (trigger 1) when switch 3 is ON."
**ES:** "Actualiza el evento común 2 para que se ejecute automáticamente (trigger 1) cuando el switch 3 esté ON."

```json
{ "event_id": 2, "trigger": 1, "switch_id": 3 }
```

---

## Maps & Events

### `create-map`

**EN:** "Create a new 20×15 dungeon map called 'Dark Cave' using tileset 3, connected to the world map (parent 1)."
**ES:** "Crea un nuevo mapa de mazmorra 20×15 llamado 'Cueva Oscura' usando el tileset 3, conectado al mapa mundial (padre 1)."

```json
{
  "name": "Dark Cave",
  "width": 20,
  "height": 15,
  "tileset_id": 3,
  "parent_id": 1,
  "encounter_step": 30,
  "autoplay_bgm": true,
  "bgm_name": "Dungeon1"
}
```

---

### `edit-map`

**EN:** "Change map 3's background music to 'Field2' and set the encounter rate to every 40 steps."
**ES:** "Cambia la música de fondo del mapa 3 a 'Field2' y pon la tasa de encuentros a cada 40 pasos."

```json
{
  "map_id": 3,
  "autoplay_bgm": true,
  "bgm_name": "Field2",
  "encounter_step": 40
}
```

**EN:** "Add a random encounter with slimes (enemy 1, weight 10) and goblins (enemy 3, weight 5) to map 2."
**ES:** "Añade encuentros aleatorios con slimes (enemigo 1, peso 10) y goblins (enemigo 3, peso 5) al mapa 2."

```json
{
  "map_id": 2,
  "encounters": [
    { "enemy_id": 1, "weight": 10 },
    { "enemy_id": 3, "weight": 5 }
  ]
}
```

**EN:** "Set map 4 to scroll the parallax at speed 2 horizontally, disable dashing, and set the BGS to 'Waterfall' at volume 70."
**ES:** "Configura el mapa 4 para que el parallax se desplace a velocidad 2 horizontalmente, deshabilita el dash y pon el BGS a 'Waterfall' con volumen 70."

```json
{
  "map_id": 4,
  "parallax_sx": 2,
  "parallax_sy": 0,
  "disable_dashing": true,
  "autoplay_bgs": true,
  "bgs_name": "Waterfall",
  "bgs_volume": 70,
  "bgs_pitch": 100
}
```

---

### `edit-map-info`

**EN:** "Rename map 3 to 'Ancient Ruins' and move it under the World map (parent 1) in the tree."
**ES:** "Renombra el mapa 3 como 'Ruinas Antiguas' y muévelo bajo el mapa Mundo (padre 1) en el árbol."

```json
{ "map_id": 3, "name": "Ancient Ruins", "parent_id": 1 }
```

**EN:** "Reorder map 5 to position 10 in the map list without touching any map data."
**ES:** "Reordena el mapa 5 a la posición 10 en la lista de mapas sin tocar ningún dato del mapa."

```json
{ "map_id": 5, "order": 10 }
```

---

### `delete-map`

**EN:** "Delete map 7 — I'm sure I don't need it anymore."
**ES:** "Elimina el mapa 7 — estoy seguro de que ya no lo necesito."

```json
{ "map_id": 7, "confirm": true }
```

---

### `create-map-event`

**EN:** "Add an NPC called 'Merchant' on map 3 at position (10, 8) that says 'Welcome, traveler! What can I get you?'"
**ES:** "Añade un NPC llamado 'Comerciante' en el mapa 3 en la posición (10, 8) que diga '¡Bienvenido, viajero! ¿Qué necesitas?'"

```json
{
  "map_id": 3,
  "event_name": "Merchant",
  "x": 10,
  "y": 8,
  "event_type": "npc",
  "dialogue": ["Welcome, traveler! What can I get you?"]
}
```

**EN:** "Create a treasure chest on map 4 at (5, 3) containing a Flame Sword (weapon 7)."
**ES:** "Crea un cofre del tesoro en el mapa 4 en (5, 3) con una Espada Llameante (arma 7)."

```json
{
  "map_id": 4,
  "event_name": "Treasure Chest",
  "x": 5,
  "y": 3,
  "event_type": "chest",
  "treasure": { "type": "weapon", "id": 7 }
}
```

---

### `edit-map-event`

**EN:** "Move the shop event on map 2 to position (12, 6) and rename it 'Weapon Shop'."
**ES:** "Mueve el evento de tienda del mapa 2 a la posición (12, 6) y renómbralo 'Tienda de Armas'."

```json
{ "map_id": 2, "event_id": 4, "name": "Weapon Shop", "x": 12, "y": 6 }
```

**EN:** "Add a dialogue line to event 5 on map 3: the guard says 'The castle gates are closed tonight.'"
**ES:** "Añade una línea de diálogo al evento 5 del mapa 3: el guardia dice 'Las puertas del castillo están cerradas esta noche.'"

```json
{
  "map_id": 3,
  "event_id": 5,
  "append_commands": [
    {
      "type": "message",
      "data": {
        "text": "The castle gates are closed tonight.",
        "speaker": "Guard"
      }
    }
  ]
}
```

---

### `edit-event-page`

**EN:** "Add a second page to event 3 on map 2 that activates when switch 5 is ON, showing a different NPC dialogue."
**ES:** "Añade una segunda página al evento 3 del mapa 2 que se active cuando el switch 5 esté ON, mostrando un diálogo diferente del NPC."

```json
{
  "map_id": 2,
  "event_id": 3,
  "mode": "add",
  "page": {
    "trigger": 0,
    "conditions": { "switch1Valid": true, "switch1Id": 5 },
    "commands": [
      {
        "type": "message",
        "data": {
          "text": "The hero has returned! The kingdom is saved!",
          "speaker": "Villager"
        }
      }
    ]
  }
}
```

**EN:** "Replace page 0 of event 7 on map 4 with a new autorun page that triggers a common event on load."
**ES:** "Reemplaza la página 0 del evento 7 del mapa 4 con una nueva página de autorun que dispare un evento común al cargar."

```json
{
  "map_id": 4,
  "event_id": 7,
  "mode": "replace",
  "page_index": 0,
  "page": {
    "trigger": 3,
    "priority_type": 0,
    "commands": [
      { "type": "common-event", "data": { "id": 5 } },
      { "type": "switch", "data": { "id": 10, "value": true } }
    ]
  }
}
```

**EN:** "Remove page 1 from event 5 on map 3 — we no longer need the conditional behaviour."
**ES:** "Elimina la página 1 del evento 5 del mapa 3 — ya no necesitamos el comportamiento condicional."

```json
{ "map_id": 3, "event_id": 5, "mode": "remove", "page_index": 1 }
```

`trigger`: `0`=action button `1`=player touch `2`=event touch `3`=autorun `4`=parallel

---

### `delete-map-event`

**EN:** "Remove the old placeholder event (event 12) from map 5."
**ES:** "Elimina el evento de marcador antiguo (evento 12) del mapa 5."

```json
{ "map_id": 5, "event_id": 12 }
```

---

### `add-dialogue`

**EN:** "Add a conversation to the Innkeeper event where she asks if the player wants to rest, then says good night."
**ES:** "Añade una conversación al evento de la Posadera donde pregunta si el jugador quiere descansar y luego dice buenas noches."

```json
{
  "event_name": "Innkeeper",
  "dialogue_lines": [
    {
      "speaker": "Innkeeper",
      "text": "Would you like to rest? It'll cost you 10 gold."
    },
    { "speaker": "Innkeeper", "text": "Sleep well, traveler. Good night!" }
  ]
}
```

---

### `create-dialogue-advanced`

**EN:** "Create a branching conversation called 'Merchant Negotiation' where the player can accept or reject an offer, with different outcomes."
**ES:** "Crea una conversación con ramas llamada 'Negociación del Mercader' donde el jugador puede aceptar o rechazar una oferta, con resultados distintos."

```json
{
  "dialogue_name": "Merchant Negotiation",
  "dialogue_nodes": [
    {
      "id": "start",
      "type": "message",
      "speaker": "Merchant",
      "text": "I'll sell you this rare gem for 500 gold. Deal?",
      "next": "choice"
    },
    {
      "id": "choice",
      "type": "choice",
      "choices": ["Accept", "Decline"],
      "branches": { "Accept": "accept", "Decline": "decline" }
    },
    {
      "id": "accept",
      "type": "message",
      "speaker": "Merchant",
      "text": "Pleasure doing business with you!"
    },
    {
      "id": "decline",
      "type": "message",
      "speaker": "Merchant",
      "text": "Perhaps another time then."
    }
  ]
}
```

---

### `story-generator`

**EN:** "Generate a 3-scene story about a hero who finds a magic sword, defeats a monster, and saves a village."
**ES:** "Genera una historia de 3 escenas sobre un héroe que encuentra una espada mágica, derrota a un monstruo y salva un pueblo."

```json
{
  "story_title": "The Sword of Dawn",
  "story_description": "A hero discovers a legendary sword and uses it to protect the innocent.",
  "scenes": [
    {
      "scene_name": "The Discovery",
      "map_id": 4,
      "description": "Hero finds the ancient sword in a cave."
    },
    {
      "scene_name": "The Battle",
      "map_id": 4,
      "description": "Hero defeats the cave monster."
    },
    {
      "scene_name": "The Return",
      "map_id": 1,
      "description": "Hero returns to the village as a savior."
    }
  ]
}
```

---

## Map Tile Painting

### `read-map-tiles`

**EN:** "Read the tile data for the top-left 10×10 region of map 3."
**ES:** "Lee los datos de tiles de la región de 10×10 en la esquina superior izquierda del mapa 3."

```json
{ "map_id": 3, "x": 0, "y": 0, "width": 10, "height": 10 }
```

**EN:** "Read only the region layer (layer 5) of the entire map 2 to see terrain tag assignments."
**ES:** "Lee solo la capa de región (capa 5) del mapa 2 completo para ver las asignaciones de tags de terreno."

```json
{ "map_id": 2, "layers": [5] }
```

**EN:** "Get all tile data from map 5 including every layer."
**ES:** "Obtén todos los datos de tiles del mapa 5 incluyendo todas las capas."

```json
{ "map_id": 5 }
```

---

### `paint-map-tiles`

**EN:** "Paint individual tiles on map 3: place wall tile 2624 at (5,3) on layer 0, and a door at (5,4) on layer 1."
**ES:** "Pinta tiles individuales en el mapa 3: coloca el tile de pared 2624 en (5,3) en la capa 0, y una puerta en (5,4) en la capa 1."

```json
{
  "map_id": 3,
  "tiles": [
    { "x": 5, "y": 3, "layer": 0, "tile_id": 2624 },
    { "x": 5, "y": 4, "layer": 1, "tile_id": 2720 }
  ]
}
```

**EN:** "Assign region ID 5 to the tile at position (10, 8) on map 2."
**ES:** "Asigna el ID de región 5 al tile en la posición (10, 8) del mapa 2."

```json
{
  "map_id": 2,
  "tiles": [{ "x": 10, "y": 8, "layer": 5, "tile_id": 5 }]
}
```

`layer`: `0-3`=tile layers `4`=shadow `5`=region

---

### `fill-map-region`

**EN:** "Fill a 5×5 area starting at (0, 0) on map 4 with floor tile 2816 on layer 0."
**ES:** "Rellena un área de 5×5 empezando en (0, 0) del mapa 4 con el tile de suelo 2816 en la capa 0."

```json
{
  "map_id": 4,
  "x": 0,
  "y": 0,
  "width": 5,
  "height": 5,
  "layer": 0,
  "tile_id": 2816
}
```

**EN:** "Clear the shadow layer in a 3×3 block at position (4, 2) on map 1."
**ES:** "Limpia la capa de sombra en un bloque 3×3 en la posición (4, 2) del mapa 1."

```json
{
  "map_id": 1,
  "x": 4,
  "y": 2,
  "width": 3,
  "height": 3,
  "layer": 4,
  "tile_id": 0
}
```

---

### `paint-map-region`

**EN:** "Paint a 10×5 rectangular area on map 2 with tile 2624 on layer 0 (solid fill)."
**ES:** "Pinta un área rectangular de 10×5 en el mapa 2 con el tile 2624 en la capa 0 (relleno sólido)."

```json
{
  "map_id": 2,
  "layer": 0,
  "x": 5,
  "y": 3,
  "width": 10,
  "height": 5,
  "tile_id": 2624
}
```

**EN:** "Paint a custom tile pattern on map 3 using a flat row-major tile array for a 3×2 region."
**ES:** "Pinta un patrón de tiles personalizado en el mapa 3 usando un array plano de tiles para una región de 3×2."

```json
{
  "map_id": 3,
  "layer": 0,
  "x": 2,
  "y": 4,
  "width": 3,
  "height": 2,
  "tiles": [2816, 2816, 2624, 2624, 2816, 2816]
}
```

---

## Vehicles

### `edit-vehicle`

**EN:** "Change the airship sprite to 'Airship2' index 0, and move its starting position to map 10 at (15, 8)."
**ES:** "Cambia el sprite de la aeronave a 'Airship2' índice 0, y pon su posición inicial en el mapa 10 en (15, 8)."

```json
{
  "vehicle": "airship",
  "character_name": "Airship2",
  "character_index": 0,
  "start_map_id": 10,
  "start_x": 15,
  "start_y": 8
}
```

**EN:** "Set the ship's background music to 'Ship' at 80% volume, and change the boat sprite to 'Boat2'."
**ES:** "Pon la música de fondo del barco a 'Ship' al 80% de volumen, y cambia el sprite del bote a 'Boat2'."

```json
{
  "vehicle": "ship",
  "bgm": { "name": "Ship", "volume": 80, "pitch": 100, "pan": 0 }
}
```

```json
{
  "vehicle": "boat",
  "character_name": "Boat2",
  "character_index": 0
}
```

**EN:** "Move the boat's starting position to map 3 at coordinates (5, 10)."
**ES:** "Mueve la posición inicial del bote al mapa 3 en las coordenadas (5, 10)."

```json
{ "vehicle": "boat", "start_map_id": 3, "start_x": 5, "start_y": 10 }
```

---

## Tilesets

### `read-tileset`

**EN:** "Read the settings for tileset 2 to see its graphic files and flag configuration."
**ES:** "Lee la configuración del tileset 2 para ver sus archivos gráficos y la configuración de flags."

```json
{ "tileset_id": 2 }
```

**EN:** "List all tilesets in the project with their names and IDs."
**ES:** "Lista todos los tilesets del proyecto con sus nombres e IDs."

```json
{}
```

**EN:** "Read tileset 3 including its full flags array so I can inspect passability settings."
**ES:** "Lee el tileset 3 incluyendo su array completo de flags para inspeccionar la configuración de paso."

```json
{ "tileset_id": 3, "include_flags": true }
```

---

### `create-tileset`

**EN:** "Create a new dungeon tileset called 'Underground Cave' using the Dungeon tileset graphics."
**ES:** "Crea un nuevo tileset de mazmorra llamado 'Cueva Subterránea' usando los gráficos de tileset de Dungeon."

```json
{
  "name": "Underground Cave",
  "mode": 1,
  "tilesetNames": [
    "TileA1",
    "TileA2",
    "TileA3",
    "TileA4",
    "TileA5",
    "Dungeon",
    "Dungeon",
    "",
    ""
  ]
}
```

**EN:** "Create a world map tileset called 'Overworld' with world mode and the World tileset graphics."
**ES:** "Crea un tileset de mapa mundial llamado 'Mundo' con modo world y los gráficos del tileset World."

```json
{
  "name": "Overworld",
  "mode": 0,
  "tilesetNames": [
    "TileA1",
    "TileA2",
    "TileA3",
    "TileA4",
    "TileA5",
    "World",
    "",
    "",
    ""
  ]
}
```

---

### `edit-tileset-properties`

**EN:** "Rename tileset 2 to 'Snow Fields' and switch it to world map mode."
**ES:** "Renombra el tileset 2 a 'Campos de Nieve' y cámbialo a modo mapa mundial."

```json
{ "tileset_id": 2, "name": "Snow Fields", "mode": 0 }
```

**EN:** "Update tileset 3 to use a new set of graphic files for all 9 slots."
**ES:** "Actualiza el tileset 3 para que use nuevos archivos gráficos en los 9 slots."

```json
{
  "tileset_id": 3,
  "tilesetNames": [
    "TileA1",
    "TileA2",
    "TileA3",
    "TileA4",
    "TileA5",
    "Inside_A",
    "Inside_B",
    "Inside_C",
    ""
  ]
}
```

---

### `edit-tileset`

**EN:** "In tileset 1, make tile 48 passable and tile 50 impassable. Set tile 64 to terrain tag 3."
**ES:** "En el tileset 1, haz el tile 48 transitable y el tile 50 no transitable. Asigna el tile 64 al tag de terreno 3."

```json
{
  "tileset_id": 1,
  "flag_overrides": [
    { "tile_id": 48, "passable": true },
    { "tile_id": 50, "passable": false },
    { "tile_id": 64, "terrain_tag": 3 }
  ]
}
```

---

## Animations

### `read-animation`

**EN:** "Read all animations in the project to see their names and IDs."
**ES:** "Lee todas las animaciones del proyecto para ver sus nombres e IDs."

```json
{}
```

**EN:** "Read the full details of animation 65 to inspect its effect file and display settings."
**ES:** "Lee los detalles completos de la animación 65 para inspeccionar su archivo de efecto y configuración de visualización."

```json
{ "animation_id": 65 }
```

---

### `edit-animation`

**EN:** "Update animation 10 to use the 'Fire_01' Effekseer effect and display it centered on the target."
**ES:** "Actualiza la animación 10 para que use el efecto Effekseer 'Fire_01' y se muestre centrada en el objetivo."

```json
{ "animation_id": 10, "effect_name": "Fire_01", "display_type": 1 }
```

**EN:** "Rename animation 20 to 'Thunder Blast' and set its playback speed to 120%."
**ES:** "Renombra la animación 20 a 'Rayo Explosivo' y pon su velocidad de reproducción al 120%."

```json
{ "animation_id": 20, "name": "Thunder Blast", "speed": 120 }
```

**EN:** "Offset animation 5 by 16 pixels up so it aligns correctly with the character's head."
**ES:** "Desplaza la animación 5 16 píxeles hacia arriba para que se alinee correctamente con la cabeza del personaje."

```json
{ "animation_id": 5, "offset_x": 0, "offset_y": -16 }
```

`display_type`: `0`=on target head `1`=on target center `2`=full screen `-1`=front

---

## Utility Tools

### `search-entity`

**EN:** "Find all skills that have 'fire' in their name."
**ES:** "Encuentra todas las habilidades que tengan 'fire' en el nombre."

```json
{ "entity_type": "Skill", "query": "fire" }
```

**EN:** "Search for any troop named 'cave' or 'dungeon'."
**ES:** "Busca cualquier grupo de enemigos con 'cave' o 'dungeon' en el nombre."

```json
{ "entity_type": "Troop", "query": "cave" }
```

Types: `Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent` `Animation`

---

### `duplicate-entity`

**EN:** "Clone Actor 1 and call the copy 'Aria (Clone)' so I can modify the copy without touching the original."
**ES:** "Clona al Actor 1 y llama a la copia 'Aria (Clon)' para poder modificarla sin tocar el original."

```json
{ "entity_type": "Actor", "entity_id": 1, "new_name": "Aria (Clone)" }
```

**EN:** "Duplicate Skill 5 and rename the copy 'Fire II' as a base for my upgraded skill."
**ES:** "Duplica la Habilidad 5 y renombra la copia 'Fuego II' como base para mi habilidad mejorada."

```json
{ "entity_type": "Skill", "entity_id": 5, "new_name": "Fire II" }
```

---

### `export-project-summary`

**EN:** "Give me a quick overview of the whole project — how many actors, enemies, maps, skills, and whether switches/variables are named."
**ES:** "Dame un resumen rápido de todo el proyecto — cuántos actores, enemigos, mapas, habilidades, y si los switches/variables tienen nombre."

```json
{}
```

---

## Plugins

### `create-plugin`

**EN:** "Create a basic empty plugin called 'QuestTracker' with my name as author."
**ES:** "Crea un plugin básico vacío llamado 'QuestTracker' con mi nombre como autor."

```json
{
  "plugin_name": "QuestTracker",
  "description": "Tracks active and completed quests.",
  "author": "Zagos",
  "version": "1.0.0",
  "code_type": "empty"
}
```

**EN:** "Create a plugin called 'SkillModifier' using the skill-modifier template."
**ES:** "Crea un plugin llamado 'SkillModifier' usando la plantilla de modificador de habilidades."

```json
{
  "plugin_name": "SkillModifier",
  "description": "Modifies skill costs based on equipment.",
  "author": "Zagos",
  "version": "1.0.0",
  "code_type": "skill-modifier"
}
```

---

### `create-plugin-advanced`

**EN:** "Create an advanced plugin called 'ActorEnhancer' using the game-actor template."
**ES:** "Crea un plugin avanzado llamado 'ActorEnhancer' usando la plantilla game-actor."

```json
{
  "plugin_name": "ActorEnhancer",
  "template_type": "game-actor"
}
```

---

### `setup-debug-plugin`

**EN:** "Install the runtime debug plugin so the AI can control the running game."
**ES:** "Instala el plugin de debug en tiempo real para que la IA pueda controlar el juego en ejecución."

```json
{}
```

---

### `manage-plugins`

**EN:** "List all the plugins currently registered in the game."
**ES:** "Lista todos los plugins actualmente registrados en el juego."

```json
{ "action": "list" }
```

**EN:** "Enable the YEP_BattleEngineCore plugin."
**ES:** "Activa el plugin YEP_BattleEngineCore."

```json
{ "action": "enable", "plugin_name": "YEP_BattleEngineCore" }
```

**EN:** "Delete the old TestPlugin — I don't need it anymore."
**ES:** "Elimina el viejo TestPlugin — ya no lo necesito."

```json
{ "action": "delete", "plugin_name": "TestPlugin" }
```

---

### `edit-plugin-parameters`

**EN:** "Update the YEP_BattleEngineCore plugin to enable the front-view battle system."
**ES:** "Actualiza el plugin YEP_BattleEngineCore para activar el sistema de batalla en vista frontal."

```json
{
  "plugin_name": "YEP_BattleEngineCore",
  "parameters": { "Front View UI": "true" }
}
```

**EN:** "Set the starting gold amount in the RMMZ_Core plugin parameters."
**ES:** "Establece la cantidad de oro inicial en los parámetros del plugin RMMZ_Core."

```json
{
  "plugin_name": "RMMZ_Core",
  "parameters": { "Starting Gold": "500" }
}
```

---

## Runtime Control

> All tools in this section require the game to be running with `setup-debug-plugin` installed and enabled.

### `launch-game`

**EN:** "Launch the game so I can start testing."
**ES:** "Lanza el juego para empezar a probar."

```json
{}
```

---

### `get-game-state`

**EN:** "Read the current game state — where is the player and how is the party doing?"
**ES:** "Lee el estado actual del juego — ¿dónde está el jugador y cómo está el grupo?"

```json
{}
```

---

### `get-switch`

**EN:** "Check if switch 5 (Story Started) is currently ON or OFF."
**ES:** "Comprueba si el switch 5 (Historia Iniciada) está actualmente ON u OFF."

```json
{ "id": 5 }
```

**EN:** "Read the value of switch 12 to see if the boss has been defeated."
**ES:** "Lee el valor del switch 12 para saber si el jefe ha sido derrotado."

```json
{ "id": 12 }
```

---

### `get-variable`

**EN:** "Read variable 1 to see how much gold the player has earned."
**ES:** "Lee la variable 1 para ver cuánto oro ha ganado el jugador."

```json
{ "id": 1 }
```

**EN:** "Check variable 7 (Quest Stage) to see what stage of the quest the player is on."
**ES:** "Comprueba la variable 7 (Etapa de Misión) para ver en qué etapa de la misión está el jugador."

```json
{ "id": 7 }
```

---

### `set-switch`

**EN:** "Turn switch 5 ON to trigger the story event."
**ES:** "Activa el switch 5 para disparar el evento de historia."

```json
{ "id": 5, "value": true }
```

---

### `set-variable`

**EN:** "Set variable 3 to 100 to simulate the player having 100 reputation points."
**ES:** "Pon la variable 3 a 100 para simular que el jugador tiene 100 puntos de reputación."

```json
{ "id": 3, "value": 100 }
```

---

### `get-inventory`

**EN:** "Show me everything in the party's inventory right now."
**ES:** "Muéstrame todo lo que hay en el inventario del grupo ahora mismo."

```json
{ "category": "all" }
```

**EN:** "List only the weapons the party currently has."
**ES:** "Lista solo las armas que tiene el grupo actualmente."

```json
{ "category": "weapons" }
```

**EN:** "Check the party's item stock before running the combat test."
**ES:** "Comprueba el inventario de ítems del grupo antes de ejecutar el test de combate."

```json
{ "category": "items" }
```

---

### `modify-inventory`

**EN:** "Give the party 5 Hi-Potions (item 5) and 1000 gold for testing."
**ES:** "Dale al grupo 5 Super Pociones (ítem 5) y 1000 de oro para probar."

```json
{
  "operations": [
    { "action": "add", "type": "item", "id": 5, "amount": 5 },
    { "action": "add", "type": "gold", "amount": 1000 }
  ]
}
```

**EN:** "Remove the Iron Sword (weapon 1) from the party and add the Flame Sword (weapon 7) instead."
**ES:** "Quita la Espada de Hierro (arma 1) del grupo y añade la Espada Llameante (arma 7) en su lugar."

```json
{
  "operations": [
    { "action": "remove", "type": "weapon", "id": 1, "amount": 1 },
    { "action": "add", "type": "weapon", "id": 7, "amount": 1 }
  ]
}
```

**EN:** "Clear the party's gold down to zero for a poverty playthrough test."
**ES:** "Pon el oro del grupo a cero para un test de modo pobreza."

```json
{
  "operations": [{ "action": "remove", "type": "gold", "amount": 99999 }]
}
```

---

### `call-common-event`

**EN:** "Trigger common event 3 (Heal Party) right now while the game is running."
**ES:** "Dispara el evento común 3 (Curar Grupo) ahora mismo mientras el juego está en ejecución."

```json
{ "common_event_id": 3 }
```

**EN:** "Fire the 'Boss Intro' common event (event 8) to play the cutscene."
**ES:** "Lanza el evento común 'Intro del Jefe' (evento 8) para reproducir la cinemática."

```json
{ "common_event_id": 8 }
```

---

### `modify-actor-runtime`

**EN:** "Set Actor 1's level to 50 for a high-level combat test."
**ES:** "Pon el nivel del Actor 1 a 50 para un test de combate de alto nivel."

```json
{
  "actor_id": 1,
  "operations": [{ "field": "level", "mode": "set", "value": 50 }]
}
```

**EN:** "Add 1000 EXP to Actor 2 and set their HP to full."
**ES:** "Añade 1000 EXP al Actor 2 y ponle el HP al máximo."

```json
{
  "actor_id": 2,
  "operations": [
    { "field": "exp", "mode": "add", "value": 1000 },
    { "field": "hp", "mode": "set", "value": 9999 }
  ]
}
```

**EN:** "Set Actor 1 to critical HP (1 HP) and max TP (100) to test limit break behavior."
**ES:** "Pon al Actor 1 con HP crítico (1 HP) y TP máximo (100) para probar el comportamiento del límite máximo."

```json
{
  "actor_id": 1,
  "operations": [
    { "field": "hp", "mode": "set", "value": 1 },
    { "field": "tp", "mode": "set", "value": 100 }
  ]
}
```

---

### `teleport-player`

**EN:** "Teleport the player to map 5 at position (10, 8), facing south."
**ES:** "Teleporta al jugador al mapa 5 en la posición (10, 8), mirando al sur."

```json
{ "map_id": 5, "x": 10, "y": 8, "direction": 2 }
```

---

### `set-party-state`

**EN:** "Set Actor 1's HP to 30% and add the Poison status effect for testing."
**ES:** "Pon el HP del Actor 1 al 30% y aplícale el estado Veneno para probar."

```json
{ "actor_id": 1, "hp_percent": 30, "add_states": [4] }
```

**EN:** "Restore the full party to 100% HP and MP, and remove all status effects."
**ES:** "Restaura todo el grupo al 100% de HP y MP, y quita todos los estados."

```json
{ "hp_percent": 100, "mp_percent": 100, "remove_all_states": true }
```

---

### `save-game`

**EN:** "Save the current game state to slot 98 so we can restore it after testing."
**ES:** "Guarda el estado actual del juego en el slot 98 para poder restaurarlo después de las pruebas."

```json
{ "slot": 98 }
```

---

### `load-game`

**EN:** "Load the save from slot 98 to restore the pre-test game state."
**ES:** "Carga la partida del slot 98 para restaurar el estado del juego antes del test."

```json
{ "slot": 98 }
```

---

### `start-encounter`

**EN:** "Start a battle against troop 4 and let the AI play it out automatically."
**ES:** "Inicia una batalla contra la tropa 4 y deja que la IA la juegue automáticamente."

```json
{ "troop_id": 4 }
```

**EN:** "Trigger a battle with 3 goblins and script the first turn: actor 1 attacks, actor 2 uses skill 5."
**ES:** "Inicia una batalla con 3 goblins y programa el primer turno: el actor 1 ataca, el actor 2 usa la habilidad 5."

```json
{
  "enemy_id": 3,
  "count": 3,
  "actions": [
    { "actor_id": 1, "action": "attack" },
    { "actor_id": 2, "action": "skill", "skill_id": 5 }
  ]
}
```

---

### `run-battle-suite`

**EN:** "Run the same battle against the Forest Ambush troop 20 times and show me the win rate and average HP."
**ES:** "Ejecuta la misma batalla contra la tropa de Emboscada del Bosque 20 veces y muéstrame el porcentaje de victorias y el HP medio."

```json
{ "troop_id": 2, "iterations": 20 }
```

---

### `execute-script`

**EN:** "Run a custom JavaScript snippet in the game: show a balloon icon above the player."
**ES:** "Ejecuta un fragmento de JavaScript personalizado en el juego: muestra un globo de icono sobre el jugador."

```json
{ "code": "$gameMap.event(1).requestBalloon(1)" }
```

**EN:** "Check the current map ID by running a script."
**ES:** "Comprueba el ID del mapa actual ejecutando un script."

```json
{ "code": "$gameMap.mapId()" }
```

---

### `show-message`

**EN:** "Show a debug message in the game: 'Test checkpoint reached.'"
**ES:** "Muestra un mensaje de debug en el juego: 'Punto de prueba alcanzado.'"

```json
{ "text": "Test checkpoint reached.", "speaker": "System" }
```

---

### `get-actor-runtime`

**EN:** "Read Actor 1's current live stats: HP, MP, level, states, and skills."
**ES:** "Lee las estadísticas actuales en vivo del Actor 1: HP, MP, nivel, estados y habilidades."

```json
{ "actor_id": 1 }
```

---

### `manage-party-runtime`

**EN:** "Check who is currently in the party."
**ES:** "Comprueba quién está actualmente en el grupo."

```json
{ "action": "get" }
```

**EN:** "Add Actor 3 to the party right now while the game is running."
**ES:** "Añade al Actor 3 al grupo ahora mismo con el juego en ejecución."

```json
{ "action": "add", "actor_id": 3 }
```

**EN:** "Remove Actor 2 from the party temporarily for a scene."
**ES:** "Elimina al Actor 2 del grupo temporalmente para una escena."

```json
{ "action": "remove", "actor_id": 2 }
```

---

### `control-weather-runtime`

**EN:** "Start a heavy rainstorm on the current map."
**ES:** "Inicia una tormenta intensa en el mapa actual."

```json
{ "type": "storm", "power": 8, "duration": 60 }
```

**EN:** "Clear the weather back to normal over 30 frames."
**ES:** "Despeja el clima a normal en 30 frames."

```json
{ "type": "none", "power": 0, "duration": 30 }
```

---

### `play-audio-runtime`

**EN:** "Play a victory fanfare ME right now in the game."
**ES:** "Reproduce una fanfarria de victoria ME ahora mismo en el juego."

```json
{ "type": "me", "name": "Victory1", "volume": 90, "pitch": 100 }
```

**EN:** "Change the background music to 'Battle1' mid-game."
**ES:** "Cambia la música de fondo a 'Battle1' en medio del juego."

```json
{ "type": "bgm", "name": "Battle1", "volume": 90, "pitch": 100 }
```

**EN:** "Play a door sound effect."
**ES:** "Reproduce un efecto de sonido de puerta."

```json
{ "type": "se", "name": "Door1", "volume": 80, "pitch": 100 }
```

**EN:** "Stop the background music."
**ES:** "Para la música de fondo."

```json
{ "type": "stop_bgm" }
```

---

### `get-map-state-runtime`

**EN:** "Read the current map info: dimensions, player position, and active weather."
**ES:** "Lee la información del mapa actual: dimensiones, posición del jugador y clima activo."

```json
{}
```

---

## Backups & Batch

### `manage-backups`

**EN:** "List all available backups for my project."
**ES:** "Lista todos los backups disponibles para mi proyecto."

```json
{ "action": "list" }
```

**EN:** "Restore the Actors.json file from backup 'Actors_2025-01-15T12-30-00-000_0001.json'."
**ES:** "Restaura el archivo Actors.json desde el backup 'Actors_2025-01-15T12-30-00-000_0001.json'."

```json
{
  "action": "restore",
  "filename": "Actors.json",
  "backup_name": "Actors_2025-01-15T12-30-00-000_0001.json"
}
```

**EN:** "Prune old backups, keeping only the last 5 per file."
**ES:** "Limpia los backups antiguos, conservando solo los últimos 5 por archivo."

```json
{ "action": "prune", "max_count": 5 }
```

---

### `batch-edit`

**EN:** "In one shot: rename Actor 1 to 'Aria', set Potion (item 1) price to 50, and turn switch 3 ON."
**ES:** "En una sola llamada: renombra al Actor 1 como 'Aria', pon el precio de la Poción (ítem 1) a 50 y activa el switch 3."

```json
{
  "operations": [
    { "tool": "edit-actor", "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-item", "input": { "item_id": 1, "price": 50 } },
    { "tool": "set-switch", "input": { "id": 3, "value": true } }
  ]
}
```

**EN:** "Set up a full test scenario at once: give the party Hi-Potions, set actor 1 to level 30, and teleport to map 5."
**ES:** "Configura un escenario de prueba completo de una vez: da al grupo Super Pociones, pon al actor 1 en nivel 30, y teleportea al mapa 5."

```json
{
  "operations": [
    {
      "tool": "modify-inventory",
      "input": {
        "operations": [
          { "action": "add", "type": "item", "id": 5, "amount": 10 }
        ]
      }
    },
    {
      "tool": "modify-actor-runtime",
      "input": {
        "actor_id": 1,
        "operations": [{ "field": "level", "mode": "set", "value": 30 }]
      }
    },
    { "tool": "teleport-player", "input": { "map_id": 5, "x": 10, "y": 8 } }
  ],
  "stop_on_error": true
}
```

---

### `batch-create-entities`

**EN:** "Create three potions at once: Potion, Hi-Potion, and Mega-Potion."
**ES:** "Crea tres pociones de una vez: Poción, Super Poción y Mega Poción."

```json
{
  "entity_type": "Item",
  "entities": [
    { "name": "Potion", "price": 50, "description": "Restores 100 HP." },
    { "name": "Hi-Potion", "price": 150, "description": "Restores 500 HP." },
    { "name": "Mega-Potion", "price": 500, "description": "Restores 2000 HP." }
  ]
}
```

**EN:** "Create five goblin enemies in a batch for the first dungeon."
**ES:** "Crea cinco enemigos goblin en lote para el primer calabozo."

```json
{
  "entity_type": "Enemy",
  "entities": [
    { "name": "Goblin Scout", "battler_name": "Goblin" },
    { "name": "Goblin Warrior", "battler_name": "Goblin" },
    { "name": "Goblin Shaman", "battler_name": "Goblin" },
    { "name": "Goblin Chief", "battler_name": "Goblin" },
    { "name": "Goblin King", "battler_name": "Goblin" }
  ]
}
```

---

### `batch-delete-entities`

**EN:** "Delete test enemies 8, 9, and 10 that I added during development."
**ES:** "Elimina los enemigos de prueba 8, 9 y 10 que añadí durante el desarrollo."

```json
{ "entity_type": "Enemy", "entity_ids": [8, 9, 10], "confirm": true }
```

**EN:** "Remove unused common events 5, 6, 7, and 8 all at once."
**ES:** "Elimina los eventos comunes sin usar 5, 6, 7 y 8 de una vez."

```json
{ "entity_type": "CommonEvent", "entity_ids": [5, 6, 7, 8], "confirm": true }
```

---

## Workflow Examples

### Starting a new project

**EN:**

> "Set up a new RPG project for me: title 'Legends of Ether', currency 'Crystals', starting party of actors 1 and 2 on map 1. Then create a 30×20 world map with the field tileset and add two NPCs — a merchant and a guard."

**ES:**

> "Configura un nuevo proyecto RPG para mí: título 'Leyendas del Éter', moneda 'Cristales', grupo inicial con los actores 1 y 2 en el mapa 1. Luego crea un mapa mundo de 30×20 con el tileset de campo y añade dos NPCs — un comerciante y un guardia."

---

### Balancing a boss fight

**EN:**

> "The dragon boss (enemy 8) feels too easy. Increase its HP to 5000, ATK to 80, and MAT to 90. Then run the boss battle 10 times and show me the win rate."

**ES:**

> "El jefe dragón (enemigo 8) parece demasiado fácil. Aumenta su HP a 5000, ATK a 80 y MAT a 90. Luego ejecuta la batalla del jefe 10 veces y muéstrame el porcentaje de victorias."

---

### Designing a skill progression

**EN:**

> "Set up the Mage class (class 2) skill learning curve: Fire (skill 3) at level 1, Ice (skill 5) at level 10, Thunder (skill 7) at level 20, Ultima (skill 30) at level 50. Make sure the EXP curve is steady (basis 35, extra 25)."

**ES:**

> "Define la curva de aprendizaje de la clase Maga (clase 2): Fuego (habilidad 3) al nivel 1, Hielo (habilidad 5) al nivel 10, Rayo (habilidad 7) al nivel 20, Ultima (habilidad 30) al nivel 50. Asegúrate de que la curva de EXP sea constante (base 35, extra 25)."

---

### Testing runtime state

**EN:**

> "Launch the game, teleport to map 3, give the party 10 Hi-Potions and set switch 5 ON, then check the current inventory and switch states so I can verify everything is set up correctly."

**ES:**

> "Lanza el juego, teleporta al mapa 3, da al grupo 10 Super Pociones y activa el switch 5, luego comprueba el inventario actual y el estado de los switches para verificar que todo está configurado correctamente."

---

### Setting up a story checkpoint

**EN:**

> "Save the game to slot 98, then check the game state. If the boss is defeated (switch 10 is ON), trigger common event 5 (Victory Celebration). Otherwise, read variable 3 to see the boss's current HP."

**ES:**

> "Guarda el juego en el slot 98, luego comprueba el estado del juego. Si el jefe ha sido derrotado (switch 10 ON), dispara el evento común 5 (Celebración de Victoria). Si no, lee la variable 3 para ver el HP actual del jefe."

---

_For architecture and implementation details, see [CLAUDE.md](CLAUDE.md)._
