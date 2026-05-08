# RPG Maker MCP - Model Context Protocol Server for RPG Maker MZ

This README is available in [English](#english) and [Español](#español).

## English

MCP Server that connects to your **RPG Maker MZ** projects, allowing you to create and edit content directly using AI.

### Features

- ✅ Read/write game data (enemies, items, characters, etc.)
- ✅ JavaScript plugin creation
- ✅ Dialogue and narrative editing
- ✅ Automatic backup system
- ✅ Event and scene generation
- ✅ RPG Maker MZ data validation

### Requirements

- **Node.js** 18+
- **TypeScript** (for development)
- **RPG Maker MZ** (existing project)

### Installation

#### 1. Clone or download the project

```bash
git clone git@github.com:Zagos/RPG-Maker-AI-Toolkit.git
cd RpgMakerMCP
npm install
```

#### 2. Configure environment variables

Copy `.env.example` to `.env` and configure the path to your RPG Maker MZ project:

```bash
cp .env.example .env
```

Edit `.env`:

```env
RPGMAKER_PROJECT_PATH=/full/path/to/your/rpg/maker/mz/project
MCP_DEBUG=true
```

**Path examples:**

- Linux/Mac: `/home/user/Documents/MyGame`
- Windows: `C:\Users\user\Documents\MyGame`

#### 3. Verify installation

```bash
npm run build
npm start
```

If you see the message `✓ MCP Server connected and ready`, everything is configured correctly.

### Usage

#### Development Mode

For development with auto-reload:

```bash
npm run dev
```

#### Production Mode

Compile to JavaScript and run:

```bash
npm run build
npm start
```

### Project Structure

```
RpgMakerMCP/
├── src/
│   ├── index.ts              # Main MCP Server
│   ├── config/               # Configuration (coming soon)
│   ├── tools/                # MCP Tools
│   ├── rpgmaker/             # RPG Maker data readers/writers
│   └── types/                # TypeScript definitions
├── package.json
├── tsconfig.json
├── .env                      # Environment variables (local)
├── .env.example              # Variables template
└── README.md
```

### Available Tools

#### `health-check`

Checks that the MCP server is running and connected properly.

```
Input: (none)
Output: Server status, project path, timestamp
```

#### `list-game-data`

Lists all available game data types in the RPG Maker project.

```
Input: data_type (string enum: Actors, Classes, Skills, etc.)
Output: Data type info, count, preview
```

#### `edit-actor`

Create or edit an actor (playable character).

```
Input: actor_id (optional), name, nickname, class_id, etc.
Output: Success message with actor ID
```

#### `edit-item`

Create or edit an item.

```
Input: item_id (optional), name, description, price
Output: Success message with item ID
```

#### `edit-enemy`

Create or edit an enemy.

```
Input: enemy_id (optional), name, gold, exp
Output: Success message with enemy ID
```

#### `create-plugin`

Create a basic JavaScript plugin.

```
Input: plugin_name, description, author, version, code_type
Output: Success message with filename and path
```

#### `add-dialogue`

Add simple dialogue to a common event.

```
Input: dialogue_lines (array), event_name (optional)
Output: Success message with event ID
```

#### `create-plugin-advanced`

Create advanced plugins with templates.

```
Input: plugin_name, description, author, version, template_type
Output: Success message with filename
```

#### `create-dialogue-advanced`

Create branching dialogue systems.

```
Input: dialogue_name, dialogue_nodes (array)
Output: Success message with common event ID
```

#### `create-map-event`

Create events on maps (NPCs, chests, triggers).

```
Input: map_id, event_name, x, y, event_type, etc.
Output: Success message with event ID
```

#### `story-generator`

Generate complete stories with scenes and events.

```
Input: story_title, story_description, scenes (array)
Output: Success message with story details
```

## Español

Servidor MCP que conecta con tus proyectos de **RPG Maker MZ**, permitiendo crear y editar contenido directamente usando IA.

### Características

- ✅ Lectura/escritura de datos de juego (enemigos, items, personajes, etc.)
- ✅ Creación de plugins JavaScript
- ✅ Edición de diálogos y narrativa
- ✅ Sistema automático de backups
- ✅ Generación de eventos y escenas
- ✅ Validación de datos RPG Maker MZ

### Requisitos

- **Node.js** 18+
- **TypeScript** (para desarrollo)
- **RPG Maker MZ** (proyecto existente)

### Instalación

#### 1. Clonar o descargar el proyecto

```bash
git clone git@github.com:Zagos/RPG-Maker-AI-Toolkit.git
cd RpgMakerMCP
npm install
```

#### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura la ruta a tu proyecto de RPG Maker MZ:

```bash
cp .env.example .env
```

Edita `.env`:

```env
RPGMAKER_PROJECT_PATH=/ruta/completa/a/tu/proyecto/rpg/maker/mz
MCP_DEBUG=true
```

**Ejemplos de rutas:**

- Linux/Mac: `/home/usuario/Documentos/MiJuego`
- Windows: `C:\Users\usuario\Documentos\MiJuego`

#### 3. Verificar la instalación

```bash
npm run build
npm start
```

Si ves el mensaje `✓ MCP Server connected and ready`, todo está configurado correctamente.

### Uso

#### Modo Desarrollo

Para desarrollo con recarga automática:

```bash
npm run dev
```

#### Modo Producción

Compilar a JavaScript y ejecutar:

```bash
npm run build
npm start
```

### Estructura de Proyecto

```
RpgMakerMCP/
├── src/
│   ├── index.ts              # Servidor MCP principal
│   ├── config/               # Configuración (próximamente)
│   ├── tools/                # Herramientas MCP
│   ├── rpgmaker/             # Lectores/escritores de datos RPG Maker
│   └── types/                # Definiciones TypeScript
├── package.json
├── tsconfig.json
├── .env                      # Variables de entorno (local)
├── .env.example              # Template de variables
└── README.md
```

### Herramientas Disponibles

#### `health-check`

Verifica que el servidor MCP esté funcionando correctamente.

```
Input: (ninguno)
Output: Estado del servidor, ruta del proyecto, timestamp
```

#### `list-game-data`

Lista todos los tipos de datos disponibles en el proyecto RPG Maker.

```
Input: data_type (enum: Actors, Classes, Skills, etc.)
Output: Información del tipo de dato, cantidad, vista previa
```

#### `edit-actor`

Crear o editar un actor (personaje jugable).

```
Input: actor_id (opcional), name, nickname, class_id, etc.
Output: Mensaje de éxito con ID del actor
```

#### `edit-item`

Crear o editar un item.

```
Input: item_id (opcional), name, description, price
Output: Mensaje de éxito con ID del item
```

#### `edit-enemy`

Crear o editar un enemigo.

```
Input: enemy_id (opcional), name, gold, exp
Output: Mensaje de éxito con ID del enemigo
```

#### `create-plugin`

Crear un plugin JavaScript básico.

```
Input: plugin_name, description, author, version, code_type
Output: Mensaje de éxito con nombre de archivo y ruta
```

#### `add-dialogue`

Agregar diálogo simple a un evento común.

```
Input: dialogue_lines (array), event_name (opcional)
Output: Mensaje de éxito con ID del evento
```

#### `create-plugin-advanced`

Crear plugins avanzados con plantillas.

```
Input: plugin_name, description, author, version, template_type
Output: Mensaje de éxito con nombre de archivo
```

#### `create-dialogue-advanced`

Crear sistemas de diálogo ramificados.

```
Input: dialogue_name, dialogue_nodes (array)
Output: Mensaje de éxito con ID del evento común
```

#### `create-map-event`

Crear eventos en mapas (NPCs, cofres, triggers).

```
Input: map_id, event_name, x, y, event_type, etc.
Output: Mensaje de éxito con ID del evento
```

#### `story-generator`

Generar historias completas con escenas y eventos.

```
Input: story_title, story_description, scenes (array)
Output: Mensaje de éxito con detalles de la historia
```

- ✅ Generador de plugins sofisticados
- ✅ Sistema de diálogos ramificados
- ✅ Generador de eventos de mapa
- ✅ Generador de narrativa (escenas complejas)

### Fase 4: Testing & Integración

- Tests automatizados
- Validación con proyecto real
- Documentación de herramientas

## Solución de Problemas

### Error: "RPGMAKER_PROJECT_PATH is not set"

**Solución:** Configura la variable `RPGMAKER_PROJECT_PATH` en `.env` con la ruta correcta a tu proyecto.

### Error: "RPG Maker project path does not exist"

**Solución:** Verifica que la ruta en `.env` sea correcta y que el directorio exista.

### Error: "RPG Maker data directory not found"

**Solución:** Asegúrate de que el proyecto es RPG Maker MZ (debe tener una carpeta `data/` en la raíz).

### El servidor se congela o no responde

**Solución:**

1. Presiona `Ctrl+C` para detener
2. Verifica que `RPGMAKER_PROJECT_PATH` sea accesible
3. Reinicia con `npm run dev`

## Contribuir

Este es un proyecto en desarrollo. Las contribuciones son bienvenidas.

## Licencia

MIT

---

**¿Preguntas o problemas?** Revisa la documentación o contacta al desarrollador.

---

Created by **Zagos**
