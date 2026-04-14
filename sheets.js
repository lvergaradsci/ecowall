// =============================================================
// sheets.js — Conector Google Sheets para Knowledge Wall
//
// ── CONFIGURACIÓN RÁPIDA (sin pedirle la URL al usuario) ────
// Descomenta y pega tu URL aquí para que sea permanente:
//
// const HARDCODED_SHEETS_URL = "https://script.google.com/macros/s/TU_ID_AQUI/exec";
//
// Si está definida, ignora cualquier URL guardada o ingresada.
// =============================================================

const HARDCODED_SHEETS_URL = "https://script.google.com/macros/s/AKfycbz4eahszenqYQXKK4X2Jtiu4dPEhbNmmWzVB6Tv5oZxUT3UjBbAqQVT7Wu1DTfqWbGbIA/exec"; 

const SheetsConnector = (() => {

  function getUrl() {
    if (HARDCODED_SHEETS_URL) return HARDCODED_SHEETS_URL;
    return (
      WALL_DATA.config.sheetsUrl ||
      localStorage.getItem("kwall_sheets_url") ||
      ""
    );
  }

  function isConnected() {
    return !!getUrl();
  }

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
    } catch (err) {
      console.warn("[Sheets]", err.message);
      return { error: err.message };
    }
  }

  // ── Registrar sesión ─────────────────────────────────────
  async function registerSession(teamA, teamB) {
    return call({
      action:  "registerSession",
      teamA,
      teamB,
      date:    new Date().toLocaleString("es-CO"),
    });
  }

  // ── Enviar puntaje por nota revelada ─────────────────────
  async function submitReveal(noteId, noteLabel, team, points) {
    return call({
      action:    "submitReveal",
      noteId,
      noteLabel,
      team,
      points,
      timestamp: new Date().toLocaleString("es-CO"),
    });
  }

  // ── Enviar puntaje final ─────────────────────────────────
  async function submitFinal(scoreA, scoreB) {
    return call({
      action:  "submitFinal",
      scoreA,
      scoreB,
      winner:  scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "Empate",
      date:    new Date().toLocaleString("es-CO"),
    });
  }

  // ── Obtener histórico ────────────────────────────────────
  async function getHistory() {
    return call({ action: "getHistory" });
  }

  // ── Ping ─────────────────────────────────────────────────
  async function ping() {
    const res = await call({ action: "ping" });
    return !res.error;
  }

  return { getUrl, isConnected, setUrl, registerSession, submitReveal, submitFinal, getHistory, ping };
})();


// =============================================================
// Code.gs — Google Apps Script (backend)
// Pega este código en script.google.com como nuevo proyecto
// y despliégalo como Web App con acceso "Cualquier usuario"
// =============================================================
/*
const SHEET_SCORES  = "Puntajes";
const SHEET_HISTORY = "Historial";
const SHEET_LOG     = "Log";

function doGet(e) {
  const p = e.parameter;
  let result;
  try {
    if      (p.action === "registerSession") result = registerSession(p);
    else if (p.action === "submitReveal")    result = submitReveal(p);
    else if (p.action === "submitFinal")     result = submitFinal(p);
    else if (p.action === "getHistory")      result = getHistory();
    else if (p.action === "ping")            result = { ok: true };
    else result = { error: "Acción desconocida" };
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) { return doGet(e); }

function getOrCreate(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#7b1c1c").setFontColor("#fff");
  }
  return sh;
}

function registerSession(p) {
  const sh = getOrCreate(SHEET_SCORES, ["Fecha","Equipo A","Equipo B","Ganador","Pts A","Pts B"]);
  // Solo registra cuando hay final
  return { ok: true };
}

function submitReveal(p) {
  const sh = getOrCreate(SHEET_LOG, ["Timestamp","Nota ID","Nota","Equipo","Puntos"]);
  sh.appendRow([p.timestamp, p.noteId, p.noteLabel, "Equipo " + p.team, parseInt(p.points)]);
  return { ok: true };
}

function submitFinal(p) {
  const sh = getOrCreate(SHEET_SCORES, ["Fecha","Pts Equipo A","Pts Equipo B","Ganador"]);
  sh.appendRow([p.date, parseInt(p.scoreA), parseInt(p.scoreB), p.winner]);
  return { ok: true };
}

function getHistory() {
  const sh = getOrCreate(SHEET_SCORES, ["Fecha","Pts Equipo A","Pts Equipo B","Ganador"]);
  const data = sh.getDataRange().getValues();
  return { rows: data };
}
*/
