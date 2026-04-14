// =====================================================
// CONFIGURACIÓN
// =====================================================
let API_URL = "https://script.google.com/macros/s/AKfycbwd42HxKIkfYHxiC7MKQqRyvaM_QoGqJko_6AlLmf4Iw_XqcLqD5J8uJevT1q4KKYKn3Q/exec";

// cargar URL guardada (si existe)
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("SHEETS_URL");
  if (saved) {
    API_URL = saved;
    updateIndicator(true);
    document.getElementById("sheets-url-input").value = saved;
  } else {
    updateIndicator(false);
  }
});

// guardar URL
document.getElementById("btn-save-sheets").onclick = () => {
  const input = document.getElementById("sheets-url-input").value.trim();

  if (!input) {
    localStorage.removeItem("SHEETS_URL");
    API_URL = "";
    updateIndicator(false);
    showToast("Modo offline activado");
    return;
  }

  API_URL = input;
  localStorage.setItem("SHEETS_URL", input);

  updateIndicator(true);
  showToast("Conectado a Google Sheets");
};

// indicador visual
function updateIndicator(online) {
  const el = document.getElementById("sheets-indicator");

  if (!el) return;

  if (online) {
    el.textContent = "● Conectado";
    el.classList.remove("sheets-offline");
    el.classList.add("sheets-online");
  } else {
    el.textContent = "○ Sin conexión";
    el.classList.remove("sheets-online");
    el.classList.add("sheets-offline");
  }
}

// =====================================================
// UTIL
// =====================================================
function postData(data) {
  if (!API_URL) return Promise.resolve({ ok: true });

  return fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(data)
  }).then(res => res.json());
}

function getData(params) {
  if (!API_URL) return Promise.resolve([]);

  return fetch(API_URL + "?" + new URLSearchParams(params))
    .then(res => res.json());
}

// =====================================================
// OBTENER EQUIPOS
// =====================================================
function getTeams() {
  if (!API_URL) {
    // modo offline (fallback)
    return Promise.resolve([
      { id: 1, name: "Equipo 1" },
      { id: 2, name: "Equipo 2" }
    ]);
  }

  return getData({ action: "getTeams" });
}

// =====================================================
// PREGUNTA ALEATORIA
// =====================================================
function getQuestion() {
  if (!API_URL) {
    // fallback offline
    return Promise.resolve({
      id: 1,
      question: "Pregunta de prueba",
      level: "facil",
      answer: "Respuesta de prueba"
    });
  }

  return getData({ action: "getQuestion" });
}

// =====================================================
// ENVIAR REVELACIÓN
// =====================================================
function sendReveal({ noteId, noteLabel, team, difficulty }) {
  return postData({
    action: "submitReveal",
    noteId,
    noteLabel,
    team,
    difficulty
  });
}

// =====================================================
// ENVIAR RESULTADO FINAL
// =====================================================
function sendFinal(scores) {
  return postData({
    action: "submitFinal",
    scores: JSON.stringify(scores)
  });
}

// =====================================================
// RESET OCULTO (OPCIONAL)
// =====================================================
function clearSheets(secretKey) {
  return postData({
    action: "clear",
    key: secretKey
  });
}

// =====================================================
// TOAST (usa el del HTML)
// =====================================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}
