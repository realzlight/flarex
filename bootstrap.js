#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";

const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
const CONFIG_PATH = path.join(FLAREX_DIR, "flarexConfig.json");
const PROJECTS_PATH = path.join(FLAREX_DIR, "flarexProjects.json");
const LOGS_PATH = path.join(FLAREX_DIR, "flarexLog.json");

const defaultConfig = {
  IsInitialized: false,
  version: "1.0.8",
  user: {
    name: "",
    workspace: FLAREX_DIR,
    geminikey: "",
    isgeminikey: false,
    theme: ["cyan","magenta"]
  }
};

const defaultProjects = {
  projects: []
};

const defaultLogs = {
  logs: []
};

try {
  const dirExists = fs.existsSync(FLAREX_DIR);
  const configExists = fs.existsSync(CONFIG_PATH);
  const projectsExists = fs.existsSync(PROJECTS_PATH);
  const logsExists = fs.existsSync(LOGS_PATH);

  if (dirExists && configExists && projectsExists && logsExists) {
    console.log(chalk.green("Flarex is installed. Run 'flarex' to start"));
    process.exit(0);
  }

  if (!dirExists) fs.mkdirSync(FLAREX_DIR, { recursive: true });
  if (!configExists) fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  if (!projectsExists) fs.writeFileSync(PROJECTS_PATH, JSON.stringify(defaultProjects, null, 2));
  if (!logsExists) fs.writeFileSync(LOGS_PATH, JSON.stringify(defaultLogs, null, 2));
  
  console.log()
  console.log(chalk.green("Flarex is installed. Run 'flarex' to start"));
  console.log()
} catch (err) {
  console.error(chalk.red("Flarex Error:"), err.message);
  process.exit(1);
}
