// ==================================================
// STOCKAGE — JSONBIN
// ==================================================

async function load() {

  // Pas de loader : on charge directement les données
  try {

    const controller = new AbortController();

    // Timeout de sécurité : 8 secondes maximum
    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    let response;

    try {
      response = await fetch(
        BIN_URL + "/latest",
        {
          method: "GET",
          headers: HEADERS_R,
          signal: controller.signal,
          cache: "no-store"
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`JSONBin HTTP ${response.status}`);
    }

    const data = await response.json();

    // JSONBin peut renvoyer :
    // { definitions: [...] }
    // ou
    // { record: { definitions: [...] } }

    const record = data?.record ?? data;
    const remoteDefs = record?.definitions;

    if (!Array.isArray(remoteDefs)) {
      throw new Error("Format JSONBin invalide.");
    }

    // On accepte même un tableau vide :
    // il représente alors réellement le contenu du BIN.
    definitions = remoteDefs;

    // Sauvegarde locale de secours
    try {
      localStorage.setItem(
        "lexiprof_fallback",
        JSON.stringify(definitions)
      );
    } catch (e) {
      console.warn("Impossible de sauvegarder le fallback local :", e);
    }

    console.log(
      `✅ JSONBin chargé : ${definitions.length} définitions`
    );

  } catch (error) {

    console.warn(
      "⚠️ JSONBin indisponible :",
      error
    );

    // ==================================================
    // FALLBACK LOCAL
    // ==================================================

    let localDefinitions = null;

    try {

      const stored = localStorage.getItem(
        "lexiprof_fallback"
      );

      if (stored) {

        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          localDefinitions = parsed;
        }

      }

    } catch (localError) {

      console.warn(
        "⚠️ Fallback local corrompu, suppression.",
        localError
      );

      // Très important :
      // on supprime l'ancien fallback cassé
      try {
        localStorage.removeItem("lexiprof_fallback");
      } catch (e) {}
    }

    // Si le fallback local fonctionne
    if (Array.isArray(localDefinitions)) {

      definitions = localDefinitions;

      console.log(
        `✅ Fallback local chargé : ${definitions.length} définitions`
      );

    } else {

      // ==================================================
      // DERNIER RECOURS : DONNÉES PAR DÉFAUT
      // ==================================================

      definitions = [...defaultData];

      console.log(
        `✅ Données par défaut chargées : ${definitions.length} définitions`
      );

      // On tente de créer un nouveau fallback propre
      try {
        localStorage.setItem(
          "lexiprof_fallback",
          JSON.stringify(definitions)
        );
      } catch (e) {
        console.warn(
          "⚠️ Impossible de créer le fallback local.",
          e
        );
      }
    }
  }

  // ==================================================
  // AFFICHAGE
  // ==================================================

  render();
}


// ==================================================
// SAUVEGARDE SUR JSONBIN
// ==================================================

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

    // Sauvegarde locale de secours
    try {

      localStorage.setItem(
        "lexiprof_fallback",
        JSON.stringify(definitions)
      );

    } catch (localError) {

      console.warn(
        "⚠️ Impossible de sauvegarder localement :",
        localError
      );
    }

    console.log(
      `✅ JSONBin sauvegardé : ${definitions.length} définitions`
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Erreur sauvegarde JSONBin :",
      error
    );

    // Même si JSONBin est indisponible,
    // on conserve les données localement.

    try {

      localStorage.setItem(
        "lexiprof_fallback",
        JSON.stringify(definitions)
      );

    } catch (localError) {

      console.error(
        "❌ Impossible de créer le fallback local :",
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