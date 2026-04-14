// =============================================================
// game.js — Lógica del Knowledge Wall
// =============================================================

// ── Inicializar ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadWallState();
  renderScoreboard();
  renderWall();
  renderTeamToggle();
  setupImportExport();
  checkSheetsConnection();

  // Sonido en primer clic
  document.addEventListener("click", () => WallSound.init(), { once: true });

  // Botón mute
  document.getElementById("btn-mute").addEventListener("click", () => {
    WallSound.init();
    const m = WallSound.toggleMute();
    document.getElementById("btn-mute").textContent = m ? "🔇" : "🔊";
  });

  // Cerrar modal al hacer click fuera
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", resetGame);

  // Importar archivo
  document.getElementById("import-file").addEventListener("change", handleFileImport);
});

// ── Renderizar el tablero ────────────────────────────────────
function renderWall() {
  const grid = document.getElementById("wall-grid");
  grid.innerHTML = "";

  WALL_DATA.notes.forEach((note) => {
    const isRevealed = WALL_STATE.revealed.has(note.id);
    const cell = document.createElement("div");
    cell.className = "note-cell";
    cell.dataset.id = note.id;

    const noteEl = document.createElement("div");
    noteEl.className = `note note--${note.category}${isRevealed ? " note--revealed" : ""}`;
    noteEl.dataset.id = note.id;
    noteEl.style.setProperty("--rot", randomRot());

    // Cara delantera (sticky note)
    const front = document.createElement("div");
    front.className = "note__front";
    front.innerHTML = `
      <span class="note__label">${note.label}</span>
      <span class="note__text">${note.front.replace(/\n/g, "<br>")}</span>
      <span class="note__pts">${note.points} pts</span>
    `;

    // Cara trasera (puntaje revelado)
    const back = document.createElement("div");
    back.className = "note__back";
    back.innerHTML = `
      <span class="note__pts-big">+${note.points}</span>
      <span class="note__pts-label">puntos</span>
    `;

    noteEl.appendChild(front);
    noteEl.appendChild(back);

    if (!isRevealed) {
      noteEl.addEventListener("click", () => handleNoteClick(note));
    }

    if (note.category === "reto") {
      const ribbon = document.createElement("div");
      ribbon.className = "note__ribbon";
      ribbon.textContent = "×2";
      noteEl.appendChild(ribbon);
    }

    cell.appendChild(noteEl);
    grid.appendChild(cell);
  });
}

// ── Rotación aleatoria orgánica ──────────────────────────────
function randomRot() {
  // Entre -3.5 y 3.5 grados, ligeramente sesgado para naturalidad
  const val = (Math.random() * 7 - 3.5).toFixed(2);
  return `${val}deg`;
}

// ── Clic en una nota ─────────────────────────────────────────
function handleNoteClick(note) {
  if (WALL_STATE.revealed.has(note.id)) return;
  WallSound.init();
  WallSound.playPeel();
  if (note.category === "reto") WallSound.playDouble();

  WALL_STATE.activeNote = note;
  showModal(note);
}

// ── Modal de pregunta ────────────────────────────────────────
function showModal(note) {
  const overlay = document.getElementById("modal-overlay");
  const catColors = {
    glosario:    "#8B6914",
    proceso:     "#2d5a27",
    tratamiento: "#1a3a5c",
    concepto:    "#7a3520",
    articulo:    "#4a2060",
    reto:        "#7b1c1c",
  };

  document.getElementById("modal-label").textContent  = note.label;
  document.getElementById("modal-label").style.background = catColors[note.category] || "#555";
  document.getElementById("modal-pts").textContent    = `${note.points} puntos`;
  document.getElementById("modal-question").innerHTML = note.front.replace(/\n/g, "<br>");
  document.getElementById("modal-hint").textContent   = note.hint || "";
  document.getElementById("modal-answer").innerHTML   = note.answer;
  document.getElementById("answer-section").style.display = "none";
  document.getElementById("modal-hint-section").style.display = "none";
  document.getElementById("award-section").style.display = "none";
  document.getElementById("btn-show-hint").style.display = note.hint ? "inline-flex" : "none";

  overlay.style.display = "flex";
  overlay.classList.add("modal-in");

  // Asignar puntaje
  document.getElementById("btn-award-a").onclick = () => awardPoints("A", note);
  document.getElementById("btn-award-b").onclick = () => awardPoints("B", note);
  document.getElementById("btn-reveal-answer").onclick = revealAnswer;
  document.getElementById("btn-show-hint").onclick = showHint;
  document.getElementById("btn-skip").onclick = () => {
    revealNoteOnBoard(note, null);
    closeModal();
  };
}

function revealAnswer() {
  document.getElementById("answer-section").style.display = "block";
  document.getElementById("award-section").style.display  = "flex";
  document.getElementById("btn-reveal-answer").style.display = "none";
}

function showHint() {
  document.getElementById("modal-hint-section").style.display = "block";
  document.getElementById("btn-show-hint").style.display = "none";
}

function awardPoints(team, note) {
  WALL_STATE.scores[team] += note.points;
  WALL_STATE.activeTeam   = team;
  saveWallState();
  renderScoreboard();
  revealNoteOnBoard(note, team);
  WallSound.playPoint(team);
  closeModal();

  // Sync Sheets
  if (SheetsConnector.isConnected()) {
    SheetsConnector.submitReveal(note.id, note.front.replace(/\n/g, " "), team, note.points)
      .catch(() => {});
  }

  // ¿Tablero completo?
  if (WALL_STATE.revealed.size === WALL_DATA.notes.length) {
    setTimeout(() => endGame(), 600);
  }
}

function revealNoteOnBoard(note, team) {
  WALL_STATE.revealed.add(note.id);
  saveWallState();

  const noteEl = document.querySelector(`.note[data-id="${note.id}"]`);
  if (!noteEl) return;

  noteEl.classList.add("note--flipping");
  setTimeout(() => {
    noteEl.classList.add("note--revealed");
    noteEl.classList.remove("note--flipping");
    if (team) {
      const color = team === "A" ? "#7b1c1c" : "#1a3a5c";
      noteEl.querySelector(".note__back").style.borderTop = `4px solid ${color}`;
    }
    noteEl.removeEventListener("click", () => {});
  }, 700);
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.remove("modal-in");
  overlay.classList.add("modal-out");
  setTimeout(() => {
    overlay.style.display = "none";
    overlay.classList.remove("modal-out");
  }, 300);
  WALL_STATE.activeNote = null;
}

// ── Marcador ─────────────────────────────────────────────────
function renderScoreboard() {
  document.getElementById("score-a").textContent = WALL_STATE.scores.A.toLocaleString();
  document.getElementById("score-b").textContent = WALL_STATE.scores.B.toLocaleString();

  const total = WALL_DATA.notes.reduce((s, n) => s + n.points, 0);
  const pctA  = total > 0 ? (WALL_STATE.scores.A / total * 100).toFixed(0) : 0;
  const pctB  = total > 0 ? (WALL_STATE.scores.B / total * 100).toFixed(0) : 0;
  document.getElementById("score-bar-a").style.width = `${pctA}%`;
  document.getElementById("score-bar-b").style.width = `${pctB}%`;

  const revealed = WALL_STATE.revealed.size;
  const total_n  = WALL_DATA.notes.length;
  document.getElementById("progress-label").textContent =
    `${revealed} / ${total_n} notas reveladas`;
  document.getElementById("progress-fill").style.width =
    `${(revealed / total_n * 100).toFixed(0)}%`;
}

// ── Toggle de equipo activo ──────────────────────────────────
function renderTeamToggle() {
  const btns = document.querySelectorAll(".team-toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      WALL_STATE.activeTeam = btn.dataset.team;
      btns.forEach((b) => b.classList.toggle("active", b.dataset.team === WALL_STATE.activeTeam));
      WallSound.playClick();
    });
    btn.classList.toggle("active", btn.dataset.team === WALL_STATE.activeTeam);
  });
}

// ── Fin de juego ─────────────────────────────────────────────
function endGame() {
  WallSound.playFinale();
  const { A, B } = WALL_STATE.scores;
  const winner = A > B ? "A" : B > A ? "B" : null;

  document.getElementById("end-score-a").textContent = A.toLocaleString();
  document.getElementById("end-score-b").textContent = B.toLocaleString();
  document.getElementById("end-winner").textContent  = winner
    ? `🏆 ¡Gana el ${WALL_DATA.teams.find(t => t.id === winner).name}!`
    : "🤝 ¡Empate perfecto!";

  if (SheetsConnector.isConnected()) {
    SheetsConnector.submitFinal(A, B).catch(() => {});
  }

  document.getElementById("end-overlay").style.display = "flex";
}

// ── Reset ────────────────────────────────────────────────────
function resetGame() {
  if (!confirm("¿Reiniciar el tablero y los puntajes?")) return;
  WALL_STATE.revealed.clear();
  WALL_STATE.scores = { A: 0, B: 0 };
  saveWallState();
  renderScoreboard();
  renderWall();
  document.getElementById("end-overlay").style.display = "none";
  WallSound.playClick();
}

// ── Persistencia ─────────────────────────────────────────────
function loadWallState() {
  const saved = localStorage.getItem("kwall_state");
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    if (p.revealed) WALL_STATE.revealed = new Set(p.revealed);
    if (p.scores)   WALL_STATE.scores   = p.scores;
  } catch(e) {}
}

function saveWallState() {
  localStorage.setItem("kwall_state", JSON.stringify({
    revealed: [...WALL_STATE.revealed],
    scores:   WALL_STATE.scores,
  }));
}

// ── Conexión Sheets ──────────────────────────────────────────
async function checkSheetsConnection() {
  const indicator = document.getElementById("sheets-indicator");
  if (!SheetsConnector.isConnected()) {
    indicator.textContent = "○ Sin conexión a Sheets";
    indicator.className   = "sheets-offline";
    return;
  }
  indicator.textContent = "◌ Conectando...";
  const ok = await SheetsConnector.ping();
  indicator.textContent = ok ? "● Google Sheets activo" : "○ Error de conexión";
  indicator.className   = ok ? "sheets-online" : "sheets-offline";
}

// ── Importar / Exportar ──────────────────────────────────────
function setupImportExport() {
  document.getElementById("btn-export-json").addEventListener("click", exportJSON);
  document.getElementById("btn-export-csv").addEventListener("click",  exportCSV);
  document.getElementById("btn-import").addEventListener("click", () =>
    document.getElementById("import-file").click()
  );
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(WALL_DATA.notes, null, 2)], { type: "application/json" });
  download(blob, "knowledge_wall_preguntas.json");
  showToast("💾 JSON exportado");
}

function exportCSV() {
  const header = ["id","category","points","label","front","answer","hint"];
  const rows   = WALL_DATA.notes.map(n => [
    n.id, n.category, n.points, `"${n.label}"`,
    `"${n.front.replace(/\n/g," ")}"`,
    `"${n.answer.replace(/"/g,'""')}"`,
    `"${(n.hint||"").replace(/"/g,'""')}"`
  ]);
  const csv  = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  download(blob, "knowledge_wall_preguntas.csv");
  showToast("📊 CSV exportado — ábrelo con Excel");
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const ext  = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      if (ext === "json") {
        const notes = JSON.parse(ev.target.result);
        if (!Array.isArray(notes)) throw new Error("El JSON debe ser un array");
        WALL_DATA.notes = notes;
        renderWall();
        showToast(`✅ ${notes.length} preguntas importadas desde JSON`);
      } else if (ext === "csv") {
        const lines  = ev.target.result.split("\n").slice(1); // skip header
        const notes  = lines.filter(l => l.trim()).map(line => {
          const cols = parseCSVLine(line);
          return {
            id:       parseInt(cols[0]) || Math.random(),
            category: cols[1] || "concepto",
            points:   parseInt(cols[2]) || 100,
            label:    cols[3] || "PREGUNTA",
            front:    cols[4] || "",
            answer:   cols[5] || "",
            hint:     cols[6] || "",
          };
        });
        WALL_DATA.notes = notes;
        renderWall();
        showToast(`✅ ${notes.length} preguntas importadas desde CSV`);
      } else {
        showToast("❌ Formato no soportado. Usa .json o .csv", "error");
      }
    } catch(err) {
      showToast("❌ Error al importar: " + err.message, "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent  = msg;
  t.className    = `toast toast--${type} toast--show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("toast--show"), 3000);
}

// ── Configurar URL de Sheets desde el UI ────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("sheets-url-input");
  const saveBtn  = document.getElementById("btn-save-sheets");
  if (!urlInput || !saveBtn) return;

  urlInput.value = SheetsConnector.getUrl();
  saveBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (url && !url.startsWith("https://script.google.com")) {
      showToast("⚠️ La URL debe ser de script.google.com", "error");
      return;
    }
    SheetsConnector.setUrl(url);
    checkSheetsConnection();
    showToast(url ? "✅ URL de Sheets guardada" : "○ Modo sin nube activado");
  });
});
