import { sendReveal, getTeams, getQuestion } from "./sheets.js";

let selectedCard = null;

// ===============================
// CLICK TARJETA (FIX)
// ===============================
export function onCardClick(card) {
  selectedCard = card;
  showTeams(); // ya debes tener algo similar
}

// ===============================
// MOSTRAR EQUIPOS DINÁMICOS
// ===============================
async function showTeams() {
  const teams = await getTeams();

  const container = document.getElementById("teams");
  container.innerHTML = "";

  teams.forEach(t => {
    const btn = document.createElement("button");
    btn.textContent = t.name;
    btn.onclick = () => selectTeam(t.name);
    container.appendChild(btn);
  });
}

// ===============================
// SELECCIONAR EQUIPO (FIX BUG)
// ===============================
async function selectTeam(team) {
  if (!selectedCard) return;

  const question = await getQuestion();

  showQuestion(question); // usa tu UI existente

  await sendReveal({
    noteId: selectedCard.id,
    noteLabel: selectedCard.label,
    team: team,
    difficulty: question.level
  });

  selectedCard = null; // 🔥 ESTE ES EL FIX
}
