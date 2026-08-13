// Add new mascots here. Each mascot is a name + an array of animation frames.
// Every frame in a mascot must have the same number of rows and roughly the same width.
// The dashboard picks one at random each time it opens and loops through its frames.

export const MASCOTS = [
  {
    name: "ember",
    frames: [
      ["  ▄▄▄▄▄  ", " █ ◆ ◆ █ ", " █▄▄▄▄▄█ ", "  █ █ █  "],
      ["  ▄▄▄▄▄  ", " █ ─ ◆ █ ", " █▄▄▄▄▄█ ", "  █ █ █  "],
      ["  ▄▄▄▄▄  ", " █ ─ ─ █ ", " █▄▄▄▄▄█ ", "  █ █ █  "],
      ["  ▄▄▄▄▄  ", " █ ◆ ─ █ ", " █▄▄▄▄▄█ ", "  █ █ █  "],
    ],
  },
  {
    name: "spark",
    frames: [
      ["  ◢▀▀▀◣  ", "  ▏◕ ◕▕  ", "  ◥▄▄▄◤  "],
      ["  ◢▀▀▀◣  ", "  ▏◕ ◕▕  ", "  ◥▄▄▄◤  "],
      ["  ◢▀▀▀◣  ", "  ▏─ ─▕  ", "  ◥▄▄▄◤  "],
      ["  ◢▀▀▀◣  ", "  ▏◕ ◕▕  ", "  ◥▄▄▄◤  "],
    ],
  },
];

export function pickMascot() {
  return MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
}
