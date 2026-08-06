#!/usr/bin/env node
import { Command } from "commander";
import * as clack from "@clack/prompts";
import chalk from "chalk";
import cfonts from "cfonts";
import { execa } from "execa";
import ora from "ora";
import path from "path"

const program = new Command();

const CONFIG = path.join(process.cwd(), "flareConfig.json") // removed the /

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

async function banner() {
  await clearScreen();

  cfonts.say("FLARE", {
    font: "block",
    align: "center",
    colors: ["cyan", "white"],
    background: "transparent",
    letterSpacing: 1,
    space: true,
  });

  console.log(center(chalk.bold("Fastest Way to Scaffold and Manage Projects")));
  console.log();
  console.log(center(chalk.gray.bold("> Run 'flare init' to Lock In!")))
  console.log();
}

program
  .name("flare")
  .description("CLI to scaffold and manage projects")
  .version("1.0.0");

// 1. DEFAULT ACTION: only runs when you type just `flare`
program.action(async () => {
  await banner();
  program.help(); // show help after banner
});

// 2. CLS COMMAND: manual banner
program
  .command("cls")
  .description("Clear screen and show banner")
  .action(async () => {
    await banner();
  });

// 3. INIT COMMAND: NO BANNER HERE
program
  .command("init")
  .description("Initialize flare project")
  .action(async () => {
    const spinner = ora('Initing Flare...').start();
    // your init logic here
    await new Promise(r => setTimeout(r, 1000));
    spinner.succeed('Flare initialized!');
  });

// MAIN
async function main(){
  program.parse();
}

main();
