// ==================================================
// STOCKAGE (JSONBIN)
// ==================================================

async function load() {
  setLoading(true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(BIN_URL + "/latest", {
        headers: HEADERS_R,
        signal: controller.signal
      });

      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      const defs = data?.definitions ?? data?.record?.definitions ?? null;

      if (Array.isArray(defs) && defs.length > 0) {
        definitions = defs;
      } else {
        definitions = [...defaultData];
        await saveRemote();
      }

    } finally {
      clearTimeout(timeout);
    }

  } catch (e) {

    console.warn("JSONBin inaccessible ou trop lent", e);

    try {
      const stored = localStorage.getItem("lexiprof_fallback");
      definitions = stored
        ? JSON.parse(stored)
        : [...defaultData];
    } catch {
      definitions = [...defaultData];
    }

    showToast("⚠️ Mode hors ligne — données locales utilisées");
  }

  setLoading(false);
  render();

  // Ferme l'écran de chargement global
  const loader = document.querySelector(".global-loader");

  if (loader) {
    loader.classList.add("hidden");

    setTimeout(() => {
      loader.remove();
    }, 500);
  }
}


async function saveRemote() {

  try {

    const res = await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS_W,
      body: JSON.stringify({ definitions })
    });

    if (!res.ok) throw new Error(res.status);

    localStorage.setItem(
      "lexiprof_fallback",
      JSON.stringify(definitions)
    );

  } catch (e) {

    console.warn("Sauvegarde échouée", e);

    localStorage.setItem(
      "lexiprof_fallback",
      JSON.stringify(definitions)
    );

    showToast(
      "⚠️ Erreur de sauvegarde. Copie locale conservée."
    );
  }
}