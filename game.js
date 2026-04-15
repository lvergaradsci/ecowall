// =============================================================
// game.js — Versión Simplificada (Total de Grupos y Sin Pregunta en Modal)
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadWallState();
  // Se inicia el juego directamente sin pasar por el selector de parejas
  initGame();
});

// =============================================================
// INICIALIZACIÓN
// =============================================================
function initGame() {
  // Si no hay orden barajado, generar uno
  if (!WALL_STATE.shuffledIds || WALL_STATE.shuffledIds.length === 0) {
    shuffleNotes();
  }

  // Inicializar scores de todos los grupos si no existen
  WALL_DATA.groups.forEach(g => {
    if (WALL_STATE.scores[g.id] === undefined) WALL_STATE.scores[g.id] = 0;
  });

  WallSound.init();
  renderWall();
  renderScoreboard();
  checkSheetsConnection();
}

// =============================================================
// RENDERIZADO DEL MURO
// =============================================================
function renderWall() {
  const container = document.getElementById("wall-grid");
  if (!container) return;
  container.innerHTML = "";

  // Crear las notas según el orden barajado
  WALL_STATE.shuffledIds.forEach((id, index) => {
    const note = WALL_DATA.notes.find(n => n.id === id);
    if (!note) return;

    const isRevealed = WALL_STATE.revealed.has(id);
    const el = document.createElement("div");
    el.className = `note ${isRevealed ? "note--revealed" : ""}`;
    el.style.setProperty("--note-color", `var(--note-${note.category})`);

    // Cara frontal (siempre visible o revelada)
    const front = document.createElement("div");
    front.className = "note__face note__face--front";
    
    // Obtenemos los puntos calculados
    const pts = getPoints(note.category);

    if (isRevealed) {
      front.innerHTML = `
        <span class="note__label">${note.label}</span>
        <span class="note__text" style="opacity: 0.5">COMPLETADA</span>
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

    // Cara trasera (el color/papel antes de "quitarlo")
    const back = document.createElement("div");
    back.className = "note__face note__face--back";
    back.innerHTML = `<span class="note__label">${note.label}</span>`;

    el.appendChild(front);
    el.appendChild(back);
    container.appendChild(el);
  });
}

// =============================================================
// MODAL DE PREGUNTA Y RESPUESTA
// =============================================================
function showModal(note) {
  const modal = document.getElementById("modal-question-overlay");
  const qText = document.getElementById("modal-question");
  const aText = document.getElementById("modal-answer");
  const btnReveal = document.getElementById("btn-reveal-answer");
  const awardSection = document.getElementById("modal-award-section");

  // Limpieza y configuración
  // 1. OCULTAR PREGUNTA (según tu solicitud para que no se repita)
  qText.style.display = "none"; 
  
  aText.textContent = note.back;
  aText.style.display = "none";
  btnReveal.style.display = "block";
  awardSection.style.display = "none";
  awardSection.innerHTML = "";

  // Crear botones para TODOS los grupos
  WALL_DATA.groups.forEach(group => {
    const btn = document.createElement("button");
    btn.className = "btn--award";
    btn.style.borderColor = group.color;
    btn.style.color = group.color;
    btn.style.background = group.color + "18";
    btn.textContent = `Punto para ${group.name}`;
    btn.onclick = () => awardPoints(note.id, group.id);
    awardSection.appendChild(btn);
  });

  // Botón para nadie (perder nota)
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

function closeModal() {
  document.getElementById("modal-question-overlay").style.display = "none";
}

// =============================================================
// LÓGICA DE PUNTUACIÓN
// =============================================================
function awardPoints(noteId, groupId) {
  const note = WALL_DATA.notes.find(n => n.id === noteId);
  const pts = getPoints(note.category);

  if (groupId) {
    WALL_STATE.scores[groupId] = (WALL_STATE.scores[groupId] || 0) + pts;
    WallSound.playScore(groupId === "G1" ? "A" : "B"); // Sonido genérico
    
    // Registrar en Sheets si está conectado
    const groupObj = WALL_DATA.groups.find(g => g.id === groupId);
    SheetsConnector.submitReveal(noteId, note.label, groupObj.name, pts);
  }

  WALL_STATE.revealed.add(noteId);
  saveWallState();
  renderWall();
  renderScoreboard();
  closeModal();

  // Verificar si terminó el juego
  if (WALL_STATE.revealed.size === WALL_DATA.notes.length) {
    showEndGame();
  }
}

function getPoints(category) {
  const base = WALL_DATA.config.basePoints || 100;
  const weight = WALL_DATA.weights[category] || 1;
  return Math.round(base * weight);
}

// =============================================================
// MARCADOR (SCOREBOARD)
// =============================================================
function renderScoreboard() {
  const container = document.getElementById("scoreboard-list");
  if (!container) return;
  container.innerHTML = "";

  // Mostrar todos los grupos que tengan puntos o todos los disponibles
  WALL_DATA.groups.forEach(group => {
    const score = WALL_STATE.scores[group.id] || 0;
    const item = document.createElement("div");
    item.className = "scoreboard__item";
    item.innerHTML = `
      <div class="scoreboard__dot" style="background:${group.color}"></div>
      <div class="scoreboard__group-info">
        <div class="scoreboard__name">${group.name}</div>
        <div class="scoreboard__pts">${score} <small>pts</small></div>
      </div>
    `;
    container.appendChild(item);
  });
}

// =============================================================
// FINAL DEL JUEGO
// =============================================================
function showEndGame() {
  WallSound.playFinale();
  const overlay = document.getElementById("end-overlay");
  const winnerEl = document.getElementById("end-winner");
  
  // Encontrar el ganador entre todos los grupos
  let maxScore = -1;
  let winnerName = "";
  
  WALL_DATA.groups.forEach(g => {
    const s = WALL_STATE.scores[g.id] || 0;
    if (s > maxScore) {
      maxScore = s;
      winnerName = g.name;
    } else if (s === maxScore) {
      winnerName = "Empate";
    }
  });

  winnerEl.textContent = winnerName === "Empate" ? "¡Es un Empate!" : `¡Ganador: ${winnerName}!`;
  overlay.style.display = "flex";
}

// =============================================================
// UTILIDADES Y ADMIN
// =============================================================
function resetMatch() {
  if (!confirm("¿Reiniciar todo el tablero y puntajes?")) return;
  WALL_STATE.revealed.clear();
  WALL_STATE.scores = {};
  shuffleNotes();
  saveWallState();
  location.reload();
}

async function checkSheetsConnection() {
  const indicator = document.getElementById("sheets-indicator");
  if (!indicator || !SheetsConnector.isConnected()) return;
  
  indicator.textContent = "◌ Conectando...";
  const ok = await SheetsConnector.ping();
  indicator.textContent = ok ? "● Sheets activo" : "○ Error de conexión";
  indicator.className = "sheets-indicator " + (ok ? "sheets-online" : "sheets-offline");
}
