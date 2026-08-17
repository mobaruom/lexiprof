// ==================================================
// STOCKAGE — JSONBIN
// ==================================================

// --------------------------------------------------
// CHARGEMENT DEPUIS JSONBIN
// --------------------------------------------------

async function loadRemote() {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 8000);

  try {

    const response = await fetch(
      BIN_URL + "/latest",
      {
        method: "GET",
        headers: HEADERS_R,
        signal: controller.signal,
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`JSONBin HTTP ${response.status}`);
    }

    const data = await response.json();

    const record = data?.record ?? data;
    const defs = record?.definitions;

    if (!Array.isArray(defs)) {
      throw new Error(
        "Format JSONBin invalide : definitions introuvable."
      );
    }

    // Sauvegarde locale de secours
    localStorage.setItem(
      "lexiprof_fallback",
      JSON.stringify(defs)
    );

    console.log(
      `✅ JSONBin chargé : ${defs.length} définitions`
    );

    return defs;

  } catch (error) {

    console.warn(
      "⚠️ Impossible de charger JSONBin :",
      error
    );

    // --------------------------------------------------
    // FALLBACK LOCAL
    // --------------------------------------------------

    try {

      const local = localStorage.getItem(
        "lexiprof_fallback"
      );

      if (local) {

        const defs = JSON.parse(local);

        if (Array.isArray(defs)) {

          console.log(
            `✅ Définitions locales chargées : ${defs.length}`
          );

          return defs;

        }

      }

    } catch (localError) {

      console.warn(
        "⚠️ Erreur avec les données locales :",
        localError
      );

    }

    // --------------------------------------------------
    // DERNIER RECOURS : DONNÉES PAR DÉFAUT
    // --------------------------------------------------

    console.log(
      "ℹ️ Utilisation des définitions par défaut."
    );

    return [...defaultData];

  } finally {

    clearTimeout(timeout);

  }

}


// --------------------------------------------------
// FONCTION DE CHARGEMENT PRINCIPALE
// --------------------------------------------------
// IMPORTANT : app.js appelle load()
// --------------------------------------------------

async function load() {

  setLoading(true);

  try {

    const defs = await loadRemote();

    if (Array.isArray(defs)) {

      definitions = defs;

    } else {

      definitions = [...defaultData];

    }

  } catch (error) {

    console.error(
      "❌ Erreur globale de chargement :",
      error
    );

    definitions = [...defaultData];

  }

  setLoading(false);

  render();

}


// --------------------------------------------------
// SAUVEGARDE SUR JSONBIN
// --------------------------------------------------

async function saveRemote() {

  try {

    const response = await fetch(
      BIN_URL,
      {
        method: "PUT",
        headers: HEADERS_W,
        body: JSON.stringify({
          definitions: definitions
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        `JSONBin HTTP ${response.status}`
      );
    }

    localStorage.setItem(
      "lexiprof_fallback",
      JSON.stringify(definitions)
    );

    console.log(
      "✅ Définitions sauvegardées sur JSONBin."
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Erreur sauvegarde JSONBin :",
      error
    );

    try {

      localStorage.setItem(
        "lexiprof_fallback",
        JSON.stringify(definitions)
      );

    } catch (localError) {

      console.error(
        "❌ Impossible de sauvegarder localement :",
        localError
      );

    }

    if (typeof showToast === "function") {

      showToast(
        "⚠️ JSONBin indisponible — copie locale conservée."
      );

    }

    return false;

  }

}