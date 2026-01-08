const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const decks = {};
const discarded = {};
const colors = ["yellow","pink","red","green","warmpurple","purple","orange","lightgreen","black"];

app.use("/cards", express.static(path.join(__dirname, "cards")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/bubble", express.static(path.join(__dirname, "bubble")));


// Load decks from JSON files
function loadDeck(color) {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, `cards/${color}.json`)));
  return data.cards.map((card, i) => ({ ...card, id: i }));
}

// Initialize decks
colors.forEach(color => {
  decks[color] = loadDeck(color);
  discarded[color] = [];
});

// Draw card
app.post("/draw/:color", (req, res) => {
  const color = req.params.color;

  if (!decks[color] || decks[color].length === 0) {
    return res.json({ empty: true });
  }

  const index = Math.floor(Math.random() * decks[color].length);
  const card = decks[color][index];

  decks[color].splice(index, 1);
  discarded[color].push(card);

  res.json({ empty: false, card, remaining: decks[color].length });
});

// Get remaining count
app.get("/count/:color", (req, res) => {
  const color = req.params.color;

  // If deck is empty, refill from JSON
  if (!decks[color] || decks[color].length === 0) {
    decks[color] = loadDeck(color);
    discarded[color] = [];
  }

  const remaining = decks[color].length;
  res.json({ remaining });
});

const savesDir = path.join(__dirname, "saves");

// Ensure saves directory exists
if (!fs.existsSync(savesDir)) fs.mkdirSync(savesDir);

app.post("/save/:name", (req, res) => {
  const saveName = req.params.name;
  const saveData = req.body;  // should contain used cards per color
  const filePath = path.join(savesDir, saveName + ".json");

  try {
    fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});


app.get("/saves", (req, res) => {
  const files = fs.readdirSync(savesDir)
                  .filter(f => f.endsWith(".json"))
                  .map(f => f.replace(".json",""));
  res.json(files);
});

app.get("/load/:name", (req, res) => {
  const filePath = path.join(savesDir, req.params.name + ".json");
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Save not found" });

  const data = JSON.parse(fs.readFileSync(filePath));
  res.json(data); // contains used card indices per color
});

app.post("/delete-all-saves", (req, res) => {
  try {
    const files = fs.readdirSync(savesDir).filter(f => f.endsWith(".json"));
    files.forEach(f => fs.unlinkSync(path.join(savesDir, f)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

const alarmDir = path.join(__dirname, "alarm");

// Endpoint to get all alarm audio files
app.get("/alarm-files", (req, res) => {
  try {
    const files = fs.readdirSync(alarmDir)
                    .filter(f => f.match(/\.(mp3|wav|ogg)$/i));
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// Silhouette Call

const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".svg",
  ".gif",
  ".bmp",
  ".tiff"
];
const silhouetteDir = path.join(__dirname, "silhouette");
app.use("/silhouette", express.static(silhouetteDir));


function getAllImages(dir, baseDir) {
  let results = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getAllImages(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        results.push(
          "/silhouette/" +
        path.relative(baseDir, fullPath).replace(/\\/g, "/")
      );

      }
    }
  }

  return results;
}

app.get("/silhouettes/random", (req, res) => {
  try {
    const requestedPath = req.query.path || "default";
    const targetDir = path.join(silhouetteDir, requestedPath);


    // Prevent directory traversal
    if (!targetDir.startsWith(silhouetteDir)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ error: "Silhouette folder not found" });
    }

    const images = getAllImages(targetDir, silhouetteDir);

    if (!images.length) {
      return res.status(404).json({ error: "No silhouettes found" });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];
    res.json({ path: randomImage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load silhouettes" });
  }
});


app.listen(3000, () => console.log("Server running at http://localhost:3000"));
