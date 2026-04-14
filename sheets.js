// =============================================================
// sheets.js v2 — Conector Google Sheets · Knowledge Wall
//
// CAMBIOS v2:
//  • Soporte de N grupos (no solo A/B)
//  • Nueva acción clearSheets para vaciar datos desde el panel
//    admin oculto (no visible a simple vista en la UI)
//  • submitFinal ahora recibe nombres de grupos dinámicamente
// =============================================================

const HARDCODED_SHEETS_URL = "https://script.google.com/macros/s/AKfycbz4eahszenqYQXKK4X2Jtiu4dPEhbNmmWzVB6Tv5oZxUT3UjBbAqQVT7Wu1DTfqWbGbIA/exec";

const SheetsConnector = (() => {

  function getUrl() {
    return (
      HARDCODED_SHEETS_URL ||
      WALL_DATA.config.sheetsUrl ||
      localStorage.getItem("kwall_sheets_url") ||
      ""
    );
  }

  function isConnected() { return !!getUrl(); }

  function setUrl(url) {
    localStorage.setItem("kwall_sheets_url", url);
  }

  // ── Llamada genérica ─────────────────────────────────────
  async function call(params) {
    const url = getUrl();
    if (!url) return { error: "Sin URL configurada" };
    try {
      const qs  = new URLSearchParams(params).toString();
      const res = await fetch(`${url}?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch(err) {
      console.warn("[Sheets]", err.message);
      return { error: err.message };
    }
  }

  // ── Registrar inicio de sesión / match ───────────────────
  async function registerSession(groupA, groupB) {
    return call({
      action: "registerSession",
      teamA:  groupA,
      teamB:  groupB,
      date:   new Date().toLocaleString("es-CO"),
    });
  }

  // ── Log por nota revelada ────────────────────────────────
  async function submitReveal(noteId, noteLabel, groupName, points) {
    return call({
      action:    "submitReveal",
      noteId,
      noteLabel,
      team:      groupName,
      points,
      timestamp: new Date().toLocaleString("es-CO"),
    });
  }

  // ── Resultado final del match ────────────────────────────
  async function submitFinal(nameA, nameB, scoreA, scoreB) {
    return call({
      action:  "submitFinal",
      teamA:   nameA,
      teamB:   nameB,
      scoreA,
      scoreB,
      winner:  scoreA > scoreB ? nameA : scoreB > scoreA ? nameB : "Empate",
      date:    new Date().toLocaleString("es-CO"),
    });
  }

  // ── Histórico ─────────────────────────────────────────────
  async function getHistory() {
    return call({ action: "getHistory" });
  }

  // ── Ping ──────────────────────────────────────────────────
  async function ping() {
    const res = await call({ action: "ping" });
    return !res.error;
  }

  // ── Vaciar todas las hojas (acción oculta) ───────────────
  // Solo disponible desde el panel admin (triple-clic en logo)
  async function clearSheets() {
    return call({ action: "clearSheets" });
  }

  return {
    getUrl, isConnected, setUrl,
    registerSession, submitReveal, submitFinal,
    getHistory, ping,
    clearSheets,    // ← nueva
  };
})();
