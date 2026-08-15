// ==================================================
// STOCKAGE — JSONBIN
// ==================================================

// --------------------------------------------------
// CHARGEMENT DEPUIS JSONBIN
// --------------------------------------------------

async function loadRemote() {

  const controller = new AbortController();

  // Empêche JSONBin de bloquer LexiProf indéfiniment
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
      throw new Error(
        `JSONBin HTTP ${response.status}`
      );
    }

    const data = await response.json();

    // JSONBin peut renvoyer les données directement
    // ou dans "record"
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
            "✅ Définitions locales chargées."
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

    // Toujours garder une copie locale
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

    // Même si JSONBin tombe, on garde les données
    // localement pour éviter de les perdre.
    try {

      localStorage.setItem(
        "lexiprof_fallback",
        JSON.stringify(definitions)
      );

    } catch (localError) {

      console.error(
        "❌ Impossible de créer la sauvegarde locale :",
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