// =====================================================
// ESTADO GLOBAL
// =====================================================
let selectedCard = null;
let currentQuestion = null;
let scores = {};
let totalCards = 0;
let revealedCount = 0;

// =====================================================
// INIT
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  initGame();
});

function initGame() {
  renderCards();
}

// =====================================================
// RENDER TARJETAS
// =====================================================
function renderCards() {
  const grid = document.getElementById("wall-grid");

  if (!window.cards) {
    console.error("No hay cards en data.js");
    return;
  }

  totalCards = window.cards.length;

  grid.innerHTML = "";

  window.cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "note";
    div.innerText = card.label;

    div.onclick = () => onCardClick(card, div);

    grid.appendChild(div);
  });

  updateProgress();
}

// =====================================================
// CLICK TARJETA
// =====================================================
function onCardClick(card, element) {
  if (element.classList.contains("used")) return;

  selectedCard = { ...card, element };

  openModal();
}

// =====================================================
// MODAL
// =====================================================
function openModal() {
  document.getElementById("modal-overlay").style.display = "flex";

  resetModal();
  loadQuestion();
}

function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
}

function resetModal() {
  document.getElementById("modal-question").innerText = "Cargando...";
  document.getElementById("modal-answer").innerText = "";
  document.getElementById("modal-hint").innerText = "";

  document.getElementById("answer-section").style.display = "none";
  document.getElementById("modal-hint-section").style.display = "none";
  document.getElementById("award-section").style.display = "none";
}

// =====================================================
// PREGUNTA ALEATORIA
// =====================================================
async function loadQuestion() {
  const q = await getQuestion(); // viene de sheets.js

  if (!q || q.error) {
    alert(q?.error || "Error cargando pregunta");
    closeModal();
    return;
  }

  currentQuestion = q;

  document.getElementById("modal-question").innerText = q.question;
  document.getElementById("modal-label").innerText = (q.level || "").toUpperCase();
  document.getElementById("modal-pts").innerText = "Puntos dinámicos";
}

// =====================================================
// MOSTRAR RESPUESTA
// =====================================================
document.getElementById("btn-reveal-answer").onclick = async () => {
  if (!currentQuestion) return;

  document.getElementById("answer-section").style.display = "block";

  document.getElementById("modal-answer").innerText =
    currentQuestion.answer || "Respuesta no registrada";

  loadAwardTeams();
};

// =====================================================
// CARGAR EQUIPOS DINÁMICOS
// =====================================================
async function loadAwardTeams() {
  const teams = await getTeams(); // sheets.js

  const container = document.getElementById("award-teams");
  container.innerHTML = "";

  teams.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "btn--award";
    btn.innerText = `✓ Punto para ${t.name}`;

    btn.onclick = () => awardPoints(t.name);

    container.appendChild(btn);
  });

  document.getElementById("award-section").style.display = "block";
}

// =====================================================
// ASIGNAR PUNTOS (FIX PRINCIPAL)
// =====================================================
async function awardPoints(team) {
  if (!selectedCard || !currentQuestion) return;

  // sumar local
  if (!scores[team]) scores[team] = 0;
  scores[team] += 1;

  updateScoreUI();

  // enviar a sheets
  await sendReveal({
    noteId: selectedCard.id,
    noteLabel: selectedCard.label,
    team: team,
    difficulty: currentQuestion.level
  });

  // marcar tarjeta
  selectedCard.element.classList.add("used");

  revealedCount++;
  updateProgress();

  closeModal();

  selectedCard = null; // 🔥 SOLUCIÓN DEL BUG
}

// =====================================================
// SCOREBOARD
// =====================================================
function updateScoreUI() {
  const teams = Object.keys(scores);

  if (teams[0]) {
    document.getElementById("score-a").innerText = scores[teams[0]] || 0;
  }

  if (teams[1]) {
    document.getElementById("score-b").innerText = scores[teams[1]] || 0;
  }
}

// =====================================================
// PROGRESO
// =====================================================
function updateProgress() {
  const label = document.getElementById("progress-label");
  const fill = document.getElementById("progress-fill");

  label.innerText = `${revealedCount} / ${totalCards} notas`;

  const percent = (revealedCount / totalCards) * 100;
  fill.style.width = percent + "%";

  if (revealedCount === totalCards) {
    endGame();
  }
}

// =====================================================
// FIN DEL JUEGO
// =====================================================
function endGame() {
  document.getElementById("end-overlay").style.display = "flex";

  const teams = Object.keys(scores);

  document.getElementById("end-score-a").innerText = scores[teams[0]] || 0;
  document.getElementById("end-score-b").innerText = scores[teams[1]] || 0;

  let winner = "";
  let max = -Infinity;

  for (let t in scores) {
    if (scores[t] > max) {
      max = scores[t];
      winner = t;
    }
  }

  document.getElementById("end-winner").innerText = "Ganador: " + winner;

  sendFinal(scores); // sheets.js
}

// =====================================================
// BOTÓN SALTAR
// =====================================================
document.getElementById("btn-skip").onclick = () => {
  closeModal();
};

// =====================================================
// RESET
// =====================================================
function resetGame() {
  location.reload();
}
