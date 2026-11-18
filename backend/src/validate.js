// Saara user input yahin saaf hota hai (kabhi trust mat karo).
const PLAYER_RE = /^[\p{L}\p{N} _.-]{1,20}$/u;

export function cleanPlayer(p) {
  return typeof p === "string" && PLAYER_RE.test(p.trim())
    ? p.trim()
    : "anonymous";
}
export function cleanAttempts(a) {
  const n = Number.parseInt(a, 10);
  return Number.isInteger(n) ? Math.min(Math.max(n, 1), 200) : 1;
}
export function cleanCommand(c) {
  return typeof c === "string" && c.length <= 100 ? c : null;
}
export function cleanId(id) {
  return /^\d{1,9}$/.test(String(id)) ? Number(id) : null;
}
