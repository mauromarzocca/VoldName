// Mappe globali caricate al volo
let nameMap = { it: new Map(), en: new Map() };
let surnameMap = { it: new Map(), en: new Map() };
let validAnagrams = [];
let isDataLoaded = false;

// Helper
function cleanStr(s) {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function getCountKey(str) {
  const count = {};
  for (let c of str) {
    if (c >= 'a' && c <= 'z') count[c] = (count[c] || 0) + 1;
  }
  return Object.entries(count)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => k + v)
    .join('');
}

function keyToObj(key) {
  const obj = {};
  let i = 0;
  while (i < key.length) {
    const char = key[i];
    i++;
    let num = '';
    while (i < key.length && /\d/.test(key[i])) {
      num += key[i];
      i++;
    }
    obj[char] = parseInt(num);
  }
  return obj;
}

function subtractKeys(inputKey, subKey) {
  const inObj = keyToObj(inputKey);
  const subObj = keyToObj(subKey);
  const res = { ...inObj };
  for (let [k, v] of Object.entries(subObj)) {
    if (!res[k] || res[k] < v) return null;
    res[k] -= v;
    if (res[k] === 0) delete res[k];
  }
  return Object.entries(res)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => k + v)
    .join('');
}

async function loadDictionaries() {
  const langs = ['it', 'en'];
  for (const lang of langs) {
    const names = await (await fetch(`data/build/${lang}_names.json`)).json();
    const surnames = await (await fetch(`data/build/${lang}_surnames.json`)).json();

    // Riempie le mappe
    for (const n of names) {
      const k = getCountKey(n);
      if (!nameMap[lang].has(k)) nameMap[lang].set(k, []);
      nameMap[lang].get(k).push(n);
    }
    for (const s of surnames) {
      const k = getCountKey(s);
      if (!surnameMap[lang].has(k)) surnameMap[lang].set(k, []);
      surnameMap[lang].get(k).push(s);
    }
  }
  isDataLoaded = true;
  console.log("✅ Dizionari caricati per VoldName");
}

function findAnagrams(fullName, lang) {
  const clean = cleanStr(fullName);
  if (clean.length === 0) return [];

  const inputKey = getCountKey(clean);
  const results = [];

  for (const [nameKey, nameList] of nameMap[lang]) {
    const remaining = subtractKeys(inputKey, nameKey);
    if (!remaining) continue;

    if (surnameMap[lang].has(remaining)) {
      const surnameList = surnameMap[lang].get(remaining);
      for (const name of nameList) {
        for (const surname of surnameList) {
          // Verifica finale (ridondante ma sicura)
          const combined = cleanStr(name + surname);
          if (combined.split('').sort().join('') === clean.split('').sort().join('')) {
            results.push({ name, surname });
          }
        }
      }
    }
  }
  return results;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generateAnagram() {
  if (!isDataLoaded) {
    alert("Caricamento dizionari in corso... Attendi un attimo!");
    return;
  }

  const input = document.getElementById("fullname").value.trim();
  const lang = document.getElementById("language").value;

  if (!input) {
    alert("Inserisci nome e cognome!");
    return;
  }

  validAnagrams = findAnagrams(input, lang);
  const resultEl = document.getElementById("result");
  const retryBtn = document.getElementById("retryBtn");

  if (validAnagrams.length === 0) {
    resultEl.innerHTML = "Nessun anagramma plausibile trovato 😢";
    retryBtn.style.display = "none";
  } else {
    const rand = validAnagrams[Math.floor(Math.random() * validAnagrams.length)];
    resultEl.innerHTML = `✨ <strong>${capitalize(rand.name)} ${capitalize(rand.surname)}</strong>`;
    retryBtn.style.display = "inline-block";
  }
}

function retry() {
  if (validAnagrams.length > 0) {
    const rand = validAnagrams[Math.floor(Math.random() * validAnagrams.length)];
    document.getElementById("result").innerHTML = 
      `✨ <strong>${capitalize(rand.name)} ${capitalize(rand.surname)}</strong>`;
  }
}

// Avvia il caricamento dei dati
loadDictionaries();