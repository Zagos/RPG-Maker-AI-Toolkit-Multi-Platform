const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const workspaceRoot = path.resolve(__dirname, "..");
const envPath = path.join(workspaceRoot, ".env");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    result[key.trim()] = rest
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return result;
}

const env = loadEnv(envPath);
const executable =
  env.RPGMAKER_EXECUTABLE_PATH || process.env.RPGMAKER_EXECUTABLE_PATH;
const projectPath =
  env.RPGMAKER_PROJECT_PATH || process.env.RPGMAKER_PROJECT_PATH;

if (!executable) {
  console.error(
    "ERROR: RPGMAKER_EXECUTABLE_PATH is not set in .env or environment variables.",
  );
  process.exit(1);
}

if (!projectPath) {
  console.error(
    "ERROR: RPGMAKER_PROJECT_PATH is not set in .env or environment variables.",
  );
  process.exit(2);
}

if (!fs.existsSync(executable)) {
  console.error(`ERROR: RPG Maker executable not found at: ${executable}`);
  process.exit(3);
}

if (!fs.existsSync(projectPath)) {
  console.error(`ERROR: RPG Maker project path not found at: ${projectPath}`);
  process.exit(4);
}

const child = spawn(executable, [projectPath], {
  cwd: workspaceRoot,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code);
});
