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

const program = new Command();






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

cfonts.say("FLAREX", {
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

    const { name, geminiKey } = await clack.group({
      name: () => clack.text({
        message: "What should we call you?",
        placeholder: "flarex_dev",
        validate: (v) => !v && "Username required"
      }),

      geminiKey: () => clack.password({
        message: "We Need A Gemini API Key",
        placeholder: "AIza... (leave empty to skip)",
        initialValue: "", // <-- allows empty
      })
    }, {
      onCancel: () => {
        clack.cancel("Setup cancelled");
        process.exit(0);
      }
    });



    const s = clack.spinner();
    s.start(chalk.gray("Flarex is Configuring..."));
    await new Promise(r => setTimeout(r, 1000));
    s.stop(chalk.green("Flarex Locked In!"));

    clack.outro(
      geminiKey
        ? `Configured for ${chalk.cyan(name)} with Gemini`
        : `Configured for ${chalk.cyan(name)} without Gemini`


   );
   console.log()
   console.log()
   console.log()
 
  
// Main core Logic
const = FlarexProjects = path.join(os.homedir,"FlarexProjects")
const flareConfig = path.join(FlarexProjects,"flarexConfig.json")
const config = {
  "IsInitialized": true,
  "user": {
    "name": name,
    "geminikey": geminiKey || "",
    "isgeminikey": true
  },
}

if (fs.existsSync(FlarexProjects)){

      const raw = fs.readFileSync(flareConfig, "utf-8");
      const config = JSON.parse(raw);

      config.IsInitialized = true;
      config.user.name = name;
      config.user.geminikey = geminiKey || "";
      config.user.isgeminikey = !!geminiKey;

      fs.writeFileSync(flareConfig, JSON.stringify(config, null, 2));


}else{
console.log()
console.log(chalk.red.bold("Re-Instsll Flarex CLI"))
console.log()
}


}); // Parent Closing



// MAIN
async function main(){
  program.parse();
}

main();
