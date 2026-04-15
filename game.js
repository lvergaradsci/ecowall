// =============================================================
// game.js v3 — Knowledge Wall · TODOS vs TODOS
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadWallState();
  initGame();
});

// =============================================================
// INICIALIZACIÓN
// =============================================================
function initGame() {

  if (!WALL_STATE.shuffledIds || WALL_STATE.shuffledIds.length === 0) {
    shuffleNotes();
  }

  // Inicializar TODOS los grupos
  WALL_STATE.scores = WALL_STATE.scores || {};
  WALL_DATA.groups.forEach(g => {
    if (!WALL_STATE.scores[g.id]) WALL_STATE.scores[g.id] = 0;
  });

  renderHeader();
  renderScoreboard();
  renderWall();
  renderLegend();
  setupToolbar();
  setupAdminPanel();
  checkSheetsConnection();

  document.addEventListener("click", () => WallSound.init(), { once: true });

  document.getElementById("btn-reset").addEventListener("click", resetMatch);
  document.getElementById("import-file").addEventListener("change", handleFileImport);
}

// =============================================================
// HEADER
// =============================================================
function renderHeader() {
  const sub = document.querySelector(".header__match-info");
  if (sub) {
    sub.textContent = `Modo: Todos vs Todos (${WALL_DATA.groups.length} grupos)`;
    sub.style.display = "block";
  }
}

// =============================================================
// TABLERO
// =============================================================
function renderWall() {
  const grid = document.getElementById("wall-grid");
  grid.innerHTML = "";

  const orderedNotes = WALL_STATE.shuffledIds
    .map(id => WALL_DATA.notes.find(n => n.id === id))
    .filter(Boolean);

  orderedNotes.forEach(note => {
    const isRevealed = WALL_STATE.revealed.has(note.id);
    const pts = calcPoints(note);

    const cell = document.createElement("div");
    cell.className = "note-cell";

    const noteEl = document.createElement("div");
    noteEl.className = `note ${isRevealed ? "note--revealed" : ""}`;
    noteEl.dataset.id = note.id;

    const front = document.createElement("div");
    front.className = "note__front";

    front.innerHTML = isRevealed
      ? `<span>${note.front}</span>`
      : `<span>???</span>`;

    const back = document.createElement("div");
    back.className = "note__back";
    back.innerHTML = `<span>+${pts}</span>`;

    noteEl.appendChild(front);
    noteEl.appendChild(back);

    if (!isRevealed) {
      noteEl.addEventListener("click", () => handleNoteClick(note));
    }

    cell.appendChild(noteEl);
    grid.appendChild(cell);
  });
}

// =============================================================
// MODAL
// =============================================================
function showModal(note) {

  const overlay = document.getElementById("modal-overlay");
  const awardSection = document.getElementById("award-section");

  awardSection.innerHTML = "";

  // 🔥 BOTONES PARA TODOS LOS GRUPOS
  WALL_DATA.groups.forEach(group => {
    const btn = document.createElement("button");
    btn.textContent = `✓ ${group.name}`;
    btn.style.background = group.color;

    btn.onclick = () => awardPoints(group.id, note);

    awardSection.appendChild(btn);
  });

  document.getElementById("modal-answer").innerHTML = note.answer;

  overlay.style.display = "flex";
}

function handleNoteClick(note) {
  if (WALL_STATE.revealed.has(note.id)) return;
  WALL_STATE.activeNote = note;
  showModal(note);
}

// =============================================================
// ASIGNAR PUNTOS
// =============================================================
function awardPoints(groupId, note) {

  const pts = calcPoints(note);

  WALL_STATE.scores[groupId] += pts;
  WALL_STATE.revealed.add(note.id);

  saveWallState();

  renderScoreboard();
  renderWall();

  closeModal();

  if (WALL_STATE.revealed.size === WALL_DATA.notes.length) {
    endGame();
  }
}

// =============================================================
// CERRAR MODAL
// =============================================================
function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}

// =============================================================
// MARCADOR DINÁMICO
// =============================================================
function renderScoreboard() {

  const container = document.getElementById("scoreboard-inner");
  container.innerHTML = "";

  WALL_DATA.groups.forEach(group => {

    const score = WALL_STATE.scores[group.id] || 0;

    const div = document.createElement("div");
    div.innerHTML = `
      <strong style="color:${group.color}">
        ${group.name}
      </strong>: ${score}
    `;

    container.appendChild(div);
  });
}

// =============================================================
// FINAL DEL JUEGO
// =============================================================
function endGame() {

  let ganador = null;
  let max = -1;

  WALL_DATA.groups.forEach(g => {
    const score = WALL_STATE.scores[g.id];
    if (score > max) {
      max = score;
      ganador = g;
    }
  });

  document.getElementById("end-winner").textContent =
    `🏆 ${ganador.name} gana con ${max} puntos`;

  document.getElementById("end-overlay").style.display = "flex";
}

// =============================================================
// RESET
// =============================================================
function resetMatch() {

  WALL_STATE.revealed = new Set();
  WALL_STATE.scores = {};
  WALL_STATE.shuffledIds = [];

  saveWallState();
  location.reload();
}
