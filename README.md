# Flarex

A CLI for developers who work in the terminal. Scaffold projects, ship code, track issues, and get AI-powered fixes — all from one tool. Works anywhere Node.js runs.

```bash
npm install -g flarex
```

---

## Table of Contents

- [Why Flarex](#why-flarex)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [Setup & Config](#setup--config)
  - [Project Management](#project-management)
  - [Shipping Code](#shipping-code)
  - [AI Commands](#ai-commands)
  - [Project Tracking](#project-tracking)
  - [Dev Log](#dev-log)
  - [Utility](#utility)
- [How Data Is Stored](#how-data-is-stored)
- [Requirements](#requirements)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Why Flarex

Flarex handles the repetitive parts of a dev workflow so you don't have to type them out by hand every time:

- Scaffolding a new MERN/Express/React project with dependencies already installed
- Committing and pushing without memorizing the same four git commands
- Debugging an error without leaving the terminal
- Keeping track of what you're building and what's left to do, across every project you have

It runs anywhere Node.js and Git are installed — Linux, macOS, Windows, or Termux on Android. Same commands, same behavior, everywhere.

---

## Installation

```bash
npm install -g flarex
```

Requires Node.js and Git.

---

## Quick Start

**1. Initialize Flarex** (one-time setup):

```bash
flarex init
```

This walks you through picking a name, a color theme, and (optionally) a Gemini API key. It creates a workspace folder at `~/FlarexProjects/` where all your projects and Flarex's own data live.

**2. Create your first project:**

```bash
flarex create
```

Pick a name and a template — MERN, Express, or React + Vite. Flarex scaffolds the folder structure, writes boilerplate files, and installs dependencies automatically.

**3. Ship your first change:**

```bash
flarex ship .
```

Stages everything, asks for a commit message (or auto-generates one from your diff if you leave it blank), and pushes to `main`.

**4. Whenever you're stuck:**

```bash
flarex ask how do I add an existing project
flarex commands
flarex tutorial
```

---

## Commands

### Setup & Config

#### `flarex init`
First-time setup. Creates `~/FlarexProjects/`, a config file, and an empty project registry. Prompts for your name, a theme, and an optional Gemini API key.

#### `flarex name <name>`
Update your display name at any time.

```bash
flarex name "Your Name"
```

#### `flarex theme`
Change your terminal color theme. Presents a picker with several presets (Cyberpunk, Matrix, Ocean, Fire, Neon, Minimal).

#### `flarex gemini <apikey>`
Set or update your Gemini API key. Required for all AI commands (`error`, `ask`, `fix`, and auto-generated commit messages in `ship`).

```bash
flarex gemini AIzaSy...
```

Get a free key at [Google AI Studio](https://aistudio.google.com/).

#### `flarex recover`
If `~/FlarexProjects/`, `flarexConfig.json`, or `flarexProjects.json` ever get deleted by accident, this rebuilds them from scratch via `bootstrap.js`.

---

### Project Management

#### `flarex create`
Scaffold a new project. You'll be asked for:
- A project name
- A template: `MERN`, `Express`, or `React`

**MERN** creates a `server/` (Express + CORS + dotenv, ready to run) and a `client/` (Vite + React, pre-wired with `axios` and `react-router-dom`, boilerplate cleaned up).

**Express** creates a standalone API in the project root with the same server setup as above.

**React** creates a standalone Vite + React app in the project root, same client cleanup as the MERN client.

All templates install their dependencies automatically — no manual `npm install` needed afterward.

#### `flarex add <folderName>`
Move an existing project from your home directory into `~/FlarexProjects/` and start tracking it. Auto-detects the template (MERN/Express/React) and git status.

```bash
flarex add my-old-project
```

#### `flarex remove <projectName>`
Moves a project back to your home directory and removes it from Flarex's tracking. Asks for confirmation before doing anything.

```bash
flarex remove my-old-project
```

#### `flarex switch [projectName]`
Drops you into a project's directory in a subshell. Run with no argument to get a picker, or name the project directly.

```bash
flarex switch
flarex switch caliber
```

#### `flarex list`
Quick view of every tracked project — name, template, and git status.

#### `flarex sync`
Rescans every tracked project: updates git status and remote URL, detects templates for projects missing that field, and removes entries whose folders no longer exist on disk.

---

### Shipping Code

#### `flarex ship <path> [branch]`
Adds, commits, and pushes in one command. `path` is required — use `.` for everything, or name a specific file/folder. `branch` is optional and defaults to `main`.

```bash
flarex ship .                  # everything, push to main
flarex ship server             # server/ only, push to main
flarex ship . dev              # everything, push to dev
flarex ship business.tsx dev   # one file, push to dev
```

Before doing anything, it checks:
- Git is initialized in the project (`.git` exists)
- A remote named `origin` is set
- The target path actually exists
- There are real changes to commit (skips if nothing changed)

When asked for a commit message, leave it blank to have Flarex read your staged diff and generate a conventional-commit-style message for you. You'll be shown the generated message and asked to confirm before it's used.

---

### AI Commands

All AI commands require a Gemini API key (`flarex gemini <apikey>`).

#### `flarex error`
Scans your recent terminal history for something that looks like a real error. If nothing is found, it prompts you to paste one manually. Returns a structured breakdown:

```
ERROR      — one-line summary of what broke
SAFE FIX   — check your own code first, here's specifically where to look
HARD FIX   — if that's not it, here are the exact terminal commands to run
```

#### `flarex ask <question>`
Ask Flarex anything — how to use a specific command, why something isn't working, or a general programming question.

```bash
flarex ask how do I switch projects
flarex ask what is the difference between let and const
```

#### `flarex fix`
Pick a project, then browse its folder structure until you land on a file. Choose between:
- **Quick check** — scans for syntax errors, stray/unclosed brackets, and indentation issues only. Fast, cheap, minimal tokens.
- **Full review** — reviews logic, bugs, and best practices.

Files over 50KB trigger a prompt asking if you want to read just the first 3000 lines, so massive files don't blow past context limits.

---

### Project Tracking

Every project tracks its own development stage, version, and issue list directly inside `flarexProjects.json` — no separate concept of "products" to manage.

#### `flarex info <projectName>`
Full overview of a single project: path, template, active status, dev stage, version, git status, and a breakdown of open/closed issues.

#### `flarex devstatus <projectName> <status>`
Set the development stage of a project.

```bash
flarex devstatus caliber beta
```

Valid values: `pre-alpha`, `alpha`, `in-development`, `beta`, `bug-testing`, `shipped`

#### `flarex version-set <projectName> <version>`
Set a project's version string.

```bash
flarex version-set caliber 1.2.0
```

#### `flarex issue-add`
Pick a project, then add an issue. After each one, you're asked "Add another?" so you can batch-add several without re-running the command each time.

#### `flarex issue-close`
Pick a project, pick from its currently open issues, close it.

#### `flarex issue-open`
Pick a project, pick from its currently closed issues, reopen it.

#### `flarex issue-list <projectName>`
List every issue for a project, with an open/closed count summary.

---

### Dev Log

#### `flarex log`
Log what you shipped today. Prompts for a project, a description of what you did, hours spent (optional), and a status (`completed`, `in-progress`, `blocked`).

#### `flarex log --week`
Summary of the last 7 days: total entries, total hours, status breakdown, per-project counts, and a chronological timeline.

#### `flarex log --month`
Same summary, over the last 30 days.

#### `flarex log --week --project <name>` / `flarex log --month --project <name>`
Filter either summary down to a single project.

---

### Utility

#### `flarex commands`
Prints every command Flarex has, grouped by category, with a one-line description for each. Instant, no API calls.

#### `flarex tutorial`
A guided, screen-by-screen walkthrough covering everything from installation to shipping your first project. Good for a first run or for showing someone else how Flarex works.

#### `flarex docs`
Prints the full documentation (this file, effectively) directly in the terminal with styled headers and sections.

---

## How Data Is Stored

Everything lives under `~/FlarexProjects/`:

| File | Purpose |
|---|---|
| `flarexConfig.json` | Name, theme, Gemini key, init status |
| `flarexProjects.json` | Every tracked project — path, template, git info, dev status, version, issues |
| `flarexLog.json` | Daily dev log entries |

None of these need to be edited by hand — every field is managed through Flarex commands. If one goes missing, run `flarex recover`.

---

## Requirements

- Node.js
- Git — needed for `ship`, `sync`, and any git status detection
- A Gemini API key — free tier available, needed for `error`, `ask`, `fix`, and auto-generated commit messages

---

## Troubleshooting

**"Flarex not initialized"** — run `flarex init` first, every other command depends on it.

**"No Gemini API key set"** — run `flarex gemini <your-key>`. Get a free key from Google AI Studio.

**A project shows in `flarex list` but the folder is gone** — run `flarex sync` to clean up dead entries.

**Config or project files got deleted** — run `flarex recover` to rebuild them.

**Still stuck?** — `flarex ask <your question>`

---

## License

MIT

---

Built by [@realzlight](https://github.com/realzlight) — made with ♥.
	
