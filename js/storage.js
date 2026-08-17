/* =========================================================
   LEXIPROF — STORAGE.JS
   Gestion JSONBin + fallback local
========================================================= */

async function loadRemote() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(BIN_URL + "/latest", {
        method: "GET",
        headers: HEADERS_R,
        signal: controller.signal,
        cache: "no-store"
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) throw new Error(`JSONBin HTTP ${response.status}`);

    const data = await response.json();
    const record = data?.record ?? data;
    const remoteDefs = record?.definitions;

    if (!Array.isArray(remoteDefs)) throw new Error("Format JSONBin invalide.");

    definitions = remoteDefs.map(normalizeDefinition);

    try {
      localStorage.setItem("lexiprof_fallback", JSON.stringify(definitions));
    } catch (e) {
      console.warn("Fallback local impossible :", e);
    }

    console.log(`✅ JSONBin : ${definitions.length} définitions`);
    return true;

  } catch (error) {
    console.warn("⚠️ JSONBin indisponible :", error);

    // Fallback local
    try {
      const stored = localStorage.getItem("lexiprof_fallback");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          definitions = parsed.map(normalizeDefinition);
          console.log(`✅ Fallback local : ${definitions.length} définitions`);
          return true;
        }
      }
    } catch (e) {
      console.warn("Fallback corrompu :", e);
      try { localStorage.removeItem("lexiprof_fallback"); } catch (_) {}
    }

    // Dernier recours : données par défaut
    definitions = defaultData.map(normalizeDefinition);
    console.log(`✅ Données par défaut : ${definitions.length} définitions`);
    try {
      localStorage.setItem("lexiprof_fallback", JSON.stringify(definitions));
    } catch (_) {}
    return false;
  }
}

async function saveRemote() {
  try {
    const response = await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS_W,
      body: JSON.stringify({ definitions: definitions })
    });

    if (!response.ok) throw new Error(`JSONBin HTTP ${response.status}`);

    try {
      localStorage.setItem("lexiprof_fallback", JSON.stringify(definitions));
    } catch (e) {
      console.warn("Sauvegarde locale impossible :", e);
    }

    console.log(`✅ JSONBin sauvegardé : ${definitions.length} définitions`);
    return true;

  } catch (error) {
    console.error("❌ Erreur sauvegarde JSONBin :", error);

    try {
      localStorage.setItem("lexiprof_fallback", JSON.stringify(definitions));
    } catch (e) {
      console.error("❌ Fallback local impossible :", e);
    }

    if (typeof showToast === "function") {
      showToast("⚠️ JSONBin indisponible — copie locale conservée.");
    }
    return false;
  }
}
