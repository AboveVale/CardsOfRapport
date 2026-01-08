// colorpicker.js
export function createHexColorPickerModal(initialHex = "#000000") {
  let currentHex = initialHex;
  let hue = 0;
  let sat = 1;
  let val = 1;

  /* =========================
     HELPERS
  ========================= */
  function hsvToHex(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) =>
      v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    const r = Math.round(f(5) * 255);
    const g = Math.round(f(3) * 255);
    const b = Math.round(f(1) * 255);
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  /* =========================
     DOM SETUP
  ========================= */
  const overlay = document.createElement("div");
  overlay.className = "colorpicker-overlay";

  const modal = document.createElement("div");
  modal.className = "colorpicker-modal";
  overlay.appendChild(modal);

  /* =========================
     HEADER (DRAG HANDLE)
  ========================= */
  const header = document.createElement("div");
  header.className = "colorpicker-header";
  header.textContent = "Color Picker";
  modal.appendChild(header);

  /* =========================
     SV PICKER
  ========================= */
  const svCanvas = document.createElement("canvas");
  svCanvas.width = 220;
  svCanvas.height = 220;
  svCanvas.className = "sv-canvas";
  const svCtx = svCanvas.getContext("2d");
  modal.appendChild(svCanvas);

  /* =========================
     HUE SLIDER
  ========================= */
  const hueCanvas = document.createElement("canvas");
  hueCanvas.width = 220;
  hueCanvas.height = 18;
  hueCanvas.className = "hue-canvas";
  const hueCtx = hueCanvas.getContext("2d");
  modal.appendChild(hueCanvas);

  /* =========================
     HEX INPUT
  ========================= */
  const hexInput = document.createElement("input");
  hexInput.type = "text";
  hexInput.value = currentHex;
  hexInput.className = "hex-input";
  modal.appendChild(hexInput);

  /* =========================
     BUTTONS
  ========================= */
  const btnRow = document.createElement("div");
  btnRow.className = "picker-buttons";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirm";

  btnRow.append(cancelBtn, confirmBtn);
  modal.appendChild(btnRow);

  document.body.appendChild(overlay);

  /* =========================
     DRAWING
  ========================= */
  // ---------- DRAW ----------
function drawSV() {
    // Base hue fill
    svCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);

    // White gradient
    const whiteGrad = svCtx.createLinearGradient(0, 0, svCanvas.width, 0);
    whiteGrad.addColorStop(0, "#fff");
    whiteGrad.addColorStop(1, "transparent");
    svCtx.fillStyle = whiteGrad;
    svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);

    // Black gradient
    const blackGrad = svCtx.createLinearGradient(0, 0, 0, svCanvas.height);
    blackGrad.addColorStop(0, "transparent");
    blackGrad.addColorStop(1, "#000");
    svCtx.fillStyle = blackGrad;
    svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);

    // Draw selection circle
    const selX = sat * svCanvas.width;
    const selY = (1 - val) * svCanvas.height;
    svCtx.strokeStyle = "#fff";
    svCtx.lineWidth = 2;
    svCtx.beginPath();
    svCtx.arc(selX, selY, 8, 0, Math.PI * 2);
    svCtx.stroke();

    // Inner shadow to make it visible on bright colors
    svCtx.strokeStyle = "#000";
    svCtx.lineWidth = 1;
    svCtx.beginPath();
    svCtx.arc(selX, selY, 9, 0, Math.PI * 2);
    svCtx.stroke();
}

function handleSV(e) {
    const rect = svCanvas.getBoundingClientRect();

    // Calculate mouse position relative to canvas and scale to canvas size
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);

    // Update saturation and value (0 → 1)
    sat = x / rect.width;
    val = 1 - y / rect.height;

    // Update color and redraw
    updateColor();
    drawSV();
}



  function drawHue() {
    const grad = hueCtx.createLinearGradient(0, 0, hueCanvas.width, 0);
    for (let i = 0; i <= 360; i += 60) {
      grad.addColorStop(i / 360, `hsl(${i},100%,50%)`);
    }
    hueCtx.fillStyle = grad;
    hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
  }

  function updateColor() {
    currentHex = hsvToHex(hue, sat, val);
    hexInput.value = currentHex;

    // Dispatch a live "colorchanging" event
    overlay.dispatchEvent(
        new CustomEvent("colorchanging", { detail: currentHex })
    );
}


  drawSV();
  drawHue();

  /* =========================
     PICKER INTERACTION
  ========================= */
  let draggingSV = false;
  let draggingHue = false;

  svCanvas.addEventListener("mousedown", e => {
    draggingSV = true;
    handleSV(e);
  });

  hueCanvas.addEventListener("mousedown", e => {
    draggingHue = true;
    handleHue(e);
  });

  window.addEventListener("mouseup", () => {
    draggingSV = false;
    draggingHue = false;
  });

  window.addEventListener("mousemove", e => {
    if (draggingSV) handleSV(e);
    if (draggingHue) handleHue(e);
  });

  function handleHue(e) {
    const rect = hueCanvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, hueCanvas.width);

    // Update hue
    hue = (x / hueCanvas.width) * 360;

    // Redraw SV and update color
    drawSV();
    updateColor();
}

  
  

  /* =========================
     DRAGGING MODAL
  ========================= */
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", e => {
    dragging = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    header.style.cursor = "grabbing";
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    header.style.cursor = "grab";
  });

  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    modal.style.left = `${e.clientX - offsetX}px`;
    modal.style.top = `${e.clientY - offsetY}px`;
  });

  /* =========================
     BUTTON ACTIONS
  ========================= */
  cancelBtn.onclick = () => overlay.remove();

  confirmBtn.onclick = () => {
    overlay.dispatchEvent(
      new CustomEvent("colorpicked", { detail: currentHex })
    );
  };

  /* =========================
     STYLES (INJECT ONCE)
  ========================= */
  if (!document.getElementById("hex-picker-styles")) {
    const style = document.createElement("style");
    style.id = "hex-picker-styles";
    style.textContent = `
.colorpicker-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2000;
}

.colorpicker-modal {
  width: 300px;
  box-shadow: 0 0 40px rgba(0,0,0,0.7);
  background: rgba(22,27,42,1);
  border: 2px solid #353d6b;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  padding: 12px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  position: absolute;
  top: 120px;
  left: 120px;
}

/* Header */
.colorpicker-header {
  font-size: 12px;
  opacity: 0.85;
  cursor: grab;
  user-select: none;
  padding-bottom: 2px;
}

/* SV picker */
.sv-canvas {
  width: 95%;
  aspect-ratio: 1 / 1;
  align-self: center;
  border-radius: 10px;
  cursor: crosshair;
  background: #000; /* prevents transparency */
}

/* Hue slider */
.hue-canvas {
  width: 95%;
  height: 16px;
  align-self: center;
  border-radius: 10px;
  cursor: pointer;
  background: #111; /* fixes transparency */
}

/* Hex input */
.hex-input {
  width: 95%;
  align-self: center;
  padding: 6px;
  text-align: center;
  font-family: monospace;
  background: #111628;
  border: 1px solid #444;
  border-radius: 8px;
  color: white;
  font-size: 12px;
}

/* Buttons */
.picker-buttons {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.picker-buttons button {
  background: rgba(33,37,52,0.85);
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.picker-buttons button:hover {
  background: #353d6b;
}

`;
    document.head.appendChild(style);
  }

  return overlay;
}
