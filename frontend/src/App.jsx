import { useEffect, useRef, useState } from "react";
import { Sprite } from "./Sprites.jsx";

const ICONS = ["cat", "frog", "chick"];

async function api(path, opts) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (res.status === 429) throw new Error("Thoda dheere! Bahut zyada requests 🐢");
  if (!res.ok) throw new Error("Server error, dobara try karo");
  return res.json();
}

export default function App() {
  const [player, setPlayer] = useState(localStorage.getItem("player") || "");
  const [levels, setLevels] = useState([]);
  const [board, setBoard] = useState([]);
  const [level, setLevel] = useState(null);
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState([]);
  const [hint, setHint] = useState(false);
  const endRef = useRef();

  const loadBoard = () => api("/leaderboard").then(setBoard).catch(() => {});
  useEffect(() => {
    api("/levels").then(setLevels).catch(() => {});
    loadBoard();
  }, []);
  useEffect(() => endRef.current?.scrollIntoView(), [lines]);

  const start = (l) => {
    setLevel(l);
    setLines([`# ${l.title}`, l.story]);
    setTries(0);
    setSolved(false);
    setHint(false);
  };

  const run = async (e) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || solved) return;
    const n = tries + 1;
    setTries(n);
    setInput("");
    try {
      const res = await api(`/levels/${level.id}/command`, {
        method: "POST",
        body: JSON.stringify({ command: cmd, player: player || "anonymous", attempts: n }),
      });
      setLines((l) => [...l, `$ ${cmd}`, res.output, ...(res.solved ? ["✅ Server fixed!"] : [])]);
      if (res.solved) {
        setSolved(true);
        setDone((d) => [...new Set([...d, level.id])]);
        loadBoard();
      }
    } catch (err) {
      setLines((l) => [...l, `$ ${cmd}`, `⚠ ${err.message}`]);
    }
  };

  return (
    <div className="app">
      <header className="box head">
        <Sprite name="cat" size={5} className="bounce" />
        <div>
          <h1>SERVERQUEST</h1>
          <p>Broken server fix karo, level jeeto!</p>
        </div>
        <Sprite name="frog" size={5} className="float" />
      </header>

      <input
        className="name"
        placeholder="Apna naam (optional)"
        maxLength={20}
        value={player}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\p{L}\p{N} _.-]/gu, "");
          setPlayer(v);
          localStorage.setItem("player", v);
        }}
      />

      <div className="layout">
        <aside>
          <section className="box">
            <h3>LEVELS</h3>
            {levels.map((l, i) => (
              <button key={l.id} onClick={() => start(l)} className={level?.id === l.id ? "btn on" : "btn"}>
                <Sprite name={ICONS[i % ICONS.length]} size={3} />
                <span>
                  {l.title} <small>({l.difficulty})</small>
                </span>
                {done.includes(l.id) && <Sprite name="star" size={3} className="float" />}
              </button>
            ))}
          </section>
          <section className="box">
            <h3>
              <Sprite name="chick" size={3} /> LEADERBOARD
            </h3>
            <ol>
              {board.map((b) => (
                <li key={b.player}>
                  {b.player} — {b.solved} solved, {b.total_attempts} tries
                </li>
              ))}
            </ol>
          </section>
        </aside>

        <main className="box">
          {!level ? (
            <div className="empty">
              <Sprite name="panda" size={8} className="bob" />
              <p>Left se level chuno aur server fix karo 👈</p>
            </div>
          ) : (
            <>
              <div className="term">
                {lines.map((t, i) => (
                  <pre key={i}>{t}</pre>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={run}>
                <span>$</span>
                <input
                  autoFocus
                  maxLength={100}
                  value={input}
                  disabled={solved}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="command likho..."
                />
              </form>
              <div className="row">
                <button className="btn small" onClick={() => setHint(true)}>
                  <Sprite name="heart" size={3} /> Hint
                </button>
                <span>Attempts: {tries}</span>
                <Sprite name="panda" size={4} className={solved ? "dance" : "bob"} />
              </div>
              {hint && <p className="hinttext">{level.hint}</p>}
              {solved && (
                <div className="confetti">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <Sprite key={n} name={n % 2 ? "star" : "heart"} size={4} className={`pop s${n}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
