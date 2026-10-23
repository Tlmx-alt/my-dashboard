"use strict";

(async () => {
const $ = id => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const icon = (n, cls = "") => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", "ico " + cls); s.innerHTML = `<use href="#i-${n}"/>`; return s; };
const dayKey = (d = new Date()) => d.toLocaleDateString("en-CA");
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, "0");
function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

/* ---------- storage: data.json through the local server, browser storage as a mirror ---------- */
let DB = {}, server = false, status = { ai: false };
async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { "X-Dashboard": "1", "Content-Type": "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}
function readLocal() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith("dash-")) out[k.slice(5)] = JSON.parse(localStorage.getItem(k));
    }
  } catch {}
  return out;
}
const local = readLocal();
if (location.protocol.startsWith("http")) {
  try {
    const [data, st] = await Promise.all([api("/api/data"), api("/api/status")]);
    server = true; status = st;
    DB = Object.keys(data).length ? data : local;
    if (!Object.keys(data).length && Object.keys(local).length) pushSoon();  // first run: move browser data into data.json
  } catch { DB = local; }
} else DB = local;

const load = (k, d) => { const v = DB[k]; return v === undefined || v === null ? d : v; };
let pushTimer = null, pending = false;
function save(k, v) {
  DB[k] = v;
  try { localStorage.setItem("dash-" + k, JSON.stringify(v)); } catch {}
  pushSoon();
}
function pushSoon() {
  if (!server) return setSync();
  pending = true; setSync("saving");
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, 500);
}
async function push(keepalive = false) {
  if (!pending) return;
  pending = false;
  try {
    await fetch("/api/data", { method: "PUT", keepalive, body: JSON.stringify(DB), headers: { "X-Dashboard": "1", "Content-Type": "application/json" } })
      .then(r => { if (!r.ok) throw new Error(); });
    setSync();
  } catch { pending = true; setSync("error"); }
}
addEventListener("pagehide", () => push(true));
document.addEventListener("visibilitychange", () => { if (document.hidden) push(true); });
function setSync(state) {
  const s = $("sync"), label = s.lastElementChild;
  s.classList.toggle("local", !server || state === "error");
  label.textContent = !server ? "Saved in this browser" : state === "saving" ? "Saving…" : state === "error" ? "Server offline, saved in browser" : "Saved to your computer";
  s.title = server ? "Your data is saved to data.json next to the dashboard" : "Start the dashboard with start.command to save to a file on your computer";
}
setSync();

/* ---------- small helpers ---------- */
const setNum = (node, value) => node.textContent = value.toLocaleString();
function removeAnimated(li, done) {
  if (reduceMotion) return done();
  li.style.height = li.offsetHeight + "px";
  li.classList.add("leaving");
  li.addEventListener("animationend", done, { once: true });
}

/* ---------- header ---------- */
const nameEl = $("name");
nameEl.value = load("name", "");
const fitName = () => nameEl.style.width = (nameEl.value ? nameEl.value.length + 1 : 9) + "ch";
nameEl.oninput = () => { save("name", nameEl.value.trim()); fitName(); };
nameEl.onkeydown = e => { if (e.key === "Enter") nameEl.blur(); };
fitName();

let today = dayKey();
function tickClock() {
  const d = new Date(), h = d.getHours();
  const parts = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).formatToParts(d);  // big time, small AM/PM
  const period = parts.find(p => p.type === "dayPeriod");
  $("now").replaceChildren(parts.filter(p => p.type !== "dayPeriod").map(p => p.value).join("").trim(), period ? el("small", { textContent: period.value }) : "");
  $("date").textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  $("greet").textContent = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  if (dayKey() !== today) { today = dayKey(); renderAll(); }
}

/* ---------- quote of the day ---------- */
const QUOTES = [
  ["It is not that we have a short time to live, but that we waste a lot of it.", "Seneca"],
  ["While we are postponing, life speeds by.", "Seneca"],
  ["Begin at once to live, and count each separate day as a separate life.", "Seneca"],
  ["Waste no more time arguing about what a good man should be. Be one.", "Marcus Aurelius"],
  ["The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius"],
  ["First say to yourself what you would be; and then do what you have to do.", "Epictetus"],
  ["No great thing is created suddenly.", "Epictetus"],
  ["If you want to improve, be content to be thought foolish and stupid.", "Epictetus"],
  ["Well begun is half done.", "Aristotle"],
  ["A journey of a thousand miles begins with a single step.", "Lao Tzu"],
  ["Our life is frittered away by detail. Simplify, simplify.", "Henry David Thoreau"],
  ["It is not enough to be industrious; so are the ants. What are you industrious about?", "Henry David Thoreau"],
  ["Lost time is never found again.", "Benjamin Franklin"],
  ["Well done is better than well said.", "Benjamin Franklin"],
  ["The best way out is always through.", "Robert Frost"],
  ["Knowing is not enough; we must apply. Willing is not enough; we must do.", "Goethe"],
  ["Perfect is the enemy of good.", "Voltaire"],
  ["Do what you can, with what you have, where you are.", "Theodore Roosevelt"],
  ["Focus is a matter of deciding what things you're not going to do.", "John Carmack"],
  ["You can do anything, but not everything.", "David Allen"],
  ["You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"],
  ["Every action you take is a vote for the type of person you wish to become.", "James Clear"],
  ["Fall seven times, stand up eight.", "Japanese proverb"],
  ["Little by little, one travels far.", "Spanish proverb"],
  ["The man who moves a mountain begins by carrying away small stones.", "Chinese proverb"],
  ["He who has a why to live can bear almost any how.", "Friedrich Nietzsche"],
  ["Men are disturbed not by things, but by the views which they take of things.", "Epictetus"],
];
let quoteIdx = null;
function showQuote(i) {
  quoteIdx = i;
  const [text, by] = QUOTES[i];
  $("qtext").textContent = text;
  $("qby").textContent = "— " + by;
}
const dailyQuote = () => Math.floor(new Date(today + "T00:00").getTime() / 864e5) % QUOTES.length;
$("qnext").onclick = () => {
  let i; do i = Math.floor(Math.random() * QUOTES.length); while (i === quoteIdx);
  showQuote(i);
};

/* ---------- focus log + stats ---------- */
let log = load("log", {});
const cfgDefault = { focus: 25, short: 5, long: 15, goal: 8, waterGoal: 2000, colors: {} };
let cfg = Object.assign({}, cfgDefault, load("cfg", {}));
const sessionsToday = () => log[dayKey()] || 0;
function streak() {
  let n = 0, d = new Date();
  if (!log[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (log[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderStats() {
  const s = sessionsToday();
  setNum($("st-sessions"), s);
  setNum($("st-minutes"), s * cfg.focus);
  setNum($("st-streak"), streak());
  $("goal").value = cfg.goal;
  $("goalbar").style.width = Math.min(100, s / cfg.goal * 100) + "%";
  $("goalbar").parentElement.title = `Daily goal: ${s} of ${cfg.goal} sessions`;
  renderCalendar();
}
$("goal").onchange = e => { cfg.goal = Math.min(30, Math.max(1, +e.target.value || cfg.goal)); save("cfg", cfg); renderStats(); };

/* ---------- timer ---------- */
const LABELS = { focus: "Time to focus", short: "Take a short break", long: "Take a long break" };
const C = 2 * Math.PI * 120;
const arc = $("arc");
arc.style.strokeDasharray = C;
let mode = "focus", total, remaining, endAt = null, timer = null;
const fmt = s => pad(Math.floor(s / 60)) + ":" + pad(s % 60);

function renderTimer() {
  const s = Math.ceil(remaining);
  $("clock").textContent = fmt(s);
  $("label").textContent = LABELS[mode];
  $("toggle").lastElementChild.textContent = timer ? "Pause" : (remaining < total ? "Resume" : "Start");
  $("toggle").firstElementChild.firstElementChild.setAttribute("href", timer ? "#i-pause" : "#i-play");
  arc.style.strokeDashoffset = C * (1 - remaining / total);
  document.title = (timer ? fmt(s) + " · " : "") + "My Dashboard";
  document.body.className = mode === "focus" ? "" : mode;
  document.body.dataset.running = timer ? "1" : "";
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  const inCycle = sessionsToday() % 4;
  $("dots").replaceChildren(...[0, 1, 2, 3].map(i => el("i", { className: i < inCycle ? "on" : "" })));
}
const saveTimer = () => save("timer", { mode, remaining, running: !!timer, endAt });
function setMode(m) { stop(); mode = m; total = remaining = cfg[m] * 60; saveTimer(); renderTimer(); }
function stop() { clearInterval(timer); timer = null; saveTimer(); }
function start() { endAt = Date.now() + remaining * 1000; timer = setInterval(tick, 250); saveTimer(); renderTimer(); }
let lastSecond = -1;
function tick() {  // checks 4x a second for accuracy, but only touches the page when the displayed second changes
  remaining = Math.max(0, (endAt - Date.now()) / 1000);
  if (remaining <= 0) return finish();
  const sec = Math.ceil(remaining);
  if (sec !== lastSecond) { lastSecond = sec; renderTimer(); }
}
function nextMode() { return mode !== "focus" ? "focus" : (sessionsToday() % 4 === 0 ? "long" : "short"); }
function logSession() { log[dayKey()] = sessionsToday() + 1; save("log", log); renderStats(); }
function finish() {
  stop(); beep();
  if (mode === "focus") logSession();
  setMode(nextMode());
}
function beep() {
  try {
    const a = new AudioContext();
    [0, .25, .5].forEach(t => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(.2, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .2);
      o.start(a.currentTime + t); o.stop(a.currentTime + t + .2);
    });
  } catch {}
}
$("toggle").onclick = () => timer ? (stop(), renderTimer()) : start();
$("reset").onclick = () => setMode(mode);
$("skip").onclick = () => setMode(mode === "focus" ? ((sessionsToday() + 1) % 4 === 0 ? "long" : "short") : "focus");
$("tabs").onclick = e => { if (e.target.dataset.mode) setMode(e.target.dataset.mode); };
document.addEventListener("keydown", e => {
  if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON|SUMMARY|SELECT/.test(e.target.tagName) && !document.querySelector(".c-timer").hidden && !$("settings").open) { e.preventDefault(); $("toggle").click(); }
});
for (const k of ["focus", "short", "long"]) {
  const input = $("s-" + k);
  input.value = cfg[k];
  input.onchange = () => {
    cfg[k] = Math.min(+input.max, Math.max(1, +input.value || cfg[k]));
    input.value = cfg[k]; save("cfg", cfg);
    if (k === mode && !timer) setMode(mode);
    renderStats();
  };
}

/* ---------- colour choices for each mode ---------- */
const PRESETS = [["Malibu", "#4aa3f0"], ["Violet", "#8b5cf6"], ["Pink", "#ec4899"], ["Red", "#cf4129"], ["Orange", "#f59e0b"], ["Lime", "#84cc16"], ["Green", "#1b7a4e"], ["Teal", "#14b8a6"]];
const MODE_NAMES = { focus: "Focus", short: "Short break", long: "Long break" };
const DEFAULT_COLOR = { focus: "#4a6cf7", short: "#cf4129", long: "#1b7a4e" };
function readableOn(hex) {  // dark text on light colours, white on dark ones
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  return .2126 * r + .7152 * g + .0722 * b > .3 ? "#0a2540" : "#fff";
}
function applyColors() {
  const st = document.documentElement.style, c = cfg.colors || {};
  for (const m of Object.keys(MODE_NAMES)) {
    if (/^#[0-9a-f]{6}$/i.test(c[m] || "")) { st.setProperty("--c-" + m, c[m]); st.setProperty("--f-" + m, readableOn(c[m])); }
    else { st.removeProperty("--c-" + m); st.removeProperty("--f-" + m); }
  }
}
function setColor(mode, hex) {
  cfg.colors = Object.assign({}, cfg.colors);
  if (hex) cfg.colors[mode] = hex.toLowerCase(); else delete cfg.colors[mode];
  save("cfg", cfg); applyColors(); renderColors();
}
function renderColors() {
  const box = $("colors"), c = cfg.colors || {};
  box.replaceChildren(...Object.keys(MODE_NAMES).map(m => {
    const cur = (c[m] || "").toLowerCase();
    const dots = PRESETS.map(([name, hex]) => {
      const b = el("button", { type: "button", className: "dot", ariaLabel: `${MODE_NAMES[m]}: ${name}`, title: name, onclick: () => setColor(m, hex) });
      b.style.setProperty("--c", hex); b.setAttribute("aria-pressed", cur === hex); return b;
    });
    const custom = !!cur && !PRESETS.some(([, h]) => h === cur);
    const picker = el("label", { className: "pick" + (custom ? " on" : ""), title: "Pick any color" },
      el("input", { type: "color", value: cur || DEFAULT_COLOR[m], ariaLabel: `${MODE_NAMES[m]}: custom color`, onchange: e => setColor(m, e.target.value) }));
    const def = el("button", { type: "button", className: "def", textContent: "Default", ariaLabel: `${MODE_NAMES[m]}: default`, onclick: () => setColor(m, null) });
    def.setAttribute("aria-pressed", !cur);
    return el("div", { className: "color-row" }, el("span", { textContent: MODE_NAMES[m] + " color" }), el("div", { className: "sw" }, ...dots, picker, def));
  }));
}
applyColors(); renderColors();

/* ---------- tasks ---------- */
let tasks = load("tasks", []);
function renderTasks() {
  const open = tasks.filter(t => !t.done).length;
  $("taskmeta").textContent = tasks.length ? `${tasks.length - open}/${tasks.length} done` : "";
  $("clearDone").hidden = open === tasks.length;
  $("tasks").replaceChildren(...(tasks.length ? tasks.map(t => {
    const box = el("button", { className: "check", ariaLabel: "Toggle done", onclick: () => {
      t.done = !t.done; save("tasks", tasks);
      renderTasks();
    } }, icon("check"));
    box.setAttribute("aria-checked", t.done);
    const li = el("li", { className: "task" + (t.done ? " done" : "") }, box, el("span", { textContent: t.text }),
      el("button", { className: "icon-btn del", ariaLabel: "Delete task", onclick: () => removeAnimated(li, () => { tasks = tasks.filter(x => x !== t); save("tasks", tasks); renderTasks(); }) }, icon("trash")));
    return li;
  }) : [el("li", { className: "empty", textContent: "Nothing yet. Add your first task above." })]));
  const next = tasks.find(t => !t.done);
  $("upnext").replaceChildren(...(next ? ["Up next: ", el("b", { textContent: next.text })] : []));
}
$("taskForm").onsubmit = e => {
  e.preventDefault();
  const v = $("taskInput").value.trim();
  if (v) { tasks.push({ id: uid(), text: v, done: false }); save("tasks", tasks); $("taskInput").value = ""; renderTasks(); }
};
$("clearDone").onclick = () => { tasks = tasks.filter(t => !t.done); save("tasks", tasks); renderTasks(); };

/* ---------- habits ---------- */
let habits = load("habits", [
  { id: uid(), name: "Exercise", days: [] }, { id: uid(), name: "Read 20 min", days: [] }, { id: uid(), name: "Drink water", days: [] }
]);
function habitStreak(h) {
  let n = 0, d = new Date();
  if (!h.days.includes(dayKey(d))) d.setDate(d.getDate() - 1);
  while (h.days.includes(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderHabits() {
  const t = dayKey();
  $("habitmeta").textContent = habits.length ? `${habits.filter(h => h.days.includes(t)).length}/${habits.length} today` : "";
  $("habits").replaceChildren(...(habits.length ? habits.map(h => {
    const on = h.days.includes(t), s = habitStreak(h);
    const box = el("button", { className: "check", ariaLabel: `Mark ${h.name} done today`, onclick: () => {
      h.days = on ? h.days.filter(d => d !== t) : [...h.days, t].slice(-400);
      save("habits", habits);
      renderHabits();
    } }, icon("check"));
    box.setAttribute("aria-checked", on);
    const li = el("li", { className: "habit" }, box,
      el("span", { className: "name", textContent: h.name }),
      el("span", { className: "streak" + (s >= 3 ? " hot" : ""), title: "Current streak" }, icon("flame"), String(s)),
      el("button", { className: "icon-btn del", ariaLabel: "Delete habit", onclick: () => removeAnimated(li, () => { habits = habits.filter(x => x !== h); save("habits", habits); renderHabits(); }) }, icon("trash")));
    return li;
  }) : [el("li", { className: "empty", textContent: "Add a habit to start a streak." })]));
}
$("habitForm").onsubmit = e => {
  e.preventDefault();
  const v = $("habitInput").value.trim();
  if (v) { habits.push({ id: uid(), name: v, days: [] }); save("habits", habits); $("habitInput").value = ""; renderHabits(); }
};

/* ---------- calendar ---------- */
let calOff = 0;
function renderCalendar() {
  const now = new Date(), first = new Date(now.getFullYear(), now.getMonth() + calOff, 1);
  $("calTitle").textContent = first.toLocaleDateString([], { month: "long", year: "numeric" });
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const heads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => el("span", { className: "dow", textContent: d }));
  const cells = [...Array(first.getDay())].map(() => el("span", { className: "day blank" }));
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(first.getFullYear(), first.getMonth(), d), k = dayKey(dt), n = log[k] || 0;
    const lv = n === 0 ? 0 : n >= cfg.goal ? 3 : n >= cfg.goal / 2 ? 2 : 1;
    const due = cds.filter(c => c.date === k).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    cells.push(el("div", { className: `day lv${lv}` + (k === dayKey() ? " today" : "") + (due.length ? " due" : ""),
      title: `${dt.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}: ${n} focus session${n === 1 ? "" : "s"}` + (due.length ? ` · ${due.map(c => c.name).join(", ")}` : "") },
      el("span", { className: "n", textContent: d }),
      ...due.slice(0, 2).map(c => el("span", { className: "ev", textContent: (c.time ? new Date(k + "T" + c.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " " : "") + c.name })),
      due.length > 2 ? el("span", { className: "more", textContent: `+${due.length - 2} more` }) : "",
      n ? el("span", { className: "sess", textContent: `${n} focus` }) : ""));
  }
  $("cal").replaceChildren(...heads, ...cells);
  $("calToday").hidden = calOff === 0;
}
$("calPrev").onclick = () => { calOff--; renderCalendar(); };
$("calNext").onclick = () => { calOff++; renderCalendar(); };
$("calToday").onclick = () => { calOff = 0; renderCalendar(); };

/* ---------- deadlines: type it in plain words ---------- */
let cds = load("countdowns", []);
const NUMS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MON_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const monthDayFirst = !/^en-US/i.test(navigator.language);

function localParse(raw) {
  let s = " " + raw.trim() + " ";
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const add = (n, unit = "day") => {
    const x = new Date(t0);
    if (unit === "week") x.setDate(x.getDate() + 7 * n);
    else if (unit === "month") x.setMonth(x.getMonth() + n);
    else if (unit === "year") x.setFullYear(x.getFullYear() + n);
    else x.setDate(x.getDate() + n);
    return x;
  };
  const take = re => { const m = s.match(re); if (m) s = s.replace(m[0], " "); return m; };
  let d = null, time = "", m, yearGiven = false;

  if ((m = take(/\s(?:at\s+|@\s*)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)(?=\W)/i))) { let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; time = pad(h) + ":" + (m[2] || "00"); }
  else if ((m = take(/\s(?:at\s+|@\s*)?([01]?\d|2[0-3]):([0-5]\d)(?=\W)/))) time = pad(+m[1]) + ":" + m[2];
  else if ((m = take(/\s(?:at\s+)?(noon|midday)(?=\W)/i))) time = "12:00";
  if ((m = take(/\s(tonight|this evening)(?=\W)/i))) { d = add(0); time = time || "20:00"; }

  if (d) {}
  else if ((m = take(/\s(\d{4})-(\d{1,2})-(\d{1,2})(?=\W)/))) { d = new Date(+m[1], m[2] - 1, +m[3]); yearGiven = true; }
  else if ((m = take(/\s(?:the\s+)?day after tomorrow(?=\W)/i))) d = add(2);
  else if ((m = take(/\s(today|tod)(?=\W)/i))) d = add(0);
  else if ((m = take(/\s(tomorrow|tmrw|tmr|tmw)(?=\W)/i))) d = add(1);
  else if ((m = take(/\sin\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(day|week|month|year)s?(?=\W)/i))) d = add(NUMS[m[1].toLowerCase()] || +m[1], m[2].toLowerCase());
  else if ((m = take(/\s(\d+)\s+(day|week|month)s?\s+from\s+(now|today)(?=\W)/i))) d = add(+m[1], m[2].toLowerCase());
  else if ((m = take(/\s(?:by\s+|before\s+)?(?:the\s+)?end\s+of\s+(?:the\s+|this\s+)?(week|month|year)(?=\W)/i))) {
    const u = m[1].toLowerCase();
    if (u === "week") d = add((5 - t0.getDay() + 7) % 7);
    else if (u === "month") d = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
    else d = new Date(t0.getFullYear(), 11, 31);
  }
  else if ((m = take(/\snext\s+(week|month|year)(?=\W)/i))) {
    const u = m[1].toLowerCase();
    d = u === "week" ? add(7) : u === "month" ? new Date(t0.getFullYear(), t0.getMonth() + 1, 1) : new Date(t0.getFullYear() + 1, 0, 1);
  }
  else if ((m = take(new RegExp(`\\s(?:on\\s+)?(?:(this|next|coming)\\s+)?(sun|mon|tue|wed|thu|fri|sat)[a-z]*(?=\\W)`, "i")))) {
    const target = WDAYS.indexOf(m[2].toLowerCase()), which = (m[1] || "").toLowerCase();
    let delta = (target - t0.getDay() + 7) % 7;
    if (delta === 0 && which !== "this") delta = 7;
    if (which === "next") {  // "next Thursday" = Thursday of next week (weeks start Monday)
      const toMonday = (8 - t0.getDay()) % 7 || 7;
      delta = toMonday + (target + 6) % 7;
    }
    d = add(delta);
  }
  else if ((m = take(new RegExp(`\\s(?:on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MON_RE}\\.?,?(?:\\s+(\\d{4}))?(?=\\W)`, "i")))) {
    d = new Date(m[3] ? +m[3] : t0.getFullYear(), MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), +m[1]); yearGiven = !!m[3];
  }
  else if ((m = take(new RegExp(`\\s(?:on\\s+)?${MON_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?(?:\\s+(\\d{4}))?(?=\\W)`, "i")))) {
    d = new Date(m[3] ? +m[3] : t0.getFullYear(), MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()), +m[2]); yearGiven = !!m[3];
  }
  else if ((m = take(/\s(?:on\s+)?(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?(?=\W)/))) {
    const [a, b] = [+m[1], +m[2]];
    let [day, mon] = monthDayFirst ? [a, b] : [b, a];
    if (mon > 12 && day <= 12) [day, mon] = [mon, day];
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : t0.getFullYear();
    d = new Date(y, mon - 1, day); yearGiven = !!m[3];
  }
  else if ((m = take(/\s(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)(?=\W)/i))) {
    d = new Date(t0.getFullYear(), t0.getMonth(), +m[1]);
    if (d < t0) d = new Date(t0.getFullYear(), t0.getMonth() + 1, +m[1]);
  }
  if (d && !yearGiven && d < t0) d.setFullYear(d.getFullYear() + 1);
  if (d && isNaN(d)) d = null;

  let name = s.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) name = name.replace(/^(?:on|at|by|due|before|for|in|this|the|is)\s+|\s+(?:on|at|by|due|before|for|in|this|the|is)$/i, "").replace(/^[,\-–:;\s]+|[,\-–:;\s]+$/g, "");
  return { name: name || raw.trim(), date: d ? dayKey(d) : "", time };
}

const prettyDate = (date, time) => {
  const d = new Date(date + "T" + (time || "00:00"));
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined })
    + (time ? " · " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
};
function renderCountdowns() {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const rows = cds.map(c => ({ c, n: Math.round((new Date(c.date + "T00:00") - t0) / 864e5) }))
    .sort((a, b) => (a.n < 0) - (b.n < 0) || (a.n < 0 ? b.n - a.n : (a.c.date + (a.c.time || "")).localeCompare(b.c.date + (b.c.time || ""))));
  $("cds").replaceChildren(...(rows.length ? rows.map(({ c, n }) => {
    let when;
    if (n === 0 && c.time) {
      const mins = Math.round((new Date(c.date + "T" + c.time) - Date.now()) / 6e4);
      when = el("div", { className: "when" }, mins > 0 ? el("b", { textContent: mins >= 60 ? Math.round(mins / 60) + "h" : mins + "m" }) : "", mins > 0 ? "left" : "Today");
    } else if (n === 0 || n === 1 || n === -1) when = el("div", { className: "when", textContent: n === 0 ? "Today" : n === 1 ? "Tomorrow" : "Yesterday" });
    else when = el("div", { className: "when" }, el("b", { textContent: Math.abs(n) }), n > 0 ? "days" : "days ago");
    const li = el("li", { className: "cd" + (n < 0 ? " past" : n <= 3 ? " soon" : "") }, when,
      el("div", { className: "nm" }, c.name, el("small", { textContent: prettyDate(c.date, c.time) })),
      el("button", { className: "icon-btn del", ariaLabel: "Delete deadline", onclick: () => removeAnimated(li, () => { cds = cds.filter(x => x !== c); save("countdowns", cds); renderCountdowns(); renderCalendar(); }) }, icon("trash")));
    return li;
  }) : [el("li", { className: "empty", textContent: "Type something like “dentist next Tuesday 4pm” or “passport renewal in 3 weeks”." })]));
}
const hint = $("cdHint");
function showHint(text) {
  const p = text.trim() ? localParse(text) : null;
  hint.replaceChildren();
  if (!p) return;
  if (status.ai) hint.append(el("span", { className: "ai", textContent: "AI" }));
  if (p.date) hint.append("Looks like ", el("b", { textContent: prettyDate(p.date, p.time) }), status.ai ? ". Press Enter to add." : "");
  else hint.append(status.ai ? "Press Enter and AI will work out the date." : "Add a date, like “next Friday” or “12 Oct”.");
}
$("cdText").oninput = e => showHint(e.target.value);
$("cdForm").onsubmit = async e => {
  e.preventDefault();
  const input = $("cdText"), btn = e.target.querySelector("button"), text = input.value.trim();
  if (!text) return;
  let result = localParse(text), usedAI = false;
  if (status.ai) {
    btn.classList.add("busy"); btn.disabled = true; input.disabled = true;
    hint.replaceChildren(el("span", { className: "ai", textContent: "AI" }), "Reading your note…");
    try {
      const r = await api("/api/parse-event", { method: "POST", body: JSON.stringify({ text, today: dayKey() }) });
      if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) { result = { name: r.name || result.name, date: r.date, time: /^\d{2}:\d{2}$/.test(r.time) ? r.time : "" }; usedAI = true; }
    } catch {}
    btn.classList.remove("busy"); btn.disabled = false; input.disabled = false; input.focus();
  }
  if (!result.date) { hint.replaceChildren("I couldn't find a date in that. Try adding “on 12 Oct” or “next Friday”."); return; }
  cds.push({ id: uid(), name: result.name, date: result.date, time: result.time, raw: text });
  save("countdowns", cds);
  input.value = "";
  hint.replaceChildren(usedAI ? el("span", { className: "ai", textContent: "AI" }) : "", "Added ", el("b", { textContent: result.name }), " for " + prettyDate(result.date, result.time) + ".");
  renderCountdowns(); renderCalendar();
};

/* ---------- water ---------- */
let water = load("water", {});   // millilitres per day
if (cfg.waterUnit !== "ml") {      // older versions counted glasses: convert once (1 glass = 250 ml)
  for (const k of Object.keys(water)) water[k] = Math.round(water[k] * 250);
  cfg.waterGoal = cfg.waterGoal <= 30 ? cfg.waterGoal * 250 : cfg.waterGoal;
  cfg.waterUnit = "ml";
  save("water", water); save("cfg", cfg);
}
function renderWater() {
  const n = water[dayKey()] || 0;
  setNum($("wcount"), n);
  $("wgoal").value = cfg.waterGoal;
  $("wbar").style.width = Math.min(100, n / cfg.waterGoal * 100) + "%";
}
const addWater = ml => {
  water[dayKey()] = Math.max(0, (water[dayKey()] || 0) + ml); save("water", water); renderWater();
};
$("wplus").onclick = () => addWater(250);
$("wminus").onclick = () => addWater(-250);
document.querySelector(".quick").onclick = e => { const b = e.target.closest("[data-ml]"); if (b) addWater(+b.dataset.ml); };
$("wgoal").onchange = e => { cfg.waterGoal = Math.min(10000, Math.max(250, Math.round(+e.target.value) || cfg.waterGoal)); save("cfg", cfg); renderWater(); };

/* ---------- day counter ---------- */
let dcs = load("dayCounters", []);
const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
function renderDays() {
  const t0 = midnight(new Date()), y = t0.getFullYear();
  const total = (new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 864e5, n = Math.round((t0 - new Date(y, 0, 1)) / 864e5) + 1;
  $("yearday").textContent = "Day " + n;
  $("yeartotal").textContent = " of " + total;
  $("yearleft").textContent = (total - n) + " left in " + y;
  $("yearbar").style.width = (n / total * 100) + "%";
  const rows = dcs.map(c => ({ c, n: Math.round((t0 - new Date(c.date + "T00:00")) / 864e5) })).sort((a, b) => a.n - b.n);
  $("dcs").replaceChildren(...(rows.length ? rows.map(({ c, n }) => {
    const num = el("b", { textContent: Math.abs(n).toLocaleString() });
    const label = n === 0 ? "today" : n > 0 ? (n === 1 ? "day since" : "days since") : (n === -1 ? "day to go" : "days to go");
    const li = el("li", { className: "dc" + (n < 0 ? " ahead" : "") },
      el("div", { className: "dc-n" }, num, el("small", { textContent: label })),
      el("div", { className: "nm" }, c.name, el("small", { textContent: new Date(c.date + "T00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }) })),
      el("button", { className: "icon-btn del", ariaLabel: "Delete counter", onclick: () => removeAnimated(li, () => { dcs = dcs.filter(x => x !== c); save("dayCounters", dcs); renderDays(); }) }, icon("trash")));
    return li;
  }) : [el("li", { className: "empty", textContent: "Count days since something started, like a streak, or until a date." })]));
}
$("dcForm").onsubmit = e => {
  e.preventDefault();
  const name = $("dcName").value.trim(), date = $("dcDate").value;
  if (!name || !date) return;
  dcs.push({ id: uid(), name, date }); save("dayCounters", dcs);
  $("dcName").value = $("dcDate").value = ""; renderDays();
};

/* ---------- notes ---------- */
const notes = $("notes");
notes.value = load("notes", "");
let noteT;
notes.oninput = () => {
  $("saved").textContent = "Saving…";
  clearTimeout(noteT);
  noteT = setTimeout(() => { save("notes", notes.value); $("saved").textContent = "Saved"; setTimeout(() => $("saved").textContent = "", 1500); }, 400);
};

/* ---------- stocks + news: Finnhub (free key), called straight from the browser ---------- */
const FH = "https://finnhub.io/api/v1/";
let fhKey = load("finnhubKey", "");
let watch = load("watchlist", ["AAPL", "MSFT", "GOOGL"]);
let quotes = {}, quotesAt = 0, news = [], newsAt = 0, newsFor = null;  // newsFor: a ticker, or null for market news
// the sidebar on the left: open or closed is remembered, and nothing is fetched while it's closed
const html = document.documentElement;
const marketsOpen = () => html.dataset.markets === "open";
function setMarketsOpen(open) {
  if (open) html.dataset.markets = "open"; else delete html.dataset.markets;
  $("openMarkets").setAttribute("aria-expanded", open);
  save("marketsOpen", open);
  if (open) { refreshMarkets(); $("closeMarkets").focus({ preventScroll: true }); }
  else $("openMarkets").focus({ preventScroll: true });
}
$("openMarkets").onclick = () => setMarketsOpen(true);
$("closeMarkets").onclick = () => setMarketsOpen(false);
$("markets").addEventListener("keydown", e => { if (e.key === "Escape") setMarketsOpen(false); });
if (load("marketsOpen", false)) html.dataset.markets = "open"; else delete html.dataset.markets;  // data.json wins over the early guess in index.html
$("openMarkets").setAttribute("aria-expanded", marketsOpen());
async function fh(path, params = {}, key = fhKey) {
  let r;
  try { r = await fetch(FH + path + "?" + new URLSearchParams({ ...params, token: key })); }
  catch { throw Object.assign(new Error("offline"), { status: 0 }); }
  if (!r.ok) throw Object.assign(new Error("Finnhub " + r.status), { status: r.status });
  return r.json();
}
const FH_MSG = { 0: "Couldn't reach Finnhub. Check your connection.", 401: "Finnhub didn't accept your key. Update it in Customize.",
  429: "Finnhub's free limit was reached. Trying again in a minute." };
const fhMsg = e => FH_MSG[e.status] || "Finnhub had a problem. Trying again shortly.";
const hasQuote = q => q && (q.c || q.pc);  // unknown tickers come back as all zeros
const price = n => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ago = sec => { const m = Math.max(1, Math.round((Date.now() / 1000 - sec) / 60)); return m < 60 ? m + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago"; };

async function refreshQuotes() {
  if (!fhKey || !marketsOpen() || !watch.length) return renderStocks();
  quotesAt = Date.now();
  const syms = [...watch];
  const res = await Promise.allSettled(syms.map(symbol => fh("quote", { symbol })));
  res.forEach((r, i) => { if (r.status === "fulfilled") quotes[syms[i]] = r.value; else if (r.reason.status === 403) quotes[syms[i]] = { plan: true }; });
  const failed = res.find(r => r.status === "rejected" && r.reason.status !== 403);
  $("stocksMsg").textContent = failed ? fhMsg(failed.reason) : "";
  if (res.some(r => r.status === "fulfilled")) $("stocksAt").textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  renderStocks();
}
function renderStocks() {
  $("marketsSetup").hidden = !!fhKey;
  $("stocksMain").hidden = $("newsMain").hidden = $("stocksRefresh").hidden = $("stocksAt").hidden = !fhKey;
  $("stocks").replaceChildren(...(watch.length ? watch.map(sym => {
    const q = quotes[sym];
    const symBtn = el("button", { className: "sym", textContent: sym, title: `Show ${sym} news`, onclick: () => setNewsFor(newsFor === sym ? null : sym) });
    symBtn.setAttribute("aria-pressed", newsFor === sym);
    let info;
    if (!q) info = [el("span", { className: "px muted", textContent: "…" })];
    else if (q.plan || !hasQuote(q)) info = [el("span", { className: "px muted", textContent: q.plan ? "Not on free plan" : "No data" })];
    else {
      const dp = q.dp ?? 0, d = q.d ?? 0;
      info = [el("span", { className: "px", textContent: price(q.c) }),
        el("span", { className: "chg" + (d > 0 ? " up" : d < 0 ? " down" : ""), textContent: (dp > 0 ? "+" : "") + dp.toFixed(2) + "%", title: `${d > 0 ? "+" : ""}${price(d)} today` })];
    }
    const li = el("li", { className: "stock" }, symBtn, ...info,
      el("button", { className: "icon-btn del", ariaLabel: `Remove ${sym}`, onclick: () => removeAnimated(li, () => {
        watch = watch.filter(x => x !== sym); delete quotes[sym]; save("watchlist", watch);
        if (newsFor === sym) setNewsFor(null);
        renderStocks();
      }) }, icon("trash")));
    return li;
  }) : [el("li", { className: "empty", textContent: "Add a ticker to follow its price." })]));
}
$("stockForm").onsubmit = async e => {
  e.preventDefault();
  const input = $("stockInput"), btn = e.target.querySelector("button"), sym = input.value.trim().toUpperCase(), msg = t => $("stocksMsg").textContent = t;
  if (!sym) return;
  if (!/^[A-Z0-9.:^=-]{1,20}$/.test(sym)) return msg("Tickers use letters, numbers and dots, like AAPL or BRK.B.");
  if (watch.includes(sym)) { input.value = ""; return; }
  btn.classList.add("busy"); btn.disabled = true;
  try {
    const q = await fh("quote", { symbol: sym });
    if (!hasQuote(q)) return msg(`Couldn't find ${sym}. Check the ticker.`);
    quotes[sym] = q; watch.push(sym); save("watchlist", watch);
    input.value = ""; msg(""); renderStocks();
  } catch (err) { msg(err.status === 403 ? `${sym} isn't included in Finnhub's free plan.` : fhMsg(err)); }
  finally { btn.classList.remove("busy"); btn.disabled = false; }
};

async function refreshNews() {
  if (!fhKey || !marketsOpen()) return renderNews();
  newsAt = Date.now();
  const forSym = newsFor;
  try {
    const items = forSym
      ? await fh("company-news", { symbol: forSym, from: dayKey(new Date(Date.now() - 7 * 864e5)), to: dayKey() })
      : await fh("news", { category: "general" });
    if (forSym !== newsFor) return;  // switched to another ticker while this was loading
    const seen = new Set();
    news = (Array.isArray(items) ? items : [])
      .filter(n => n.headline && /^https?:\/\//.test(n.url) && !seen.has(n.headline) && seen.add(n.headline))
      .sort((a, b) => b.datetime - a.datetime).slice(0, 8);
    $("newsMsg").textContent = "";
  } catch (err) {
    if (forSym !== newsFor) return;
    if (news === null) news = [];
    $("newsMsg").textContent = fhMsg(err);
  }
  renderNews();
}
function setNewsFor(sym) { newsFor = sym; news = null; renderStocks(); renderNews(); refreshNews(); }
function renderNews() {
  $("newsFilter").replaceChildren(!fhKey ? "" : newsFor
    ? el("button", { className: "chip", ariaLabel: `Showing ${newsFor} news. Show market news instead`, title: "Back to market news", onclick: () => setNewsFor(null) }, newsFor, icon("x"))
    : "Market");
  $("news").replaceChildren(...(!fhKey ? [] : news === null ? [el("li", { className: "empty", textContent: "Loading…" })] : news.length
    ? news.map(n => el("li", {}, el("a", { className: "headline", href: n.url, target: "_blank", rel: "noopener noreferrer" },
        el("span", { textContent: n.headline }), el("small", { textContent: [n.source, n.datetime ? ago(n.datetime) : ""].filter(Boolean).join(" · ") }))))
    : [el("li", { className: "empty", textContent: newsFor ? `No ${newsFor} news in the last week.` : "No headlines right now." })]));
}

// prices every minute and headlines every 10 minutes, only while the page is open and the card is showing
function refreshMarkets(force) {
  if (force || Date.now() - quotesAt > 60e3) refreshQuotes();
  if (force || Date.now() - newsAt > 10 * 60e3) refreshNews();
}
setInterval(() => { if (!document.hidden) refreshMarkets(); }, 15e3);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshMarkets(); });
$("stocksRefresh").onclick = () => refreshMarkets(true);
document.querySelectorAll("[data-setup]").forEach(b => b.onclick = () => openSettings("fhKey"));

async function saveKey() {
  const input = $("fhKey"), key = input.value.trim(), msg = t => $("fhMsg").textContent = t;
  if (!key) return;
  msg("Checking key…");
  try { await fh("quote", { symbol: "AAPL" }, key); }
  catch (err) { return msg(err.status === 401 ? "Finnhub didn't accept that key. Check it and try again." : fhMsg(err)); }
  fhKey = key; save("finnhubKey", key); input.value = "";
  msg("Connected. Prices and news are loading.");
  quotes = {}; news = null; renderSettings(); renderStocks(); renderNews(); refreshMarkets(true);
}
$("fhSave").onclick = saveKey;
$("fhKey").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); saveKey(); } };
$("fhRemove").onclick = () => {
  fhKey = ""; save("finnhubKey", ""); quotes = {}; news = []; newsFor = null;
  $("stocksMsg").textContent = $("newsMsg").textContent = "";
  $("fhMsg").textContent = "Key removed.";
  renderSettings(); renderStocks(); renderNews();
};

/* ---------- customize panel: wallpaper, theme, which widgets show ---------- */
const root = document.documentElement, dialog = $("settings");
function openSettings(focusId) { renderSettings(); dialog.showModal(); if (focusId) $(focusId).focus(); }
$("openSettings").onclick = () => openSettings();
$("closeSettings").onclick = () => dialog.close();
dialog.onclick = e => { if (e.target === dialog) dialog.close(); };  // click on the dimmed backdrop

// wallpaper: a preset (gradients in styles.css), an uploaded photo (kept in this browser only), or an image link
const WALLS = [["plain", "Plain"], ["mist", "Mist"], ["sand", "Sand"], ["peach", "Peach"], ["sage", "Sage"], ["lavender", "Lavender"],
  ["dusk", "Dusk"], ["ocean", "Ocean"], ["forest", "Forest"], ["night", "Night"]];
const IMG_KEY = "wallpaper-image";  // not "dash-": the photo stays out of data.json, which is re-sent on every save
let wall = Object.assign({ id: "plain", url: "", dim: 25 }, load("wallpaper", {}));
const storedImage = () => { try { return localStorage.getItem(IMG_KEY); } catch { return null; } };
const cssUrl = src => `url(${JSON.stringify(src)})`;
function applyWallpaper() {
  const src = wall.id === "upload" ? storedImage() : wall.id === "url" ? wall.url : null;
  if (src) { root.dataset.wall = "image"; root.style.setProperty("--wall-img", cssUrl(src)); root.style.setProperty("--dim", wall.dim / 100); }
  else { root.style.removeProperty("--wall-img"); if (WALLS.some(([id]) => id === wall.id)) root.dataset.wall = wall.id; else delete root.dataset.wall; }
}
function setWall(changes) { Object.assign(wall, changes); save("wallpaper", wall); applyWallpaper(); renderSettings(); }
const wallMsg = text => $("wallMsg").textContent = text;

$("wallFile").onchange = async e => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  wallMsg("Loading photo…");
  try {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode().finally(() => URL.revokeObjectURL(img.src));
    // shrink big photos so they fit in browser storage; try smaller sizes if the first is still too large
    for (const [max, q] of [[2560, .85], [1920, .8], [1440, .7]]) {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = Object.assign(document.createElement("canvas"), { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) });
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      try { localStorage.setItem(IMG_KEY, c.toDataURL("image/jpeg", q)); wallMsg("Photo saved in this browser."); return setWall({ id: "upload" }); }
      catch {}
    }
    wallMsg("That photo is too large to store. Try a smaller one, or use an image link.");
  } catch { wallMsg("Couldn't read that file. Try a JPEG or PNG."); }
};
function useUrl() {
  const raw = $("wallUrl").value.trim();
  if (!raw) return;
  let url;
  try { url = new URL(raw); } catch {}
  if (!url || !/^https?:$/.test(url.protocol)) return wallMsg("Paste a link that starts with https://");
  wallMsg("Loading image…");
  const img = new Image();
  img.onload = () => { wallMsg(""); setWall({ id: "url", url: url.href }); };
  img.onerror = () => wallMsg("Couldn't load an image from that link.");
  img.src = url.href;
}
$("wallUrlBtn").onclick = useUrl;
$("wallUrl").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); useUrl(); } };
$("wallDim").oninput = e => { wall.dim = +e.target.value; root.style.setProperty("--dim", wall.dim / 100); };
$("wallDim").onchange = () => save("wallpaper", wall);

// theme: Auto follows the system setting
$("themeSeg").onclick = e => {
  const b = e.target.closest("[data-t]");
  if (!b) return;
  if (b.dataset.t) root.dataset.theme = b.dataset.t; else delete root.dataset.theme;
  save("theme", b.dataset.t || null);
  renderSettings();
};
const savedTheme = load("theme", null);
if (savedTheme) root.dataset.theme = savedTheme;

// widgets you can hide
const WIDGETS = { quote: "Quote", timer: "Focus timer", tasks: "Tasks", deadlines: "Deadlines", habits: "Habits",
  water: "Water", calendar: "Calendar", days: "Day counter", notes: "Notes" };
let hidden = load("hidden", []);
const applyWidgets = () => document.querySelectorAll("[data-w]").forEach(n => { if (n.dataset.w in WIDGETS) n.hidden = hidden.includes(n.dataset.w); });

function renderSettings() {
  const img = storedImage();
  const tiles = WALLS.map(([id, name]) => el("button", { className: "wp", textContent: name, ariaLabel: `${name} wallpaper`, onclick: () => setWall({ id }) }));
  WALLS.forEach(([id], i) => { tiles[i].dataset.w = id; tiles[i].setAttribute("aria-pressed", wall.id === id); });
  // the photo and link stay as tiles once added, so you can switch back to them
  for (const [id, src, name] of [["upload", img, "Your photo"], ["url", wall.url, "Image link"]]) {
    if (!src) continue;
    const t = el("button", { className: "wp", textContent: name, ariaLabel: `${name} wallpaper`, onclick: () => setWall({ id }) });
    t.style.cssText = `background-image:${cssUrl(src)};color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.5)`;
    t.setAttribute("aria-pressed", wall.id === id);
    tiles.push(t);
  }
  $("walls").replaceChildren(...tiles);
  $("wallUrl").value = wall.url || "";
  $("wallDim").value = wall.dim;
  $("dimRow").hidden = root.dataset.wall !== "image";
  document.querySelectorAll("#themeSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === (root.dataset.theme || "")));
  $("widgetToggles").replaceChildren(...Object.entries(WIDGETS).map(([id, name]) => el("label", {}, name,
    el("input", { type: "checkbox", checked: !hidden.includes(id), onchange: e => {
      hidden = e.target.checked ? hidden.filter(x => x !== id) : [...hidden, id];
      save("hidden", hidden); applyWidgets();
    } }))));
  $("fhKey").placeholder = fhKey ? `Key saved (…${fhKey.slice(-4)}). Paste to replace` : "Finnhub API key";
  $("fhRemove").hidden = !fhKey;
}
applyWallpaper(); applyWidgets();

/* ---------- start ---------- */
function renderAll() {
  showQuote(dailyQuote());
  renderStats(); renderTasks(); renderHabits(); renderCountdowns(); renderWater(); renderDays(); renderStocks(); renderNews();
}
tickClock();
setInterval(tickClock, 1000);
setInterval(renderCountdowns, 60_000);
renderAll();
refreshMarkets(true);

// restore the timer from the last visit
const st = load("timer", null);
if (st && cfg[st.mode]) {
  setMode(st.mode);
  if (st.running && st.endAt) {
    remaining = (st.endAt - Date.now()) / 1000;
    if (remaining > 0) start();
    else { if (mode === "focus") logSession(); setMode(nextMode()); }  // ran out while the page was closed
  } else if (st.remaining > 0 && st.remaining <= total) {
    remaining = st.remaining; renderTimer();
  }
} else setMode("focus");
})();
