const API_URL = "TU_URL_APPS_SCRIPT";

// ===============================
// ENVIAR REVELACIÓN
// ===============================
export async function sendReveal({ noteId, noteLabel, team, difficulty }) {
  return fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "submitReveal",
      noteId,
      noteLabel,
      team,
      difficulty
    })
  });
}

// ===============================
// OBTENER EQUIPOS
// ===============================
export async function getTeams() {
  const res = await fetch(API_URL + "?action=getTeams");
  return res.json();
}

// ===============================
// PREGUNTA ALEATORIA
// ===============================
export async function getQuestion() {
  const res = await fetch(API_URL + "?action=getQuestion");
  return res.json();
}

// ===============================
// RESULTADO FINAL
// ===============================
export async function sendFinal(scores) {
  return fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "submitFinal",
      scores: JSON.stringify(scores)
    })
  });
}
