// ---------------------------------------------------------------------------
// Random Distribution RPG
//
// Simple growth loop:
//   - Gain EXP -> level up -> earn stat points (no manual assignment).
//   - Click "Assign" to RANDOMLY distribute all pending stat points across
//     the stats below.
//
// Stats are defined in one place so adding more later is a one-line change.
// ---------------------------------------------------------------------------

const POINTS_PER_LEVEL = 2;

// Add new stats here later — everything else adapts automatically.
const STAT_DEFS = [
  { key: "hp", name: "HP", color: "var(--hp)", base: 20 },
  { key: "atk", name: "ATK", color: "var(--atk)", base: 5 },
  { key: "def", name: "DEF", color: "var(--def)", base: 5 },
  { key: "mp", name: "MP", color: "var(--mp)", base: 10 },
];

const state = {
  level: 1,
  exp: 0,
  statPoints: 0,
  stats: Object.fromEntries(STAT_DEFS.map((s) => [s.key, s.base])),
};

// EXP required to reach the next level.
function expNeeded(level) {
  return 10 + (level - 1) * 5;
}

// How much EXP a single "Train" grants.
function trainReward() {
  return 4 + Math.floor(Math.random() * 5); // 4-8
}

// ---------------------------------------------------------------------------
// Core actions
// ---------------------------------------------------------------------------

function gainExp() {
  const reward = trainReward();
  state.exp += reward;
  log(`Trained hard and gained ${reward} EXP.`);

  while (state.exp >= expNeeded(state.level)) {
    state.exp -= expNeeded(state.level);
    levelUp();
  }
  render();
}

function levelUp() {
  state.level += 1;
  state.statPoints += POINTS_PER_LEVEL;
  log(
    `Reached Level ${state.level}! Earned ${POINTS_PER_LEVEL} stat points to assign.`,
    true
  );
}

// Randomly spread every pending point across the stats.
function assignPoints() {
  if (state.statPoints <= 0) return;

  const gained = Object.fromEntries(STAT_DEFS.map((s) => [s.key, 0]));
  const total = state.statPoints;

  while (state.statPoints > 0) {
    const pick = STAT_DEFS[Math.floor(Math.random() * STAT_DEFS.length)];
    state.stats[pick.key] += 1;
    gained[pick.key] += 1;
    state.statPoints -= 1;
  }

  const summary = STAT_DEFS.filter((s) => gained[s.key] > 0)
    .map((s) => `+${gained[s.key]} ${s.name}`)
    .join(", ");
  log(`Assigned ${total} points at random: ${summary}.`, true);

  render(gained);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function buildStatRows() {
  const list = document.getElementById("stats");
  list.innerHTML = "";
  for (const def of STAT_DEFS) {
    const li = document.createElement("li");
    li.className = "stat";
    li.dataset.key = def.key;
    li.innerHTML = `
      <span class="stat__name" style="color:${def.color}">${def.name}</span>
      <div class="stat__bar">
        <div class="stat__fill" style="background:${def.color}"></div>
      </div>
      <span class="stat__value">0</span>
    `;
    list.appendChild(li);
  }
}

function render(gained = {}) {
  document.getElementById("level").textContent = state.level;
  document.getElementById("exp").textContent = state.exp;
  document.getElementById("exp-needed").textContent = expNeeded(state.level);
  document.getElementById("stat-points").textContent = state.statPoints;

  const expPct = (state.exp / expNeeded(state.level)) * 100;
  document.getElementById("exp-fill").style.width = `${expPct}%`;

  // Scale stat bars relative to the current strongest stat.
  const maxStat = Math.max(...Object.values(state.stats), 1);

  for (const def of STAT_DEFS) {
    const row = document.querySelector(`.stat[data-key="${def.key}"]`);
    if (!row) continue;
    const value = state.stats[def.key];
    row.querySelector(".stat__value").textContent = value;
    row.querySelector(".stat__fill").style.width = `${(value / maxStat) * 100}%`;

    if (gained[def.key]) {
      row.classList.remove("gained");
      void row.offsetWidth; // restart animation
      row.classList.add("gained");
    }
  }

  document.getElementById("assign").disabled = state.statPoints <= 0;
}

function log(message, highlight = false) {
  const list = document.getElementById("log");
  const li = document.createElement("li");
  li.textContent = message;
  if (highlight) li.classList.add("highlight");
  list.prepend(li);
  while (list.children.length > 30) list.removeChild(list.lastChild);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.getElementById("gain-exp").addEventListener("click", gainExp);
document.getElementById("assign").addEventListener("click", assignPoints);

buildStatRows();
render();
log("A new adventurer appears. Train to grow, then roll for your stats!");
