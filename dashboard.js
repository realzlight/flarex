import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { execa } from "execa";
import chalk from "chalk";
import { pickMascot } from "./mascots.js";

const e = React.createElement;

const FLAREX_DIR = path.join(os.homedir(), "FlarexProjects");
const CONFIG_PATH = path.join(FLAREX_DIR, "flarexConfig.json");
const PROJECTS_PATH = path.join(FLAREX_DIR, "flarexProjects.json");

function readConfigLocal() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return null;
  }
}

function readProjectsLocal() {
  if (!fs.existsSync(PROJECTS_PATH)) return { projects: [] };
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));
  } catch {
    return { projects: [] };
  }
}

function shortPath(p) {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

function parseArgs(input) {
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const args = [];
  let match;
  while ((match = regex.exec(input))) {
    args.push(match[1] ?? match[2] ?? match[3]);
  }
  return args;
}

function getGreeting(name) {
  const greetings = [`${name}, you're back`, `What's up, ${name}?`, `Lock in, ${name}`];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// ---------------- MASCOT ----------------

function Mascot({ mascot, color }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % mascot.frames.length);
    }, 450);
    return () => clearInterval(interval);
  }, [mascot]);

  return e(
    Box,
    { flexDirection: "column" },
    mascot.frames[frame].map((line, i) => e(Text, { key: i, color }, line))
  );
}

// ---------------- APP ----------------

function App({ name, accent, projects, mascot, onAction }) {
  const [selected, setSelected] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [greeting] = useState(() => getGreeting(name));

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onAction(null);
      return;
    }
    if (key.upArrow && projects.length > 0) {
      setSelected((s) => Math.max(0, s - 1));
    }
    if (key.downArrow && projects.length > 0) {
      setSelected((s) => Math.min(projects.length - 1, s + 1));
    }
  });

  const handleSubmit = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      if (projects.length > 0) {
        onAction({ type: "switch", project: projects[selected].safeName });
      }
      return;
    }

    if (["exit", "quit"].includes(trimmed.toLowerCase())) {
      onAction(null);
      return;
    }

    onAction({ type: "raw", command: trimmed });
  };

  const current = projects[selected];
  const openIssues = current ? (current.issues || []).filter((i) => i.status === "todo").length : 0;
  const closedIssues = current ? (current.issues || []).filter((i) => i.status === "done").length : 0;

  return e(
    Box,
    {
      flexDirection: "column",
      borderStyle: "round",
      borderColor: "gray",
      paddingX: 2,
      paddingY: 1,
      width: 72,
    },

    // Top row: greeting + mascot | project list
    e(
      Box,
      { flexDirection: "row" },
      e(
        Box,
        { flexDirection: "column", width: 30 },
        e(Text, { color: "white" }, greeting),
        e(Box, { marginTop: 1 }, e(Mascot, { mascot, color: "gray" }))
      ),
      e(
        Box,
        { flexDirection: "column", flexGrow: 1 },
        e(Text, { bold: true, color: "white" }, "Projects"),
        projects.length === 0
          ? e(Text, { color: "gray" }, "  No projects yet — type: create")
          : projects.map((p, i) =>
              e(
                Text,
                {
                  key: p.safeName,
                  color: i === selected ? "black" : "white",
                  backgroundColor: i === selected ? accent : undefined,
                },
                `${i === selected ? "› " : "  "}${p.name.padEnd(18)} v${p.version || "0.1.0"}`
              )
            )
      )
    ),

    // Detail panel
    current &&
      e(
        Box,
        { flexDirection: "column", marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
        e(Text, { color: "gray" }, `Path      ${shortPath(current.path)}`),
        e(Text, { color: "gray" }, `Template  ${current.template || "Unknown"}`),
        e(Text, { color: "gray" }, `Status    ${current.devStatus || "in-development"}`),
        e(Text, { color: "gray" }, `Git       ${current.git?.initialized ? "initialized" : "not initialized"}`),
        e(Text, { color: "gray" }, `Issues    ${openIssues} open · ${closedIssues} closed`)
      ),

    // Quick reference
    e(
      Box,
      { marginTop: 1, flexDirection: "column" },
      e(Text, { color: "gray" }, "Try: create · switch · list · issue-add · log · docs · tutorial")
    ),

    e(Text, { color: "gray" }, "─".repeat(64)),

    // Input
    e(
      Box,
      {},
      e(Text, { color: accent }, "> "),
      e(TextInput, {
        value: inputValue,
        onChange: setInputValue,
        onSubmit: handleSubmit,
        placeholder: "type a command, or leave empty + enter to switch",
      })
    )
  );
}

// ---------------- LOOP ----------------

function waitForEnter() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.gray("\nPress Enter to return to Flarex "), () => {
      rl.close();
      resolve();
    });
  });
}

async function runChildCommand(args) {
  try {
    await execa(process.execPath, [process.argv[1], ...args], { stdio: "inherit" });
  } catch {
    // command failed or was cancelled — fall through, don't crash the dashboard
  }
  await waitForEnter();
}

export async function runDashboard() {
  let quit = false;

  while (!quit) {
    console.clear();

    const config = readConfigLocal();
    const projectsData = readProjectsLocal();
    const mascot = pickMascot();
    const accent = config?.user?.theme?.[0] || "white";

    const action = await new Promise((resolve) => {
      const instance = render(
        e(App, {
          name: config?.user?.name || "dev",
          accent,
          projects: projectsData.projects || [],
          mascot,
          onAction: (a) => {
            instance.unmount();
            resolve(a);
          },
        })
      );
    });

    if (!action) {
      quit = true;
      break;
    }

    if (action.type === "switch") {
      await runChildCommand(["switch", action.project]);
      continue;
    }

    if (action.type === "raw") {
      const args = parseArgs(action.command);
      await runChildCommand(args);
      continue;
    }
  }

  console.clear();
}
