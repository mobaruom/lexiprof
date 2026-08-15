// ==================================================
// LEXIPROF — APP.JS
// Version stable
// IMPORTANT : load() et saveRemote() sont dans storage.js
// ==================================================

"use strict";

// ==================================================
// DONNÉES PAR DÉFAUT
// ==================================================

const defaultData = [
  {
    id: 1,
    term: "Management",
    matiere: "Management",
    def: "Ensemble des techniques de direction, de coordination et de contrôle permettant à une organisation d'atteindre ses objectifs de manière efficace et efficiente.",
    example: "Le management d'une entreprise implique de planifier les stratégies, organiser les ressources, diriger les équipes et contrôler les résultats.",
    remember: "Penser au cycle PDCA : Planifier, Déployer, Contrôler, Ajuster.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est le rôle principal du management ?",
      answers: [
        { text: "Diriger et coordonner les ressources", correct: true },
        { text: "Vendre des produits", correct: false },
        { text: "Rédiger des contrats juridiques", correct: false }
      ]
    }
  },

  {
    id: 2,
    term: "Leadership",
    matiere: "Management",
    def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs, en inspirant confiance et adhésion.",
    example: "Un bon leader sait écouter son équipe, communiquer une vision claire et donner l'exemple.",
    remember: "Le leader inspire, le manager organise.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quelle est la différence clé entre un leader et un manager ?",
      answers: [
        { text: "Le leader inspire et motive, le manager organise", correct: true },
        { text: "Le leader gagne plus d'argent", correct: false },
        { text: "Il n'y a aucune différence", correct: false }
      ]
    }
  },

  {
    id: 3,
    term: "Organigramme",
    matiere: "Management",
    def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation, montrant les liens d'autorité et de communication entre les différents postes.",
    example: "L'organigramme d'une entreprise montre le PDG en haut, puis les directeurs, les chefs de service et les employés.",
    remember: "Organigramme = représentation de la structure de l'organisation.",
    createdAt: "2024-01-01",
    qcm: {
      question: "À quoi sert un organigramme ?",
      answers: [
        { text: "Représenter la structure hiérarchique", correct: true },
        { text: "Calculer les salaires", correct: false },
        { text: "Planifier les vacances", correct: false }
      ]
    }
  },

  {
    id: 4,
    term: "Contrat de travail",
    matiere: "Droit",
    def: "Convention par laquelle une personne, le salarié, s'engage à travailler pour le compte et sous la direction d'une autre personne, l'employeur, en échange d'une rémunération.",
    example: "Un CDI est un contrat à durée indéterminée, tandis qu'un CDD a une date de fin fixée dès le départ.",
    remember: "CDI = durée indéterminée. CDD = durée déterminée.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'élément essentiel d'un contrat de travail ?",
      answers: [
        { text: "Une rémunération en échange du travail", correct: true },
        { text: "Un logement fourni", correct: false },
        { text: "Une voiture de fonction", correct: false }
      ]
    }
  },

  {
    id: 5,
    term: "Personne morale",
    matiere: "Droit",
    def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres, telle qu'une société, une association ou une collectivité publique.",
    example: "Une SARL est une personne morale qui peut signer des contrats, posséder des biens et être poursuivie en justice.",
    remember: "Personne physique = individu. Personne morale = organisation juridiquement reconnue.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quelle entité est une personne morale ?",
      answers: [
        { text: "Une société (SARL, SAS, SA)", correct: true },
        { text: "Un individu", correct: false },
        { text: "Un animal domestique", correct: false }
      ]
    }
  },

  {
    id: 6,
    term: "PIB",
    matiere: "Économie",
    def: "Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.",
    example: "Si le PIB de la France augmente de 2%, cela signifie que l'économie française a créé davantage de richesse.",
    remember: "PIB = ce que le pays produit.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Que mesure le PIB ?",
      answers: [
        { text: "La richesse produite sur le territoire national", correct: true },
        { text: "Le nombre d'habitants", correct: false },
        { text: "Le taux de chômage", correct: false }
      ]
    }
  },

  {
    id: 7,
    term: "Inflation",
    matiere: "Économie",
    def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie, entraînant une diminution du pouvoir d'achat de la monnaie.",
    example: "Avec une inflation de 5%, un produit qui coûtait 100€ peut coûter 105€.",
    remember: "Inflation = les prix montent, le pouvoir d'achat baisse.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'effet principal de l'inflation ?",
      answers: [
        { text: "Diminution du pouvoir d'achat", correct: true },
        { text: "Augmentation automatique des salaires", correct: false },
        { text: "Baisse générale des prix", correct: false }
      ]
    }
  },

  {
    id: 8,
    term: "Recrutement",
    matiere: "RH",
    def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats qualifiés pour pourvoir un poste vacant, en adéquation avec ses besoins et sa culture d'entreprise.",
    example: "Le recrutement peut passer par des annonces en ligne, des cabinets de recrutement ou du cooptage.",
    remember: "Recrutement = trouver la bonne personne au bon poste.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'objectif du recrutement ?",
      answers: [
        { text: "Trouver le candidat adapté au poste", correct: true },
        { text: "Réduire les salaires", correct: false },
        { text: "Augmenter les congés", correct: false }
      ]
    }
  },

  {
    id: 9,
    term: "GPEC",
    matiere: "RH",
    def: "Gestion Prévisionnelle des Emplois et des Compétences. Démarche prospective visant à anticiper les besoins en ressources humaines d'une organisation à moyen terme afin d'adapter les effectifs et les compétences.",
    example: "Une entreprise qui prévoit de se digitaliser peut anticiper les besoins de formation de ses salariés.",
    remember: "GPEC = anticiper les besoins futurs en emplois et compétences.",
    createdAt: "2024-01-01",
    qcm: {
      question: "La GPEC vise à :",
      answers: [
        { text: "Anticiper les besoins futurs en compétences", correct: true },
        { text: "Réduire les salaires immédiatement", correct: false },
        { text: "Embaucher sans stratégie", correct: false }
      ]
    }
  }
];


// ==================================================
// ÉTAT GLOBAL
// ==================================================

let definitions = [];
let currentFilter = "all";
let searchQuery = "";
let editingId = null;


// ==================================================
// UTILITAIRES
// ==================================================

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nextId() {
  if (!definitions.length) return 1;

  return Math.max(
    ...definitions.map(d => Number(d.id) || 0)
  ) + 1;
}

function getPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}

function isNew(createdAt) {
  if (!createdAt) return false;

  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) {
    return false;
  }

  const days =
    (Date.now() - created.getTime()) /
    (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 7;
}

function highlight(text, query) {
  const safeText = escapeHTML(text);

  if (!query) return safeText;

  const escapedQuery = query
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return safeText.replace(
    new RegExp(`(${escapedQuery})`, "gi"),
    "<mark>$1</mark>"
  );
}


// ==================================================
// FAVORIS
// ==================================================

function getFavorites() {
  try {
    const raw = localStorage.getItem("lexiprof_favorites");
    const data = raw ? JSON.parse(raw) : [];

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const index = favs.indexOf(id);

  if (index !== -1) {
    favs.splice(index, 1);
    showToast("☆ Retiré des favoris");
  } else {
    favs.push(id);
    showToast("★ Ajouté aux favoris");
  }

  localStorage.setItem(
    "lexiprof_favorites",
    JSON.stringify(favs)
  );

  render();
}


// ==================================================
// HISTORIQUE RECHERCHE
// ==================================================

function getSearchHistory() {
  try {
    const raw = localStorage.getItem(
      "lexiprof_search_history"
    );

    const data = raw ? JSON.parse(raw) : [];

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function addToHistory(query) {
  if (!query || !query.trim()) return;

  let history = getSearchHistory();

  history = history.filter(
    item => item.toLowerCase() !== query.toLowerCase()
  );

  history.unshift(query.trim());

  history = history.slice(0, 5);

  localStorage.setItem(
    "lexiprof_search_history",
    JSON.stringify(history)
  );

  renderHistory();
}

function removeFromHistory(query, event) {
  if (event) {
    event.stopPropagation();
  }

  const history = getSearchHistory().filter(
    item => item !== query
  );

  localStorage.setItem(
    "lexiprof_search_history",
    JSON.stringify(history)
  );

  renderHistory();
}

function renderHistory() {
  const container = $("searchHistory");

  if (!container) return;

  const history = getSearchHistory();

  if (!history.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = history.map(query => {
    const safe = escapeHTML(query);
    const encoded = encodeURIComponent(query);

    return `
      <span
        class="history-chip"
        onclick="setSearch(decodeURIComponent('${encoded}'))"
      >
        ${safe}
        <span
          class="remove-chip"
          onclick="removeFromHistory(decodeURIComponent('${encoded}'), event)"
        >✕</span>
      </span>
    `;
  }).join("");
}

function setSearch(query) {
  const input = $("searchInput");

  if (!input) return;

  input.value = query;
  searchQuery = query;

  onSearch();
}

function clearSearch() {
  if (searchQuery.trim()) {
    addToHistory(searchQuery);
  }

  const input = $("searchInput");

  if (input) {
    input.value = "";
  }

  searchQuery = "";

  onSearch();
}


// ==================================================
// MODE SOMBRE
// ==================================================

function initTheme() {
  const saved =
    localStorage.getItem("lexiprof_theme");

  let isDark;

  if (saved === "dark") {
    isDark = true;
  } else if (saved === "light") {
    isDark = false;
  } else {
    isDark =
      window.matchMedia &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
  }

  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );

  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark =
    document.documentElement.getAttribute(
      "data-theme"
    ) === "dark";

  const next = isDark ? "light" : "dark";

  document.documentElement.setAttribute(
    "data-theme",
    next
  );

  localStorage.setItem(
    "lexiprof_theme",
    next
  );

  updateThemeIcon(next === "dark");
}

function updateThemeIcon(isDark) {
  const moon = $("iconMoon");
  const sun = $("iconSun");

  if (moon) {
    moon.style.display =
      isDark ? "none" : "block";
  }

  if (sun) {
    sun.style.display =
      isDark ? "block" : "none";
  }
}


// ==================================================
// COMPTEUR
// ==================================================

function updateCounter(count) {
  const element = $("defCounter");

  if (!element) return;

  const total = definitions.length;

  if (
    currentFilter === "all" &&
    !searchQuery.trim()
  ) {
    element.textContent =
      `${total} définition${total !== 1 ? "s" : ""} disponible${total !== 1 ? "s" : ""}`;
  } else {
    element.textContent =
      `${count} résultat${count !== 1 ? "s" : ""} sur ${total}`;
  }
}


// ==================================================
// SCROLL
// ==================================================

let scrollObserver = null;

function initScrollObserver() {
  if (!("IntersectionObserver" in window)) {
    scrollObserver = null;
    return;
  }

  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  scrollObserver =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");

            if (scrollObserver) {
              scrollObserver.unobserve(
                entry.target
              );
            }
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -20px 0px"
      }
    );
}

function observeCards() {
  const cards =
    document.querySelectorAll(
      ".card:not(.visible)"
    );

  cards.forEach((card, index) => {
    card.style.transitionDelay =
      `${Math.min(index * 40, 300)}ms`;

    if (scrollObserver) {
      scrollObserver.observe(card);
    } else {
      card.classList.add("visible");
    }
  });
}

function initScrollTop() {
  const button = $("scrollTop");

  if (!button) return;

  window.addEventListener(
    "scroll",
    () => {
      button.classList.toggle(
        "visible",
        window.scrollY > 400
      );
    },
    { passive: true }
  );
}


// ==================================================
// RENDU PRINCIPAL
// ==================================================

function render() {
  const container = $("cardsContainer");
  const info = $("resultsInfo");

  if (!container) return;

  const query =
    searchQuery.toLowerCase().trim();

  let filtered = [...definitions];

  // FILTRE MATIÈRE
  if (currentFilter !== "all") {
    if (currentFilter === "favorites") {
      const favs = getFavorites();

      filtered = filtered.filter(
        d => favs.includes(d.id)
      );
    } else {
      filtered = filtered.filter(
        d => d.matiere === currentFilter
      );
    }
  }

  // RECHERCHE
  if (query) {
    filtered = filtered.filter(d => {
      const term =
        String(d.term || "").toLowerCase();

      const definition =
        String(d.def || "").toLowerCase();

      const example =
        String(d.example || "").toLowerCase();

      const remember =
        String(d.remember || "").toLowerCase();

      return (
        term.includes(query) ||
        definition.includes(query) ||
        example.includes(query) ||
        remember.includes(query)
      );
    });
  }

  // TRI
  filtered.sort((a, b) =>
    String(a.term || "").localeCompare(
      String(b.term || ""),
      "fr"
    )
  );

  if (info) {
    info.textContent =
      (query || currentFilter !== "all")
        ? `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`
        : "";
  }

  updateCounter(filtered.length);

  // AUCUN RÉSULTAT
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>Aucun résultat</h3>
        <p>Essaie un autre terme ou change le filtre.</p>
      </div>
    `;

    return;
  }

  const favorites = getFavorites();

  container.innerHTML =
    filtered.map(d => {

      const id = Number(d.id);
      const favorite =
        favorites.includes(d.id) ||
        favorites.includes(id);

      const nouveau =
        isNew(d.createdAt);

      const qcm =
        d.qcm &&
        Array.isArray(d.qcm.answers);

      return `
        <div class="card">

          ${
            nouveau
              ? `<span class="card-badge-new">Nouveau</span>`
              : ""
          }

          <div class="card-top">

            <div class="card-term">
              ${highlight(d.term, query)}
            </div>

            <span class="matiere-badge badge-${escapeHTML(d.matiere)}">
              ${escapeHTML(d.matiere)}
            </span>

          </div>

          <div class="card-def">
            ${highlight(d.def, query)}
          </div>

          ${
            d.example
              ? `
                <details class="card-details">
                  <summary>💡 Exemple concret</summary>
                  <div class="details-content">
                    ${escapeHTML(d.example)}
                  </div>
                </details>
              `
              : ""
          }

          ${
            d.remember
              ? `
                <details class="card-details">
                  <summary>📝 À retenir</summary>
                  <div class="details-content">
                    ${escapeHTML(d.remember)}
                  </div>
                </details>
              `
              : ""
          }

          ${
            qcm
              ? `
                <details class="card-details">
                  <summary>❓ Mini QCM</summary>

                  <div class="details-content">

                    <p style="font-weight:600;margin-bottom:10px;">
                      ${escapeHTML(d.qcm.question)}
                    </p>

                    ${d.qcm.answers.map(answer => `
                      <button
                        class="qcm-btn"
                        data-correct="${answer.correct}"
                        onclick="handleQcmClick(this)"
                      >
                        ${escapeHTML(answer.text)}
                      </button>
                    `).join("")}

                  </div>
                </details>
              `
              : ""
          }

          <div class="card-actions">

            <button
              class="card-action-btn favorite-btn ${favorite ? "active" : ""}"
              onclick="toggleFavorite(${id})"
              title="${favorite ? "Retirer des favoris" : "Ajouter aux favoris"}"
            >
              ${favorite ? "★" : "☆"}
              <span class="btn-text"> Favori</span>
            </button>

            <button
              class="card-action-btn"
              onclick="shareDefinitionById(${id})"
              title="Partager"
            >
              📤
              <span class="btn-text"> Partager</span>
            </button>

            <button
              class="card-action-btn"
              onclick="copyDefinitionById(${id})"
              title="Copier"
            >
              📋
              <span class="btn-text"> Copier</span>
            </button>

            <button
              class="card-action-btn"
              onclick="exportCardToPDF(${id})"
              title="Exporter en PDF"
            >
              📄
              <span class="btn-text"> PDF</span>
            </button>

          </div>

        </div>
      `;
    }).join("");

  observeCards();
}


// ==================================================
// QCM
// ==================================================

function handleQcmClick(button) {
  if (!button) return;

  const parent =
    button.closest(".details-content");

  if (!parent) return;

  const buttons =
    parent.querySelectorAll(".qcm-btn");

  buttons.forEach(btn => {
    btn.disabled = true;
  });

  if (button.dataset.correct === "true") {
    button.classList.add("correct");
    showToast("✅ Bonne réponse !");
  } else {
    button.classList.add("wrong");

    buttons.forEach(btn => {
      if (btn.dataset.correct === "true") {
        btn.classList.add("correct");
      }
    });

    showToast("❌ Mauvaise réponse");
  }
}


// ==================================================
// RECHERCHE
// ==================================================

function onSearch() {
  const input = $("searchInput");

  if (!input) return;

  searchQuery = input.value;

  const clear = $("searchClear");

  if (clear) {
    clear.style.display =
      searchQuery ? "flex" : "none";
  }

  render();
}

function setFilter(filter, button) {
  currentFilter = filter;

  document
    .querySelectorAll(".filter-btn")
    .forEach(btn => {
      btn.classList.remove("active");
    });

  if (button) {
    button.classList.add("active");
  }

  render();
}


// ==================================================
// PARTAGE
// ==================================================

async function shareDefinition(term, def) {
  const data = {
    title: `LexiProf — ${term}`,
    text: `${term}\n\n${def}`,
    url: window.location.href
  };

  if (
    navigator.share &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(data);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  copyText(`${term}\n\n${def}`);
}

function shareDefinitionById(id) {
  const d =
    definitions.find(
      item => Number(item.id) === Number(id)
    );

  if (!d) return;

  shareDefinition(d.term, d.def);
}


// ==================================================
// COPIER
// ==================================================

async function copyText(text) {
  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      showToast("📋 Copié !");
      return;
    }

    const textarea =
      document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    showToast("📋 Copié !");
  } catch {
    showToast("❌ Impossible de copier");
  }
}

function copyDefinition(term, def) {
  copyText(`${term}\n\n${def}`);
}

function copyDefinitionById(id) {
  const d =
    definitions.find(
      item => Number(item.id) === Number(id)
    );

  if (!d) return;

  copyDefinition(d.term, d.def);
}


// ==================================================
// EXPORT PDF
// ==================================================

function exportCardToPDF(id) {
  const d =
    definitions.find(
      item => Number(item.id) === Number(id)
    );

  if (!d) return;

  if (typeof html2pdf !== "function") {
    showToast("❌ Export PDF indisponible");
    return;
  }

  const container =
    document.createElement("div");

  container.style.padding = "30px";
  container.style.fontFamily =
    "'DM Sans', sans-serif";
  container.style.color = "#1a1814";
  container.style.background = "#fff";
  container.style.width = "700px";

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="font-family:'Lora',serif;font-size:28px;">
        LexiProf — Dictionnaire STMG
      </h1>

      <p style="color:#7a7570;font-size:13px;">
        Exporté le ${new Date().toLocaleDateString("fr-FR")}
      </p>
    </div>

    <div style="
      margin-bottom:24px;
      padding-bottom:20px;
      border-bottom:1px solid #e2ddd5;
    ">

      <h2 style="
        font-family:'Lora',serif;
        font-size:22px;
        color:#1a1814;
      ">
        ${escapeHTML(d.term)}
      </h2>

      <p style="
        font-size:11px;
        font-weight:700;
        text-transform:uppercase;
      ">
        ${escapeHTML(d.matiere)}
      </p>

      <p style="
        font-size:14px;
        line-height:1.7;
      ">
        ${escapeHTML(d.def)}
      </p>

      ${
        d.example
          ? `
            <p style="font-size:13px;color:#7a7570;">
              <strong>Exemple :</strong>
              ${escapeHTML(d.example)}
            </p>
          `
          : ""
      }

      ${
        d.remember
          ? `
            <p style="font-size:13px;color:#7a7570;">
              <strong>À retenir :</strong>
              ${escapeHTML(d.remember)}
            </p>
          `
          : ""
      }

    </div>

    <div style="
      text-align:center;
      font-size:11px;
      color:#b0aba4;
    ">
      LexiProf · mobaruom.github.io
    </div>
  `;

  document.body.appendChild(container);

  html2pdf()
    .set({
      margin: 10,
      filename:
        `lexiprof-${String(d.term)
          .toLowerCase()
          .replace(/\s+/g, "-")}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    })
    .from(container)
    .save()
    .then(() => {
      container.remove();
      showToast("📄 PDF exporté !");
    })
    .catch(error => {
      console.warn("PDF error:", error);

      container.remove();

      showToast("❌ Erreur export PDF");
    });
}


// ==================================================
// FLASHCARDS
// ==================================================

let flashcardDefs = [];
let flashcardIndex = 0;
let flashcardRevealed = false;

function openFlashcard() {
  let filtered = [...definitions];

  if (currentFilter !== "all") {

    if (currentFilter === "favorites") {
      const favs = getFavorites();

      filtered = filtered.filter(
        d => favs.includes(d.id)
      );
    } else {
      filtered = filtered.filter(
        d => d.matiere === currentFilter
      );
    }
  }

  const query =
    searchQuery.toLowerCase().trim();

  if (query) {
    filtered = filtered.filter(d =>
      String(d.term).toLowerCase().includes(query) ||
      String(d.def).toLowerCase().includes(query)
    );
  }

  if (!filtered.length) {
    showToast(
      "⚠️ Aucune définition pour les flashcards"
    );
    return;
  }

  filtered.sort((a, b) =>
    String(a.term).localeCompare(
      String(b.term),
      "fr"
    )
  );

  flashcardDefs = filtered;
  flashcardIndex = 0;
  flashcardRevealed = false;

  renderFlashcard();

  const overlay =
    $("flashcardOverlay");

  if (overlay) {
    overlay.classList.add("open");
  }
}

function closeFlashcard(event) {
  const overlay =
    $("flashcardOverlay");

  if (!overlay) return;

  if (
    event &&
    event.target !== overlay
  ) {
    return;
  }

  overlay.classList.remove("open");
}

function renderFlashcard() {
  if (!flashcardDefs.length) return;

  const d =
    flashcardDefs[flashcardIndex];

  const counter = $("flashcardCounter");
  const term = $("flashcardTerm");
  const def = $("flashcardDef");
  const meta = $("flashcardMeta");
  const reveal = $("flashcardReveal");

  if (counter) {
    counter.textContent =
      `${flashcardIndex + 1} / ${flashcardDefs.length}`;
  }

  if (term) {
    term.textContent = d.term;
  }

  if (def) {
    def.textContent = d.def;
  }

  if (meta) {
    meta.textContent = d.matiere;

    const colors = {
      Management: ["#dbeafe", "#2563a8"],
      Droit: ["#fef3c7", "#b45309"],
      "Économie": ["#dcfce7", "#166534"],
      RH: ["#ede9fe", "#7c3aed"]
    };

    const color =
      colors[d.matiere] ||
      ["#eee", "#555"];

    meta.style.background =
      color[0];

    meta.style.color =
      color[1];
  }

  flashcardRevealed = false;

  if (reveal) {
    reveal.style.display = "block";
  }

  if (def) {
    def.style.display = "none";
  }

  if (meta) {
    meta.style.display = "none";
  }
}

function revealFlashcard() {
  if (flashcardRevealed) return;

  flashcardRevealed = true;

  const reveal = $("flashcardReveal");
  const def = $("flashcardDef");
  const meta = $("flashcardMeta");

  if (reveal) {
    reveal.style.display = "none";
  }

  if (def) {
    def.style.display = "block";
  }

  if (meta) {
    meta.style.display = "inline-block";
  }
}

function nextFlashcard() {
  if (!flashcardDefs.length) return;

  flashcardIndex =
    (flashcardIndex + 1) %
    flashcardDefs.length;

  renderFlashcard();
}

function prevFlashcard() {
  if (!flashcardDefs.length) return;

  flashcardIndex =
    (flashcardIndex - 1 +
      flashcardDefs.length) %
    flashcardDefs.length;

  renderFlashcard();
}


// ==================================================
// ADMIN — MOT DE PASSE
// ==================================================

function openAdmin() {
  const overlay = $("pwdOverlay");

  if (!overlay) return;

  const input = $("pwdInput");
  const error = $("pwdError");

  if (input) {
    input.value = "";
    input.classList.remove("error");
  }

  if (error) {
    error.textContent = "";
  }

  overlay.classList.add("open");

  setTimeout(() => {
    if (input) input.focus();
  }, 150);
}

function closePwdModal() {
  const overlay = $("pwdOverlay");

  if (overlay) {
    overlay.classList.remove("open");
  }
}

function checkPassword() {
  const input = $("pwdInput");

  if (!input) return;

  if (input.value === getPassword()) {
    closePwdModal();
    openAdminPanel();
    return;
  }

  const error = $("pwdError");

  if (error) {
    error.textContent =
      "Mot de passe incorrect.";
  }

  input.classList.add("error");
  input.value = "";

  setTimeout(() => {
    input.classList.remove("error");
  }, 400);
}


// ==================================================
// ADMIN — PANNEAU
// ==================================================

function openAdminPanel() {
  cancelEdit();
  renderAdminList();

  const changePwd =
    $("changePwdForm");

  if (changePwd) {
    changePwd.classList.remove("open");
  }

  const overlay = $("overlay");

  if (overlay) {
    overlay.classList.add("open");
  }
}

function closeAdmin() {
  const overlay = $("overlay");

  if (overlay) {
    overlay.classList.remove("open");
  }
}

function handleOverlayClick(event) {
  const overlay = $("overlay");

  if (
    overlay &&
    event.target === overlay
  ) {
    closeAdmin();
  }
}


// ==================================================
// ADMIN — LISTE
// ==================================================

function renderAdminList() {
  const list = $("adminList");
  const count = $("adminCount");

  if (!list) return;

  if (count) {
    count.textContent =
      definitions.length;
  }

  const sorted =
    [...definitions].sort(
      (a, b) =>
        String(a.term).localeCompare(
          String(b.term),
          "fr"
        )
    );

  if (!sorted.length) {
    list.innerHTML = `
      <p style="
        color:var(--text-muted);
        font-size:13px;
        text-align:center;
        padding:16px 0;
      ">
        Aucune définition.
      </p>
    `;

    return;
  }

  list.innerHTML =
    sorted.map(d => `
      <div class="admin-item">

        <div>
          <div class="admin-item-term">
            ${escapeHTML(d.term)}
          </div>

          <div class="admin-item-meta">
            ${escapeHTML(d.matiere)}
          </div>
        </div>

        <div class="admin-item-actions">

          <button
            class="btn-edit"
            onclick="startEdit(${Number(d.id)})"
            title="Modifier"
          >
            ✏️
          </button>

          <button
            class="btn-del"
            onclick="deleteDefinition(${Number(d.id)})"
            title="Supprimer"
          >
            ✕
          </button>

        </div>

      </div>
    `).join("");
}


// ==================================================
// ADMIN — MODIFICATION
// ==================================================

function startEdit(id) {
  const d =
    definitions.find(
      item => Number(item.id) === Number(id)
    );

  if (!d) return;

  editingId = Number(id);

  const term = $("formTerm");
  const matiere = $("formMatiere");
  const def = $("formDef");
  const example = $("formExample");
  const remember = $("formRemember");

  if (term) term.value = d.term;
  if (matiere) matiere.value = d.matiere;
  if (def) def.value = d.def;

  if (example) {
    example.value = d.example || "";
  }

  if (remember) {
    remember.value = d.remember || "";
  }

  const title = $("formTitle");
  const action = $("btnFormAction");
  const cancel = $("btnCancelEdit");

  if (title) {
    title.textContent =
      "Modifier la définition";
  }

  if (action) {
    action.textContent =
      "💾 Enregistrer";
  }

  if (cancel) {
    cancel.style.display = "block";
  }

  const section =
    document.querySelector(".form-section");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }
}

function cancelEdit() {
  editingId = null;

  const term = $("formTerm");
  const matiere = $("formMatiere");
  const def = $("formDef");
  const example = $("formExample");
  const remember = $("formRemember");

  if (term) term.value = "";

  if (matiere) {
    matiere.value = "Management";
  }

  if (def) def.value = "";
  if (example) example.value = "";
  if (remember) remember.value = "";

  const title = $("formTitle");
  const action = $("btnFormAction");
  const cancel = $("btnCancelEdit");

  if (title) {
    title.textContent =
      "Ajouter une définition";
  }

  if (action) {
    action.textContent =
      "+ Ajouter";
  }

  if (cancel) {
    cancel.style.display = "none";
  }
}

async function handleFormAction() {
  if (editingId !== null) {
    await updateDefinition();
  } else {
    await addDefinition();
  }
}

async function updateDefinition() {
  const term =
    $("formTerm")?.value.trim();

  const matiere =
    $("formMatiere")?.value;

  const def =
    $("formDef")?.value.trim();

  const example =
    $("formExample")?.value.trim();

  const remember =
    $("formRemember")?.value.trim();

  if (!term || !def) {
    showToast(
      "⚠️ Remplis le terme et la définition !"
    );
    return;
  }

  const index =
    definitions.findIndex(
      d => Number(d.id) === Number(editingId)
    );

  if (index === -1) return;

  const duplicate =
    definitions.find(
      d =>
        Number(d.id) !== Number(editingId) &&
        String(d.term).toLowerCase() ===
          term.toLowerCase() &&
        d.matiere === matiere
    );

  if (duplicate) {
    showToast(
      "⚠️ Ce terme existe déjà."
    );
    return;
  }

  definitions[index] = {
    ...definitions[index],
    term,
    matiere,
    def,
    example: example || undefined,
    remember: remember || undefined
  };

  showToast("⏳ Sauvegarde…");

  try {
    await saveRemote();

    render();
    renderAdminList();

    cancelEdit();

    showToast(
      "✅ Définition modifiée !"
    );
  } catch (error) {
    console.error(error);
    showToast(
      "⚠️ Modification enregistrée localement."
    );
  }
}


// ==================================================
// ADMIN — AJOUT
// ==================================================

async function addDefinition() {
  const term =
    $("formTerm")?.value.trim();

  const matiere =
    $("formMatiere")?.value;

  const def =
    $("formDef")?.value.trim();

  const example =
    $("formExample")?.value.trim();

  const remember =
    $("formRemember")?.value.trim();

  if (!term || !def) {
    showToast(
      "⚠️ Remplis le terme et la définition !"
    );
    return;
  }

  const duplicate =
    definitions.find(
      d =>
        String(d.term).toLowerCase() ===
          term.toLowerCase() &&
        d.matiere === matiere
    );

  if (duplicate) {
    showToast(
      "⚠️ Ce terme existe déjà."
    );
    return;
  }

  const newDefinition = {
    id: nextId(),
    term,
    matiere,
    def,
    createdAt:
      new Date()
        .toISOString()
        .slice(0, 10),
    example:
      example || undefined,
    remember:
      remember || undefined
  };

  definitions.push(newDefinition);

  showToast("⏳ Sauvegarde…");

  await saveRemote();

  render();
  renderAdminList();

  if ($("formTerm")) {
    $("formTerm").value = "";
  }

  if ($("formDef")) {
    $("formDef").value = "";
  }

  if ($("formExample")) {
    $("formExample").value = "";
  }

  if ($("formRemember")) {
    $("formRemember").value = "";
  }

  showToast(
    "✅ Définition ajoutée !"
  );
}


// ==================================================
// ADMIN — SUPPRESSION
// ==================================================

async function deleteDefinition(id) {
  if (
    !confirm(
      "Supprimer cette définition ?"
    )
  ) {
    return;
  }

  definitions =
    definitions.filter(
      d => Number(d.id) !== Number(id)
    );

  await saveRemote();

  render();
  renderAdminList();

  showToast(
    "🗑 Définition supprimée."
  );
}


// ==================================================
// CHANGEMENT MOT DE PASSE
// ==================================================

function toggleChangePwd() {
  const form =
    $("changePwdForm");

  if (form) {
    form.classList.toggle("open");
  }
}

function changePassword() {
  const p1 =
    $("newPwd1")?.value;

  const p2 =
    $("newPwd2")?.value;

  if (!p1 || p1.length < 4) {
    showToast(
      "⚠️ Minimum 4 caractères."
    );
    return;
  }

  if (p1 !== p2) {
    showToast(
      "⚠️ Les mots de passe ne correspondent pas."
    );
    return;
  }

  localStorage.setItem(
    PWD_KEY,
    p1
  );

  if ($("newPwd1")) {
    $("newPwd1").value = "";
  }

  if ($("newPwd2")) {
    $("newPwd2").value = "";
  }

  const form =
    $("changePwdForm");

  if (form) {
    form.classList.remove("open");
  }

  showToast(
    "🔑 Mot de passe mis à jour !"
  );
}


// ==================================================
// TOAST
// ==================================================

function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
}


// ==================================================
// INITIALISATION
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    // Thème
    initTheme();

    // Animations
    initScrollObserver();
    initScrollTop();

    // Historique
    renderHistory();

    // Bouton thème
    const themeButton =
      $("themeToggle");

    if (themeButton) {
      themeButton.addEventListener(
        "click",
        toggleTheme
      );
    }

    // Bouton flashcard
    const flashcardButton =
      $("btnFlashcard");

    if (flashcardButton) {
      flashcardButton.addEventListener(
        "click",
        openFlashcard
      );
    }

    // Entrée recherche
    const searchInput =
      $("searchInput");

    if (searchInput) {

      searchInput.addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {
            addToHistory(
              searchInput.value
            );
          }

        }
      );

    }

    /*
      IMPORTANT :
      On ne fait PAS load() ici si storage.js
      n'est pas chargé.

      Dans ton HTML :
      config.js
      storage.js
      app.js

      Donc storage.js possède déjà load().
    */

    if (typeof load === "function") {
      load();
    } else {
      console.error(
        "LexiProf : storage.js introuvable."
      );

      definitions =
        [...defaultData];

      render();
    }

  }
);

console.log(
  "LexiProf — app.js chargé correctement ✅"
);