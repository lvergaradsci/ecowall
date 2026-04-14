// ===============================
// CONFIG API
// ===============================
const API_URL = "https://script.google.com/macros/s/TU_ID/exec";

// ===============================
// REQUEST HELPER
// ===============================
async function apiRequest(params = {}) {
  const url = API_URL + "?" + new URLSearchParams(params);

  const res = await fetch(url);
  return res.json();
}

// ===============================
// LOG REVEAL
// ===============================
function logReveal(noteId, noteLabel, team, points) {
  return apiRequest({
    action: "submitReveal",
    noteId,
    noteLabel,
    team,
    points,
    timestamp: new Date().toISOString()
  });
}

// ===============================
// FINAL RESULT
// ===============================
function submitFinal(scoreA, scoreB) {
  return apiRequest({
    action: "submitFinal",
    scoreA,
    scoreB,
    date: new Date().toISOString()
  });
}

// ===============================
// RESET OCULTO
// ===============================
function wipeAll() {
  localStorage.clear();
  apiRequest({ action: "wipeData" });
  location.reload();
}

// combinación secreta
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "X") {
    if (confirm("¿Reset total del juego?")) {
      wipeAll();
    }
  }
});
