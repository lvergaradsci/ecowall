// =============================================================
// game.js — VERSIÓN CORREGIDA: TOTAL DE GRUPOS Y MODAL LIMPIO
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadWallState();
  // Bypass total del selector de parejas: iniciamos directo
  initGame();
});

function initGame() {
  if (!WALL_STATE.shuffledIds || WALL_STATE.shuffledIds.length === 0) {
    shuffleNotes();
  }

  // Aseguramos que TODOS los grupos de data.js tengan un espacio en el score
  WALL_DATA.groups.forEach(g => {
    if (WALL_STATE.scores[g.id] === undefined) WALL_STATE.scores[g.id] = 0;
  });

  WallSound.init();
  renderWall();
  renderScoreboard();
  checkSheetsConnection();
}

function renderWall() {
  const container = document.getElementById("wall-grid");
  if (!container) return;
  container.innerHTML = "";

  WALL_STATE.shuffledIds.forEach((id) => {
    const note = WALL_DATA.notes.find(n => n.id === id);
    if (!note) return;

    const isRevealed = WALL_STATE.revealed.has(id);
    const el = document.createElement("div");
    el.className = `note ${isRevealed ? "note--revealed" : ""}`;
    el.style.setProperty("--note-color", `var(--note-${note.category})`);

    const pts = getPoints(note.category);
    const front = document.createElement("div");
    front.className = "note__face note__face--front";

    if (isRevealed) {
      front.innerHTML = `
        <span class="note__label">${note.label}</span>
        <span class="note__text" style="opacity: 0.3; font-size: 0.8em;">COMPLETADA</span>
        <span class="note__pts">${pts} pts</span>
      `;
    } else {
      front.innerHTML = `
        <span class="note__label">${note.label}</span>
        <span class="note__text">???</span>
        <span class="note__pts">${pts} pts</span>
      `;
      el.onclick = () => showModal(note);
    }

    const back = document.createElement("div");
    back.className = "note__face note__face--back";
    back.innerHTML = `<span class="note__label">${note.label}</span>`;

    el.appendChild(front);
    el.appendChild(back);
    container.appendChild(el);
  });
}

function showModal(note) {
  const modal = document.getElementById("modal-question-overlay");
  const qText = document.getElementById("modal-question");
  const aText = document.getElementById("modal-answer");
  const btnReveal = document.getElementById("btn-reveal-answer");
  const awardSection = document.getElementById("modal-award-section");

  // SOLUCIÓN: Ocultar la pregunta por completo para que no se vea nada antes de la respuesta
  qText.style.display = "none"; 
  
  aText.textContent = note.back; // La respuesta
  aText.style.display = "none";
  btnReveal.style.display = "block";
  awardSection.style.display = "none";
  awardSection.innerHTML = "";

  // Crear botones para TODOS los grupos definidos en data.js
  WALL_DATA.groups.forEach(group => {
    const btn = document.createElement("button");
    btn.className = "btn--award";
    btn.style.border = `2px solid ${group.color}`;
    btn.style.color = group.color;
    btn.style.margin = "4px";
    btn.textContent = `Punto para ${group.name}`;
    btn.onclick = () => awardPoints(note.id, group.id);
    awardSection.appendChild(btn);
  });

  const btnNone = document.createElement("button");
  btnNone.className = "btn--award";
  btnNone.style.borderColor = "#888";
  btnNone.textContent = "Nadie respondió";
  btnNone.onclick = () => awardPoints(note.id, null);
  awardSection.appendChild(btnNone);

  modal.style.display = "flex";

  btnReveal.onclick = () => {
    WallSound.playPeel();
    btnReveal.style.display = "none";
    aText.style.display = "block";
    awardSection.style.display = "flex";
  };
}

function awardPoints(noteId, groupId) {
  const note = WALL_DATA.notes.find(n => n.id === noteId);
  const pts = getPoints(note.category);

  if (groupId) {
    WALL_STATE.scores[groupId] = (WALL_STATE.scores[groupId] || 0) + pts;
    WallSound.playScore("A"); // Sonido por defecto

    const groupObj = WALL_DATA.groups.find(g => g.id === groupId);
    // Ajuste para Sheets: enviamos el nombre del grupo dinámico
    SheetsConnector.submitReveal(noteId, note.label, groupObj.name, pts);
  }

  WALL_STATE.revealed.add(noteId);
  saveWallState();
  renderWall();
  renderScoreboard();
  document.getElementById("modal-question-overlay").style.display = "none";

  if (WALL_STATE.revealed.size === WALL_DATA.notes.length) showEndGame();
}

function renderScoreboard() {
  const container = document.getElementById("scoreboard-list");
  if (!container) return;
  container.innerHTML = "";

  // Generamos el marcador para todos los grupos con puntos
  WALL_DATA.groups.forEach(group => {
    const score = WALL_STATE.scores[group.id] || 0;
    const item = document.createElement("div");
    item.className = "scoreboard__item";
    item.innerHTML = `
      <div class="scoreboard__dot" style="background:${group.color}"></div>
      <div class="scoreboard__group-info">
        <div class="scoreboard__name">${group.name}</div>
        <div class="scoreboard__pts">${score} pts</div>
      </div>
    `;
    container.appendChild(item);
  });
}

function getPoints(category) {
  const base = (WALL_DATA.config && WALL_DATA.config.basePoints) ? WALL_DATA.config.basePoints : 100;
  const weight = (WALL_DATA.weights && WALL_DATA.weights[category]) ? WALL_DATA.weights[category] : 1;
  return Math.round(base * weight);
}

function showEndGame() {
  WallSound.playFinale();
  const overlay = document.getElementById("end-overlay");
  const winnerEl = document.getElementById("end-winner");
  
  let maxScore = -1;
  let winnerName = "";
  
  WALL_DATA.groups.forEach(g => {
    const s = WALL_STATE.scores[g.id] || 0;
    if (s > maxScore) {
      maxScore = s;
      winnerName = g.name;
    } else if (s === maxScore && maxScore > 0) {
      winnerName = "Empate";
    }
  });

  winnerEl.textContent = winnerName === "Empate" ? "¡Empate técnico!" : `¡Ganador: ${winnerName}!`;
  overlay.style.display = "flex";
}

function resetMatch() {
  if (!confirm("¿Reiniciar tablero?")) return;
  localStorage.removeItem("kwall_state_v2");
  location.reload();
}

// Mantenemos la función de Sheets para evitar errores de referencia
async function checkSheetsConnection() {
  const indicator = document.getElementById("sheets-indicator");
  if (!indicator || !SheetsConnector.isConnected()) return;
  const ok = await SheetsConnector.ping();
  indicator.textContent = ok ? "● Sheets activo" : "○ Error Sheets";
  indicator.className = "sheets-indicator " + (ok ? "sheets-online" : "sheets-offline");
}
