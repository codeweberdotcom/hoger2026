document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hoger-download-pdf");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const root   = document.getElementById("hoger-configurator");
    const canvas = root ? root.querySelector("canvas[data-configurator]") : null;
    if (!canvas || !canvas.captureRender) return;

    const origText  = btn.textContent;
    btn.disabled    = true;
    btn.textContent = "...";

    try {
      const modelTitle = btn.getAttribute("data-model-title") || "";
      const config     = canvas.getActiveConfig();
      const imgData    = canvas.captureRender(3);

      const now     = new Date();
      const pad     = (n) => String(n).padStart(2, "0");
      const dateStr = pad(now.getDate()) + "." + pad(now.getMonth() + 1) + "." + now.getFullYear();

      const content = [
        { image: imgData, width: 515, margin: [0, 0, 0, 20] },
      ];

      if (modelTitle) {
        content.push({ text: modelTitle, style: "title" });
      }
      if (config.surfaceTitle) {
        content.push({ text: "Surface: " + config.surfaceTitle, style: "info" });
      }
      if (config.colorName) {
        content.push({ text: "Color: " + config.colorName, style: "info" });
      }

      const docDef = {
        content,
        styles: {
          title: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          info:  { fontSize: 13, margin: [0, 0, 0, 5], color: "#333333" },
        },
        defaultStyle: { font: "Roboto" },
        footer: () => ({
          text: dateStr,
          fontSize: 9,
          color: "#999999",
          margin: [40, 10, 0, 0],
        }),
      };

      const slug = modelTitle.toLowerCase().replace(/\s+/g, "-") || "model";
      pdfMake.createPdf(docDef).download(slug + "-configuration.pdf");
    } finally {
      btn.disabled    = false;
      btn.textContent = origText;
    }
  });
});
