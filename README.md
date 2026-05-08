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

### Available Tools (Phase 1)

#### `health-check`
Checks that the MCP server is working correctly.

```
Input: (none)
Output: Server status, project path, timestamp
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

### Herramientas Disponibles (Fase 1)

#### `health-check`
Verifica que el servidor MCP esté funcionando correctamente.

```
Input: (ninguno)
Output: Estado del servidor, ruta del proyecto, timestamp
```

### `list-game-data`
Lista datos disponibles en tu proyecto RPG Maker MZ.

```
Input: 
  - data_type: "actors" | "enemies" | "items" | "weapons" | "armors" | "skills" | "etc."
  
Output:
  - count: Número de elementos
  - preview: Primeros 3 elementos
  - data_type: Tipo de dato listado
```

**Tipos de datos soportados:**
- `actors` - Personajes jugables
- `classes` - Clases
- `skills` - Habilidades
- `items` - Items/Objetos
- `weapons` - Armas
- `armors` - Armaduras
- `enemies` - Enemigos
- `troops` - Tropas (grupos de enemigos)
- `states` - Estados (envenenar, dormir, etc.)
- `animations` - Animaciones
- `tilesets` - Tilesets
- `maps` - Mapas
- `common_events` - Eventos comunes

## Herramientas Avanzadas (Fase 3)

### `create-plugin-advanced`
Genera plugins RPG Maker MZ con cabecera, ayuda, parámetros y plantillas para:

- `with-parameters`
- `game-actor`
- `game-enemy`
- `event-handler`
- `custom-ui`

### `create-dialogue-advanced`
Crea un sistema de diálogo ramificado. Además de guardar un manifiesto `Dialogue_*.json`, genera un evento común ejecutable con:

- Mensajes con nombre de hablante
- Labels por nodo
- Elecciones que saltan a otros nodos
- Acciones simples como `setSwitch`, `setVariable`, `addItem`, `addGold`, `commonEvent` y `script`

### `create-map-event`
Crea eventos reales dentro de `MapXXX.json` y guarda backup del mapa antes de escribir. Soporta NPCs, cofres, puertas, triggers, scripts, páginas, sprites, diálogo inicial y comandos de evento básicos.

### `story-generator`
Genera una narrativa completa como `Story_*.json` y crea un evento común por escena con diálogos, batallas, elecciones, animaciones, transferencias y anotaciones de ramas/prerrequisitos.

## Próximas Fases (Roadmap)

### Fase 2: Core MCP
- Crear/editar actores (personajes)
- Crear/editar enemigos
- Crear/editar items, armas, armaduras
- Crear plugins básicos
- Sistema de diálogos

### Fase 3: Avanzado
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
