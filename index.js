#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import chalk from "chalk";
import cfonts from "cfonts";
import { execa } from "execa";
import ora from "ora";
import path from "path"
import os from "os"
import fs from "fs"
import { setTimeout as sleep } from "node:timers/promises";
import gradient from "gradient-string"
const program = new Command();

const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
const CONFIG_PATH = path.join(FLAREX_DIR, "flarexConfig.json");
const PROJECTS_PATH = path.join(FLAREX_DIR, "flareProjects.json");


// FUNCTIONS / HELPERS
async function clearScreen(){
  await execa("clear", { shell: true, stdio: "inherit" });
}

function center(text) {
  const width = process.stdout.columns || 80;
  const plain = text.replace(/\u001b\[[0-9;]*m/g, "");
  const padding = Math.max(0, Math.floor((width - plain.length) / 2));
  return " ".repeat(padding) + text;
}




function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null; 
  
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return config;
  } catch {
    return null;
  }
}

function isInit() {
  const config = loadConfig();
  if (!config) return false;
  
  return config.IsInitialized === true;
}




async function banner() {
const graySandwich = gradient(['#4a4a4a', '#ffffff', '#4a4a4a']);
  const config =  loadConfig()
const theme = config?.user?.theme || ['cyan', 'magenta']
  await clearScreen();
  cfonts.say("FLAREX", {
    font: "block",
    align: "center",
    colors: theme,
    background: "transparent",
    letterSpacing: 1,
    space: true,
  });

  console.log(center(chalk.bold("Fastest Way to Scaffold and Manage Projects")));
  console.log();

  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    if (config.user?.name) {
      const name = config.user.name;
      const greetings = [
        `${name}, you're back`,
        `What's up, ${name}?`,
        `Lock in, ${name}`
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      console.log()
      console.log(center(chalk.bold(graySandwich(greeting))));
    } else {
      console.log(center(chalk.gray.bold("> Run 'flare init' to Lock In!")));
    }
  } else {
    console.log(center(chalk.gray.bold("> Run 'flare init' to Lock In!")));
  }

  console.log();
}

program
  .name("flare")
  .description("CLI to scaffold and manage projects")
  .version("1.0.0");

// 1. DEFAULT ACTION: only runs when you type just `flare`
program.action(async () => {
  await banner();
});

// 2. CLS COMMAND: manual banner
program
  .command("cls")
  .description("Clear screen and show banner")
  .action(async () => {
    await banner();
  });

// 3. INIT COMMAND
program
  .command("init")
  .description("Initialize flare project")
  .action(async () => {
    console.log()
    console.log()
    console.log()
    clack.intro(chalk.bold.cyan("Flarex is Initializing! :)"));

    const { name, geminiKey, theme} = await clack.group({
      name: () => clack.text({
        message: "What should we call you?",
        placeholder: "flarex_dev",
        validate: (v) => !v && "Username required"
      }),

	theme: () => clack.select({
  message: "Pick your Flarex theme",
  options: [
    { value: ['cyan', 'magenta'], label: "Cyberpunk" },
    { value: ['green', 'yellow'], label: "Matrix" },
    { value: ['blue', 'white'], label: "Ocean" },
    { value: ['red', 'yellow'], label: "Fire" },
    { value: ['magentaBright', 'cyanBright'], label: "Neon" },
    { value: ['gray'], label: "Minimal" }
  ],
  initialValue: ['cyan', 'magenta']
}),
      geminiKey: () => clack.password({
        message: "We Need A Gemini API Key",
        placeholder: "AIza... (leave empty to skip)",
        initialValue: "",
      })
    }, {
      onCancel: () => {
        clack.cancel("Setup cancelled");
        process.exit(0);
      }
    });

    const s = clack.spinner();
    s.start(chalk.gray("Flarex is Configuring..."));

    if (!fs.existsSync(CONFIG_PATH)) {
      s.stop(chalk.red("Config file missing"));
      console.log();
      console.log(chalk.red.bold("Re-Install Flarex CLI"));
      console.log();
      return;
    }

    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);

    config.IsInitialized = true;
    config.user.name = name;
    config.user.geminikey = geminiKey || "";
    config.user.isgeminikey = !!geminiKey;
    config.user.theme = theme;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    await new Promise(r => setTimeout(r, 600));
    s.stop(chalk.green("Flarex Locked In!"));

clack.outro(
  geminiKey
    ? `Configured for ${chalk.cyan(name)} with Gemini`
    : `Configured for ${chalk.cyan(name)} without Gemini`
);

console.log();
console.log(chalk.green.bold("FlarexProjects Folder Created (Dont Delete)"));
console.log();

await sleep(3000)
banner()

}); // PARENT CLOSING
// MAIN
async function main(){
  program.parse();
}

main();
