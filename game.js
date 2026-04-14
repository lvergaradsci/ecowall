// ===============================
// ESTADO GLOBAL
// ===============================
let teams = JSON.parse(localStorage.getItem("teams")) || [];
let matches = [];
let currentMatchIndex = 0;
let currentTeamTurn = 0;

let weights = JSON.parse(localStorage.getItem("weights")) || {
  correct: 10,
  partial: 5,
  wrong: 0
};

let usedQuestions = [];
let questions = []; // debes cargar tus preguntas

let selectedTeam = null;
let selectingTeam = false;

// ===============================
// TEAMS
// ===============================
function addTeam(name) {
  teams.push({
    id: crypto.randomUUID(),
    name,
    score: 0
  });

  saveTeams();
  renderAll();
}

function saveTeams() {
  localStorage.setItem("teams", JSON.stringify(teams));
}

// ===============================
// MATCHES
// ===============================
function generateMatches() {
  matches = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push([teams[i], teams[j]]);
    }
  }

  currentMatchIndex = 0;
}

function getCurrentMatch() {
  return matches[currentMatchIndex];
}

function nextMatch() {
  currentMatchIndex++;
  currentTeamTurn = 0;

  if (currentMatchIndex >= matches.length) {
    alert("Juego terminado");
  }

  renderAll();
}

// ===============================
// TURNOS
// ===============================
function getCurrentTeam() {
  const match = getCurrentMatch();
  return match[currentTeamTurn];
}

function switchTurn() {
  currentTeamTurn = currentTeamTurn === 0 ? 1 : 0;
}

// ===============================
// PREGUNTAS
// ===============================
function getRandomQuestion() {
  let available = questions.filter(q => !usedQuestions.includes(q.id));

  if (available.length === 0) {
    usedQuestions = [];
    available = questions;
  }

  const q = available[Math.floor(Math.random() * available.length)];
  usedQuestions.push(q.id);

  return q;
}

// ===============================
// TARJETAS
// ===============================
function onCardClick(card) {
  const question = getRandomQuestion();

  showQuestionModal(question);

  selectingTeam = true;
  selectedTeam = null;

  renderTeamSelector();
}

// ===============================
// SELECCIÓN GRUPO
// ===============================
function selectTeam(teamId) {
  selectedTeam = teams.find(t => t.id === teamId);
}

// ===============================
// PUNTAJE
// ===============================
function assignPoints(type) {
  if (!selectedTeam) {
    alert("Selecciona un grupo");
    return;
  }

  const points = weights[type] || 0;

  selectedTeam.score += points;

  saveTeams();

  selectedTeam = null;
  selectingTeam = false;

  switchTurn();
  renderAll();
}

// ===============================
// PESOS
// ===============================
function updateWeights(newWeights) {
  weights = newWeights;
  localStorage.setItem("weights", JSON.stringify(weights));
}

// ===============================
// GANADOR
// ===============================
function getWinner() {
  return teams.sort((a, b) => b.score - a.score)[0];
}
