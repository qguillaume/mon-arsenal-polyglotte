let vocabulaire = [];
let currentIndex = 0;
let currentStep = -1;
const langNames = {
  fr: "Français",
  de: "Allemand",
  en: "Anglais",
  es: "Espagnol",
};
// Variable master pour garder la source intacte
let masterVocab = [];

async function loadVocab() {
  try {
    // Charge le fichier MD (assure-toi qu'il est dans le même dossier)
    const response = await fetch("Vocabulaire.md");
    const text = await response.text();
    parseMD(text);
    syncLangs();
  } catch (error) {
    console.error("Erreur:", error);
    document.getElementById("wordDisplay").innerText = "Fichier .md absent";
  }
}

function parseMD(data) {
  const lines = data.split("\n");
  masterVocab = [];
  lines.forEach((line) => {
    if (line.includes(",") && line.trim() !== "") {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2 && parts[0].toLowerCase() !== "allemand") {
        const deWord = parts[0];
        const frWord = parts[1];

        // --- LOGIQUE HPI : AUTO-CLASSIFICATION ---
        let type = "adj"; // Par défaut

        // Détection Verbes (commence par minuscule ou contient pronom)
        if (
          deWord.match(/^[a-z]/) &&
          (deWord.endsWith("en") ||
            deWord.includes("Ich") ||
            deWord.includes("Du"))
        ) {
          type = "verbe";
        }
        // Détection Noms (commence par Majuscule ou a un Article en DE)
        else if (deWord.match(/^[A-Z]/) || deWord.match(/^(der|die|das)\s/)) {
          type = "nom";
        }

        masterVocab.push({
          de: deWord,
          fr: frWord,
          en: parts[2] || "",
          es: parts[3] || "",
          type: type,
        });
      }
    }
  });
  vocabulaire = [...masterVocab]; // Initialise la vue actuelle
}

function syncLangs() {
  const source = document.querySelector('input[name="source"]:checked').value;
  const checks = document.querySelectorAll(".target-check");
  checks.forEach((check) => {
    const langId = check.id.split("-")[1];
    if (langId === source) {
      check.checked = false;
      check.disabled = true;
    } else {
      check.disabled = false;
    }
  });
  nextWord();
}

function getActiveTargets() {
  const targets = [];
  document.querySelectorAll(".target-check:checked").forEach((check) => {
    const id = check.id.split("-")[1];
    targets.push({ id: id, label: langNames[id] });
  });
  return targets;
}

function updateCard() {
  if (vocabulaire.length === 0) return;
  const sourceLang = document.querySelector(
    'input[name="source"]:checked',
  ).value;
  const item = vocabulaire[currentIndex];
  const targets = getActiveTargets();

  if (currentStep === -1) {
    document.getElementById("langLabel").innerText = langNames[sourceLang];
    document.getElementById("wordDisplay").innerText =
      item[sourceLang] || "---";
    document.getElementById("subDisplay").innerText = "";
  } else if (targets.length > 0) {
    const target = targets[currentStep];
    document.getElementById("langLabel").innerText = target.label;
    document.getElementById("subDisplay").innerText = item[target.id] || "N/A";
  }
}

document.getElementById("mainCard").onclick = () => {
  const targets = getActiveTargets();
  if (currentStep < targets.length - 1) currentStep++;
  else currentStep = -1;
  updateCard();
};

function nextWord() {
  const filterValue = document.getElementById("typeFilter").value;

  // Filtrage dynamique
  if (filterValue === "all") {
    vocabulaire = [...masterVocab];
  } else {
    vocabulaire = masterVocab.filter((item) => item.type === filterValue);
  }

  if (vocabulaire.length === 0) {
    document.getElementById("wordDisplay").innerText = "Aucun mot trouvé";
    return;
  }

  currentIndex = Math.floor(Math.random() * vocabulaire.length);
  currentStep = -1;
  updateCard();
}

function searchWord() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  if (query.length < 2) return; // On attend au moins 2 lettres

  const sourceLang = document.querySelector(
    'input[name="source"]:checked',
  ).value;

  // On cherche dans la langue source sélectionnée
  const foundIndex = vocabulaire.findIndex((item) =>
    item[sourceLang].toLowerCase().includes(query),
  );

  if (foundIndex !== -1) {
    currentIndex = foundIndex;
    currentStep = -1; // Reset pour montrer le mot source
    updateCard();
  }
}

function speakWord(event) {
  // Empêche le clic sur le bouton de déclencher le clic sur la carte entière
  event.stopPropagation();

  const word =
    currentStep === -1
      ? document.getElementById("wordDisplay").innerText
      : document.getElementById("subDisplay").innerText;

  const langCode =
    currentStep === -1
      ? document.querySelector('input[name="source"]:checked').value
      : getActiveTargets()[currentStep].id;

  const utterance = new SpeechSynthesisUtterance(word);

  // On définit la langue pour l'accent (fr-FR, de-DE, etc.)
  const voiceMap = { fr: "fr-FR", de: "de-DE", en: "en-US", es: "es-ES" };
  utterance.lang = voiceMap[langCode] || "de-DE";

  window.speechSynthesis.speak(utterance);
}

window.onload = loadVocab;
