const topBox = document.querySelector(".top-box");
const bottomBox = document.querySelector(".bottom-box");
const sidePanel = document.querySelector(".side-panel");
import { createHexColorPickerModal } from "./colorpicker.js";
let sfxVolume = 0.1; // 0 = muted, 1 = full volume
const timerSound = new Audio("alarm/sound1.mp3");
timerSound.volume = 0.5; // adjust volume

// ================================
// =========== Sounds ==================================================================================================================================================================
// ================================

window.playCardFlip = () => {
  const sound = new Audio("sounds/cardflip.wav");
  sound.volume = sfxVolume;
  sound.play().catch(() => {});
};

window.playHoverSound = () => {
  const sound = new Audio("sounds/hover.mp3");
  sound.volume = sfxVolume;
  sound.play().catch(() => {});
};

const tracks = [
  "sounds/bgm1.mp3",
  "sounds/bgm2.mp3",
  "sounds/bgm3.mp3",
  "sounds/bgm4.mp3",
  "sounds/bgm5.mp3",
  "sounds/bgm6.mp3",
  "sounds/bgm7.mp3",
  "sounds/bgm8.mp3"
];

let i = 0;
const bgm = new Audio(tracks[i]);
bgm.volume = 0.2;

bgm.onended = () => {
  i = (i + 1) % tracks.length;
  bgm.src = tracks[i];
  bgm.play().catch(()=>{});
};

let bgmMuted = false;


// ============================================
// ========== Mute background audio ======================================================================================================================================================
// ============================================

window.toggleBgmMute = () => {
  bgmMuted = !bgmMuted;
  bgm.muted = bgmMuted;
};
window.toggleBgmMute = () => {
  bgmMuted = !bgmMuted;
  bgm.muted = bgmMuted;
  event.target.textContent = bgmMuted ? "🔇" : "🔊";
};


document.addEventListener("click", () => {
  bgm.play().catch(()=>{});
}, { once: true });

// ================================================================
// =========== Get geo location (for geography games) =====================================================================================================================================
// ================================================================

let cachedUserLocation = null;
let populationDeck = null;
let usedPopulationIndices = new Set();

(() => {
  navigator.geolocation?.getCurrentPosition(()=>{},()=>{});
  try {
    const c = new (window.AudioContext||window.webkitAudioContext)();
    c.resume?.();
    const o=c.createOscillator(), g=c.createGain();
    g.gain.value=0; o.connect(g); g.connect(c.destination);
    o.start(); o.stop();
  } catch {}
})();

// ============================================
// ========== Punishment wheel ======================================================================================================================================================
// ============================================

let punishments = [];
let wheelIndex = 0;
let wheelInterval = null;
const VISIBLE_ITEMS = 11; // exactly 11 items on wheel

async function openPunishmentWheel() {
  const modal = document.getElementById("punishment-modal");
  modal.style.display = "flex";

  if (!punishments.length) {
    punishments = await fetch("data/punishments.json").then(r => r.json());
  }

  const wheel = document.getElementById("wheel");
  wheel.innerHTML = "";

  // Create 11 wheel items
  for (let i = 0; i < VISIBLE_ITEMS; i++) {
    const div = document.createElement("div");
    div.className = "wheel-item";
    div.style.transition = "color 0.2s";
    wheel.appendChild(div);
  }

  updateWheel();
}

function closePunishmentWheel() {
  document.getElementById("punishment-modal").style.display = "none";
}

function wheelEls() {
  return [...document.querySelectorAll("#wheel .wheel-item")];
}

function updateWheel() {
  const items = wheelEls();
  const visibleItems = 11;          // number of lines visible on the wheel
  const half = Math.floor(visibleItems / 2); // middle index

  for (let i = 0; i < visibleItems; i++) {
    const idx = (wheelIndex + i - half + punishments.length) % punishments.length;
    const item = items[i];
    item.textContent = punishments[idx];

    const distance = Math.abs(i - half);

    if (distance === 0) {
      // CENTER item
      item.style.opacity = "1";
      item.style.fontWeight = "bold";
      item.style.fontSize = "1.6rem";  // larger font for center
	  item.style.borderTop = "1px solid grey";
	  item.style.borderBottom = "1px solid grey";
    } else if (distance === 1) {
      // one step away
      item.style.opacity = "0.7";
      item.style.fontWeight = "normal";
      item.style.fontSize = "1.3rem";
    } else if (distance === 2) {
      item.style.opacity = "0.5";
      item.style.fontWeight = "normal";
      item.style.fontSize = "1.1rem";
    } else {
      item.style.opacity = "0.3";
      item.style.fontWeight = "normal";
      item.style.fontSize = "1rem";
    }
  }
}



function spinWheel() {
  let spins = Math.floor(Math.random() * 10) + 50; // spin timer
  let delay = 80;

  clearInterval(wheelInterval);

  wheelInterval = setInterval(() => {
  wheelIndex = (wheelIndex + 1) % punishments.length;
  updateWheel();

  // Play tick sound on every spin step
  const tick = new Audio("sounds/tick.wav");
  tick.volume = 1;
  tick.play().catch(() => {}); // ignore errors if user hasn't interacted yet

  spins--;
  if (spins <= 0) {
    clearInterval(wheelInterval);
  }
}, delay);
}
window.openPunishmentWheel = openPunishmentWheel;
window.closePunishmentWheel = closePunishmentWheel;
window.spinWheel = spinWheel;

// =================================================
// ========== Geography population cards ======================================================================================================================================================
// =================================================

async function loadPopulationDeck() {
  if (populationDeck) return populationDeck;

  const res = await fetch("data/population.json");
  const data = await res.json();

  populationDeck = data.cards;
  return populationDeck;
}

async function drawPopulationCard(historyEntry) {
  const deck = await loadPopulationDeck();

  // Undo / redo path
  if (historyEntry?.populationIndex !== undefined) {
    return deck[historyEntry.populationIndex];
  }

  const available = deck
    .map((_, i) => i)
    .filter(i => !usedPopulationIndices.has(i));

  if (!available.length) return null;

  const index = available[Math.floor(Math.random() * available.length)];
  usedPopulationIndices.add(index);

  if (historyEntry) {
    historyEntry.populationIndex = index;
    historyEntry.populationName = deck[index].name;
    historyEntry.populationValue = deck[index].population;
  }

  return deck[index];
}


function getCachedUserLocation() {
  if (cachedUserLocation) {
    return Promise.resolve(cachedUserLocation);
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      pos => {
        cachedUserLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        resolve(cachedUserLocation);
      },
      err => reject(err),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  });
}

let cachedGeoData = null;

async function getCachedGeoData() {
  if (cachedGeoData) return cachedGeoData;

  const res = await fetch("data/countries_airports.json");
  cachedGeoData = await res.json();
  return cachedGeoData;
}

let penColor = "#000000"; // declares pen color for canvas
const usedCards = {}; // Track drawn cards per color
const deckData = {};  // Store all cards per color

function updateSideBorder(colors) { // Gradient card borders
  sidePanel.style.setProperty("--sb1", colors[0]);
  sidePanel.style.setProperty("--sb2", colors[1]);
  sidePanel.style.setProperty("--sb3", colors[2]);
}

let gambleRewards = [];
let gamblePunishments = [];
let history = []; // array of {color, cardIndex, resolvedBottomText, colors, useDarkText}
let historyPointer = -1; // points to current card in the history

const usedSilhouettes = new Set(); // Track which silhouettes have been used


function normalizeImagePath(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path; // external
  if (path.startsWith("/")) return path;    // already absolute
  return "/" + path;                         // force absolute
}
async function playFullscreenVideoAndWait(videoPath) { // Used for literally one card in the game
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "black";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";

    const video = document.createElement("video");
    video.src = videoPath;
    video.autoplay = true;
    video.controls = false;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "contain";

    overlay.appendChild(video);
    document.body.appendChild(overlay);

    video.addEventListener("ended", () => {
      overlay.remove();
      resolve();
    });
  });
}

// =================================================================================
// ========== "gamble decks", or decks that replace text based on chance ======================================================================================================================================================
// =================================================================================

(async function loadGambleDecks() {
  const rewardsRes = await fetch("cards/rewards.json");
  const punishRes = await fetch("cards/punishments.json");

  gambleRewards = (await rewardsRes.json()).cards;
  gamblePunishments = (await punishRes.json()).cards;
})();

async function resolveTopText(text, historyEntry) {
  if (!text) return text;

  const gambleMatch = text.match(/>>gamble\.(population|geography)<</i);
  if (!gambleMatch) return text;

  const contentBox = topBox.querySelector(".top-box-content");

  // Undo / redo path or save/load path
  if (historyEntry?.resolvedTopText) {
    contentBox.innerHTML = "";
    const textNode = document.createElement("div");
    textNode.className = "text-content";
    textNode.textContent = historyEntry.resolvedTopText;
    contentBox.appendChild(textNode);
    return historyEntry.resolvedTopText;
  }

  contentBox.innerHTML = "";

  // ---- Overlay / Loading UI ---- (keep as-is)
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "10";
  overlay.style.background = "rgba(0,0,0,0.25)";
  overlay.style.pointerEvents = "none";

// ---- Loading text ----
const loadingText = document.createElement("div");
loadingText.style.fontSize = "2rem";
loadingText.style.fontWeight = "bold";
loadingText.style.display = "flex";
loadingText.style.gap = "4px";
loadingText.textContent = "Loading";

// Create 3 bouncing dots
for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.textContent = ".";
    dot.style.display = "inline-block";

    // Explicit animation properties
    dot.style.animationName = "bounce";
    dot.style.animationDuration = "1.2s";
    dot.style.animationTimingFunction = "ease-in-out";
    dot.style.animationIterationCount = "infinite";
    dot.style.animationDelay = `${i * 0.2}s`;

    loadingText.appendChild(dot);
}

// ---- Inject shimmer/bounce CSS once ----
if (!document.getElementById("loading-shimmer-style")) {
    const style = document.createElement("style");
    style.id = "loading-shimmer-style";
    style.textContent = `
        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
        }
    `;
    document.head.appendChild(style);
}

overlay.appendChild(loadingText);


  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.appendChild(overlay);
  contentBox.appendChild(wrapper);

  let replacementText = "";

  if (gambleMatch[1] === "population") {
    let card;

    // If this entry already has a saved populationIndex, use it
    if (historyEntry?.populationIndex !== undefined) {
      const deck = await loadPopulationDeck();
      card = deck[historyEntry.populationIndex];
    } else {
      card = await drawPopulationCard(historyEntry);
    }

    if (!card) return text;

    replacementText = card.name;

  } else if (gambleMatch[1] === "geography") {
    const geo = await resolveGeographyGamble();
    if (!geo) return text;

    replacementText = geo.name;
    historyEntry.geoAnswer =
      `The busiest airport for ${geo.name} is approximately ${geo.miles.toLocaleString()} miles away.`;
  }
  

  const finalText = text.replace(gambleMatch[0], replacementText);

  // Store for undo/redo/save
  historyEntry.resolvedTopText = finalText;

  contentBox.innerHTML = "";
  const textNode = document.createElement("div");
  textNode.className = "text-content";
  textNode.innerHTML = finalText;
  contentBox.appendChild(textNode);

  return finalText;
}

// ==================================
// ========== Load cards ======================================================================================================================================================
// ==================================

async function renderCard(card, colors, useDarkText = false, resolvedBottomText = null, historyEntry = null) {
    const contentBox = topBox.querySelector(".top-box-content");
    contentBox.innerHTML = "";
    bottomBox.innerHTML = "";
    bottomBox.className = "bottom-box";
	bottomBox.onclick = null;           // remove old click handlers

    topBox.classList.toggle("dark-text", useDarkText);

    topBox.style.setProperty("--c1", colors[0]);
    topBox.style.setProperty("--c2", colors[1]);
    topBox.style.setProperty("--c3", colors[2]);

    // ---- TOP BOX ----
	
	// =============== Video ======================================================================
if (typeof card.top.value === "string" && card.top.value.startsWith("!!video!!")) {
  const textAfter = card.top.value.replace("!!video!!", "").trim();

  // Fetch video list
  const res = await fetch("cards/images/black/videos/index.json");
  const videos = await res.json(); // array of filenames
  const chosen = videos[Math.floor(Math.random() * videos.length)];

  // Play video fullscreen and wait
  await playFullscreenVideoAndWait(
    `/cards/images/black/videos/${chosen}`
  );

  // After video ends, render remaining text normally
  if (textAfter) {
    const text = document.createElement("div");
    text.className = "text-content";
    text.textContent = textAfter;
    contentBox.appendChild(text);
  }

  bottomBox.textContent = card.bottom || "";
  return;
}

	
	// =============== Canvas =======================================================================================================================
	
	// Inside renderCard function, replace or add before other card types
if (card.top.value === "!!canvas!!") {
    const canvasWrapper = document.createElement("div");
    canvasWrapper.className = "top-box-canvas-wrapper";

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.className = "top-box-canvas";
    canvas.width = contentBox.clientWidth;
    canvas.height = contentBox.clientHeight - 60; // leave space for toolbar
    canvasWrapper.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000"; // default pen color
    let penColor = ctx.strokeStyle;

    let drawing = false;

    // Utility: get accurate mouse coordinates on canvas
    function getCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    canvas.addEventListener("mousedown", e => {
    drawing = true;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y); // draw a single point
    ctx.stroke();
});


    canvas.addEventListener("mousemove", e => {
        if (!drawing) return;
        const { x, y } = getCanvasPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    });

    window.addEventListener("mouseup", () => {
        drawing = false;
    });

    // --------------------
    // Toolbar
    // --------------------
    const toolbar = document.createElement("div");
    toolbar.className = "canvas-toolbar";

    // Pen size slider
    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Size:";
    const sizeInput = document.createElement("input");
    sizeInput.type = "range";
    sizeInput.min = 1;
    sizeInput.max = 30;
    sizeInput.value = ctx.lineWidth;
    sizeInput.addEventListener("input", () => {
        ctx.lineWidth = sizeInput.value;
    });
    sizeLabel.appendChild(sizeInput);
    toolbar.appendChild(sizeLabel);

    // Color picker button
    // Color picker button
const colorBtn = document.createElement("button");
colorBtn.textContent = "Color";
toolbar.appendChild(colorBtn);

colorBtn.addEventListener("click", () => {
    const pickerOverlay = createHexColorPickerModal(penColor);
    const modal = pickerOverlay.querySelector(".colorpicker-modal"); // modal inside overlay

    // Position the modal near the button
    const rect = colorBtn.getBoundingClientRect();
    modal.style.position = "absolute";
    modal.style.left = `${rect.left}px`;
    modal.style.top = `${rect.bottom + 4}px`;

    // Update pen color immediately when picking
    pickerOverlay.addEventListener("colorpicked", e => {
        penColor = e.detail;
        ctx.strokeStyle = penColor;
    });

    // Optional: if your color picker dispatches 'colorchanging' events for live updates
    pickerOverlay.addEventListener("colorchanging", e => {
        penColor = e.detail;
        ctx.strokeStyle = penColor;
    });
});



    // Clear button
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
    toolbar.appendChild(clearBtn);

    canvasWrapper.appendChild(toolbar);
    contentBox.appendChild(canvasWrapper);
    bottomBox.innerHTML = card.bottom || "";

    return await renderBottomText(card.bottom, null, historyEntry);
}


	
	// =============== Silhouette ===================================================================================================================
    const silhouetteMatch = card.top.value.match(/^!!silhouette(?:\.([a-zA-Z0-9_.-]+))?!!$/);

if (silhouetteMatch) {
  const img = document.createElement("img");

  let path;
  let revealed = historyEntry?.revealed ?? false;

  // Convert dot notation to folder path
  const subPath = silhouetteMatch[1]
    ? silhouetteMatch[1].split(".").join("/")
    : "";

  if (historyEntry?.silhouettePath) {
    path = historyEntry.silhouettePath;
    usedSilhouettes.add(path);
  } else {
    let res, data;
    do {
      const url = subPath
        ? `/silhouettes/random?path=${encodeURIComponent(subPath)}`
        : `/silhouettes/random`;

      res = await fetch(url);
      data = await res.json();
      path = data.path;
    } while (usedSilhouettes.has(path));

    usedSilhouettes.add(path);

    if (historyEntry) {
      historyEntry.silhouettePath = path;
      historyEntry.revealed = false;
    }
  }

  img.src = path;
  img.style.filter = revealed
    ? "none"
    : "brightness(0) invert(0) opacity(1)";

  img.addEventListener("click", () => {
    revealed = !revealed;
    img.style.filter = revealed
      ? "none"
      : "brightness(0) invert(0) opacity(1)";
    if (historyEntry) historyEntry.revealed = revealed;
  });

  contentBox.appendChild(img);
}


 else if (card.top.type === "image") {
    // ✅ THIS WAS MISSING
    const img = document.createElement("img");
    img.src = normalizeImagePath(card.top.value);
    contentBox.appendChild(img);

    } else {
      const text = document.createElement("div");
	text.className = "text-content";
	text.innerHTML = await resolveTopText(card.top.value, historyEntry);
	contentBox.appendChild(text);

    }

    // ---- BOTTOM BOX ----
    if (resolvedBottomText !== null) {
        bottomBox.textContent = resolvedBottomText;
        bottomBox.classList.remove("spoiler-mode");
        bottomBox.classList.add("spoiler-revealed");
        return resolvedBottomText;
    }

    // Pass down the historyEntry so gambling or undo/redo can be stored
    return await renderBottomText(card.bottom, null, historyEntry);
  }


async function renderBottomText(text, resolvedContent = null, historyEntry = null) {
  if (!text) return "";

  bottomBox.innerHTML = "";
  bottomBox.className = "bottom-box";

  const spoilerMatch = text.match(/(.*?)\|\|(.*?)\|\|/);

  if (spoilerMatch) {
    const label = spoilerMatch[1].trim() || "Click to reveal";
    const hiddenContent = spoilerMatch[2].trim();

    let revealed = historyEntry?.revealed ?? false;

    async function updateBottom() {
      bottomBox.innerHTML = "";

      if (!revealed) {
        bottomBox.classList.add("spoiler-mode");
        bottomBox.classList.remove("spoiler-revealed");
        const labelDiv = document.createElement("div");
        labelDiv.className = "spoiler-label";
        labelDiv.textContent = label;
        bottomBox.appendChild(labelDiv);
      } else {
        bottomBox.classList.remove("spoiler-mode");
        bottomBox.classList.add("spoiler-revealed");

        // Resolve gamble if not already resolved in history
        if (resolvedContent === null) {
          const gambleMatch = hiddenContent.match(/>>gamble\.([a-zA-Z0-9_-]+)\.(\d{1,3})<</i);

          if (gambleMatch) {
  const gambleResult = await resolveGambleToken(
    `gamble.${gambleMatch[1]}.${gambleMatch[2]}`
  );

  resolvedContent = hiddenContent.replace(
    gambleMatch[0],
    gambleResult
  );
} else {
  resolvedContent = hiddenContent;
}


          // Save to history so undo/redo uses the same result
          if (historyEntry) historyEntry.resolvedBottomText = resolvedContent;
        }

        if (resolvedContent === ">>answer.geo<<") {
  bottomBox.textContent =
    historyEntry?.geoAnswer || "Calculating distance…";
  return;
}

if (hiddenContent.includes(">>answer.population<<")) {
  if (historyEntry?.populationName) {
    bottomBox.textContent =
      `${historyEntry.populationName} has a population of ${historyEntry.populationValue}.`;
  } else {
    bottomBox.textContent = "Population unavailable.";
  }
  return;
}

 else {
  bottomBox.textContent = resolvedContent;
}

      }
    }

    await updateBottom();

    bottomBox.onclick = async function toggleSpoiler() {
  revealed = !revealed;
  await updateBottom();
};


    return resolvedContent;
  }

  // ---- Non-spoiler text (including gambles) ----
  const gambleMatch = text.match(/>>gamble\.([a-zA-Z0-9_-]+)\.(\d{1,3})<</i);
  if (gambleMatch) {
    if (resolvedContent === null) {
      resolvedContent = await resolveGambleToken(
        `gamble.${gambleMatch[1]}.${gambleMatch[2]}`
      );

      if (historyEntry) historyEntry.resolvedBottomText = resolvedContent;
    }

    bottomBox.textContent = resolvedContent;
    return resolvedContent;
  } else {
    bottomBox.textContent = text;

    if (historyEntry) historyEntry.resolvedBottomText = text;
    return text;
  }
}

// --------------------
// Geography Gamble
// --------------------
async function resolveGeographyGamble() {
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject("Geolocation not supported");
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        }),
        err => reject(err)
      );
    });
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    let dlat = (lat2 - lat1) * Math.PI / 180;
    let dlon = (lon2 - lon1) * Math.PI / 180;

    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    const a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.pow(Math.sin(dlon / 2), 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

    const radius = 6371; // km
    const c = 2 * Math.asin(Math.sqrt(a));
    return radius * c;
  }

  try {
    const user = await getCachedUserLocation();
	const locations = await getCachedGeoData();


    const place = locations[Math.floor(Math.random() * locations.length)];

    const km = haversineDistance(
      user.lat,
      user.lon,
      place.lat,
      place.lon
    );

    const miles = Math.round(km * 0.621371);

    return {
      name: place.name,
      miles
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function resolveGambleToken(token) {
  const parts = token.split(".");
  if (parts.length < 2) return "Invalid gamble.";

  const extension = parts[1];
  const chance = Number(parts[2]);

  // --------------------
  // Geography Gamble
  // --------------------
  if (extension === "geography") {
    const geo = await resolveGeographyGamble();

    if (!geo) {
      return "your location (permission denied)";
    }

    // Store answer globally for >>answer.geo<<
    window.__lastGeoAnswer = `${geo.name} is approximately ${geo.miles.toLocaleString()} miles away.`;

    return geo.name;
  }

  // --------------------
  // Default Gamble Logic
  // --------------------
  if (isNaN(chance) || chance < 0 || chance > 100) {
    return "Invalid gamble odds.";
  }

  const roll = Math.random() * 100;
  const outcome = roll < chance ? "win" : "loss";

  const path = `cards/gamble/${extension}/${outcome}.json`;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Missing gamble file");

    const data = await res.json();
    if (!Array.isArray(data.cards) || data.cards.length === 0) {
      return "Nothing happens.";
    }

    return data.cards[Math.floor(Math.random() * data.cards.length)];
  } catch (err) {
    console.error(err);
    return `Gamble "${extension}" failed.`;
  }
}

// --------------------
// Initialize decks and counters
// --------------------
document.querySelectorAll(".card-stack").forEach(async stack => {
  const color = stack.dataset.color;

  if (!usedCards[color]) usedCards[color] = new Set();

  // Fetch the deck JSON
  const res = await fetch(`cards/${color}.json`);
  const data = await res.json();
  deckData[color] = data.cards; // store globally

  // Initialize counters
  stack.querySelectorAll(".card").forEach(card => {
    let numberDiv = card.querySelector(".card-number");
    if (!numberDiv) {
      numberDiv = document.createElement("div");
      numberDiv.className = "card-number";
      card.appendChild(numberDiv);
    }
    numberDiv.textContent = deckData[color].length;
  });

  // Click event
stack.addEventListener("click", async () => {
  const available = deckData[color].filter((_, i) => !usedCards[color].has(i));

  if (available.length === 0) {
  // ---- Deck empty path ----
  topBox.querySelector(".top-box-content").innerHTML = ""; // clear top box

  bottomBox.textContent = "This deck is empty. Refresh page to reload."; // update bottom
  bottomBox.className = "bottom-box"; // remove any spoiler styling
  bottomBox.onclick = null; // remove any previous spoiler click handler

  stack.querySelectorAll(".card .card-number").forEach(num => num.textContent = 0);
  return; // stop further processing
}

  const index = Math.floor(Math.random() * available.length);
  const card = available[index];
  usedCards[color].add(deckData[color].indexOf(card));

  const lightColors = ["yellow", "lightgreen"];
  const useDarkText = lightColors.includes(color);

  // ---- Timeline handling ----
  historyPointer = history.length; // move to end
  history.push({
    card,
    colors: [
      getComputedStyle(stack).getPropertyValue("--c1").trim(),
      getComputedStyle(stack).getPropertyValue("--c2").trim(),
      getComputedStyle(stack).getPropertyValue("--c3").trim()
    ],
    useDarkText,
    resolvedBottomText: null,
    color,
    cardIndex: deckData[color].indexOf(card)
  });

  await renderCard(
    card,
    [
      getComputedStyle(stack).getPropertyValue("--c1").trim(),
      getComputedStyle(stack).getPropertyValue("--c2").trim(),
      getComputedStyle(stack).getPropertyValue("--c3").trim()
    ],
    useDarkText,
    null,
    history[historyPointer]
  );

  updateSideBorder(stack.dataset.border.split(","));

  const remaining = deckData[color].length - usedCards[color].size;
  stack.querySelectorAll(".card .card-number").forEach(num => num.textContent = remaining);
});

});


// ------------------
// Save / Load buttons
// ------------------
const saveButton = document.querySelector(".toolbar-btn:nth-child(1)");
const loadDropdownContent = document.querySelector(".dropdown-content");

saveButton.addEventListener("click", () => {
  const saveName = prompt("Enter a name for this save:");
  if (!saveName) return;

  const saveData = {
    usedCards: {},
    history,
    historyPointer,
    usedSilhouettes: Array.from(usedSilhouettes)
  };

  for (const color in usedCards) {
    saveData.usedCards[color] = Array.from(usedCards[color]);
  }

  const blob = new Blob(
    [JSON.stringify(saveData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${saveName}.json`;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

const loadInput = document.createElement("input");
loadInput.type = "file";
loadInput.accept = ".json";
loadInput.style.display = "none";
document.body.appendChild(loadInput);



function populateLoadDropdown() {
  loadDropdownContent.innerHTML = "";

  const btn = document.createElement("button");
  btn.textContent = "Click here to load from file…";
  btn.style.display = "block";
  btn.style.width = "100%";
  btn.style.background = "transparent";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.cursor = "pointer";

  btn.onclick = () => loadInput.click();

  loadDropdownContent.appendChild(btn);
}


loadInput.addEventListener("change", async () => {
  const file = loadInput.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Restore used cards
    document.querySelectorAll(".card-stack").forEach(stack => {
      const color = stack.dataset.color;
      usedCards[color] = new Set(data.usedCards?.[color] || []);

      const total = deckData[color].length;
      const remaining = total - usedCards[color].size;
      stack.querySelectorAll(".card .card-number")
        .forEach(num => num.textContent = remaining);
    });

    // Restore history
    history.length = 0;
    if (Array.isArray(data.history)) history.push(...data.history);

    historyPointer =
      typeof data.historyPointer === "number"
        ? data.historyPointer
        : history.length - 1;

    // Restore silhouettes
    usedSilhouettes.clear();
    (data.usedSilhouettes || []).forEach(p => usedSilhouettes.add(p));

    // Render current card
    if (historyPointer >= 0 && historyPointer < history.length) {
      await showHistoryCard();
    } else {
      topBox.innerHTML = "";
      bottomBox.textContent = "Save loaded!";
    }

  } catch (err) {
    alert("Invalid save file.");
    console.error(err);
  } finally {
    loadInput.value = ""; // allow reloading same file
  }
});



populateLoadDropdown();



// REFRESH MODAL HANDLING
const refreshBtn = document.querySelector(".toolbar-btn.refresh");
const modal = document.getElementById("refresh-modal");
const yesBtn = document.getElementById("refresh-yes");
const noBtn = document.getElementById("refresh-no");

refreshBtn.addEventListener("click", () => {
  modal.style.display = "flex"; // show modal
});

noBtn.addEventListener("click", () => {
  modal.style.display = "none"; // hide modal
});

yesBtn.addEventListener("click", () => {
  modal.style.display = "none"; // hide modal
  // Force reload
  window.location.href = window.location.href;
});

// Optional: Close modal if user clicks outside content
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// -------------------------
// TIMER MODAL CREATION
// -------------------------
const timerModalOverlay = document.createElement("div");
timerModalOverlay.id = "timer-modal-overlay";
timerModalOverlay.style.display = "none";

const timerModal = document.createElement("div");
timerModal.id = "timer-modal";

// Close button
const timerCloseBtn = document.createElement("button");
timerCloseBtn.id = "timer-close";
timerCloseBtn.textContent = "×";
timerModal.appendChild(timerCloseBtn);

// Container for left (controls) and right (timer)
const modalContainer = document.createElement("div");
modalContainer.id = "modal-container";
timerModal.appendChild(modalContainer);

// -------------------------
// LEFT SIDE: INPUT + QUICK SELECT
// -------------------------
const leftContainer = document.createElement("div");
leftContainer.id = "left-container";

// Timer input at top-left
const timerInput = document.createElement("input");
timerInput.type = "text";
timerInput.id = "timer-input";
timerInput.placeholder = "00:00";
leftContainer.appendChild(timerInput);

// Quick-select buttons in 2x3 grid (1-5 + 10 minutes)
const quickControls = document.createElement("div");
quickControls.id = "quick-controls";
[1, 2, 3, 4, 5, 10].forEach(min => {
  const btn = document.createElement("button");
  btn.textContent = `${min} min`;
  btn.className = "timer-quick-btn";
  btn.addEventListener("click", () => {
    timerInput.value = `${String(min).padStart(2,"0")}:00`;
  });
  quickControls.appendChild(btn);
});
leftContainer.appendChild(quickControls);

// Bottom row buttons: Start, Stop, Reset, Stopwatch
const bottomControls = document.createElement("div");
bottomControls.id = "bottom-controls";

const timerStartBtn = document.createElement("button");
timerStartBtn.textContent = "Start";
timerStartBtn.id = "timer-start";
bottomControls.appendChild(timerStartBtn);

const timerPauseBtn = document.createElement("button");
timerPauseBtn.textContent = "Pause";
timerPauseBtn.id = "timer-pause";
bottomControls.appendChild(timerPauseBtn);

const timerResetBtn = document.createElement("button");
timerResetBtn.textContent = "Reset";
timerResetBtn.id = "timer-reset";
bottomControls.appendChild(timerResetBtn);

const stopwatchBtn = document.createElement("button");
stopwatchBtn.textContent = "Stopwatch";
stopwatchBtn.id = "stopwatch-btn";
bottomControls.appendChild(stopwatchBtn);

leftContainer.appendChild(bottomControls);

// -------------------------
// RIGHT SIDE: TIMER DISPLAY
// -------------------------
const rightContainer = document.createElement("div");
rightContainer.id = "right-container";

const timerDisplay = document.createElement("div");
timerDisplay.id = "timer-display";
timerDisplay.textContent = "00:00";
rightContainer.appendChild(timerDisplay);

// -------------------------
// APPEND TIMER CONTENT (VERTICAL)
// -------------------------
modalContainer.innerHTML = ""; // ensure clean slate

modalContainer.appendChild(timerDisplay);
modalContainer.appendChild(timerInput);
modalContainer.appendChild(quickControls);
modalContainer.appendChild(bottomControls);

timerModal.appendChild(modalContainer);
timerModalOverlay.appendChild(timerModal);
document.body.appendChild(timerModalOverlay);

// -------------------------
// STYLES
// -------------------------
const timerStyle = document.createElement("style");
timerStyle.textContent = `
#timer-modal-overlay {
  position: fixed;
  inset: 0;
  background: none;
  pointer-events: none;
  z-index: 1500;
}

/* Main modal */
#timer-modal {
  background: rgba(22,27,42,1);
  border: 1px solid #353d6b;
  padding: 20px;
  border-radius: 16px;
  color: white;
  width: 360px;
  position: absolute;
  top: 100px;
  left: 100px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0,0,0,0.7);
}

/* Close button */
#timer-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
}

/* Container */
#modal-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  margin-top: 30px;
}

/* Timer display */
#timer-display {
  font-size: 5.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 6px;
}

/* Input */
#timer-input {
  width: 100%;
  padding: 12px;
  font-size: 1.4rem;
  border-radius: 8px;
  border: none;
  background: rgba(52,60,89,1);
  color: white;
  text-align: center;
}

/* Quick buttons */
#quick-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.timer-quick-btn {
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: rgba(33,37,52,0.85);
  color: white;
  font-size: 1rem;
  transition: 0.2s;
}

.timer-quick-btn:hover {
  background: rgba(43,47,62,1);
}

/* Bottom controls */
#bottom-controls {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

#bottom-controls button {
  padding: 12px 0;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  background: rgba(33,37,52,0.85);
  color: white;
  transition: 0.2s;
}

#bottom-controls button:hover {
  background: rgba(43,47,62,1);
}
`;
document.head.appendChild(timerStyle);

// -------------------------
// DRAGGABLE TIMER MODAL
// -------------------------
let timerDragging = false;
let timerOffsetX = 0;
let timerOffsetY = 0;

timerModal.style.cursor = "grab";

timerModal.addEventListener("mousedown", e => {
  if (e.target.closest("button") || e.target.tagName === "INPUT") return;

  timerDragging = true;
  timerOffsetX = e.clientX - timerModal.offsetLeft;
  timerOffsetY = e.clientY - timerModal.offsetTop;
  timerModal.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  timerDragging = false;
  timerModal.style.cursor = "grab";
});

window.addEventListener("mousemove", e => {
  if (!timerDragging) return;
  timerModal.style.left = `${e.clientX - timerOffsetX}px`;
  timerModal.style.top = `${e.clientY - timerOffsetY}px`;
});



// -------------------------
// TIMER / STOPWATCH LOGIC
// -------------------------
let timerInterval = null;
let remainingSeconds = 0;
let stopwatchMode = false;
let isPaused = false;

// Format seconds as MM:SS
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Show modal when toolbar button clicked
const timerBtn = document.querySelector(".toolbar-btn.timer");
timerBtn.addEventListener("click", () => {
  timerModalOverlay.style.display = "flex";
  // Show current time if paused
  timerDisplay.textContent = formatTime(remainingSeconds);
});

// Close modal
timerCloseBtn.addEventListener("click", () => {
  timerModalOverlay.style.display = "none";
  clearInterval(timerInterval);
});

// -----------------
// Start Button
// -----------------
timerStartBtn.addEventListener("click", () => {
  clearInterval(timerInterval);

  // If paused, resume
  if (isPaused) {
    startTimerOrStopwatch();
    return;
  }

  // If stopwatch mode, reset if starting fresh
  if (stopwatchMode) remainingSeconds = 0;

  // Timer mode: read input
  if (!stopwatchMode) {
    const match = timerInput.value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return alert("Invalid format! Use 00:00");

    const mins = Number(match[1]);
    const secs = Number(match[2]);
    remainingSeconds = mins * 60 + secs;
  }

  timerInput.value = ""; // clear input
  startTimerOrStopwatch();
});

function startTimerOrStopwatch() {
  timerInterval = setInterval(() => {
    if (stopwatchMode) {
      remainingSeconds++;
    } else {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        clearInterval(timerInterval);
        timerSound.play().catch(() => {});
      }
    }
    timerDisplay.textContent = formatTime(remainingSeconds);
  }, 1000);

  isPaused = false;
}

// -----------------
// Pause Button
// -----------------
timerPauseBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isPaused = true;
});

// -----------------
// Reset Button
// -----------------
timerResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  remainingSeconds = 0;
  stopwatchMode = false;
  isPaused = false;
  timerInput.disabled = false;
  timerInput.value = "";
  timerDisplay.textContent = "00:00";
});

// -----------------
// Stopwatch Button
// -----------------
stopwatchBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  stopwatchMode = true;
  isPaused = false;
  timerInput.disabled = true;
  timerInput.value = ""; // clear input
  timerDisplay.textContent = formatTime(remainingSeconds); // show current time

  // Start the stopwatch
  timerInterval = setInterval(() => {
    remainingSeconds++;
    timerDisplay.textContent = formatTime(remainingSeconds);
  }, 1000);

});



// --------------------
// UNDO / REDO BUTTON LOGIC
// --------------------
const undoBtn = document.querySelector(".top-box .undo-btn");
const redoBtn = document.querySelector(".top-box .redo-btn");

async function showHistoryCard() {
  if (historyPointer < 0 || historyPointer >= history.length) return;

  const entry = history[historyPointer];
  const stack = document.querySelector(`.card-stack[data-color="${entry.color}"]`);
  const card = deckData[entry.color][entry.cardIndex];

  const lightColors = ["yellow", "lightgreen"];
  const useDarkText = lightColors.includes(entry.color);

  // Render card using previously resolved bottom text
  await renderCard(
  card,
  [
    getComputedStyle(stack).getPropertyValue("--c1").trim(),
    getComputedStyle(stack).getPropertyValue("--c2").trim(),
    getComputedStyle(stack).getPropertyValue("--c3").trim()
  ],
  useDarkText,
  entry.resolvedBottomText,
  entry // <-- pass the history entry
);


  // Update side border
  updateSideBorder(stack.dataset.border.split(","));
}

// Undo button
undoBtn.addEventListener("click", async () => {
  if (historyPointer <= 0) return; // nothing to undo
  historyPointer--;
  await showHistoryCard();
});

// Redo button
redoBtn.addEventListener("click", async () => {
  if (historyPointer >= history.length - 1) return; // nothing to redo
  historyPointer++;
  await showHistoryCard();
});

// RULES MODAL
const rulesBtn = document.getElementById("rules-btn");
const rulesModal = document.getElementById("rules-modal");
const rulesClose = document.getElementById("rules-close");

// Open modal
rulesBtn.addEventListener("click", () => {
  rulesModal.style.display = "flex";
});

// Close modal
rulesClose.addEventListener("click", () => {
  rulesModal.style.display = "none";
});

// Optional: close if click outside modal-content
rulesModal.addEventListener("click", (e) => {
  if (e.target === rulesModal) rulesModal.style.display = "none";
});


// BUBBLE

const bubbleContainer = document.querySelector('.bubble-container');

const imageFiles = [
  'bubble/blueberry.png',
  'bubble/blueberry2.png',
  'bubble/banana.png',
  'bubble/milk.png',
  'bubble/pineapple.png',
  'bubble/squidward.png',
  'bubble/okra.png',
  'bubble/ufo.png',
  'bubble/blackhole.png',
];

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createBubble() {
  if (!bubbleContainer) return; // safeguard

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');

  // Random size
  const size = Math.random() * 30 + 20; // 20px to 50px
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;

  // Random horizontal position
  bubble.style.left = `${Math.random() * 100}%`;

  // Random rotation
  bubble.style.setProperty('--rotation', `${Math.random() * 360}deg`);

  // Half speed: double the base duration
  const duration = (Math.random() * 8 + 10) * 2; // 10s to 26s
  bubble.style.animationDuration = `${duration}s`;
  bubble.style.animationDelay = `${Math.random() * 5}s`;

  // Random image
  const imgUrl = randomFromArray(imageFiles);
  bubble.style.backgroundImage = `url("${imgUrl}")`;

  // Random opacity between 0.1 and 0.6
  bubble.style.opacity = (Math.random() * 0.1 + 0.5).toString();

  bubbleContainer.appendChild(bubble);

  // Remove bubble after animation
  bubble.addEventListener('animationend', () => {
    bubble.remove();
  });
}


// Generate bubbles at intervals
setInterval(createBubble, 300);

