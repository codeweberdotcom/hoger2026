document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hoger-download-pdf");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const root   = document.getElementById("hoger-configurator");
    const canvas = root ? root.querySelector("canvas[data-configurator]") : null;
    if (!canvas || !canvas.captureRender) return;

    const modelTitle  = btn.getAttribute("data-model-title") || "";
    const config      = canvas.getActiveConfig();
    const imgData     = canvas.captureRender();

    /* jsPDF is loaded globally from CDN */
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 20;
    const inner  = pageW - margin * 2;

    /* Image: preserve canvas aspect ratio, fit within inner width */
    const canvasW   = canvas.width  || canvas.offsetWidth  || 600;
    const canvasH   = canvas.height || canvas.offsetHeight || 600;
    const imgH      = Math.round(inner * (canvasH / canvasW));
    doc.addImage(imgData, "PNG", margin, margin, inner, imgH);

    /* Text block below image */
    const textY = margin + imgH + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(modelTitle, margin, textY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    let y = textY + 8;

    if (config.surfaceTitle) {
      doc.text("Surface: " + config.surfaceTitle, margin, y);
      y += 7;
    }
    if (config.colorName) {
      doc.text("Color: " + config.colorName, margin, y);
      y += 7;
    }

    /* Date */
    const now    = new Date();
    const pad    = (n) => String(n).padStart(2, "0");
    const dateStr = pad(now.getDate()) + "." + pad(now.getMonth() + 1) + "." + now.getFullYear();
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(dateStr, margin, pageH - margin);

    const slug = modelTitle.toLowerCase().replace(/\s+/g, "-") || "model";
    doc.save(slug + "-configuration.pdf");
  });
});
