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
const PROJECTS_PATH = path.join(FLAREX_DIR, "flarexProjects.json");
const LOGS_PATH = path.join(FLAREX_DIR, "flarexLog.json");


// DOCS
const FLAREX_DOCS = `
FLAREX DOCUMENTATION

INSTALL
  npm install -g flarex

GETTING STARTED
  Run the setup wizard first:
  flarex init

  This creates ~/FlarexProjects/ with your config and project registry,
  and asks you to set a name, theme, and optional Gemini API key.

COMMANDS

Setup & Config
  flarex init                    First-time setup. Creates config, workspace, and project registry.
  flarex name <name>             Update your display name.
  flarex theme                   Change your terminal theme.
  flarex gemini <apikey>         Set or update your Gemini API key (needed for AI commands).
  flarex recover                 Restore missing config/project files if deleted accidentally.

Project Management
  flarex create                  Scaffold a new project. Choose MERN, Express, or React + Vite. Installs dependencies automatically.
  flarex add <folder>            Import an existing project from your home directory into Flarex.
  flarex remove <project>        Move a project back to home and remove it from Flarex tracking.
  flarex switch [project]        Drop into a project's directory. No argument shows a picker.
  flarex list                    Quick view of all projects — name, template, git status, active/inactive.
  flarex sync                    Rescan all projects, update git status, detect templates, remove dead entries.

  Templates:
    MERN     — Express server (server/) + Vite/React client (client/), both with dependencies installed
    Express  — Standalone Express API in the project root
    React    — Standalone Vite + React app in the project root, pre-wired with axios and react-router-dom

Shipping Code
  flarex ship <path> [branch]    Add, commit, and push. path is required (. for everything, or a specific file/folder). branch defaults to main.

  Checks git is initialized and a remote exists before doing anything.
  If you leave the commit message empty, Flarex reads your staged diff
  and generates a commit message for you — you can accept it or write your own.

  Examples:
    flarex ship .                  commit everything, push to main
    flarex ship server             commit server/ only
    flarex ship . dev              commit everything, push to dev
    flarex ship business.tsx dev   commit one file, push to dev

AI Commands
  Require a Gemini API key set via flarex gemini <apikey>.

  flarex error                   Scans recent terminal history for an error. If nothing found, prompts you to paste one. Returns a structured breakdown: error summary, safe fix (check your own code), hard fix (reinstall/update/delete dependencies).
  flarex ask <question>          Ask Flarex anything — how to use a command, troubleshooting, or general dev questions.
  flarex fix                     Pick a project, browse into its folders, select a file. Choose a quick syntax/bracket/indentation scan or a full logic review. Large files (50KB+) prompt before reading the first 3000 lines only, to keep things fast.

Project Tracking
  Every project can track its own development status, version, and issue list — no separate "product" concept, it's all part of the project.

  flarex info <project>                  Full project overview — path, template, git, dev status, version, and issue breakdown.
  flarex devstatus <project> <status>    Set development stage.
  flarex version-set <project> <version> Set the project's version string (e.g. 1.0.0).
  flarex issue-add                       Pick a project, add an issue. Prompts "add another?" so you can batch-add quickly.
  flarex issue-close                     Pick a project, pick from its open issues, close it.
  flarex issue-open                      Pick a project, pick from its closed issues, reopen it.
  flarex issue-list <project>            List all issues for a project with open/closed counts.

  Valid dev statuses:
    pre-alpha, alpha, in-development, beta, bug-testing, shipped

Dev Log
  flarex log                             Log what you shipped today — pick a project, describe what you did, hours (optional), and status.
  flarex log --week                      Summary of the last 7 days — total entries, hours, status breakdown, per-project counts, timeline.
  flarex log --month                     Same summary, last 30 days.
  flarex log --week --project <name>     Filter either summary to one project.

CONFIG FILES
  Everything lives in ~/FlarexProjects/:

    flarexConfig.json      Your name, theme, Gemini key, init status.
    flarexProjects.json    Every tracked project — path, template, git info, dev status, version, issues.
    flarexLog.json         Daily dev log entries.

  If any of these go missing, run flarex recover.

REQUIREMENTS
  - Node.js
  - Git (for ship, sync, and git status detection)
  - A Gemini API key for AI commands (free tier available)

Made with care, one terminal session at a time.
`;
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

function forceInit(){
const init = isInit()
if (!init){
console.log()
console.log()
msg("You aren't initialized. RUN 'flare init' to Initialize")
console.log()
console.log()
}else{
return "Inited"
}
}


function getTermWidth() {
  const w = process.stdout.columns || 60;
  return Math.min(w, 72);
}

function boxTop(width) {
  return chalk.gray("╭" + "─".repeat(width - 2) + "╮");
}

function boxBottom(width) {
  return chalk.gray("╰" + "─".repeat(width - 2) + "╯");
}

function boxDivider(width) {
  return chalk.gray("├" + "─".repeat(width - 2) + "┤");
}

function boxLine(content, width, align = "left") {
  const visibleLength = content.replace(/\x1b\[[0-9;]*m/g, "").length;
  const innerWidth = width - 4;
  const padTotal = Math.max(innerWidth - visibleLength, 0);

  let left = 1;
  let right = padTotal - 1 + 1;

  if (align === "center") {
    left = Math.floor(padTotal / 2);
    right = padTotal - left;
  }

  return (
    chalk.gray("│") +
    " " +
    " ".repeat(Math.max(left, 0)) +
    content +
    " ".repeat(Math.max(right, 0)) +
    " " +
    chalk.gray("│")
  );
}

function boxEmpty(width) {
  return chalk.gray("│") + " ".repeat(width - 2) + chalk.gray("│");
}
function centerBlock(width) {
  const termWidth = process.stdout.columns || 80;
  const pad = Math.max(Math.floor((termWidth - width) / 2), 0);
  return " ".repeat(pad);
}

async function banner() {
  await clearScreen();

  const config = loadConfig();
  const pad = centerBlock(64);
  const divider = pad + chalk.gray("─".repeat(64));

  cfonts.say("FLAREX", {
    font: "block",
    align: "center",
    colors: ["white"],
    background: "transparent",
    letterSpacing: 1,
    space: true,
  });

  console.log(center(chalk.gray("Less setup. More ship.")));
  console.log();

  if (!config?.user?.name) {
    console.log(center(chalk.gray("Run") + " " + chalk.white("flarex init") + " " + chalk.gray("to get started")));
    console.log();
    return;
  }

  const name = config.user.name;
  const greetings = [
    `Welcome back, ${name}`,
    `Good to see you, ${name}`,
    `${name}, let's ship something`,
    `Ready when you are, ${name}`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const projectsData = readProjects();
  const projects = projectsData.projects || [];

  console.log(center(chalk.bold.white(greeting)));
  console.log();
  console.log(divider);
  console.log();

  if (projects.length === 0) {
    console.log(center(chalk.gray("No projects yet")));
    console.log(center(chalk.white("flarex create") + chalk.gray(" to start one")));
  } else {
    console.log(center(chalk.gray.dim("PROJECTS")));
    console.log();
    projects.slice(0, 6).forEach((p) => {
      console.log(
        center(chalk.white(p.name.padEnd(20)) + chalk.gray(`v${p.version || "0.1.0"}`))
      );
    });
    if (projects.length > 6) {
      console.log();
      console.log(center(chalk.gray(`+${projects.length - 6} more`) + chalk.gray("  ·  flarex list")));
    }
  }

  console.log();
  console.log(divider);
  console.log();
  console.log(center(chalk.gray("create") + chalk.gray(" · ") + chalk.gray("ship") + chalk.gray(" · ") + chalk.gray("switch") + chalk.gray(" · ") + chalk.gray("log")));
  console.log(center(chalk.gray("docs") + chalk.gray(" · ") + chalk.gray("tutorial") + chalk.gray(" · ") + chalk.gray("commands")));
  console.log();
}



function readProjects() {
  if (!fs.existsSync(PROJECTS_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));
}

function writeProjects(projects) {
  fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2));
}

async function syncAllProjects() {
  const projects = readProjects();
  const validProjects = [];

  for (const project of projects.projects) {
    // Remove if path doesn't exist
    if (!fs.existsSync(project.path)) {
      continue;
    }

    project.status = "active";

    // Check git
    const gitDir = path.join(project.path, ".git");
    project.git.initialized = fs.existsSync(gitDir);

    if (project.git.initialized) {
      try {
        const remote = await execa("git", ["config", "--get", "remote.origin.url"], {
          cwd: project.path,
        });
        project.git.remote = remote.stdout.trim();
      } catch {
        project.git.remote = null;
      }
    }

    validProjects.push(project);
  }

  projects.projects = validProjects;
  writeProjects(projects);
}




function readLogs() {
  if (!fs.existsSync(LOGS_PATH)) {
    return { logs: [] };
  }
  return JSON.parse(fs.readFileSync(LOGS_PATH, "utf8"));
}

function writeLogs(data) {
  fs.writeFileSync(LOGS_PATH, JSON.stringify(data, null, 2));
}


async function syncAllProjectsGit() {
  const projects = readProjects();
  
  for (const project of projects.projects) {
    const gitDir = path.join(project.path, ".git");
    project.git.initialized = fs.existsSync(gitDir);

    if (project.git.initialized) {
      try {
        const remote = await execa("git", ["config", "--get", "remote.origin.url"], {
          cwd: project.path,
        });
        project.git.remote = remote.stdout.trim();
      } catch {
        project.git.remote = null;
      }
    }
  }

  writeProjects(projects);
}

async function getLatestError() {
  const home = os.homedir();
  const platform = process.platform;

  let historyFiles = [];

  if (platform === "win32") {
    historyFiles = [
      path.join(home, "AppData/Roaming/Microsoft/Windows/PowerShell/PSReadline/ConsoleHost_history.txt"),
    ];
  } else {
    historyFiles = [
      path.join(home, ".zsh_history"),
      path.join(home, ".bash_history"),
      path.join(home, ".fish_history"),
    ];
  }

  for (const file of historyFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    // Only check last 50 lines (recent session)
    const recentLines = lines.slice(Math.max(0, lines.length - 50));

    for (let i = recentLines.length - 1; i >= 0; i--) {
      const line = recentLines[i];

      // Skip false positives
      if (
        line.startsWith("cat") ||
        line.startsWith("grep") ||
        line.startsWith("ls") ||
        line.startsWith("cd") ||
        line.includes("commit")
      ) {
        continue;
      }

      // Real error patterns
      if (
        line.includes("Error:") ||
        line.includes("at ") ||
        line.includes("TypeError:") ||
        line.includes("ReferenceError:") ||
        line.includes("SyntaxError:") ||
        (line.includes("✗") && line.length > 10) ||
        line.includes("ENOENT") ||
        line.includes("cannot find") ||
        line.includes("Command failed")
      ) {
        return line;
      }
    }
  }

  return null;
}
// GIT SCAN
syncAllProjectsGit()
getLatestError()
syncAllProjects()
// PROGRAMS
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
    clack.intro(chalk.bold.hex("#f97316")("Flarex Initialize"));

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
console.log(chalk.dim("RUN flarex init again to change credentials or RUN flarex name <yourname> to change name or RUN flarex gemini <geminikey> to change it!"))
console.log()
await sleep(6000)
banner()

}); // PARENT CLOSING



program
  .command("create")
  .description("CREATE AND SETUP PROJECT COMPLETELY AND STORE IN FlareProjects FOLDER")
  .action(async () => {
  await syncAllProjectsGit()
    if (!isInit()) {
      console.log()
      console.log()
      msg("You are not initialized, before initializing you can't do this. RUN 'flarex init' to initialize!");
      console.log()
      console.log()
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Create"));

    const { projectname, template } = await clack.group(
      {
        projectname: () =>
          clack.text({
            message: "What would you name your project?",
            placeholder: "MyApp...",
            validate: (v) => !v && "Project name is required",
          }),
        template: () =>
          clack.select({
            message: "What is your project type?",
            options: [
              { value: "MERN", label: "MERN Stack" },
              { value: "Express", label: "Express" },
              { value: "React", label: "React + Vite" },
            ],
          }),
      },
      {
        onCancel: () => {
          clack.cancel("Setup cancelled");
          process.exit(0);
        },
      }
    );

    if (template === "MERN") {
      const safeName = projectname.trim().replace(/\s+/g, "-").toLowerCase();
      const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
      const FullPath = path.join(FLAREX_DIR, safeName);
      const serverPath = path.join(FullPath, "server");
      const clientPath = path.join(FullPath, "client");

      fs.mkdirSync(FullPath, { recursive: true });

      const s = clack.spinner();

      // ---------------- SERVER ----------------
      console.log();
      clack.log.step(chalk.bold("Flarex setting up server"));

      s.start("Creating server folder");
      fs.mkdirSync(serverPath, { recursive: true });
      s.stop(chalk.green("✓") + " Server folder created");

      s.start("Initializing package.json");
      await execa("npm", ["init", "-y"], { stdio: "ignore", cwd: serverPath });
      s.stop(chalk.green("✓") + " package.json initialized");

      s.start("Installing server dependencies");
      await execa("npm", ["install", "express", "cors", "dotenv"], {
        stdio: "ignore",
        cwd: serverPath,
      });
      s.stop(chalk.green("✓") + " Dependencies installed (express, cors, dotenv)");

      s.start("Configuring package.json");
      const packageJsonPath = path.join(serverPath, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.name = safeName;
      packageJson.type = "module";
      packageJson.description = "Made with Flarex";
      packageJson.scripts = {
        ...packageJson.scripts,
        dev: "node index.js",
        start: "node index.js",
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      s.stop(chalk.green("✓") + " package.json configured");

      s.start("Writing .gitignore");
      fs.writeFileSync(
        path.join(FullPath, ".gitignore"),
        `node_modules/
dist/
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
      );
      s.stop(chalk.green("✓") + " .gitignore written");

      s.start("Writing index.js");
      fs.writeFileSync(
        path.join(serverPath, "index.js"),
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
      s.stop(chalk.green("✓") + " index.js written");

      // ---------------- CLIENT ----------------
      console.log();
      clack.log.step(chalk.bold("Flarex setting up client"));

      s.start("Scaffolding Vite + React app");
      await execa(
        "npm",
        ["create", "vite@latest", "client", "--", "--template", "react"],
        { stdio: "ignore", cwd: FullPath }
      );
      s.stop(chalk.green("✓") + " Vite + React app created");

      s.start("Installing client dependencies");
      await execa("npm", ["install"], { stdio: "ignore", cwd: clientPath });
      await execa("npm", ["install", "axios", "react-router-dom"], {
        stdio: "ignore",
        cwd: clientPath,
      });
      s.stop(chalk.green("✓") + " Dependencies installed (axios, react-router-dom)");

      s.start("Cleaning up boilerplate");
      const srcPath = path.join(clientPath, "src");
      const publicPath = path.join(clientPath, "public");

      [
        path.join(srcPath, "App.css"),
        path.join(srcPath, "assets", "react.svg"),
        path.join(publicPath, "vite.svg"),
      ].forEach((f) => {
        if (fs.existsSync(f)) fs.rmSync(f, { force: true });
      });

      fs.writeFileSync(
        path.join(srcPath, "index.css"),
        `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
`
      );
      s.stop(chalk.green("✓") + " Boilerplate cleaned");

      s.start("Writing App.jsx");
      fs.writeFileSync(
        path.join(srcPath, "App.jsx"),
        `function App() {
  return (
    <div>
      <h1>${projectname}</h1>
    </div>
  );
}

export default App;
`
      );
      s.stop(chalk.green("✓") + " App.jsx written");

      s.start("Writing main.jsx");
      fs.writeFileSync(
        path.join(srcPath, "main.jsx"),
        `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`
      );
      s.stop(chalk.green("✓") + " main.jsx written");

      
    console.log();
    clack.outro(chalk.green("Flarex set up everything for you"))
    console.log()
    console.log(chalk.dim("SUMMARY - Flarex didn't created '.env'. It sets type to module in 'package.json'. Flarex created and configured '.gitignore' and you'll not push node_modules to github. Its Better You LOOK Around a bit and Check the DIR. Flarex Installed Cors, dotenv and express. You are ready to code without wasting 30min in setting up files!"))
    console.log()
const FinalPath = path.join(os.homedir(),"FlarexProjects",safeName)
console.log(`Flarex created ${safeName} at ${FinalPath}. That's where Flarex stores all projects and it gets organized there!`)
console.log()
    console.log()


const projects = readProjects();

projects.projects.push({
  name: projectname,
  safeName: safeName,
  path: FullPath,
  template: template,
  status: "active",
  git: { initialized: false, remote: null },
  devStatus: "in-development",
  version: "0.1.0",
  issues: [],
});

writeProjects(projects);
    } // MERN



if (template === "Express") {
      const safeName = projectname.trim().replace(/\s+/g, "-").toLowerCase();
      const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
      const FullPath = path.join(FLAREX_DIR, safeName);

      fs.mkdirSync(FullPath, { recursive: true });

      const s = clack.spinner();

      // ---------------- EXPRESS ----------------
      console.log();
      clack.log.step(chalk.bold("Flarex setting up Express project"));

      s.start("Initializing package.json");
      await execa("npm", ["init", "-y"], { stdio: "ignore", cwd: FullPath });
      s.stop(chalk.green("✓") + " package.json initialized");

      s.start("Installing dependencies");
      await execa("npm", ["install", "express", "cors", "dotenv"], {
        stdio: "ignore",
        cwd: FullPath,
      });
      s.stop(chalk.green("✓") + " Dependencies installed (express, cors, dotenv)");

      s.start("Configuring package.json");
      const packageJsonPath = path.join(FullPath, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.name = safeName;
      packageJson.type = "module";
      packageJson.description = "Made with Flarex";
      packageJson.scripts = {
        ...packageJson.scripts,
        dev: "node index.js",
        start: "node index.js",
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      s.stop(chalk.green("✓") + " package.json configured");

      s.start("Writing .gitignore");
      fs.writeFileSync(
        path.join(FullPath, ".gitignore"),
        `node_modules/
dist/
.env
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
      );
      s.stop(chalk.green("✓") + " .gitignore written");

      s.start("Writing index.js");
      fs.writeFileSync(
        path.join(FullPath, "index.js"),
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

      s.stop(chalk.green("✓") + " index.js written");

console.log()
console.log(chalk.green("Flarex set up everything for you"))
console.log()
const FinalPath = path.join(os.homedir(),"FlarexProjects",safeName)
console.log(`Flarex created ${safeName} at ${FinalPath}. That's where Flarex stores all projects and it gets organized there!`)
console.log()


console.log()
const projects = readProjects();

projects.projects.push({
  name: projectname,
  safeName: safeName,
  path: FullPath,
  template: template,
  status: "active",
  git: { initialized: false, remote: null },
  devStatus: "in-development",
  version: "0.1.0",
  issues: [],
});
writeProjects(projects);
    } // EXORESS 




if (template === "React") {
      const safeName = projectname.trim().replace(/\s+/g, "-").toLowerCase();
      const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
      const FullPath = path.join(FLAREX_DIR, safeName);

      fs.mkdirSync(FullPath, { recursive: true });

      const s = clack.spinner();

      // ---------------- CLIENT ----------------
      console.log();
      clack.log.step(chalk.bold("Flarex setting up client"));

      s.start("Scaffolding Vite + React app");
      await execa(
        "npm",
        ["create", "vite@latest", ".", "--", "--template", "react", "--force"],
        { stdio: "ignore", cwd: FullPath }
      );
      s.stop(chalk.green("✓") + " Vite + React app created");

      s.start("Installing dependencies");
      await execa("npm", ["install"], { stdio: "ignore", cwd: FullPath });
      await execa("npm", ["install", "axios", "react-router-dom"], {
        stdio: "ignore",
        cwd: FullPath,
      });
      s.stop(chalk.green("✓") + " Dependencies installed (axios, react-router-dom)");

      s.start("Cleaning up boilerplate");
      const srcPath = path.join(FullPath, "src");
      const publicPath = path.join(FullPath, "public");

      [
        path.join(srcPath, "App.css"),
        path.join(srcPath, "assets", "react.svg"),
        path.join(publicPath, "vite.svg"),
      ].forEach((f) => {
        if (fs.existsSync(f)) fs.rmSync(f, { force: true });
      });

      fs.writeFileSync(
        path.join(srcPath, "index.css"),
        `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
`
      );
      s.stop(chalk.green("✓") + " Boilerplate cleaned");

      s.start("Writing App.jsx");
      fs.writeFileSync(
        path.join(srcPath, "App.jsx"),
        `function App() {
  return (
    <div>
      <h1>${projectname}</h1>
    </div>
  );
}

export default App;
`
      );
      s.stop(chalk.green("✓") + " App.jsx written");

      s.start("Writing main.jsx");
      fs.writeFileSync(
        path.join(srcPath, "main.jsx"),
        `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`
      );
      s.stop(chalk.green("✓") + " main.jsx written");

console.log()
console.log(chalk.green("Flarex set up everything for you"))
console.log()
const FinalPath = path.join(os.homedir(),"FlarexProjects",safeName)
console.log(`Flarex created ${safeName} at ${FinalPath}. That's where Flarex stores all projects and it gets organized there!`)
console.log()

console.log()

const projects = readProjects();

projects.projects.push({
  name: projectname,
  safeName: safeName,
  path: FullPath,
  template: template,
  status: "active",
  git: { initialized: false, remote: null },
  devStatus: "in-development",
  version: "0.1.0",
  issues: [],
});

writeProjects(projects);

    } // REACT 

  }); // PARENT CLOSING flare create



// SYNC CMD
program
  .command("sync")
  .description("Sync git status for all projects")
  .action(async () => {
    const s = clack.spinner();
    s.start("Syncing all projects");
    await syncAllProjectsGit();
    await syncAllProjects()
    s.stop(chalk.green("✓") + " All projects synced");
    console.log()
  });


//  SWITCH CMD
program
  .command("switch [projectName]")
  .description("Switch to a Flarex project")
  .action(async (projectName) => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Switch"));

    const projects = readProjects();

    if (!projects.projects || projects.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    let selected;

    if (projectName) {
      // Direct project name provided
      const project = projects.projects.find(
        (p) => p.safeName === projectName.toLowerCase()
      );

      if (!project) {
        console.log();
        clack.log.error(`Project "${projectName}" not found`);
        console.log();
        return;
      }

      selected = project.path;
      console.log();
      clack.log.step(`Switching to ${chalk.bold(project.name)}`);
    } else {
      // Show selection menu
      console.log();
      selected = await clack.select({
        message: "Select a project to switch to",
        options: projects.projects.map((p) => ({
          value: p.path,
          label: p.name,
        })),
      });
    }

    console.log();
    const shell = process.platform === "win32" ? "cmd.exe" : "bash";
    await execa(shell, { cwd: selected, stdio: "inherit" });
  });




// LIST CMD
program
  .command("list")
  .description("List all Flarex projects")
  .action(async () => {
    await syncAllProjects()
    await syncAllProjectsGit()
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Projects"));

    const projects = readProjects();

    if (!projects.projects || projects.projects.length === 0) {
      console.log();
      clack.log.warn("No projects found");
      console.log();
      return;
    }

    console.log();
    projects.projects.forEach((project, index) => {
      const statusColor = project.status === "active" ? chalk.green : chalk.gray;
      const statusBadge = project.status === "active" ? "● Active" : "○ Inactive";

      const gitStatus = project.git.initialized
        ? chalk.green("✓ Git")
        : chalk.gray("○ No Git");

      const gitRemote = project.git.remote ? chalk.dim(`(${project.git.remote})`) : "";

      console.log(
        chalk.bold(`${index + 1}. ${project.name}`) +
          chalk.dim(` [${project.template || "Unknown"}]`)
      );
      console.log(chalk.dim(`   Path: ${project.path}`));
      console.log(statusColor(`   ${statusBadge}`) + chalk.dim(` | ${gitStatus} ${gitRemote}`));
      console.log();
    });

    clack.outro(`Total: ${projects.projects.length} project${projects.projects.length !== 1 ? "s" : ""}`);
  });

// ADD

program
  .command("add <folderName>")
  .description("Add existing project from home to FlarexProjects")
  .action(async (folderName) => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Add"));

    const homePath = os.homedir();
    const sourcePath = path.join(homePath, folderName);
    const FLAREX_DIR = path.join(homePath, "FlarexProjects");
    const safeName = folderName.trim().replace(/\s+/g, "-").toLowerCase();
    const destPath = path.join(FLAREX_DIR, safeName);

    const s = clack.spinner();

    console.log();
    s.start("Checking project folder");
    if (!fs.existsSync(sourcePath)) {
      console.log();
      clack.log.error(`Project "${folderName}" not found in home directory`);
      console.log();
      return;
    }
    s.stop(chalk.green("✓") + " Project found");

    console.log();
    s.start("Moving project to FlarexProjects");
    fs.mkdirSync(FLAREX_DIR, { recursive: true });
    if (fs.existsSync(destPath)) {
      clack.log.error(`Project already exists at ${destPath}`);
      console.log();
      return;
    }
    fs.renameSync(sourcePath, destPath);
    s.stop(chalk.green("✓") + " Project moved");

    console.log();
    s.start("Detecting template");
    let template = "Unknown";
    const hasServer = fs.existsSync(path.join(destPath, "server"));
    const hasClient = fs.existsSync(path.join(destPath, "client"));
    const hasSrc = fs.existsSync(path.join(destPath, "src"));

    if (hasServer && hasClient) {
      template = "MERN";
    } else if (hasSrc && !hasServer) {
      template = "React";
    } else if (fs.existsSync(path.join(destPath, "package.json"))) {
      template = "Express";
    }
    s.stop(chalk.green("✓") + ` Template detected: ${template}`);

    console.log();
    s.start("Checking git status");
    let gitInitialized = false;
    let gitRemote = null;

    const gitDir = path.join(destPath, ".git");
    if (fs.existsSync(gitDir)) {
      gitInitialized = true;
      try {
        const remote = await execa("git", ["config", "--get", "remote.origin.url"], {
          cwd: destPath,
        });
        gitRemote = remote.stdout.trim();
      } catch {
        gitRemote = null;
      }
    }
    s.stop(chalk.green("✓") + ` Git: ${gitInitialized ? "✓" : "○"}`);

    console.log();
    s.start("Registering project");
    const projects = readProjects();
projects.projects.push({
  name: projectname,
  safeName: safeName,
  path: FullPath,
  template: template,
  status: "active",
  git: { initialized: false, remote: null },
  devStatus: "in-development",
  version: "0.1.0",
  issues: [],
});
    writeProjects(projects);
    s.stop(chalk.green("✓") + " Project registered");

    console.log();
    clack.outro(chalk.green(`"${folderName}" added as ${template}`));
  });

// REMOVE
program
  .command("remove <projectName>")
  .description("Remove project from Flarex and move back to home")
  .action(async (projectName) => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Remove"));

    const projects = readProjects();
    const project = projects.projects.find(
      (p) => p.safeName === projectName.toLowerCase()
    );

    if (!project) {
      console.log();
      clack.log.error(`Project "${projectName}" not found`);
      console.log();
      return;
    }

    console.log();
    clack.log.step(`Removing ${chalk.bold(project.name)}`);
    console.log(chalk.dim(`Path: ${project.path}`));
    console.log();

    const confirmed = await clack.confirm({
      message: "Move project back to home and remove from Flarex?",
    });

    if (!confirmed) {
      console.log();
      clack.cancel("Remove cancelled");
      console.log();
      return;
    }

    const s = clack.spinner();

    console.log();
    s.start("Moving project to home");
    const homePath = os.homedir();
    const destPath = path.join(homePath, project.name);

    if (fs.existsSync(destPath)) {
      console.log();
      clack.log.error(`"${project.name}" already exists in home directory`);
      console.log();
      return;
    }

    fs.renameSync(project.path, destPath);
    s.stop(chalk.green("✓") + " Project moved to home");

    console.log();
    s.start("Updating project list");
    const updatedProjects = projects.projects.filter(
      (p) => p.safeName !== projectName.toLowerCase()
    );
    writeProjects({ projects: updatedProjects });
    s.stop(chalk.green("✓") + " Project removed from Flarex");

    console.log();
    clack.outro(chalk.green(`"${project.name}" moved back to home`));
  });






// HELPER CMDS
program
  .command("gemini <apikey>")
  .description("Set your Gemini API key")
  .action(async (apikey) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Gemini"));

    const s = clack.spinner();

    console.log();
    s.start("Updating API key");

    try {
      const configPath = path.join(os.homedir(), "FlarexProjects","flarexConfig.json");
      
      if (!fs.existsSync(configPath)) {
        throw new Error("Config file not found");
      }

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      config.user.geminikey = apikey;
      config.user.isgeminikey = true;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      s.stop(chalk.green("✓") + " Gemini API key set");
      console.log();
      clack.outro("API key updated");
    } catch (err) {
      s.stop(chalk.red("✗") + " Failed to update API key");
      console.log();
      clack.log.error(err.message);
      console.log();
    }
  });

program
  .command("name <userName>")
  .description("Set your name")
  .action(async (userName) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Profile"));

    const s = clack.spinner();

    console.log();
    s.start("Updating name");

    try {
      const configPath = path.join(os.homedir(),"FlarexProjects", "flarexConfig.json");
      
      if (!fs.existsSync(configPath)) {
        throw new Error("Config file not found");
      }

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      config.user.name = userName;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      s.stop(chalk.green("✓") + " Name set");
      console.log();
      clack.outro(`Welcome, ${chalk.bold(userName)}`);
    } catch (err) {
      s.stop(chalk.red("✗") + " Failed to update name");
      console.log();
      clack.log.error(err.message);
      console.log();
    }
  });


program
  .command("theme")
  .description("Change your Flarex theme")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Theme"));

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    const selectedTheme = await clack.select({
      message: "Pick your Flarex theme",
      options: [
        { value: ["cyan", "magenta"], label: "Cyberpunk" },
        { value: ["green", "yellow"], label: "Matrix" },
        { value: ["blue", "white"], label: "Ocean" },
        { value: ["red", "yellow"], label: "Fire" },
        { value: ["magentaBright", "cyanBright"], label: "Neon" },
        { value: ["gray"], label: "Minimal" },
      ],
      initialValue: config.user.theme,
    });

    const s = clack.spinner();

    s.start("Updating theme");
    config.user.theme = selectedTheme;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    s.stop(chalk.green("✓") + " Theme updated");

    console.log();
    clack.outro(chalk.green("Theme applied"));
    await sleep(2000)
    banner()
  });



program
  .command("recover")
  .description("Recover Flarex after missing files/folders")
  .action(async () => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Recover"));

    const s = clack.spinner();

    console.log();
    s.start("Running recovery");
    await execa("node", ["bootstrap.js"], { stdio: "inherit" });
    s.stop(chalk.green("✓") + " Recovery complete");

    console.log();
    clack.outro("Flarex is ready");
  });




// AI PART

program
  .command("error")
  .description("Auto-detect error or prompt to paste")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    if (!config.user.isgeminikey || !config.user.geminikey) {
      console.log();
      clack.log.error("No Gemini API key set. Run: flarex gemini <apikey>");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Error"));

    const s = clack.spinner();

    s.start("Scanning history");
    let errorMsg = await getLatestError();

    if (!errorMsg) {
      s.stop(chalk.yellow("○") + " Nothing found in history");

      errorMsg = await clack.text({
        message: "Paste your error",
        placeholder: "Error message...",
      });

      if (!errorMsg) {
        clack.cancel("No error provided");
        return;
      }
    } else {
      s.stop(chalk.green("✓") + " Error found");
    }

    let currentProject = null;
    if (fs.existsSync(PROJECTS_PATH)) {
      const projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));
      currentProject = projectsData.projects.find((p) =>
        process.cwd().startsWith(p.path)
      );
    }

    s.start("Analyzing");

    const systemPrompt = `You are Flarex, a CLI dev assistant running inside a terminal. Sharp, direct, no fluff.

User: ${config.user.name}
Project: ${currentProject ? `${currentProject.name} (${currentProject.template})` : "None detected"}

IMPORTANT RULES:
- This is a raw terminal, not a code editor. Never use markdown code fences like \`\`\`javascript. Never use markdown formatting of any kind.
- Write plain text only. If you show code, write it as plain lines with no backticks or syntax highlighting markers.
- Keep it short. No greetings, no sign-offs.

Read the error below and respond in exactly this structure:

ERROR
One line summary of what broke.

SAFE FIX
Tell the user to check their own code first — the specific line, function, or logic likely responsible. Be specific about what to look for.

HARD FIX
If the safe fix doesn't apply, give the exact terminal commands to run — reinstalling a package, updating a dependency, deleting node_modules and reinstalling, etc. Only include this if genuinely relevant to the error.

Error:
${errorMsg}
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${config.user.geminikey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) {
        s.stop(chalk.red("✗") + " No response");
        return;
      }

      s.stop(chalk.green("✓") + " Analyzed");
      console.log();

      const sections = text.split(/\n(?=ERROR|SAFE FIX|HARD FIX)/);
      sections.forEach((section) => {
        const [label, ...rest] = section.split("\n");
        const body = rest.join("\n").trim();
        if (!body) return;

        if (label.startsWith("ERROR")) {
          console.log(chalk.bold.red("ERROR"));
          console.log(chalk.white(body));
          console.log();
        } else if (label.startsWith("SAFE FIX")) {
          console.log(chalk.bold.cyan("SAFE FIX"));
          console.log(chalk.white(body));
          console.log();
        } else if (label.startsWith("HARD FIX")) {
          console.log(chalk.bold.magenta("HARD FIX"));
          console.log(chalk.white(body));
          console.log();
        }
      });

      clack.outro(chalk.green("RUN 'flarex fix' so Flarex can tell you the exact error!"));
    } catch (err) {
      s.stop(chalk.red("✗") + " Request failed");
      clack.log.error(err.message);
    }
  });

program
  .command("ask <question...>")
  .description("Ask Flarex anything — setup, troubleshooting, or general questions")
  .action(async (questionArray) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    if (!config.user.isgeminikey || !config.user.geminikey) {
      console.log();
      clack.log.error("No Gemini API key set. Run: flarex gemini <apikey>");
      console.log();
      return;
    }

    const question = questionArray.join(" ");

    if (!question.trim()) {
      console.log();
      clack.log.error("Please provide a question");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Ask"));

    const s = clack.spinner();

    const loadingStates = [
      "Flarex is thinking",
      "Flarex is digging through docs",
      "Flarex is connecting the dots",
      "Flarex is almost there",
    ];
    let stateIndex = 0;

    s.start(loadingStates[0]);
    const loadingInterval = setInterval(() => {
      stateIndex = (stateIndex + 1) % loadingStates.length;
      s.message(loadingStates[stateIndex]);
    }, 1200);

    let projectsData = { projects: [] };
    if (fs.existsSync(PROJECTS_PATH)) {
      projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));
    }

    const systemPrompt = `You are Flarex, a CLI assistant running inside a developer's terminal. You are NOT Gemini and must never mention Gemini, Google, or any underlying model. You are Flarex — speak as Flarex.

USER CONFIG:
${JSON.stringify(config, null, 2)}

USER'S PROJECTS:
${JSON.stringify(projectsData, null, 2)}

FLAREX DOCUMENTATION:
${FLAREX_DOCS}

RULES:
- This is a raw terminal, not a code editor. Never use markdown code fences like triple backticks. Never use markdown formatting.
- Write plain text only.
- Answer Flarex-related questions first with priority — setup, commands, troubleshooting, config, projects.
- For general programming questions (what is JavaScript, how async works, etc), answer briefly and clearly.
- Keep answers short and direct. No greetings, no sign-offs, no fluff.
- If asked who you are or what model you use, say you are Flarex, nothing else.

Question:
${question}
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.user.geminikey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      clearInterval(loadingInterval);

      if (!text) {
        s.stop(chalk.red("✗") + " No response");
        console.log();
        return;
      }

      s.stop(chalk.green("✓") + " Flarex answered");
      console.log();
      console.log(boxen(chalk.white(text)))
      console.log();

      clack.outro(chalk.green("Done"));
    } catch (err) {
      clearInterval(loadingInterval);
      s.stop(chalk.red("✗") + " Request failed");
      console.log();
      clack.log.error(err.message);
      console.log();
    }
  });



program
  .command("fix")
  .description("Pick a project and file to analyze and fix")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    if (!config.user.isgeminikey || !config.user.geminikey) {
      console.log();
      clack.log.error("No Gemini API key set. Run: flarex gemini <apikey>");
      console.log();
      return;
    }

    if (!fs.existsSync(PROJECTS_PATH)) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Fix"));

    const projectPath = await clack.select({
      message: "Select a project",
      options: projectsData.projects.map((p) => ({
        value: p.path,
        label: p.name,
      })),
    });

    let currentDir = projectPath;
    let selectedFile = null;

    while (!selectedFile) {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });

      const filtered = items.filter(
        (item) => !item.name.startsWith(".") && item.name !== "node_modules"
      );

      if (filtered.length === 0) {
        clack.log.warn("Empty folder");
        break;
      }

      const options = filtered.map((item) => ({
        value: item.name,
        label: item.isDirectory() ? chalk.blue(`📁 ${item.name}`) : `📄 ${item.name}`,
      }));

      if (currentDir !== projectPath) {
        options.unshift({ value: "..", label: chalk.dim("← Back") });
      }

      const choice = await clack.select({
        message: `Browsing: ${path.relative(projectPath, currentDir) || "/"}`,
        options,
      });

      if (choice === "..") {
        currentDir = path.dirname(currentDir);
        continue;
      }

      const fullPath = path.join(currentDir, choice);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        currentDir = fullPath;
      } else {
        selectedFile = fullPath;
      }
    }

    if (!selectedFile) {
      clack.cancel("No file selected");
      return;
    }

    const fileStat = fs.statSync(selectedFile);
    let fileContent = fs.readFileSync(selectedFile, "utf8");

    if (fileStat.size > 50000) {
      const sizeKB = Math.round(fileStat.size / 1024);
      const proceed = await clack.confirm({
        message: `File is large (${sizeKB}KB). Read first 3000 lines only?`,
      });

      if (!proceed) {
        clack.cancel("Cancelled");
        return;
      }

      fileContent = fileContent.split("\n").slice(0, 3000).join("\n");
    }

    const mode = await clack.select({
      message: "What kind of check?",
      options: [
        { value: "quick", label: "Quick check (syntax, indentation, brackets)" },
        { value: "full", label: "Full review (logic, bugs, best practices)" },
      ],
    });

    const s = clack.spinner();

    const loadingStates = mode === "quick"
      ? ["Flarex is scanning syntax", "Flarex is checking brackets", "Flarex is checking indentation"]
      : ["Flarex is reading code", "Flarex is analyzing logic", "Flarex is checking patterns"];

    let stateIndex = 0;
    s.start(loadingStates[0]);
    const loadingInterval = setInterval(() => {
      stateIndex = (stateIndex + 1) % loadingStates.length;
      s.message(loadingStates[stateIndex]);
    }, 1200);

    const fileName = path.basename(selectedFile);

    const quickPrompt = `You are Flarex, a CLI dev assistant running inside a terminal. You are NOT Gemini and must never mention Gemini, Google, or any model name — you are Flarex.

RULES:
- This is a raw terminal. Never use markdown code fences or markdown formatting.
- Write plain text only.
- ONLY check for: syntax errors, unclosed/stray brackets ({[, mismatched parens, indentation issues, missing semicolons if relevant to the language.
- Do NOT review logic, architecture, or best practices — this is a fast structural scan only.
- Keep it short. List issues by line number if possible. If nothing found, say so in one line.

File: ${fileName}

Code:
${fileContent}
`;

    const fullPrompt = `You are Flarex, a CLI dev assistant running inside a terminal. You are NOT Gemini and must never mention Gemini, Google, or any model name — you are Flarex.

RULES:
- This is a raw terminal. Never use markdown code fences or markdown formatting.
- Write plain text only.
- Review this code for bugs, logic issues, and best practice violations.
- Be concise. Point out real issues only, not style nitpicks.
- Structure as: ISSUES FOUND, then SUGGESTED FIXES.

File: ${fileName}

Code:
${fileContent}
`;

    const systemPrompt = mode === "quick" ? quickPrompt : fullPrompt;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.user.geminikey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      clearInterval(loadingInterval);

      if (!text) {
        s.stop(chalk.red("✗") + " No response from Flarex");
        console.log();
        return;
      }

      s.stop(chalk.green("✓") + " Analysis complete");
      console.log();
      console.log(chalk.bold.cyan(fileName));
      console.log();
      console.log(chalk.white(text));
      console.log();

      clack.outro(chalk.green("Done"));
    } catch (err) {
      clearInterval(loadingInterval);
      s.stop(chalk.red("✗") + " Request failed");
      console.log();
      clack.log.error(err.message);
      console.log();
    }
  });




// GIT CMDS
program
  .command("ship <targetPath> [branch]")
  .description("Add, commit, and push a project to GitHub")
  .action(async (targetPath, branch) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    if (!fs.existsSync(PROJECTS_PATH)) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Ship"));

    const projectPath = await clack.select({
      message: "Select a project",
      options: projectsData.projects.map((p) => ({
        value: p.path,
        label: p.name,
      })),
    });

    if (!fs.existsSync(projectPath)) {
      console.log();
      clack.log.error("Project folder no longer exists");
      console.log();
      return;
    }

    const addPath = targetPath;
    const targetBranch = branch || "main";

    const s = clack.spinner();

    console.log();
    s.start("Checking git status");
    const gitDir = path.join(projectPath, ".git");

    if (!fs.existsSync(gitDir)) {
      s.stop(chalk.red("✗") + " Git not initialized");
      console.log();
      clack.log.error(`Run this first: cd ${projectPath} && git init`);
      console.log();
      return;
    }
    s.stop(chalk.green("✓") + " Git initialized");

    s.start("Checking remote");
    let hasRemote = false;
    try {
      const remote = await execa("git", ["remote", "get-url", "origin"], {
        cwd: projectPath,
      });
      hasRemote = !!remote.stdout.trim();
    } catch {
      hasRemote = false;
    }

    if (!hasRemote) {
      s.stop(chalk.red("✗") + " No remote found");
      console.log();
      clack.log.error("No remote 'origin' set. Run: git remote add origin <url>");
      console.log();
      return;
    }
    s.stop(chalk.green("✓") + " Remote found");

    if (addPath !== ".") {
      const fullTargetPath = path.join(projectPath, addPath);
      if (!fs.existsSync(fullTargetPath)) {
        console.log();
        clack.log.error(`Path not found: ${addPath}`);
        console.log();
        return;
      }
    }

    s.start("Checking for changes");
    const statusResult = await execa("git", ["status", "--porcelain", addPath], {
      cwd: projectPath,
    });

    if (!statusResult.stdout.trim()) {
      s.stop(chalk.yellow("○") + " No changes to ship");
      console.log();
      clack.outro("Nothing to commit");
      return;
    }
    s.stop(chalk.green("✓") + ` Changes found in ${addPath}`);

    s.start(`Adding ${addPath}`);
    await execa("git", ["add", addPath], { cwd: projectPath });
    s.stop(chalk.green("✓") + " Files staged");

    let commitMessage = await clack.text({
      message: "Enter commit message",
      placeholder: "Leave empty to auto-generate",
    });

    // Auto-generate if empty
    if (!commitMessage || !commitMessage.trim()) {
      if (!config.user.isgeminikey || !config.user.geminikey) {
        console.log();
        clack.log.error("No Gemini API key set. Run: flarex gemini <apikey>");
        console.log();
        return;
      }

      s.start("Flarex is writing your commit message");

      const diffResult = await execa("git", ["diff", "--cached"], {
        cwd: projectPath,
      });
      const diff = diffResult.stdout.slice(0, 8000); // cap diff size for token safety

      const commitPrompt = `You are Flarex, a CLI dev assistant. Generate a single-line git commit message based on this diff.

RULES:
- Use conventional commit style: feat, fix, chore, refactor, docs, style, perf, test
- One line only, no explanation, no markdown, no quotes
- Be specific about what changed, not generic like "update code"
- Max 72 characters

Diff:
${diff}
`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.user.geminikey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: commitPrompt }] }],
            }),
          }
        );

        const data = await response.json();
        const generated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!generated) {
          s.stop(chalk.red("✗") + " Could not generate message");
          console.log();
          clack.log.error("Try entering a commit message manually");
          console.log();
          return;
        }

        s.stop(chalk.green("✓") + " Message generated");
        console.log();
        console.log(chalk.dim("Generated: ") + chalk.white(generated));
        console.log();

        const useGenerated = await clack.confirm({
          message: "Use this commit message?",
        });

        if (!useGenerated) {
          const manualMessage = await clack.text({
            message: "Enter commit message",
          });

          if (!manualMessage) {
            clack.cancel("Ship cancelled");
            return;
          }

          commitMessage = manualMessage;
        } else {
          commitMessage = generated;
        }
      } catch (err) {
        s.stop(chalk.red("✗") + " Failed to generate message");
        console.log();
        clack.log.error(err.message);
        console.log();
        return;
      }
    }

    s.start("Committing");
    try {
      await execa("git", ["commit", "-m", commitMessage], { cwd: projectPath });
      s.stop(chalk.green("✓") + " Committed");
    } catch (err) {
      s.stop(chalk.red("✗") + " Commit failed");
      console.log();
      clack.log.error(err.message);
      console.log();
      return;
    }

    s.start("Checking branch");
    const currentBranchResult = await execa("git", ["branch", "--show-current"], {
      cwd: projectPath,
    });
    const currentBranch = currentBranchResult.stdout.trim();

    if (currentBranch !== targetBranch) {
      const branchListResult = await execa("git", ["branch", "--list", targetBranch], {
        cwd: projectPath,
      });
      const branchExists = !!branchListResult.stdout.trim();

      if (branchExists) {
        await execa("git", ["checkout", targetBranch], { cwd: projectPath });
      } else {
        await execa("git", ["checkout", "-b", targetBranch], { cwd: projectPath });
      }
    }
    s.stop(chalk.green("✓") + ` On branch ${targetBranch}`);

    s.start(`Pushing to ${targetBranch}`);
    try {
      await execa("git", ["push", "-u", "origin", targetBranch], { cwd: projectPath });
      s.stop(chalk.green("✓") + " Pushed");
    } catch (err) {
      s.stop(chalk.red("✗") + " Push failed");
      console.log();
      clack.log.error(err.message);
      console.log();
      return;
    }

    console.log();
    clack.outro(chalk.green(`Shipped to ${targetBranch}`));
  });


// LOG CMDS

program
  .command("log")
  .description("Log what you shipped today, or view week/month summaries")
  .option("-w, --week", "Show this week's summary")
  .option("-m, --month", "Show this month's summary")
  .option("-p, --project <name>", "Filter summary by project")
  .action(async (options) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    // ---------------- SUMMARY MODE ----------------
    if (options.week || options.month) {
      const logsData = readLogs();

      if (!logsData.logs || logsData.logs.length === 0) {
        console.log();
        clack.log.warn("No logs found yet");
        console.log();
        return;
      }

      const now = new Date();
      let rangeStart;
      let rangeLabel;

      if (options.week) {
        rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - 7);
        rangeLabel = "This Week";
      } else {
        rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - 30);
        rangeLabel = "This Month";
      }

      let filtered = logsData.logs.filter(
        (l) => new Date(l.timestamp) >= rangeStart
      );

      if (options.project) {
        filtered = filtered.filter(
          (l) => l.project.toLowerCase() === options.project.toLowerCase()
        );
      }

      console.log();
      clack.intro(chalk.bold.hex("#f97316")(`Flarex Log — ${rangeLabel}`));

      if (filtered.length === 0) {
        console.log();
        clack.log.warn("No entries in this range");
        console.log();
        return;
      }

      // Stats
      const totalHours = filtered.reduce((sum, l) => sum + (l.hours || 0), 0);
      const completed = filtered.filter((l) => l.status === "completed").length;
      const inProgress = filtered.filter((l) => l.status === "in-progress").length;
      const blocked = filtered.filter((l) => l.status === "blocked").length;

      const projectCounts = {};
      filtered.forEach((l) => {
        projectCounts[l.project] = (projectCounts[l.project] || 0) + 1;
      });

      console.log();
      clack.log.step(chalk.bold("Overview"));
      console.log(chalk.white(`  Entries: ${filtered.length}`));
      console.log(chalk.white(`  Hours: ${totalHours}h`));
      console.log(
        chalk.green(`  Completed: ${completed}`) +
          chalk.dim("  ") +
          chalk.yellow(`In Progress: ${inProgress}`) +
          chalk.dim("  ") +
          chalk.red(`Blocked: ${blocked}`)
      );

      console.log();
      clack.log.step(chalk.bold("By Project"));
      Object.entries(projectCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([proj, count]) => {
          console.log(chalk.white(`  ${proj}`) + chalk.dim(` — ${count} entries`));
        });

      console.log();
      clack.log.step(chalk.bold("Timeline"));
      console.log();

      const sorted = [...filtered].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      sorted.forEach((entry) => {
        const statusColor =
          entry.status === "completed"
            ? chalk.green
            : entry.status === "blocked"
            ? chalk.red
            : chalk.yellow;

        console.log(
          chalk.dim(`  ${entry.date}`) +
            chalk.bold(`  ${entry.project}`) +
            statusColor(`  [${entry.status}]`)
        );
        console.log(chalk.dim(`    ${entry.what}`));
        if (entry.hours) console.log(chalk.dim(`    ${entry.hours}h`));
        console.log();
      });

      clack.outro(chalk.green(`${filtered.length} entries in ${rangeLabel.toLowerCase()}`));
      return;
    }

    // ---------------- ADD LOG MODE ----------------
    if (!fs.existsSync(PROJECTS_PATH)) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found. Create one first: flarex create");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Log"));

    const { project, what, hours, status } = await clack.group(
      {
        project: () =>
          clack.select({
            message: "Which project?",
            options: projectsData.projects.map((p) => ({
              value: p.name,
              label: p.name,
            })),
          }),
        what: () =>
          clack.text({
            message: "What did you ship today?",
            placeholder: "Fixed OCR accuracy, deployed v1.2...",
            validate: (v) => !v && "This field is required",
          }),
        hours: () =>
          clack.text({
            message: "How many hours? (optional)",
            placeholder: "0",
          }),
        status: () =>
          clack.select({
            message: "Status",
            options: [
              { value: "completed", label: "Completed" },
              { value: "in-progress", label: "In Progress" },
              { value: "blocked", label: "Blocked" },
            ],
          }),
      },
      {
        onCancel: () => {
          clack.cancel("Log cancelled");
          process.exit(0);
        },
      }
    );

    const s = clack.spinner();

    s.start("Saving log");

    const logsData = readLogs();
    const now = new Date();

    logsData.logs.push({
      date: now.toISOString().split("T")[0],
      project: project,
      what: what,
      hours: hours ? parseFloat(hours) : 0,
      status: status,
      timestamp: now.toISOString(),
    });

    writeLogs(logsData);

    s.stop(chalk.green("✓") + " Log saved");

    const today = now.toISOString().split("T")[0];
    const todayLogs = logsData.logs.filter((l) => l.date === today);

    console.log();
    clack.log.step(chalk.bold(`Today's entries (${todayLogs.length})`));
    console.log();

    todayLogs.forEach((entry, i) => {
      const statusColor =
        entry.status === "completed"
          ? chalk.green
          : entry.status === "blocked"
          ? chalk.red
          : chalk.yellow;

      console.log(chalk.bold(`${i + 1}. ${entry.project}`));
      console.log(chalk.dim(`   ${entry.what}`));
      console.log(
        statusColor(`   ${entry.status}`) +
          chalk.dim(entry.hours ? ` | ${entry.hours}h` : "")
      );
      console.log();
    });

    clack.outro(chalk.green("Keep shipping"));
  });



// ---------------- ISSUE ADD ----------------
program
  .command("issue-add")
  .description("Add issues to a project")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Issue"));

    const safeName = await clack.select({
      message: "Select a project",
      options: projectsData.projects.map((p) => ({
        value: p.safeName,
        label: p.name,
      })),
    });

    const project = projectsData.projects.find((p) => p.safeName === safeName);

    if (!project.issues) project.issues = [];

    let addMore = true;

    while (addMore) {
      const title = await clack.text({
        message: "Issue title",
        placeholder: "Add weather API integration...",
        validate: (v) => !v && "Title is required",
      });

      if (!title) break;

      const nextId =
        project.issues.length > 0
          ? Math.max(...project.issues.map((i) => i.id)) + 1
          : 1;

      project.issues.push({
        id: nextId,
        title: title,
        status: "todo",
        createdAt: new Date().toISOString(),
      });

      console.log(chalk.green("✓") + ` Issue #${nextId} added`);

      addMore = await clack.confirm({
        message: "Add another issue?",
      });
    }

    writeProjects(projectsData);

    console.log();
    clack.outro(chalk.green(`Issues saved for ${project.name}`));
  });

// ---------------- ISSUE CLOSE ----------------
program
  .command("issue-close")
  .description("Close an open issue")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Issue Close"));

    const safeName = await clack.select({
      message: "Select a project",
      options: projectsData.projects.map((p) => ({
        value: p.safeName,
        label: p.name,
      })),
    });

    const project = projectsData.projects.find((p) => p.safeName === safeName);
    const openIssues = (project.issues || []).filter((i) => i.status === "todo");

    if (openIssues.length === 0) {
      console.log();
      clack.log.warn("No open issues");
      console.log();
      return;
    }

    const issueId = await clack.select({
      message: "Select an issue to close",
      options: openIssues.map((i) => ({
        value: i.id,
        label: `#${i.id} — ${i.title}`,
      })),
    });

    const issue = project.issues.find((i) => i.id === issueId);
    issue.status = "done";
    issue.closedAt = new Date().toISOString();

    writeProjects(projectsData);

    console.log();
    clack.outro(chalk.green(`Issue #${issueId} closed`));
  });

// ---------------- ISSUE OPEN ----------------
program
  .command("issue-open")
  .description("Reopen a closed issue")
  .action(async () => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();

    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log();
      clack.log.error("No projects found");
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Issue Open"));

    const safeName = await clack.select({
      message: "Select a project",
      options: projectsData.projects.map((p) => ({
        value: p.safeName,
        label: p.name,
      })),
    });

    const project = projectsData.projects.find((p) => p.safeName === safeName);
    const closedIssues = (project.issues || []).filter((i) => i.status === "done");

    if (closedIssues.length === 0) {
      console.log();
      clack.log.warn("No closed issues");
      console.log();
      return;
    }

    const issueId = await clack.select({
      message: "Select an issue to reopen",
      options: closedIssues.map((i) => ({
        value: i.id,
        label: `#${i.id} — ${i.title}`,
      })),
    });

    const issue = project.issues.find((i) => i.id === issueId);
    issue.status = "todo";
    delete issue.closedAt;

    writeProjects(projectsData);

    console.log();
    clack.outro(chalk.green(`Issue #${issueId} reopened`));
  });

// ---------------- ISSUE LIST ----------------
program
  .command("issue-list <projectName>")
  .description("List all issues for a project")
  .action(async (projectName) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();
    const project = projectsData.projects.find(
      (p) => p.safeName === projectName.toLowerCase()
    );

    if (!project) {
      console.log();
      clack.log.error(`Project "${projectName}" not found`);
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")(`Issues — ${project.name}`));

    const issues = project.issues || [];

    if (issues.length === 0) {
      console.log();
      clack.log.warn("No issues yet");
      console.log();
      return;
    }

    console.log();
    issues.forEach((issue) => {
      const statusColor = issue.status === "done" ? chalk.green : chalk.yellow;
      const statusLabel = issue.status === "done" ? "✓ done" : "○ todo";

      console.log(
        chalk.bold(`#${issue.id}`) + `  ${issue.title}  ` + statusColor(statusLabel)
      );
    });

    const openCount = issues.filter((i) => i.status === "todo").length;
    const closedCount = issues.filter((i) => i.status === "done").length;

    console.log();
    clack.outro(`${openCount} open · ${closedCount} closed`);
  });

// ---------------- DEV STATUS ----------------
program
  .command("devstatus <projectName> <status>")
  .description("Set project development status")
  .action(async (projectName, status) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const validStatuses = [
      "pre-alpha",
      "alpha",
      "in-development",
      "beta",
      "bug-testing",
      "shipped",
    ];

    if (!validStatuses.includes(status.toLowerCase())) {
      console.log();
      clack.log.error(`Invalid status. Use: ${validStatuses.join(", ")}`);
      console.log();
      return;
    }

    const projectsData = readProjects();
    const project = projectsData.projects.find(
      (p) => p.safeName === projectName.toLowerCase()
    );

    if (!project) {
      console.log();
      clack.log.error(`Project "${projectName}" not found`);
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Dev Status"));

    const s = clack.spinner();
    s.start("Updating status");
    project.devStatus = status.toLowerCase();
    writeProjects(projectsData);
    s.stop(chalk.green("✓") + ` Status set to ${status}`);

    console.log();
    clack.outro(chalk.green(`${project.name} is now ${status}`));
  });

// ---------------- VERSION ----------------
program
  .command("version-set <projectName> <version>")
  .description("Set project version")
  .action(async (projectName, version) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();
    const project = projectsData.projects.find(
      (p) => p.safeName === projectName.toLowerCase()
    );

    if (!project) {
      console.log();
      clack.log.error(`Project "${projectName}" not found`);
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Version"));

    const s = clack.spinner();
    s.start("Updating version");
    project.version = version;
    writeProjects(projectsData);
    s.stop(chalk.green("✓") + ` Version set to ${version}`);

    console.log();
    clack.outro(chalk.green(`${project.name} is now v${version}`));
  });

// ---------------- INFO ----------------
program
  .command("info <projectName>")
  .description("Show full details for a project")
  .action(async (projectName) => {
    if (!isInit()) {
      console.log();
      clack.log.error("Flarex not initialized. Run: flarex init");
      console.log();
      return;
    }

    const projectsData = readProjects();
    const project = projectsData.projects.find(
      (p) => p.safeName === projectName.toLowerCase()
    );

    if (!project) {
      console.log();
      clack.log.error(`Project "${projectName}" not found`);
      console.log();
      return;
    }

    console.log();
    clack.intro(chalk.bold.hex("#f97316")(project.name));

    const issues = project.issues || [];
    const openCount = issues.filter((i) => i.status === "todo").length;
    const closedCount = issues.filter((i) => i.status === "done").length;

    const gitStatus = project.git?.initialized ? chalk.green("✓ Git") : chalk.gray("○ No Git");
    const gitRemote = project.git?.remote ? chalk.dim(project.git.remote) : chalk.dim("No remote");

    console.log();
    console.log(chalk.dim("Path       ") + chalk.white(project.path));
    console.log(chalk.dim("Template   ") + chalk.white(project.template || "Unknown"));
    console.log(chalk.dim("Status     ") + (project.status === "active" ? chalk.green("● Active") : chalk.gray("○ Inactive")));
    console.log(chalk.dim("Dev Status ") + chalk.hex("#f97316")(project.devStatus || "Not set"));
    console.log(chalk.dim("Version    ") + chalk.white(project.version || "0.0.0"));
    console.log(chalk.dim("Git        ") + gitStatus + "  " + gitRemote);

    console.log();
    console.log(chalk.bold(`Issues (${openCount} open · ${closedCount} closed)`));

    if (issues.length === 0) {
      console.log(chalk.dim("  No issues yet"));
    } else {
      issues.forEach((issue) => {
        const statusColor = issue.status === "done" ? chalk.green : chalk.yellow;
        const statusLabel = issue.status === "done" ? "✓" : "○";
        console.log(`  ${statusColor(statusLabel)} #${issue.id} ${issue.title}`);
      });
    }

    console.log();
    clack.outro(chalk.green("End of report"));
  });

program
  .command("commands")
  .alias("help-all")
  .description("Show all Flarex commands and how to use them")
  .action(() => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Commands"));

    const sections = [
      {
        title: "Setup & Config",
        commands: [
          ["flarex init", "First-time setup — creates config and workspace"],
          ["flarex name <name>", "Update your display name"],
          ["flarex theme", "Change your terminal theme"],
          ["flarex gemini <apikey>", "Set your Gemini API key"],
          ["flarex recover", "Restore missing config/project files"],
        ],
      },
      {
        title: "Project Management",
        commands: [
          ["flarex create", "Scaffold a new project (MERN / Express / React)"],
          ["flarex add <folder>", "Import an existing project from home"],
          ["flarex remove <project>", "Move project back to home, untrack it"],
          ["flarex switch [project]", "Jump into a project's directory"],
          ["flarex list", "Quick view of all tracked projects"],
          ["flarex sync", "Rescan projects, update git status, clean dead entries"],
        ],
      },
      {
        title: "Shipping",
        commands: [
          ["flarex ship <path> [branch]", "Add, commit, push. '.' = everything. Branch defaults to main"],
        ],
      },
      {
        title: "AI Commands",
        commands: [
          ["flarex error", "Find and explain a recent error, or paste one"],
          ["flarex ask <question>", "Ask Flarex anything — usage or general dev help"],
          ["flarex fix", "Browse a project's files, get a syntax scan or full review"],
        ],
      },
      {
        title: "Project Tracking",
        commands: [
          ["flarex info <project>", "Full project overview — status, version, issues"],
          ["flarex devstatus <project> <status>", "Set dev stage (alpha, beta, shipped, etc)"],
          ["flarex version-set <project> <version>", "Set project version"],
          ["flarex issue-add", "Add issues to a project (loop to add more)"],
          ["flarex issue-close", "Close an open issue"],
          ["flarex issue-open", "Reopen a closed issue"],
          ["flarex issue-list <project>", "List all issues for a project"],
        ],
      },
      {
        title: "Dev Log",
        commands: [
          ["flarex log", "Log what you shipped today"],
          ["flarex log --week", "Summary of the last 7 days"],
          ["flarex log --month", "Summary of the last 30 days"],
          ["flarex log --week --project <name>", "Filter summary by project"],
        ],
      },
    ];

    sections.forEach((section) => {
      console.log();
      clack.log.step(chalk.bold(section.title));
      console.log();
      section.commands.forEach(([cmd, desc]) => {
        console.log(chalk.hex("#f97316")(`  ${cmd}`));
        console.log(chalk.dim(`    ${desc}`));
      });
    });

    console.log();
    console.log(chalk.dim("Need setup? Run: ") + chalk.white("flarex init"));
    console.log(chalk.dim("Stuck? Run: ") + chalk.white("flarex ask <your question>"));

    console.log();
    clack.outro(chalk.green(`${sections.reduce((sum, s) => sum + s.commands.length, 0)} commands available`));
  });


program
  .command("tutorial")
  .description("A friendly walkthrough of Flarex, from install to shipping")
  .action(async () => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Welcome to Flarex"));

    const screens = [
      {
        title: "What is Flarex?",
        lines: [
          "Flarex is a CLI built for developers coding on mobile — Termux, no desktop needed.",
          "It scaffolds projects, ships code to GitHub, tracks issues, and even fixes your errors using AI.",
          "Think of it as your dev toolkit that lives entirely in the terminal.",
        ],
      },
      {
        title: "Getting Started",
        lines: [
          "Install it globally:",
          "  npm install -g flarex",
          "",
          "Then run the setup wizard. This only happens once:",
          "  flarex init",
          "",
          "It'll ask for your name, a theme, and optionally a Gemini API key (needed later for AI commands).",
          "This creates a folder at ~/FlarexProjects — this is where all your projects and Flarex's data live.",
        ],
      },
      {
        title: "Creating Your First Project",
        lines: [
          "Run:",
          "  flarex create",
          "",
          "You'll pick a name and a template — MERN, Express, or React + Vite.",
          "Flarex scaffolds the whole thing, installs dependencies, and sets you up with clean boilerplate.",
          "No more copy-pasting starter templates by hand.",
        ],
      },
      {
        title: "Managing Your Projects",
        lines: [
          "  flarex list          — quick view of every project you're tracking",
          "  flarex switch         — jump straight into a project's folder",
          "  flarex add <folder>   — bring an existing project (from your home dir) into Flarex",
          "  flarex remove <name>  — move a project back to home and stop tracking it",
          "  flarex sync           — rescan everything, update git status, clean up dead entries",
          "",
          "Everything Flarex knows about your projects lives in flarexProjects.json — you never have to touch it directly.",
        ],
      },
      {
        title: "Shipping Code",
        lines: [
          "When you're ready to push changes:",
          "  flarex ship .",
          "",
          "That adds everything, commits, and pushes to main.",
          "Want to push only one file or folder? Just name it:",
          "  flarex ship server",
          "  flarex ship business.tsx dev",
          "",
          "Leave the commit message blank when asked, and Flarex will read your changes and write one for you.",
        ],
      },
      {
        title: "AI Commands",
        lines: [
          "These need a Gemini API key — set one anytime with:",
          "  flarex gemini <your-api-key>",
          "",
          "  flarex error   — finds your latest error (or you paste one), explains it, and gives you a fix",
          "  flarex ask     — ask Flarex literally anything, dev questions or how-to-use-Flarex questions",
          "  flarex fix     — pick a project and file, get a quick syntax scan or a full code review",
          "",
          "These are built to feel like a senior dev looking over your shoulder — direct, no fluff.",
        ],
      },
      {
        title: "Tracking Your Progress",
        lines: [
          "Every project can track its own status, version, and issues:",
          "  flarex info <project>              — full overview of a project",
          "  flarex devstatus <project> <stage>  — alpha, beta, shipped, etc",
          "  flarex version-set <project> <ver>  — set a version like 1.0.0",
          "  flarex issue-add                    — add issues to work on",
          "  flarex issue-close / issue-open      — manage issue status",
          "  flarex issue-list <project>         — see everything open and closed",
          "",
          "And to log what you actually shipped each day:",
          "  flarex log",
          "  flarex log --week   — see your last 7 days summarized",
        ],
      },
      {
        title: "Where To Go From Here",
        lines: [
          "  flarex commands   — full list of every command, anytime you forget one",
          "  flarex ask        — stuck on anything? just ask",
          "",
          "That's genuinely everything you need to go from zero to shipped.",
          "Now go build something.",
        ],
      },
    ];

    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      console.log();
      clack.log.step(chalk.bold.hex("#f97316")(`${screen.title}`));
      console.log();
      screen.lines.forEach((line) => {
        if (line.trim().startsWith("flarex") || line.trim().startsWith("npm")) {
          console.log(chalk.cyan(`  ${line.trim()}`));
        } else if (line === "") {
          console.log();
        } else {
          console.log(chalk.white(`  ${line}`));
        }
      });

      if (i < screens.length - 1) {
        console.log();
        const cont = await clack.confirm({
          message: "Continue?",
          initialValue: true,
        });

        if (!cont) {
          console.log();
          clack.outro(chalk.yellow("Tutorial paused — run 'flarex tutorial' anytime to resume from the start"));
          return;
        }
      }
    }

    console.log();
    clack.outro(chalk.green("You're ready. Happy shipping."));
  });


program
  .command("docs")
  .description("Show the full Flarex documentation")
  .action(() => {
    console.log();
    clack.intro(chalk.bold.hex("#f97316")("Flarex Documentation"));
    console.log();

    const lines = FLAREX_DOCS.split("\n");

    lines.forEach((line) => {
      if (line.startsWith("# ")) {
        console.log(chalk.bold.hex("#f97316")(line.replace("# ", "")));
        console.log(chalk.dim("─".repeat(line.length + 10)));
      } else if (line.startsWith("## ")) {
        console.log();
        console.log(chalk.bold.cyan(line.replace("## ", "▸ ")));
      } else if (line.startsWith("### ")) {
        console.log();
        console.log(chalk.bold.white(line.replace("### ", "")));
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        console.log(chalk.gray("  • ") + chalk.white(line.replace(/^[-*]\s/, "")));
      } else if (line.match(/^\|.*\|$/)) {
        // Table row
        const cells = line.split("|").filter((c) => c.trim() !== "");
        if (cells.every((c) => c.trim().match(/^-+$/))) return; // skip separator row
        console.log(cells.map((c) => chalk.white(c.trim())).join(chalk.dim("  │  ")));
      } else if (line.trim().startsWith("`flarex") || line.trim().startsWith("flarex ")) {
        console.log(chalk.cyan(`  ${line.trim()}`));
      } else if (line.trim() === "---") {
        console.log(chalk.dim("─".repeat(50)));
      } else if (line.trim() === "") {
        console.log();
      } else {
        console.log(chalk.gray(line));
      }
    });

    console.log();
    clack.outro(chalk.green("End of docs"));
  });


// MAIN
async function main(){
  program.parse();
}

main();
