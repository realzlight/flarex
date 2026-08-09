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

// DOCS
const FLAREX_DOCS = "No Docs Yet, Will be filled later"
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
  template:template,
  status: "active",
  git: {
    initialized: false,
    remote: null,
  },
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
  template:template,
  status: "active",
  git: {
    initialized: false,
    remote: null,
  },
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
  template:template,
  status: "active",
  git: {
    initialized: false,
    remote: null,
  },
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
      name: folderName,
      safeName: safeName,
      path: destPath,
      template: template,
      status: "active",
      git: {
        initialized: gitInitialized,
        remote: gitRemote,
      },
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
// MAIN
async function main(){
  program.parse();
}

main();
