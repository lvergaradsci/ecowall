// =============================================================
// game.js v2 — Knowledge Wall · Gestión Ambiental
//
// CAMBIOS v2:
//  • Grupos dinámicos: se leen de WALL_DATA.groups
//  • BUG FIX: el modal ahora siempre muestra los botones de
//    asignación al grupo correcto después de la 1ª tarjeta
//  • Notas barajadas; la tarjeta muestra "???" hasta revelar
//  • Pesos configurables por categoría (panel oculto)
//  • Opción oculta para vaciar Sheets (Konami o triple-clic)
//  • Panel de configuración de grupos y rondas
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadWallState();

  // Si no hay match activo, abrir selector de grupos
  if (!WALL_STATE.matchGroupA || !WALL_STATE.matchGroupB) {
    openMatchSetup();
  } else {
    initGame();
  }
});

// =============================================================
// INICIALIZACIÓN
// =============================================================
function initGame() {
  // Si no hay orden barajado, generar uno
  if (!WALL_STATE.shuffledIds || WALL_STATE.shuffledIds.length === 0) {
    shuffleNotes();
  }
  // Inicializar scores del match si están vacíos
  if (!WALL_STATE.scores[WALL_STATE.matchGroupA]) WALL_STATE.scores[WALL_STATE.matchGroupA] = 0;
  if (!WALL_STATE.scores[WALL_STATE.matchGroupB]) WALL_STATE.scores[WALL_STATE.matchGroupB] = 0;

  // Grupo activo por defecto = A del match
  if (!WALL_STATE.activeGroup) WALL_STATE.activeGroup = WALL_STATE.matchGroupA;

  renderHeader();
  renderScoreboard();
  renderWall();
  renderGroupToggle();
  renderLegend();
  setupToolbar();
  setupAdminPanel();
  checkSheetsConnection();

  // Sonido en primer clic
  document.addEventListener("click", () => WallSound.init(), { once: true });

  document.getElementById("btn-mute").addEventListener("click", () => {
    WallSound.init();
    const m = WallSound.toggleMute();
    document.getElementById("btn-mute").textContent = m ? "🔇" : "🔊";
  });

  // Cerrar modal al click fuera
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  document.getElementById("btn-reset").addEventListener("click", resetMatch);
  document.getElementById("import-file").addEventListener("change", handleFileImport);

  // Activar panel oculto de admin con triple-clic en el logo
  let logoClicks = 0, logoTimer;
  document.querySelector(".header__crest").addEventListener("click", () => {
    logoClicks++;
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => { logoClicks = 0; }, 600);
    if (logoClicks >= 3) {
      logoClicks = 0;
      toggleAdminPanel();
    }
  });
}

// =============================================================
// SETUP INICIAL DE MATCH (selector de grupos)
// =============================================================
function openMatchSetup() {
  const overlay = document.getElementById("match-setup-overlay");
  if (!overlay) return;

  renderGroupOptions();
  overlay.style.display = "flex";

  document.getElementById("btn-start-match").addEventListener("click", () => {
    const selA = document.getElementById("select-group-a").value;
    const selB = document.getElementById("select-group-b").value;

    if (selA === selB) {
      showToast("⚠️ Los grupos deben ser distintos", "error");
      return;
    }

    WALL_STATE.matchGroupA   = selA;
    WALL_STATE.matchGroupB   = selB;
    WALL_STATE.scores        = { [selA]: 0, [selB]: 0 };
    WALL_STATE.revealed      = new Set();
    WALL_STATE.activeGroup   = selA;
    WALL_STATE.shuffledIds   = [];
    shuffleNotes();
    saveWallState();

    overlay.style.display = "none";
    initGame();
  });

  // Botón de "agregar grupo"
  document.getElementById("btn-add-group").addEventListener("click", addGroupFromForm);
}

function renderGroupOptions() {
  ["select-group-a", "select-group-b"].forEach((selId, idx) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = "";
    WALL_DATA.groups.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      if (idx === 0 && WALL_DATA.groups.indexOf(g) === 0) opt.selected = true;
      if (idx === 1 && WALL_DATA.groups.indexOf(g) === 1) opt.selected = true;
      sel.appendChild(opt);
    });
  });
  renderGroupList();
}

function renderGroupList() {
  const list = document.getElementById("groups-list");
  if (!list) return;
  list.innerHTML = "";
  WALL_DATA.groups.forEach(g => {
    const row = document.createElement("div");
    row.className = "group-row";
    row.innerHTML = 
      <span class="group-dot" style="background:${g.color}"></span>
      <span class="group-name">${g.name}</span>
      <button class="btn btn--sm btn--danger" onclick="removeGroup('${g.id}')">✕</button>
    ;
    list.appendChild(row);
  });
}

function addGroupFromForm() {
  const nameInput  = document.getElementById("input-group-name");
  const colorInput = document.getElementById("input-group-color");
  const name  = nameInput.value.trim();
  const color = colorInput.value || "#666666";

  if (!name) { showToast("⚠️ Escribe un nombre", "error"); return; }
  if (WALL_DATA.groups.length >= 8) { showToast("⚠️ Máximo 8 grupos", "error"); return; }

  const id = "G" + (Date.now() % 10000);
  WALL_DATA.groups.push({ id, name, color, score: 0 });
  nameInput.value = "";
  renderGroupOptions();
  showToast(✅ Grupo "${name}" agregado);
}

function removeGroup(id) {
  const idx = WALL_DATA.groups.findIndex(g => g.id === id);
  if (idx === -1) return;
  WALL_DATA.groups.splice(idx, 1);
  renderGroupOptions();
}

// =============================================================
// HEADER DINÁMICO
// =============================================================
function renderHeader() {
  const gA = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupA);
  const gB = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupB);
  const sub = document.querySelector(".header__match-info");
  if (sub && gA && gB) {
    sub.textContent = Match: ${gA.name}  vs  ${gB.name};
    sub.style.display = "block";
  }
}

// =============================================================
// RENDERIZAR EL TABLERO (notas en orden barajado, sin texto)
// =============================================================
function renderWall() {
  const grid = document.getElementById("wall-grid");
  grid.innerHTML = "";

  const orderedNotes = WALL_STATE.shuffledIds
    .map(id => WALL_DATA.notes.find(n => n.id === id))
    .filter(Boolean);

  orderedNotes.forEach(note => {
    const isRevealed = WALL_STATE.revealed.has(note.id);
    const pts = calcPoints(note);

    const cell = document.createElement("div");
    cell.className = "note-cell";
    cell.dataset.id = note.id;

    const noteEl = document.createElement("div");
    noteEl.className = note note--${note.category}${isRevealed ? " note--revealed" : ""};
    noteEl.dataset.id = note.id;
    noteEl.style.setProperty("--rot", randomRot());

    // Cara delantera:
    // - Si NO está revelada → solo muestra la categoría y "???" (sin texto)
    // - Si está revelada    → muestra el texto completo (back)
    const front = document.createElement("div");
    front.className = "note__front";
    if (!isRevealed) {
      // Solo etiqueta de categoría y puntos ocultos → el jugador no sabe qué sale
      front.innerHTML = 
        <span class="note__label">${note.label}</span>
        <span class="note__text note__text--mystery">???</span>
        <span class="note__pts">${pts} pts</span>
      ;
    } else {
      front.innerHTML = 
        <span class="note__label">${note.label}</span>
        <span class="note__text">${note.front.replace(/\n/g, "<br>")}</span>
        <span class="note__pts">${pts} pts</span>
      ;
    }

    // Cara trasera
    const back = document.createElement("div");
    back.className = "note__back";

    // Buscar a qué grupo se le asignó
    const awardedTo = isRevealed ? getAwardedGroup(note.id) : null;
    const awardColor = awardedTo ? (WALL_DATA.groups.find(g => g.id === awardedTo)?.color || "#888") : "#888";
    back.innerHTML = 
      <span class="note__pts-big" style="color:${awardColor}">+${pts}</span>
      <span class="note__pts-label">${awardedTo ? (WALL_DATA.groups.find(g => g.id === awardedTo)?.name || "pts") : "puntos"}</span>
    ;

    noteEl.appendChild(front);
    noteEl.appendChild(back);

    if (!isRevealed) {
      noteEl.addEventListener("click", () => handleNoteClick(note));
    }

    if (note.category === "reto") {
      const ribbon = document.createElement("div");
      ribbon.className = "note__ribbon";
      ribbon.textContent = "×2";
      noteEl.appendChild(ribbon);
    }

    cell.appendChild(noteEl);
    grid.appendChild(cell);
  });
}

// Recuperar a quién se asignó una nota revelada
const _awarded = {}; // { noteId: groupId }
function getAwardedGroup(noteId) { return _awarded[noteId] || null; }

function randomRot() {
  return ${(Math.random() * 7 - 3.5).toFixed(2)}deg;
}

// =============================================================
// CLIC EN UNA NOTA
// =============================================================
function handleNoteClick(note) {
  if (WALL_STATE.revealed.has(note.id)) return;
  WallSound.init();
  WallSound.playPeel();
  if (note.category === "reto") WallSound.playDouble();
  WALL_STATE.activeNote = note;
  showModal(note);
}

// =============================================================
// MODAL — BUG FIX: los botones de asignación se recrean SIEMPRE
// usando cloneNode para eliminar listeners anteriores
// =============================================================
function showModal(note) {
  const overlay  = document.getElementById("modal-overlay");
  const pts      = calcPoints(note);

  // Colores por categoría
  const catColors = {
    glosario:    "#8B6914",
    proceso:     "#2d5a27",
    tratamiento: "#1a3a5c",
    concepto:    "#7a3520",
    articulo:    "#4a2060",
    reto:        "#7b1c1c",
  };

  document.getElementById("modal-label").textContent       = note.label;
  document.getElementById("modal-label").style.background  = catColors[note.category] || "#555";
  document.getElementById("modal-pts").textContent         = ${pts} puntos;
  // La pregunta NO se muestra aquí — la descubren al revelar la respuesta
  document.getElementById("modal-question").textContent    = "¿Pueden responder esta pregunta?";
  document.getElementById("modal-hint").textContent        = note.hint || "";
  document.getElementById("modal-answer").innerHTML        = note.answer;
  document.getElementById("answer-section").style.display  = "none";
  document.getElementById("modal-hint-section").style.display = "none";
  document.getElementById("award-section").style.display   = "none";
  document.getElementById("btn-show-hint").style.display   = note.hint ? "inline-flex" : "none";
  document.getElementById("btn-reveal-answer").style.display = "inline-flex";

  // ── BUG FIX: reconstruir botones de asignación dinámicamente ──
  const awardSection = document.getElementById("award-section");
  awardSection.innerHTML = ""; // limpiar botones viejos

  const gA = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupA);
  const gB = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupB);

  [gA, gB].forEach(group => {
    if (!group) return;
    const btn = document.createElement("button");
    btn.className = "btn--award";
    btn.style.borderColor = group.color;
    btn.style.color = group.color;
    btn.style.background = group.color + "18"; // muy transparente
    btn.textContent = ✓ Punto para ${group.name};
    btn.addEventListener("click", () => awardPoints(group.id, note));
    awardSection.appendChild(btn);
  });

  overlay.style.display = "flex";
  overlay.classList.add("modal-in");

  // Botones de acción
  // Usar cloneNode para remover listeners acumulados
  replaceListener("btn-reveal-answer", revealAnswer);
  replaceListener("btn-show-hint", showHint);
  replaceListener("btn-skip", () => {
    revealNoteOnBoard(note, null);
    closeModal();
  });
}

// Reemplaza un botón por su clon (elimina todos los listeners)
function replaceListener(id, fn) {
  const old = document.getElementById(id);
  if (!old) return;
  const fresh = old.cloneNode(true);
  old.parentNode.replaceChild(fresh, old);
  fresh.addEventListener("click", fn);
}

function revealAnswer() {
  document.getElementById("answer-section").style.display  = "block";
  document.getElementById("award-section").style.display   = "flex";
  // Mostrar la pregunta ahora que van a ver la respuesta
  if (WALL_STATE.activeNote) {
    document.getElementById("modal-question").innerHTML =
      WALL_STATE.activeNote.front.replace(/\n/g, "<br>");
  }
  document.getElementById("btn-reveal-answer").style.display = "none";
}

function showHint() {
  document.getElementById("modal-hint-section").style.display = "block";
  document.getElementById("btn-show-hint").style.display = "none";
}

function awardPoints(groupId, note) {
  const pts = calcPoints(note);
  if (!WALL_STATE.scores[groupId]) WALL_STATE.scores[groupId] = 0;
  WALL_STATE.scores[groupId] += pts;
  WALL_STATE.activeGroup = groupId;
  _awarded[note.id] = groupId;

  saveWallState();
  renderScoreboard();
  revealNoteOnBoard(note, groupId);
  WallSound.playPoint(groupId === WALL_STATE.matchGroupA ? "A" : "B");
  closeModal();

  if (SheetsConnector.isConnected()) {
    const group = WALL_DATA.groups.find(g => g.id === groupId);
    SheetsConnector.submitReveal(note.id, note.label, group?.name || groupId, pts).catch(() => {});
  }

  if (WALL_STATE.revealed.size === WALL_DATA.notes.length) {
    setTimeout(() => endGame(), 600);
  }
}

function revealNoteOnBoard(note, groupId) {
  WALL_STATE.revealed.add(note.id);
  saveWallState();

  const noteEl = document.querySelector(.note[data-id="${note.id}"]);
  if (!noteEl) return;

  noteEl.classList.add("note--flipping");
  setTimeout(() => {
    noteEl.classList.add("note--revealed");
    noteEl.classList.remove("note--flipping");
    if (groupId) {
      const color = WALL_DATA.groups.find(g => g.id === groupId)?.color || "#888";
      noteEl.querySelector(".note__back").style.borderTop = 4px solid ${color};
    }
  }, 700);
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.remove("modal-in");
  overlay.classList.add("modal-out");
  setTimeout(() => {
    overlay.style.display = "none";
    overlay.classList.remove("modal-out");
  }, 300);
  WALL_STATE.activeNote = null;
}

// =============================================================
// MARCADOR DINÁMICO (grupos del match actual)
// =============================================================
function renderScoreboard() {
  const inner = document.getElementById("scoreboard-inner");
  if (!inner) return;
  inner.innerHTML = "";

  const gA = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupA);
  const gB = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupB);
  if (!gA || !gB) return;

  const sA = WALL_STATE.scores[gA.id] || 0;
  const sB = WALL_STATE.scores[gB.id] || 0;
  const total = WALL_DATA.notes.reduce((s, n) => s + calcPoints(n), 0);
  const pctA = total > 0 ? (sA / total * 100).toFixed(0) : 0;
  const pctB = total > 0 ? (sB / total * 100).toFixed(0) : 0;

  inner.innerHTML = 
    <div class="team-score">
      <div class="team-score__name" style="color:${gA.color}">${gA.name}</div>
      <div class="team-score__pts" style="color:${gA.color}" id="score-a">${sA.toLocaleString()}</div>
      <div class="team-score__bar-wrap">
        <div class="team-score__bar" style="background:${gA.color};width:${pctA}%"></div>
      </div>
    </div>
    <div class="scoreboard__center">
      <div class="vs-badge">VS</div>
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${(WALL_STATE.revealed.size/WALL_DATA.notes.length*100).toFixed(0)}%"></div>
        </div>
        <div class="progress-label">${WALL_STATE.revealed.size} / ${WALL_DATA.notes.length} notas</div>
      </div>
    </div>
    <div class="team-score" style="text-align:right">
      <div class="team-score__name" style="color:${gB.color}">${gB.name}</div>
      <div class="team-score__pts" style="color:${gB.color}" id="score-b">${sB.toLocaleString()}</div>
      <div class="team-score__bar-wrap">
        <div class="team-score__bar" style="background:${gB.color};width:${pctB}%;margin-left:auto"></div>
      </div>
    </div>
  ;
}

// =============================================================
// TOGGLE DE GRUPO ACTIVO (dinámico)
// =============================================================
function renderGroupToggle() {
  const container = document.getElementById("group-toggle-container");
  if (!container) return;
  container.innerHTML = "";

  const gA = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupA);
  const gB = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupB);

  [gA, gB].filter(Boolean).forEach(group => {
    const btn = document.createElement("button");
    btn.className = "team-toggle-btn" + (WALL_STATE.activeGroup === group.id ? " active" : "");
    btn.dataset.group = group.id;
    btn.textContent   = group.name;
    btn.style.setProperty("--group-color", group.color);
    btn.addEventListener("click", () => {
      WALL_STATE.activeGroup = group.id;
      document.querySelectorAll(".team-toggle-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.group === group.id)
      );
      WallSound.playClick();
    });
    container.appendChild(btn);
  });
}

// =============================================================
// LEYENDA
// =============================================================
function renderLegend() {
  const inner = document.getElementById("legend-inner");
  if (!inner) return;
  inner.innerHTML = <span style="font-size:11px;color:#888;font-weight:700">CATEGORÍAS:</span>;

  const catMeta = {
    glosario:    { bg: "#fef08a", border: "#ca8a04" },
    proceso:     { bg: "#bbf7d0", border: "#15803d" },
    tratamiento: { bg: "#bfdbfe", border: "#1d4ed8" },
    concepto:    { bg: "#fed7aa", border: "#c2410c" },
    articulo:    { bg: "#e9d5ff", border: "#7e22ce" },
    reto:        { bg: "#fecaca", border: "#7b1c1c" },
  };

  const cats = [...new Set(WALL_DATA.notes.map(n => n.category))];
  cats.forEach(cat => {
    const m   = catMeta[cat] || { bg: "#eee", border: "#999" };
    const pts = WALL_DATA.notes.find(n => n.category === cat)?.basePoints || "?";
    const w   = WALL_DATA.weights[cat] ?? 1.0;
    const eff = Math.round(pts * w);
    const item = document.createElement("div");
    item.className = "legend__item";
    item.innerHTML = 
      <div class="legend__dot" style="background:${m.bg};border:1px solid ${m.border}"></div>
      ${cat.charAt(0).toUpperCase() + cat.slice(1)} · ${eff} pts
      ${w !== 1.0 ? <em style="color:#888;font-size:10px">(×${w})</em> : ""}
    ;
    inner.appendChild(item);
  });
}

// =============================================================
// FIN DE JUEGO
// =============================================================
function endGame() {
  WallSound.playFinale();
  const gA = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupA);
  const gB = WALL_DATA.groups.find(g => g.id === WALL_STATE.matchGroupB);
  const sA = WALL_STATE.scores[WALL_STATE.matchGroupA] || 0;
  const sB = WALL_STATE.scores[WALL_STATE.matchGroupB] || 0;
  const winner = sA > sB ? gA : sB > sA ? gB : null;

  document.getElementById("end-score-a").textContent  = sA.toLocaleString();
  document.getElementById("end-score-b").textContent  = sB.toLocaleString();
  document.getElementById("end-team-a-name").textContent = gA?.name || "Grupo A";
  document.getElementById("end-team-b-name").textContent = gB?.name || "Grupo B";
  document.getElementById("end-winner").textContent =
    winner ? 🏆 ¡Gana ${winner.name}! : "🤝 ¡Empate perfecto!";

  // Acumular puntaje total
  if (!WALL_STATE.totalScores) WALL_STATE.totalScores = {};
  [WALL_STATE.matchGroupA, WALL_STATE.matchGroupB].forEach(id => {
    WALL_STATE.totalScores[id] = (WALL_STATE.totalScores[id] || 0) + (WALL_STATE.scores[id] || 0);
  });
  saveWallState();

  // Enviar a Sheets
  if (SheetsConnector.isConnected()) {
    SheetsConnector.submitFinal(gA?.name || "A", gB?.name || "B", sA, sB).catch(() => {});
  }

  document.getElementById("end-overlay").style.display = "flex";
}

// =============================================================
// RESET / NUEVO MATCH
// =============================================================
function resetMatch() {
  if (!confirm("¿Reiniciar el tablero y los puntajes de este match?")) return;
  WALL_STATE.revealed.clear();
  WALL_STATE.scores      = {};
  WALL_STATE.matchGroupA = null;
  WALL_STATE.matchGroupB = null;
  WALL_STATE.activeGroup = null;
  WALL_STATE.shuffledIds = [];
  saveWallState();
  document.getElementById("end-overlay").style.display = "none";
  document.getElementById("wall-grid").innerHTML = "";
  openMatchSetup();
}

// =============================================================
// TOOLBAR (export / import)
// =============================================================
function setupToolbar() {
  document.getElementById("btn-export-json").addEventListener("click", exportJSON);
  document.getElementById("btn-export-csv").addEventListener("click",  exportCSV);
  document.getElementById("btn-import").addEventListener("click", () =>
    document.getElementById("import-file").click()
  );
  document.getElementById("btn-new-match").addEventListener("click", resetMatch);
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(WALL_DATA.notes, null, 2)], { type: "application/json" });
  download(blob, "knowledge_wall_preguntas.json");
  showToast("💾 JSON exportado");
}

function exportCSV() {
  const header = ["id","category","basePoints","label","front","answer","hint"];
  const rows   = WALL_DATA.notes.map(n => [
    n.id, n.category, n.basePoints, "${n.label}",
    "${n.front.replace(/\n/g," ")}",
    "${n.answer.replace(/"/g,'""')}",
    "${(n.hint||"").replace(/"/g,'""')}"
  ]);
  const csv  = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  download(blob, "knowledge_wall_preguntas.csv");
  showToast("📊 CSV exportado");
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      if (ext === "json") {
        const notes = JSON.parse(ev.target.result);
        if (!Array.isArray(notes)) throw new Error("El JSON debe ser un array");
        WALL_DATA.notes = notes;
        shuffleNotes();
        renderWall();
        showToast(✅ ${notes.length} preguntas importadas);
      } else if (ext === "csv") {
        const lines = ev.target.result.split("\n").slice(1);
        WALL_DATA.notes = lines.filter(l => l.trim()).map(line => {
          const cols = parseCSVLine(line);
          return {
            id:         parseInt(cols[0]) || Math.random(),
            category:   cols[1] || "concepto",
            basePoints: parseInt(cols[2]) || 100,
            label:      cols[3] || "PREGUNTA",
            front:      cols[4] || "",
            answer:     cols[5] || "",
            hint:       cols[6] || "",
          };
        });
        shuffleNotes();
        renderWall();
        showToast(✅ ${WALL_DATA.notes.length} preguntas importadas);
      }
    } catch(err) {
      showToast("❌ Error al importar: " + err.message, "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function parseCSVLine(line) {
  const result = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

// =============================================================
// PANEL ADMIN OCULTO (triple-clic en logo)
// Contiene: pesos de calificación + limpiar Sheets
// =============================================================
function setupAdminPanel() {
  const panel = document.getElementById("admin-panel");
  if (!panel) return;

  // Renderizar controles de pesos
  renderWeightControls();

  // Guardar pesos
  document.getElementById("btn-save-weights").addEventListener("click", () => {
    const inputs = document.querySelectorAll(".weight-input");
    inputs.forEach(inp => {
      const cat = inp.dataset.cat;
      const val = parseFloat(inp.value);
      if (!isNaN(val) && val > 0) WALL_DATA.weights[cat] = val;
    });
    saveWallState();
    renderLegend();
    renderWall();
    showToast("✅ Pesos actualizados");
  });

  // URL de Sheets
  const urlInput = document.getElementById("sheets-url-input");
  const saveBtn  = document.getElementById("btn-save-sheets");
  if (urlInput && saveBtn) {
    urlInput.value = SheetsConnector.getUrl();
    saveBtn.addEventListener("click", () => {
      const url = urlInput.value.trim();
      SheetsConnector.setUrl(url);
      checkSheetsConnection();
      showToast(url ? "✅ URL de Sheets guardada" : "○ Modo sin nube activado");
    });
  }

  // Limpiar Sheets (oculto a simple vista dentro del panel admin)
  document.getElementById("btn-clear-sheets").addEventListener("click", async () => {
    if (!confirm("⚠️ ¿Vaciar TODOS los datos de Google Sheets?\nEsto borrará Puntajes, Historial y Log.")) return;
    if (!SheetsConnector.isConnected()) {
      showToast("❌ No hay conexión a Sheets", "error");
      return;
    }
    showToast("⏳ Vaciando...");
    const res = await SheetsConnector.clearSheets().catch(() => null);
    showToast(res?.ok ? "✅ Sheets vaciados correctamente" : "❌ Error al vaciar", res?.ok ? "info" : "error");
  });
}

function renderWeightControls() {
  const container = document.getElementById("weight-controls");
  if (!container) return;
  container.innerHTML = "";

  const cats = ["glosario", "proceso", "tratamiento", "concepto", "articulo", "reto"];
  const baseMap = {};
  cats.forEach(cat => {
    const note = WALL_DATA.notes.find(n => n.category === cat);
    baseMap[cat] = note?.basePoints || 100;
  });

  cats.forEach(cat => {
    const w    = WALL_DATA.weights[cat] ?? 1.0;
    const row  = document.createElement("div");
    row.className = "weight-row";
    row.innerHTML = 
      <label class="weight-label">${cat.charAt(0).toUpperCase() + cat.slice(1)}
        <span style="color:#888;font-size:10px">(base: ${baseMap[cat]} pts)</span>
      </label>
      <input type="number" class="weight-input" data-cat="${cat}"
        value="${w}" min="0.1" max="5" step="0.1"
        style="width:70px;padding:3px 6px;border:1px solid #ccc;border-radius:4px;">
      <span class="weight-preview" style="color:#888;font-size:11px">
        → ${Math.round(baseMap[cat] * w)} pts
      </span>
    ;
    // Preview en tiempo real
    row.querySelector(".weight-input").addEventListener("input", function() {
      const v = parseFloat(this.value) || 1;
      row.querySelector(".weight-preview").textContent = → ${Math.round(baseMap[cat] * v)} pts;
    });
    container.appendChild(row);
  });
}

function toggleAdminPanel() {
  const panel = document.getElementById("admin-panel");
  if (!panel) return;
  const visible = panel.style.display !== "none" && panel.style.display !== "";
  panel.style.display = visible ? "none" : "block";
  if (!visible) showToast("🔧 Panel de administración abierto");
}

// =============================================================
// CONEXIÓN SHEETS
// =============================================================
async function checkSheetsConnection() {
  const indicator = document.getElementById("sheets-indicator");
  if (!indicator) return;
  if (!SheetsConnector.isConnected()) {
    indicator.textContent = "○ Sin conexión a Sheets";
    indicator.className   = "sheets-indicator sheets-offline";
    return;
  }
  indicator.textContent = "◌ Conectando...";
  const ok = await SheetsConnector.ping();
  indicator.textContent = ok ? "● Sheets activo" : "○ Error de conexión";
  indicator.className   = "sheets-indicator " + (ok ? "sheets-online" : "sheets-offline");
}

// =============================================================
// TOAST
// =============================================================
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = toast toast--${type} toast--show;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("toast--show"), 3000);
}
