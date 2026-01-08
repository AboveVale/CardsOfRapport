import { createHexColorPickerModal } from './colorpicker.js';
import { renderBottomText } from './script.js';



// canvasDrawer.js
export async function renderCanvasCard(contentBox, bottomBox, card, historyEntry) {
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
    });

    canvas.addEventListener("mousemove", e => {
        if (!drawing) return;
        const { x, y } = getCanvasPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    });

    window.addEventListener("mouseup", () => drawing = false);

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "canvas-toolbar";

    // Pen size
    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Size:";
    const sizeInput = document.createElement("input");
    sizeInput.type = "range";
    sizeInput.min = 1;
    sizeInput.max = 150;
    sizeInput.value = ctx.lineWidth;
    sizeInput.addEventListener("input", () => ctx.lineWidth = sizeInput.value);
    sizeLabel.appendChild(sizeInput);
    toolbar.appendChild(sizeLabel);

	const colorBtn = document.createElement("button");
colorBtn.textContent = "Color";
toolbar.appendChild(colorBtn);

    // Color picker button
    colorBtn.addEventListener("click", () => {
    // Create overlay/modal
    const pickerOverlay = createHexColorPickerModal(penColor);
    
    // Append to body so it’s visible
    document.body.appendChild(pickerOverlay);

    const modal = pickerOverlay.querySelector(".colorpicker-modal");

    // Position modal near the button
    const rect = colorBtn.getBoundingClientRect();
    modal.style.position = "absolute";
    modal.style.left = `${rect.left}px`;
    modal.style.top = `${rect.bottom + 4}px`;
    modal.style.zIndex = 1000; // make sure it’s on top

    // Update pen color when user picks
    pickerOverlay.addEventListener("colorpicked", e => {
        penColor = e.detail;
        ctx.strokeStyle = penColor;

        // remove modal after picking
        pickerOverlay.remove();
    });

    // Optional: live color change while dragging
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
