/* =========================================================
   LEXIPROF — APP.JS COMPLET
========================================================= */


/* =========================================================
   DONNÉES DE BASE
========================================================= */

const defaultData = [
  {
    id: 1,
    term: "Management",
    matiere: "Management",
    def: "Ensemble des techniques permettant de diriger, organiser et coordonner les ressources d'une organisation afin d'atteindre ses objectifs.",
    example: "Un manager organise le travail de son équipe, répartit les tâches et suit les résultats.",
    remember: "Le management consiste notamment à organiser, décider, coordonner et motiver.",
    qcm: {
      question: "Quel est l'objectif principal du management ?",
      answers: [
        { text: "Atteindre les objectifs de l'organisation", correct: true },
        { text: "Supprimer tous les salariés", correct: false },
        { text: "Éviter toute prise de décision", correct: false }
      ]
    }
  },

  {
    id: 2,
    term: "Leadership",
    matiere: "Management",
    def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs.",
    example: "Un responsable qui motive son équipe autour d'un projet fait preuve de leadership.",
    remember: "Leadership = influencer, guider et motiver.",
  },

  {
    id: 3,
    term: "Organigramme",
    matiere: "Management",
    def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation.",
    example: "L'organigramme d'une entreprise permet de voir qui dépend de quel responsable.",
    remember: "Il permet de visualiser les relations hiérarchiques.",
  },

  {
    id: 4,
    term: "Contrat de travail",
    matiere: "Droit",
    def: "Convention par laquelle une personne, le salarié, s'engage à travailler pour le compte et sous la direction d'un employeur en échange d'une rémunération.",
    example: "Un CDI signé entre une entreprise et un salarié constitue un contrat de travail.",
    remember: "Travail + rémunération + lien de subordination.",
  },

  {
    id: 5,
    term: "Personne morale",
    matiere: "Droit",
    def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres.",
    example: "Une société ou une association peut être une personne morale.",
    remember: "Une personne morale possède une existence juridique propre.",
  },

  {
    id: 6,
    term: "PIB",
    matiere: "Économie",
    def: "Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.",
    example: "Le PIB permet notamment de mesurer la production économique d'un pays.",
    remember: "PIB = valeur des biens et services produits sur un territoire.",
  },

  {
    id: 7,
    term: "Inflation",
    matiere: "Économie",
    def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie.",
    example: "Lorsque les prix augmentent durablement, le pouvoir d'achat de la monnaie diminue.",
    remember: "Inflation = hausse générale et durable des prix.",
  },

  {
    id: 8,
    term: "Recrutement",
    matiere: "RH",
    def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats afin de pourvoir un poste vacant.",
    example: "Une entreprise publie une offre d'emploi puis sélectionne les candidats.",
    remember: "Recruter = rechercher, sélectionner puis intégrer un candidat.",
  },

  {
    id: 9,
    term: "GPEC",
    matiere: "RH",
    def: "Gestion Prévisionnelle des Emplois et des Compétences. Démarche permettant d'anticiper les besoins futurs d'une organisation en emplois et en compétences.",
    example: "Une entreprise peut prévoir des formations pour préparer ses salariés à de nouvelles compétences.",
    remember: "GPEC = anticiper les besoins futurs en emplois et compétences."
  }
];


/* =========================================================
   ÉTAT
========================================================= */

let definitions = [];
let currentFilter = "all";
let searchQuery = "";

let favorites = JSON.parse(
  localStorage.getItem("lexiprof_favorites") || "[]"
);

let currentFlashcardIndex = 0;
let flashcardList = [];

let deferredInstallPrompt = null;


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  load();

});


/* =========================================================
   UTILITAIRES
========================================================= */

function nextId() {

  if (!definitions.length) return 1;

  return Math.max(
    ...definitions.map(d => Number(d.id) || 0)
  ) + 1;

}


function getPassword() {

  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;

}


function escapeHTML(value) {

  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function normalizeDefinition(d) {

  return {
    id: Number(d.id) || nextId(),
    term: String(d.term || "").trim(),
    matiere: String(d.matiere || "Management").trim(),
    def: String(d.def || d.definition || "").trim(),
    example: String(d.example || "").trim(),
    remember: String(d.remember || "").trim(),
    qcm: normalizeQCM(d.qcm)
  };

}


function normalizeQCM(qcm) {

  if (!qcm) return null;

  const question =
    qcm.question ||
    qcm.questionText ||
    "";

  let answers =
    qcm.answers ||
    qcm.choices ||
    [];

  if (!Array.isArray(answers)) {
    answers = [];
  }

  answers = answers.map((a, index) => {

    if (typeof a === "string") {

      return {
        text: a,
        correct: index === Number(qcm.answer)
      };

    }

    return {
      text: String(a.text || a.choice || "").trim(),
      correct:
        Boolean(a.correct) ||
        index === Number(qcm.answer)
    };

  }).filter(a => a.text);

  if (!question && !answers.length) {
    return null;
  }

  return {
    question: String(question).trim(),
    answers
  };

}


/* =========================================================
   HIGHLIGHT RECHERCHE
========================================================= */

function highlight(text, q) {

  const safeText = escapeHTML(text);

  if (!q) return safeText;

  const escaped =
    q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return safeText.replace(
    new RegExp(`(${escaped})`, "gi"),
    "<mark>$1</mark>"
  );

}


/* =========================================================
   CHARGEMENT
========================================================= */

async function load() {

  setLoading(true);

  try {

    if (typeof loadRemote === "function") {

      const remote = await loadRemote();

      if (Array.isArray(remote) && remote.length) {

        definitions =
          remote.map(normalizeDefinition);

      } else {

        definitions =
          defaultData.map(normalizeDefinition);

      }

    } else {

      definitions =
        defaultData.map(normalizeDefinition);

    }

  } catch (error) {

    console.error("Erreur de chargement :", error);

    definitions =
      defaultData.map(normalizeDefinition);

    showToast("⚠️ Mode hors ligne");

  }

  render();

  setTimeout(() => {

    const loader =
      document.querySelector(".global-loader");

    if (loader) {
      loader.classList.add("hidden");
    }

  }, 300);

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(on) {

  const container =
    document.getElementById("cardsContainer");

  if (!container) return;

  if (on) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⏳</div>
        <h3>Chargement…</h3>
        <p>Récupération des définitions.</p>
      </div>
    `;

  }

}


/* =========================================================
   FILTRAGE
========================================================= */

function getFilteredDefinitions() {

  const q =
    searchQuery.toLowerCase().trim();

  let filtered =
    [...definitions];

  if (currentFilter === "favorites") {

    filtered =
      filtered.filter(d =>
        favorites.includes(Number(d.id))
      );

  } else if (currentFilter !== "all") {

    filtered =
      filtered.filter(
        d => d.matiere === currentFilter
      );

  }

  if (q) {

    filtered =
      filtered.filter(d => {

        const term =
          d.term.toLowerCase();

        const def =
          d.def.toLowerCase();

        return (
          term.includes(q) ||
          def.includes(q)
        );

      });

  }

  filtered.sort(
    (a, b) =>
      a.term.localeCompare(
        b.term,
        "fr"
      )
  );

  return filtered;

}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function render() {

  const container =
    document.getElementById("cardsContainer");

  if (!container) return;

  const info =
    document.getElementById("resultsInfo");

  const filtered =
    getFilteredDefinitions();

  if (info) {

    if (
      searchQuery ||
      currentFilter !== "all"
    ) {

      info.textContent =
        `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`;

    } else {

      info.textContent =
        `${definitions.length} définition${definitions.length !== 1 ? "s" : ""}`;

    }

  }

  updateCounter();

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

  container.innerHTML =
    filtered.map(
      (d, index) =>
        createCardHTML(d, index)
    ).join("");

}


/* =========================================================
   CARTE
========================================================= */

function createCardHTML(d, index) {

  const isFavorite =
    favorites.includes(Number(d.id));

  return `

    <article
      class="card"
      data-id="${d.id}"
      style="animation-delay:${Math.min(index * 35, 350)}ms"
    >

      <div class="card-top">

        <div class="card-term">
          ${highlight(d.term, searchQuery)}
        </div>

        <span class="matiere-badge badge-${escapeHTML(d.matiere)}">
          ${escapeHTML(d.matiere)}
        </span>

      </div>


      <div class="card-def">

        ${highlight(d.def, searchQuery)}

      </div>


      <div
        style="
          display:flex;
          gap:7px;
          margin-top:14px;
        "
      >

        <button
          class="open-card-btn"
          onclick="toggleCard(${d.id}, this)"
          style="flex:1"
        >
          📖 Ouvrir la fiche
        </button>

        <button
          class="btn-icon favorite-card-btn"
          onclick="toggleFavorite(${d.id})"
          title="Favori"
          style="
            flex:0 0 42px;
            width:42px;
            height:42px;
          "
        >
          ${isFavorite ? "★" : "☆"}
        </button>

      </div>


      <div
        class="card-extra"
        id="card-${d.id}"
      >

        ${
          d.example
            ? `
              <div class="extra-block">
                <h4>💡 Exemple concret</h4>
                <p>${escapeHTML(d.example)}</p>
              </div>
            `
            : ""
        }


        ${
          d.remember
            ? `
              <div class="extra-block">
                <h4>📝 À retenir</h4>
                <p>${escapeHTML(d.remember)}</p>
              </div>
            `
            : ""
        }


        ${
          d.qcm
            ? createQCMHTML(d)
            : ""
        }

      </div>

    </article>

  `;

}


/* =========================================================
   OUVERTURE FICHE
========================================================= */

function toggleCard(id, button) {

  const extra =
    document.getElementById(`card-${id}`);

  if (!extra) return;

  const isOpen =
    extra.classList.contains("open");

  if (isOpen) {

    extra.classList.remove("open");

    button.innerHTML =
      "📖 Ouvrir la fiche";

  } else {

    extra.classList.add("open");

    button.innerHTML =
      "📕 Fermer la fiche";

  }

}


/* =========================================================
   QCM HTML
========================================================= */

function createQCMHTML(d) {

  if (!d.qcm) return "";

  const answers =
    Array.isArray(d.qcm.answers)
      ? d.qcm.answers
      : [];

  if (!answers.length) return "";

  return `

    <div class="extra-block">

      <h4>❓ Mini QCM</h4>

      <p>
        ${escapeHTML(d.qcm.question)}
      </p>

      <div class="qcm-container">

        ${answers.map((a, i) => `

          <button
            class="qcm-btn"
            onclick="
              answerQCM(
                this,
                ${Boolean(a.correct)},
                ${d.id}
              )
            "
          >
            ${escapeHTML(a.text)}
          </button>

        `).join("")}

      </div>

      <div
        class="qcm-feedback"
        id="qcm-feedback-${d.id}"
      ></div>

    </div>

  `;

}


/* =========================================================
   QCM
========================================================= */

function answerQCM(button, correct, id) {

  const card =
    button.closest(".extra-block");

  if (!card) return;

  const buttons =
    card.querySelectorAll(".qcm-btn");

  buttons.forEach(btn => {

    btn.disabled = true;

  });

  const feedback =
    document.getElementById(
      `qcm-feedback-${id}`
    );

  if (correct) {

    button.classList.add("correct");

    if (feedback) {

      feedback.textContent =
        "✅ Bonne réponse !";

      feedback.className =
        "qcm-feedback correct";

    }

    showToast("✅ Bonne réponse !");

  } else {

    button.classList.add("wrong");

    if (feedback) {

      feedback.textContent =
        "❌ Mauvaise réponse.";

      feedback.className =
        "qcm-feedback wrong";

    }

    showToast("❌ Mauvaise réponse");

  }

}


/* =========================================================
   RECHERCHE
========================================================= */

function onSearch() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  searchQuery =
    input.value;

  updateSearchClear();

  render();

}


function clearSearch() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  input.value = "";

  searchQuery = "";

  updateSearchClear();

  render();

  input.focus();

}


function updateSearchClear() {

  const button =
    document.querySelector(".search-clear");

  if (!button) return;

  button.classList.toggle(
    "visible",
    Boolean(searchQuery)
  );

}


/* =========================================================
   FILTRES
========================================================= */

function setFilter(filter, btn) {

  currentFilter =
    filter;

  document
    .querySelectorAll(".filter-btn")
    .forEach(b =>
      b.classList.remove("active")
    );

  if (btn) {

    btn.classList.add("active");

  }

  render();

}


/* =========================================================
   FAVORIS
========================================================= */

function toggleFavorite(id) {

  id = Number(id);

  if (favorites.includes(id)) {

    favorites =
      favorites.filter(
        x => x !== id
      );

    showToast("☆ Retiré des favoris");

  } else {

    favorites.push(id);

    showToast("★ Ajouté aux favoris");

  }

  localStorage.setItem(
    "lexiprof_favorites",
    JSON.stringify(favorites)
  );

  render();

}


function showFavorites() {

  currentFilter = "favorites";

  document
    .querySelectorAll(".filter-btn")
    .forEach(b =>
      b.classList.remove("active")
    );

  const favoriteButton =
    document.querySelector(
      '[data-filter="favorites"]'
    );

  if (favoriteButton) {

    favoriteButton.classList.add("active");

  }

  render();

}


/* =========================================================
   COMPTEUR
========================================================= */

function updateCounter() {

  const counter =
    document.querySelector(
      ".definition-counter"
    );

  if (!counter) return;

  counter.textContent =
    `${definitions.length} définition${definitions.length !== 1 ? "s" : ""} disponible${definitions.length !== 1 ? "s" : ""}`;

}


/* =========================================================
   MODE SOMBRE
========================================================= */

function initTheme() {

  const saved =
    localStorage.getItem(
      "lexiprof_theme"
    );

  if (saved === "dark") {

    document.body.classList.add("dark");

  }

  updateThemeButton();

}


function toggleTheme() {

  document.body.classList.toggle("dark");

  const dark =
    document.body.classList.contains("dark");

  localStorage.setItem(
    "lexiprof_theme",
    dark ? "dark" : "light"
  );

  updateThemeButton();

}


function updateThemeButton() {

  const button =
    document.getElementById(
      "themeToggle"
    );

  if (!button) return;

  const dark =
    document.body.classList.contains("dark");

  button.innerHTML =
    dark ? "☀️" : "🌙";

  button.title =
    dark
      ? "Mode clair"
      : "Mode sombre";

}


/* =========================================================
   AUTHENTIFICATION ADMIN
========================================================= */

function openAdmin() {

  const input =
    document.getElementById("pwdInput");

  const error =
    document.getElementById("pwdError");

  const overlay =
    document.getElementById("pwdOverlay");

  if (!overlay) return;

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

  const overlay =
    document.getElementById(
      "pwdOverlay"
    );

  if (overlay) {

    overlay.classList.remove("open");

  }

}


function checkPassword() {

  const input =
    document.getElementById("pwdInput");

  const error =
    document.getElementById("pwdError");

  if (!input) return;

  if (
    input.value ===
    getPassword()
  ) {

    closePwdModal();

    openAdminPanel();

  } else {

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

}


/* =========================================================
   ADMIN
========================================================= */

function openAdminPanel() {

  renderAdminList();

  const changePwd =
    document.getElementById(
      "changePwdForm"
    );

  if (changePwd) {

    changePwd.classList.remove("open");

  }

  const overlay =
    document.getElementById(
      "overlay"
    );

  if (overlay) {

    overlay.classList.add("open");

  }

}


function closeAdmin() {

  const overlay =
    document.getElementById("overlay");

  if (overlay) {

    overlay.classList.remove("open");

  }

}


function handleOverlayClick(e) {

  const overlay =
    document.getElementById("overlay");

  if (
    overlay &&
    e.target === overlay
  ) {

    closeAdmin();

  }

}


/* =========================================================
   LISTE ADMIN
========================================================= */

function renderAdminList() {

  const list =
    document.getElementById(
      "adminList"
    );

  const count =
    document.getElementById(
      "adminCount"
    );

  if (!list) return;

  if (count) {

    count.textContent =
      definitions.length;

  }

  const sorted =
    [...definitions].sort(
      (a, b) =>
        a.term.localeCompare(
          b.term,
          "fr"
        )
    );

  if (!sorted.length) {

    list.innerHTML = `
      <p style="
        color:var(--text-muted);
        font-size:13px;
        text-align:center;
        padding:16px 0
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
            onclick="editDefinition(${d.id})"
            title="Modifier"
          >
            ✎
          </button>

          <button
            class="btn-del"
            onclick="deleteDefinition(${d.id})"
            title="Supprimer"
          >
            ✕
          </button>

        </div>

      </div>

    `).join("");

}


/* =========================================================
   AJOUT DÉFINITION
========================================================= */

async function addDefinition() {

  const term =
    document.getElementById(
      "formTerm"
    )?.value.trim();

  const matiere =
    document.getElementById(
      "formMatiere"
    )?.value;

  const def =
    document.getElementById(
      "formDef"
    )?.value.trim();

  if (!term || !def) {

    showToast(
      "⚠️ Remplis le terme et la définition !"
    );

    return;

  }

  const duplicate =
    definitions.find(
      d =>
        d.term.toLowerCase() ===
          term.toLowerCase() &&
        d.matiere === matiere
    );

  if (duplicate) {

    showToast(
      "⚠️ Ce terme existe déjà."
    );

    return;

  }

  const example =
    document.getElementById(
      "formExample"
    )?.value.trim() || "";

  const remember =
    document.getElementById(
      "formRemember"
    )?.value.trim() || "";

  definitions.push({

    id: nextId(),

    term,

    matiere,

    def,

    example,

    remember,

    qcm: null

  });

  showToast("⏳ Sauvegarde…");

  try {

    await saveRemote();

    render();

    renderAdminList();

    clearDefinitionForm();

    showToast(
      "✅ Définition ajoutée !"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "⚠️ Erreur de sauvegarde."
    );

  }

}


/* =========================================================
   VIDER FORMULAIRE
========================================================= */

function clearDefinitionForm() {

  [
    "formTerm",
    "formDef",
    "formExample",
    "formRemember"
  ].forEach(id => {

    const el =
      document.getElementById(id);

    if (el) el.value = "";

  });

}


/* =========================================================
   MODIFICATION
========================================================= */

function editDefinition(id) {

  const d =
    definitions.find(
      x => Number(x.id) === Number(id)
    );

  if (!d) return;

  const term =
    document.getElementById("formTerm");

  const matiere =
    document.getElementById("formMatiere");

  const def =
    document.getElementById("formDef");

  const example =
    document.getElementById("formExample");

  const remember =
    document.getElementById("formRemember");

  if (term) term.value = d.term;

  if (matiere) matiere.value = d.matiere;

  if (def) def.value = d.def;

  if (example) example.value = d.example || "";

  if (remember) remember.value = d.remember || "";

  window.editingDefinitionId =
    Number(id);

  showToast(
    "✏️ Modification en cours"
  );

  const admin =
    document.querySelector(
      ".admin-panel"
    );

  if (admin) {

    admin.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


async function saveEditedDefinition() {

  const id =
    window.editingDefinitionId;

  if (!id) {

    await addDefinition();

    return;

  }

  const d =
    definitions.find(
      x => Number(x.id) === Number(id)
    );

  if (!d) return;

  d.term =
    document.getElementById(
      "formTerm"
    )?.value.trim();

  d.matiere =
    document.getElementById(
      "formMatiere"
    )?.value;

  d.def =
    document.getElementById(
      "formDef"
    )?.value.trim();

  d.example =
    document.getElementById(
      "formExample"
    )?.value.trim() || "";

  d.remember =
    document.getElementById(
      "formRemember"
    )?.value.trim() || "";

  await saveRemote();

  window.editingDefinitionId =
    null;

  clearDefinitionForm();

  render();

  renderAdminList();

  showToast(
    "✅ Définition modifiée !"
  );

}


/* =========================================================
   SUPPRESSION
========================================================= */

async function deleteDefinition(id) {

  if (
    !confirm(
      "Supprimer cette définition ?"
    )
  ) return;

  definitions =
    definitions.filter(
      d =>
        Number(d.id) !==
        Number(id)
    );

  favorites =
    favorites.filter(
      x =>
        Number(x) !==
        Number(id)
    );

  localStorage.setItem(
    "lexiprof_favorites",
    JSON.stringify(favorites)
  );

  try {

    await saveRemote();

    render();

    renderAdminList();

    showToast(
      "🗑 Définition supprimée."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "⚠️ Erreur de sauvegarde."
    );

  }

}


/* =========================================================
   MOT DE PASSE
========================================================= */

function toggleChangePwd() {

  const form =
    document.getElementById(
      "changePwdForm"
    );

  if (form) {

    form.classList.toggle(
      "open"
    );

  }

}


function changePassword() {

  const p1 =
    document.getElementById(
      "newPwd1"
    )?.value;

  const p2 =
    document.getElementById(
      "newPwd2"
    )?.value;

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

  document.getElementById(
    "newPwd1"
  ).value = "";

  document.getElementById(
    "newPwd2"
  ).value = "";

  document.getElementById(
    "changePwdForm"
  )?.classList.remove("open");

  showToast(
    "🔑 Mot de passe mis à jour !"
  );

}


/* =========================================================
   IMPORT JSON
========================================================= */

function handleJSONImport(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = async e => {

    try {

      const parsed =
        JSON.parse(
          e.target.result
        );

      const imported =
        Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.definitions)
            ? parsed.definitions
            : [];

      if (!imported.length) {

        throw new Error(
          "Aucune définition trouvée."
        );

      }

      let added = 0;

      imported.forEach(raw => {

        const d =
          normalizeDefinition(raw);

        if (!d.term || !d.def) return;

        const exists =
          definitions.some(
            existing =>
              existing.term.toLowerCase() ===
                d.term.toLowerCase() &&
              existing.matiere ===
                d.matiere
          );

        if (exists) return;

        d.id = nextId();

        definitions.push(d);

        added++;

      });

      await saveRemote();

      render();

      renderAdminList();

      showToast(
        `✅ ${added} définition${added !== 1 ? "s" : ""} importée${added !== 1 ? "s" : ""}`
      );

    } catch (error) {

      console.error(error);

      showToast(
        "❌ JSON invalide."
      );

    }

    event.target.value = "";

  };

  reader.readAsText(file);

}


/* =========================================================
   IMPORT JSON VIA TEXTE
========================================================= */

async function importJSONText() {

  const textarea =
    document.getElementById(
      "jsonInput"
    );

  if (!textarea) return;

  const text =
    textarea.value.trim();

  if (!text) {

    showToast(
      "⚠️ Colle d'abord ton JSON."
    );

    return;

  }

  try {

    const parsed =
      JSON.parse(text);

    const imported =
      Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.definitions)
          ? parsed.definitions
          : [];

    if (!imported.length) {

      throw new Error(
        "Format vide."
      );

    }

    let added = 0;

    imported.forEach(raw => {

      const d =
        normalizeDefinition(raw);

      if (!d.term || !d.def) return;

      const exists =
        definitions.some(
          existing =>
            existing.term.toLowerCase() ===
              d.term.toLowerCase() &&
            existing.matiere ===
              d.matiere
        );

      if (exists) return;

      d.id =
        nextId();

      definitions.push(d);

      added++;

    });

    await saveRemote();

    render();

    renderAdminList();

    textarea.value = "";

    showToast(
      `✅ ${added} définition${added !== 1 ? "s" : ""} importée${added !== 1 ? "s" : ""}`
    );

  } catch (error) {

    console.error(error);

    showToast(
      "❌ JSON invalide ou mauvais format."
    );

  }

}


/* =========================================================
   EXPORT JSON
========================================================= */

function exportJSON() {

  const data =
    JSON.stringify(
      definitions,
      null,
      2
    );

  const blob =
    new Blob(
      [data],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "lexiprof-definitions.json";

  a.click();

  URL.revokeObjectURL(url);

  showToast(
    "📦 JSON exporté !"
  );

}


/* =========================================================
   FLASHCARDS
========================================================= */

function openFlashcards() {

  flashcardList =
    getFilteredDefinitions();

  if (!flashcardList.length) {

    showToast(
      "⚠️ Aucune définition disponible."
    );

    return;

  }

  currentFlashcardIndex = 0;

  renderFlashcard();

}


function renderFlashcard() {

  const d =
    flashcardList[
      currentFlashcardIndex
    ];

  if (!d) return;

  const modal =
    document.getElementById(
      "flashcardModal"
    );

  if (!modal) {

    createFlashcardModal();

  }

  const title =
    document.getElementById(
      "flashcardTerm"
    );

  const def =
    document.getElementById(
      "flashcardDef"
    );

  const matiere =
    document.getElementById(
      "flashcardMatiere"
    );

  const counter =
    document.getElementById(
      "flashcardCounter"
    );

  const reveal =
    document.getElementById(
      "flashcardReveal"
    );

  if (title)
    title.textContent =
      d.term;

  if (def)
    def.textContent =
      d.def;

  if (matiere)
    matiere.textContent =
      d.matiere;

  if (counter)
    counter.textContent =
      `${currentFlashcardIndex + 1} / ${flashcardList.length}`;

  if (reveal)
    reveal.style.display =
      "block";

  document
    .getElementById(
      "flashcardModal"
    )
    ?.classList.add("open");

}


function createFlashcardModal() {

  const modal =
    document.createElement("div");

  modal.id =
    "flashcardModal";

  modal.className =
    "overlay";

  modal.innerHTML = `

    <div class="flashcard-modal">

      <div class="flashcard-header">

        <span
          id="flashcardCounter"
          class="flashcard-counter"
        ></span>

        <button
          class="btn-close"
          onclick="closeFlashcards()"
        >
          ×
        </button>

      </div>


      <div
        class="flashcard-body"
        onclick="revealFlashcard()"
      >

        <div
          id="flashcardMatiere"
          class="flashcard-matiere"
        ></div>

        <div
          id="flashcardTerm"
          class="flashcard-term"
        ></div>

        <div
          id="flashcardReveal"
          class="flashcard-reveal"
        >
          Cliquez pour voir la définition
        </div>

        <div
          id="flashcardDef"
          class="flashcard-def"
          style="display:none"
        ></div>

      </div>


      <div class="flashcard-actions">

        <button
          class="flashcard-btn"
          onclick="previousFlashcard()"
        >
          ← Précédente
        </button>

        <button
          class="flashcard-btn primary"
          onclick="nextFlashcard()"
        >
          Suivante →
        </button>

      </div>

    </div>

  `;

  document.body.appendChild(modal);

}


function revealFlashcard() {

  const def =
    document.getElementById(
      "flashcardDef"
    );

  const reveal =
    document.getElementById(
      "flashcardReveal"
    );

  if (!def || !reveal) return;

  const hidden =
    def.style.display === "none";

  def.style.display =
    hidden ? "block" : "none";

  reveal.textContent =
    hidden
      ? "Cliquez pour masquer"
      : "Cliquez pour voir la définition";

}


function nextFlashcard() {

  if (!flashcardList.length) return;

  currentFlashcardIndex =
    (currentFlashcardIndex + 1) %
    flashcardList.length;

  renderFlashcard();

}


function previousFlashcard() {

  if (!flashcardList.length) return;

  currentFlashcardIndex =
    (currentFlashcardIndex - 1 +
      flashcardList.length) %
    flashcardList.length;

  renderFlashcard();

}


function closeFlashcards() {

  document
    .getElementById(
      "flashcardModal"
    )
    ?.classList.remove("open");

}


/* =========================================================
   DÉFINITION ALÉATOIRE
========================================================= */

function openRandomDefinition() {

  if (!definitions.length) {

    showToast(
      "⚠️ Aucune définition."
    );

    return;

  }

  const d =
    definitions[
      Math.floor(
        Math.random() *
        definitions.length
      )
    ];

  let modal =
    document.getElementById(
      "randomModal"
    );

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "randomModal";

    modal.className =
      "random-modal";

    document.body.appendChild(
      modal
    );

  }

  modal.innerHTML = `

    <div class="random-modal-card">

      <button
        class="random-close"
        onclick="closeRandomDefinition()"
      >
        ×
      </button>

      <span class="random-label">
        DÉFINITION ALÉATOIRE
      </span>

      <span class="random-matiere">
        ${escapeHTML(d.matiere)}
      </span>

      <h2>
        ${escapeHTML(d.term)}
      </h2>

      <p>
        ${escapeHTML(d.def)}
      </p>

      <div class="random-actions">

        <button
          onclick="openRandomDefinition()"
        >
          🎲 Une autre
        </button>

        <button
          class="secondary"
          onclick="closeRandomDefinition()"
        >
          Fermer
        </button>

      </div>

    </div>

  `;

  modal.classList.add("open");

}


function closeRandomDefinition() {

  document
    .getElementById(
      "randomModal"
    )
    ?.classList.remove("open");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  let toast =
    document.getElementById(
      "toast"
    );

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "toast";

    toast.className =
      "toast";

    document.body.appendChild(
      toast
    );

  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toast._timer
  );

  toast._timer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2500);

}


/* =========================================================
   RACCOURCIS CLAVIER
========================================================= */

function initKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "/" &&
        document.activeElement.tagName !==
          "INPUT" &&
        document.activeElement.tagName !==
          "TEXTAREA"
      ) {

        e.preventDefault();

        document
          .getElementById(
            "searchInput"
          )
          ?.focus();

      }


      if (
        e.key === "Escape"
      ) {

        closePwdModal();
        closeAdmin();
        closeFlashcards();
        closeRandomDefinition();

      }

    }
  );

}


/* =========================================================
   SCROLL
========================================================= */

function initScrollEffects() {

  const scrollTop =
    document.querySelector(
      ".scroll-top"
    );

  const progress =
    document.querySelector(
      ".reading-progress"
    );

  window.addEventListener(
    "scroll",
    () => {

      const scroll =
        window.scrollY;

      if (scrollTop) {

        scrollTop.classList.toggle(
          "visible",
          scroll > 400
        );

      }

      if (progress) {

        const height =
          document.documentElement
            .scrollHeight -
          window.innerHeight;

        const percentage =
          height > 0
            ? (scroll / height) * 100
            : 0;

        progress.style.width =
          `${percentage}%`;

      }

    },
    {
      passive: true
    }
  );

}


function scrollToTop() {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   INSTALLATION PWA
========================================================= */

function initInstallPrompt() {

  window.addEventListener(
    "beforeinstallprompt",
    e => {

      e.preventDefault();

      deferredInstallPrompt =
        e;

      const button =
        document.querySelector(
          ".install-app-btn"
        );

      if (button) {

        button.classList.add(
          "visible"
        );

      }

    }
  );

}


async function installApp() {

  if (!deferredInstallPrompt) {

    showToast(
      "ℹ️ Utilise le menu Partager de ton navigateur pour ajouter LexiProf."
    );

    return;

  }

  deferredInstallPrompt.prompt();

  const result =
    await deferredInstallPrompt.userChoice;

  if (
    result.outcome ===
    "accepted"
  ) {

    showToast(
      "✅ LexiProf ajouté à l'écran d'accueil !"
    );

  }

  deferredInstallPrompt =
    null;

}




  /*
    Si ton storage.js possède déjà
    sa propre fonction saveRemote(),
    elle reste utilisée.

    Sinon, on conserve les données
    localement pour éviter de perdre
    les modifications.
  */

  localStorage.setItem(
    "lexiprof_local_data",
    JSON.stringify(
      definitions
    )
  );

}


/* =========================================================
   FALLBACK LOCAL
========================================================= */

function loadLocalFallback() {

  try {

    const local =
      JSON.parse(
        localStorage.getItem(
          "lexiprof_local_data"
        ) || "[]"
      );

    if (
      Array.isArray(local) &&
      local.length
    ) {

      definitions =
        local.map(
          normalizeDefinition
        );

      return true;

    }

  } catch (e) {

    console.error(e);

  }

  return false;

}


/* =========================================================
   NOTIFICATION BIENVENUE
========================================================= */

function showWelcome() {

  let banner =
    document.querySelector(
      ".welcome-banner"
    );

  if (!banner) return;

  banner.classList.add(
    "show"
  );

  setTimeout(() => {

    banner.classList.remove(
      "show"
    );

  }, 5000);

}


/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.render =
  render;

window.toggleCard =
  toggleCard;

window.answerQCM =
  answerQCM;

window.onSearch =
  onSearch;

window.clearSearch =
  clearSearch;

window.setFilter =
  setFilter;

window.toggleFavorite =
  toggleFavorite;

window.showFavorites =
  showFavorites;

window.toggleTheme =
  toggleTheme;

window.openAdmin =
  openAdmin;

window.closePwdModal =
  closePwdModal;

window.checkPassword =
  checkPassword;

window.openAdminPanel =
  openAdminPanel;

window.closeAdmin =
  closeAdmin;

window.handleOverlayClick =
  handleOverlayClick;

window.addDefinition =
  addDefinition;

window.editDefinition =
  editDefinition;

window.saveEditedDefinition =
  saveEditedDefinition;

window.deleteDefinition =
  deleteDefinition;

window.toggleChangePwd =
  toggleChangePwd;

window.changePassword =
  changePassword;

window.handleJSONImport =
  handleJSONImport;

window.importJSONText =
  importJSONText;

window.exportJSON =
  exportJSON;

window.openFlashcards =
  openFlashcards;

window.nextFlashcard =
  nextFlashcard;

window.previousFlashcard =
  previousFlashcard;

window.closeFlashcards =
  closeFlashcards;

window.openRandomDefinition =
  openRandomDefinition;

window.closeRandomDefinition =
  closeRandomDefinition;

window.scrollToTop =
  scrollToTop;

window.installApp =
  installApp;

window.showToast =
  showToast;


/* =========================================================
   FIN
========================================================= */

console.log(
  "📚 LexiProf — app.js chargé"
);