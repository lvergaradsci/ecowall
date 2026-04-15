// =============================================================
// game.js v2.1 — FIX: Todos vs Todos (sin romper lógica original)
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadWallState();

  if (!WALL_STATE.shuffledIds || WALL_STATE.shuffledIds.length === 0) {
    shuffleNotes();
  }

  initGame();
});

// =============================================================
// INIT
// =============================================================
function initGame() {

  // 🔥 FIX: inicializar TODOS los grupos
  WALL_STATE.scores = WALL_STATE.scores || {};
  WALL_DATA.groups.forEach(g => {
    if (!WALL_STATE.scores[g.id]) {
      WALL_STATE.scores[g.id] = 0;
    }
  });

  renderHeader();
  renderScoreboard();
  renderWall();
  renderLegend();

  setupToolbar();
  setupAdminPanel();
  checkSheetsConnection();

  document.addEventListener("click", () => WallSound.init(), { once: true });
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
// WALL (SIN CAMBIOS IMPORTANTES)
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

    // 🔥 CLAVE: mantiene ??? (NO SE VE LA PREGUNTA)
    if (!isRevealed) {
      front.innerHTML = `
        <span class="note__label">${note.label}</span>
        <span class="note__text note__text--mystery">???</span>
        <span class="note__pts">${pts} pts</span>
      `;
    } else {
      front.innerHTML = `
        <span class="note__label">${note.label}</span>
        <span class="note__text">${note.front.replace(/\n/g, "<br>")}</span>
        <span class="note__pts">${pts} pts</span>
      `;
    }

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
// MODAL (🔥 AQUÍ ESTÁ EL CAMBIO CLAVE)
// =============================================================
function showModal(note) {

  const overlay = document.getElementById("modal-overlay");
  const awardSection = document.getElementById("award-section");

  awardSection.innerHTML = "";

  // 🔥 FIX: TODOS LOS GRUPOS (no solo A/B)
  WALL_DATA.groups.forEach(group => {

    const btn = document.createElement("button");
    btn.className = "btn--award";

    btn.style.borderColor = group.color;
    btn.style.color = group.color;
    btn.style.background = group.color + "18";

    btn.textContent = `✓ Punto para ${group.name}`;

    btn.addEventListener("click", () => awardPoints(group.id, note));

    awardSection.appendChild(btn);
  });

  document.getElementById("modal-answer").innerHTML = note.answer;
  document.getElementById("modal-question").textContent = "¿Pueden responder esta pregunta?";

  overlay.style.display = "flex";
}

// =============================================================
// CLICK NOTA
// =============================================================
function handleNoteClick(note) {
  if (WALL_STATE.revealed.has(note.id)) return;
  WALL_STATE.activeNote = note;
  showModal(note);
}

// =============================================================
// ASIGNAR PUNTOS (SIN CAMBIOS)
// =============================================================
function awardPoints(groupId, note) {

  const pts = calcPoints(note);

  if (!WALL_STATE.scores[groupId]) {
    WALL_STATE.scores[groupId] = 0;
  }

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
// MODAL CLOSE
// =============================================================
function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}

// =============================================================
// SCOREBOARD (🔥 dinámico)
// =============================================================
function renderScoreboard() {

  const inner = document.getElementById("scoreboard-inner");
  if (!inner) return;

  inner.innerHTML = "";

  WALL_DATA.groups.forEach(group => {

    const score = WALL_STATE.scores[group.id] || 0;

    const div = document.createElement("div");
    div.className = "team-score";

    div.innerHTML = `
      <div style="color:${group.color}">
        ${group.name}: ${score}
      </div>
    `;

    inner.appendChild(div);
  });
}

// =============================================================
// END GAME
// =============================================================
function endGame() {

  let ganador = null;
  let max = -1;

  WALL_DATA.groups.forEach(g => {
    const s = WALL_STATE.scores[g.id] || 0;
    if (s > max) {
      max = s;
      ganador = g;
    }
  });

  document.getElementById("end-winner").textContent =
    ganador ? `🏆 ${ganador.name} gana con ${max} pts` : "Empate";

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
