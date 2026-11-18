// Fake terminal engine: command ko level ke patterns se match karta hai.
export function runCommand(level, input) {
  const cmd = (input || "").trim();
  if (!cmd) return { output: "", solved: false };
  for (const c of level.commands) {
    if (new RegExp(c.pattern).test(cmd)) {
      return { output: c.output, solved: Boolean(c.solves) };
    }
  }
  return { output: `bash: '${cmd.split(" ")[0]}' yahan kaam ka nahi / not found`, solved: false };
}
