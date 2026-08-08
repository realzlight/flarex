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
import boxen from "boxen"

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


function msg(txt){
console.log()
console.log(boxen(chalk.red(txt)))
console.log()
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
const graySandwich = gradient(['#666666', '#ffffff', '#666666']);
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
  console.log(center(chalk.dim("> RUN flarex tutorial")));
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



program
  .command("create")
  .description("CREATE AND SETUP PROJECT COMPLETELY AND STORE IN FlareProjects FOLDER")
  .action(async () => {

  if (isInit()){

        console.log()
        clack.intro("Flarex Locking in... ")


const { projectname, template } = await clack.group({
  projectname: () => clack.text({
    message: "What Would You Name Your Project?",
    placeholder: "MyApp...",
    validate: (v) => !v && "Project Name Is Required"
  }),

  template: () => clack.select({
    message: "What Is Your Project Type",
    options: [
      { value: 'MERN', label: "Mern Stack" },
      { value: 'Express', label: "Express" },
      { value: 'React', label: "React + Vite" }
    ],
  }),
}, {
  onCancel: () => {
    clack.cancel("Setup cancelled");
    process.exit(0);
  }
});
        if (template === "MERN"){
                console.log()
                console.log(chalk.bold(`Flarex Is Starting to Set Up ${projectname}`))
                console.log()
                const s = clack.spinner()
                s.start("Flarex Is Cooking...")
                console.log()
                const safeName = projectname.trim().replace(/\s+/g, '-').toLowerCase();
                const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
                const FullPath = path.join(FLAREX_DIR,safeName)
                fs.mkdirSync(FullPath, {recursive:true})

                console.log(chalk.bold(`• ✓ Flarex Created ${safeName}`))

                const serverPath = path.join(FullPath,"server")
                fs.mkdirSync(serverPath, {recursive:true})
                await execa("npm",["init","-y"],{stdio:"ignore",cwd:serverPath})

                const packageJsonPath = path.join(serverPath,"package.json")
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath,"utf8"))

                packageJson.name = safeName;
                packageJson.type = "module";
                packageJson.description = "Made with Flarex";
                packageJson.scripts = {
                  ...packageJson.scripts,
                          dev: `node index.js`,
                          start: `node index.js`
                        };

                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log(chalk.bold("• ✓ Flarex Created and Configured 'package.json'"))


                // WRTING GITIGNORE
                const gitignorePath = path.join(FullPath, '.gitignore');

const gitignoreContent = `node_modules/
dist/
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

                fs.writeFileSync(gitignorePath, gitignoreContent);
                console.log(chalk.bold("• ✓ Flarex Configured '.gitignore'"))


                // INDEX.JS
fs.writeFileSync(
path.join(serverPath, 'index.js'),
`import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.json({ message: 'Flarex server is running 🚀' });
});

// start server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`
);



                s.stop("Flarex Is Done Cooking!!")
}



        console.log()
        clack.outro(chalk.green("Flarex Set Up Everything For You.."))
  }else{
        msg("!Init")
  }


}) // Parent Closing








// MAIN
async function main(){
  program.parse();
}

main();
