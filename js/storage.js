// ==================================================
// STOCKAGE (JSONBIN)
// ==================================================

async function load() {
  setLoading(true);
  try {
    const res = await fetch(BIN_URL + "/latest", { headers: HEADERS_R });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const defs = data?.definitions ?? data?.record?.definitions ?? null;
    if (Array.isArray(defs) && defs.length > 0) {
      definitions = defs;
    } else {
      definitions = [...defaultData];
      await saveRemote();
    }
  } catch (e) {
    console.warn("JSONBin inaccessible", e);
    const stored = localStorage.getItem("lexiprof_fallback");
    definitions = stored ? JSON.parse(stored) : [...defaultData];
  }
  setLoading(false);
  render();
}

async function saveRemote() {
  try {
    const res = await fetch(BIN_URL, {
      method: "PUT",
      headers: HEADERS_W,
      body: JSON.stringify({ definitions })
    });
    if (!res.ok) throw new Error(res.status);
    localStorage.setItem("lexiprof_fallback", JSON.stringify(definitions));
  } catch (e) {
    console.warn("Sauvegarde échouée", e);
    showToast("⚠️ Erreur de sauvegarde.");
  }
}
