#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";

const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
const CONFIG_PATH = path.join(FLAREX_DIR, "flarexConfig.json"); // <-- note the x

const defaultConfig = {
  IsInitialized: false,
  version: "1.0.0",
  user: {
    name: "",
    workspace: FLAREX_DIR,
    geminikey: "",
    isgeminikey: false
  },
  projects: []
};

try {
  // 1. Create FlarexProjects folder
  fs.mkdirSync(FLAREX_DIR, { recursive: true });

  // 2. Create flarexConfig.json only if it doesn't exist
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    console.log(chalk.green("Flarex: Created"), chalk.gray(CONFIG_PATH));
  } else {
    console.log(chalk.gray("Flarex: Config already exists at"), chalk.gray(CONFIG_PATH));
  }
  
  console.log(chalk.green("Flarex: Bootstrap complete! Run 'flare init' to get started"));
} catch (err) {
  console.error(chalk.red("Flarex Bootstrap Error:"), err.message);
  process.exit(1);
}
