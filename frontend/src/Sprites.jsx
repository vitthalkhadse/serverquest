// Pixel art: har row sirf LEFT half (6 pixel) hai, code isse mirror karke 12 pixel banata hai.
const PAL = {
  k: "#1b1b2f",
  w: "#ffffff",
  o: "#ff9f43",
  p: "#ff6b9d",
  g: "#2ecc71",
  y: "#feca57",
  r: "#ee5253",
};

const SPRITES = {
  cat: [
    "..k...",
    ".kok..",
    ".koooo",
    "kooooo",
    "kookoo",
    "kooooo",
    "koooop",
    ".kkkkk",
  ],
  frog: [".kkk..", "kwwwk.", "kwkwgk", "kpgggg", "kggkkk", "kggggg", ".kkkkk"],
  panda: [
    "kkk...",
    "kkkwww",
    "kwwwww",
    "kwkkww",
    "kwkwww",
    "kwwwww",
    "kwwwkk",
    "kwwwww",
    ".kwwww",
    "..kkkk",
  ],
  chick: [
    "..kkk.",
    ".kyyyy",
    "kyyyyy",
    "kykyyy",
    "kyyyoo",
    "kyyyoo",
    "kyyyyy",
    ".kyyyy",
    "..kkkk",
  ],
  star: [
    ".....y",
    ".....y",
    "....yy",
    "yyyyyy",
    ".yyyyy",
    "..yyyy",
    "..yyyy",
    ".yyy.y",
    ".yy...",
  ],
  heart: [
    ".rrr..",
    "rwrrrr",
    "rrrrrr",
    ".rrrrr",
    "..rrrr",
    "...rrr",
    "....rr",
    ".....r",
  ],
};

export function Sprite({ name, size = 6, className = "" }) {
  const rows = SPRITES[name].map((r) => r + [...r].reverse().join(""));
  const w = rows[0].length;
  return (
    <svg
      className={className}
      width={w * size}
      height={rows.length * size}
      viewBox={`0 0 ${w} ${rows.length}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={name}
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={PAL[c]}
            />
          ),
        ),
      )}
    </svg>
  );
}
