# Flarex

A mobile-first CLI for developers building on Termux. Scaffold projects, ship code, track issues, and get AI-powered fixes — all from your terminal.

Built for developers who code on the go and don't have a desktop IDE.

---

## Install

```bash
npm install -g flarex
```

## Getting Started

Run the setup wizard first:

```bash
flarex init
```

This creates `~/FlarexProjects/` with your config and project registry, and asks you to set a name, theme, and optional Gemini API key.

---

## Commands

### Setup & Config

| Command | Description |
|---|---|
| `flarex init` | First-time setup. Creates config, workspace, and project registry. |
| `flarex name <name>` | Update your display name. |
| `flarex theme` | Change your terminal theme. |
| `flarex gemini <apikey>` | Set or update your Gemini API key (needed for AI commands). |
| `flarex recover` | Restore missing config/project files if deleted accidentally. |

---

### Project Management

| Command | Description |
|---|---|
| `flarex create` | Scaffold a new project. Choose MERN, Express, or React + Vite. Installs dependencies automatically. |
| `flarex add <folder>` | Import an existing project from your home directory into Flarex. |
| `flarex remove <project>` | Move a project back to home and remove it from Flarex tracking. |
| `flarex switch [project]` | Drop into a project's directory. No argument shows a picker. |
| `flarex list` | Quick view of all projects — name, template, git status, active/inactive. |
| `flarex sync` | Rescan all projects, update git status, detect templates, remove dead entries. |

**Templates:**
- **MERN** — Express server (`server/`) + Vite/React client (`client/`), both with dependencies installed
- **Express** — Standalone Express API in the project root
- **React** — Standalone Vite + React app in the project root, pre-wired with `axios` and `react-router-dom`

---

### Shipping Code

| Command | Description |
|---|---|
| `flarex ship <path> [branch]` | Add, commit, and push. `path` is required (`.` for everything, or a specific file/folder). `branch` defaults to `main`. |

Checks git is initialized and a remote exists before doing anything. If you leave the commit message empty, Flarex reads your staged diff and generates a commit message for you — you can accept it or write your own.

```bash
flarex ship .                  # commit everything, push to main
flarex ship server             # commit server/ only
flarex ship . dev              # commit everything, push to dev
flarex ship business.tsx dev   # commit one file, push to dev
```

---

### AI Commands

Require a Gemini API key set via `flarex gemini <apikey>`.

| Command | Description |
|---|---|
| `flarex error` | Scans recent terminal history for an error. If nothing found, prompts you to paste one. Returns a structured breakdown: error summary, safe fix (check your own code), hard fix (reinstall/update/delete dependencies). |
| `flarex ask <question>` | Ask Flarex anything — how to use a command, troubleshooting, or general dev questions. |
| `flarex fix` | Pick a project, browse into its folders, select a file. Choose a quick syntax/bracket/indentation scan or a full logic review. Large files (50KB+) prompt before reading the first 3000 lines only, to keep things fast. |

---

### Project Tracking

Every project can track its own development status, version, and issue list — no separate "product" concept, it's all part of the project.

| Command | Description |
|---|---|
| `flarex info <project>` | Full project overview — path, template, git, dev status, version, and issue breakdown. |
| `flarex devstatus <project> <status>` | Set development stage. |
| `flarex version-set <project> <version>` | Set the project's version string (e.g. `1.0.0`). |
| `flarex issue-add` | Pick a project, add an issue. Prompts "add another?" so you can batch-add quickly. |
| `flarex issue-close` | Pick a project, pick from its open issues, close it. |
| `flarex issue-open` | Pick a project, pick from its closed issues, reopen it. |
| `flarex issue-list <project>` | List all issues for a project with open/closed counts. |

**Valid dev statuses:**
```
pre-alpha  ·  alpha  ·  in-development  ·  beta  ·  bug-testing  ·  shipped
```

---

### Dev Log

| Command | Description |
|---|---|
| `flarex log` | Log what you shipped today — pick a project, describe what you did, hours (optional), and status. |
| `flarex log --week` | Summary of the last 7 days — total entries, hours, status breakdown, per-project counts, timeline. |
| `flarex log --month` | Same summary, last 30 days. |
| `flarex log --week --project <name>` | Filter either summary to one project. |

---

## Config Files

Everything lives in `~/FlarexProjects/`:

| File | Purpose |
|---|---|
| `flarexConfig.json` | Your name, theme, Gemini key, init status. |
| `flarexProjects.json` | Every tracked project — path, template, git info, dev status, version, issues. |
| `flarexLog.json` | Daily dev log entries. |

If any of these go missing, run `flarex recover`.

---

## Requirements

- Node.js
- Git (for `ship`, `sync`, and git status detection)
- A Gemini API key for AI commands (free tier available)

---

Made with care, one terminal session at a time.

