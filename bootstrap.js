#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";
import execa from "execa"
const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
const CONFIG_PATH = path.join(FLAREX_DIR, "flarexConfig.json");
const PROJECTS_PATH = path.join(FLAREX_DIR, "flareProjects.json"); // <-- NEW

const defaultConfig = {
  IsInitialized: false,
  version: "1.0.0",
  user: {
    name: "",
    workspace: FLAREX_DIR,
    geminikey: "",
    isgeminikey: false
  }
};

const defaultProjects = {
  version: "1.0.0",
  projects: [] // [{ name, path, createdAt }]
};

try {
  const dirExists = fs.existsSync(FLAREX_DIR);
  const configExists = fs.existsSync(CONFIG_PATH);
  const projectsExists = fs.existsSync(PROJECTS_PATH);

  // 1. If EVERYTHING exists, skip. Don't touch David's precious files
  if (dirExists && configExists && projectsExists) {
    await execa("flarex",{stdio:"inherit"})
    process.exit(0);
  }

  // 2. Create FlarexProjects folder only if missing
  if (!dirExists) {
    fs.mkdirSync(FLAREX_DIR, { recursive: true });
  }

  // 3. Create flarexConfig.json only if missing
  if (!configExists) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  }

  // 4. Create flareProjects.json only if missing
  if (!projectsExists) {
    fs.writeFileSync(PROJECTS_PATH, JSON.stringify(defaultProjects, null, 2));
  }

await execa("flarex",{stdio:"inherit"})

} catch (err) {
  console.error(chalk.red("Flarex Bootstrap Error:"), err.message);
  process.exit(1);
}
