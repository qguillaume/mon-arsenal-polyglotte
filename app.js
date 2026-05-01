let vocabulaire = [];
let currentIndex = 0;
let currentStep = -1;
const langNames = {
  fr: "Français",
  de: "Allemand",
  en: "Anglais",
  es: "Espagnol",
};

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
  vocabulaire = [];
  lines.forEach((line) => {
    // On vérifie s'il y a une virgule et on ignore les lignes vides
    if (line.includes(",") && line.trim() !== "") {
      const parts = line.split(",").map((p) => p.trim());

      // On s'assure que ce n'est pas la ligne d'entête (Allemand, Français...)
      if (parts.length >= 2 && parts[0].toLowerCase() !== "allemand") {
        vocabulaire.push({
          de: parts[0] || "",
          fr: parts[1] || "",
          en: parts[2] || "",
          es: parts[3] || "",
        });
      }
    }
  });
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
  if (vocabulaire.length === 0) return;
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

window.onload = loadVocab;
