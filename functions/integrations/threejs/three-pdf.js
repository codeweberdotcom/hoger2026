document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hoger-download-pdf");
  if (!btn) return;

  /* Render a text string to a PNG data URL using the browser's canvas (supports any charset) */
  function textImg(text, { fontSize = 14, fontWeight = "normal", color = "#000000", font = "Inter, sans-serif" } = {}) {
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    ctx.font = `${fontWeight} ${fontSize}px ${font}`;
    const w = Math.ceil(ctx.measureText(text).width) + 4;
    const h = Math.ceil(fontSize * 1.6);
    tmp.width  = w;
    tmp.height = h;
    ctx.font          = `${fontWeight} ${fontSize}px ${font}`;
    ctx.fillStyle     = color;
    ctx.textBaseline  = "middle";
    ctx.fillText(text, 2, h / 2);
    return { dataUrl: tmp.toDataURL("image/png"), w, h };
  }

  btn.addEventListener("click", () => {
    const root   = document.getElementById("hoger-configurator");
    const canvas = root ? root.querySelector("canvas[data-configurator]") : null;
    if (!canvas || !canvas.captureRender) return;

    const modelTitle = btn.getAttribute("data-model-title") || "";
    const config     = canvas.getActiveConfig();
    const imgData    = canvas.captureRender();

    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 30;
    const inner  = pageW - margin * 2;

    /* Model render image */
    const canvasW = canvas.width  || canvas.offsetWidth  || 600;
    const canvasH = canvas.height || canvas.offsetHeight || 600;
    const imgH    = Math.round(inner * (canvasH / canvasW));
    doc.addImage(imgData, "PNG", margin, margin, inner, imgH);

    /* Text lines using browser canvas for Cyrillic support */
    let y = margin + imgH + 20;

    if (modelTitle) {
      const t = textImg(modelTitle, { fontSize: 22, fontWeight: "bold" });
      const tw = t.w * (inner / Math.max(t.w, inner));
      const th = t.h * (tw / t.w);
      doc.addImage(t.dataUrl, "PNG", margin, y, tw, th);
      y += th + 10;
    }

    if (config.surfaceTitle) {
      const t = textImg("Surface: " + config.surfaceTitle, { fontSize: 14 });
      const tw = Math.min(t.w, inner);
      doc.addImage(t.dataUrl, "PNG", margin, y, tw, t.h * (tw / t.w));
      y += t.h + 6;
    }

    if (config.colorName) {
      const t = textImg("Color: " + config.colorName, { fontSize: 14 });
      const tw = Math.min(t.w, inner);
      doc.addImage(t.dataUrl, "PNG", margin, y, tw, t.h * (tw / t.w));
    }

    /* Date — bottom left */
    const now    = new Date();
    const pad    = (n) => String(n).padStart(2, "0");
    const dateStr = pad(now.getDate()) + "." + pad(now.getMonth() + 1) + "." + now.getFullYear();
    const dt = textImg(dateStr, { fontSize: 11, color: "#999999" });
    doc.addImage(dt.dataUrl, "PNG", margin, pageH - margin - dt.h, dt.w, dt.h);

    const slug = modelTitle.toLowerCase().replace(/\s+/g, "-") || "model";
    doc.save(slug + "-configuration.pdf");
  });
});
