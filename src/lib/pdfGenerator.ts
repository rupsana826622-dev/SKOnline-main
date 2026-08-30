/**
 * Unified High-Fidelity 1:1 Print & PDF Engine
 * Provides separated direct offline PDF download via jsPDF + html2canvas
 * and high-fidelity native print streams via iframe/window.print.
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PrintOptions {
  pageSize?: "A4" | "A5";
  orientation?: "portrait" | "landscape";
  margins?: string;
  title?: string;
}

/**
 * Safely locates an element in the DOM, with retry for asynchronous React mounting.
 */
async function findElementWithRetry(elementId: string, maxWaitMs = 1200): Promise<HTMLElement | null> {
  const startTime = Date.now();
  
  const getEl = () => {
    return (
      document.getElementById(elementId) ||
      (elementId === "bank-forms-bundle" || elementId === "a4-print-bundle"
        ? document.getElementById("bank-forms-bundle") || document.getElementById("a4-print-bundle")
        : null) ||
      (elementId === "ack-slip-print"
        ? document.getElementById("ack-slip-print") || (document.querySelector(".ack-slip-print") as HTMLElement)
        : null) ||
      (document.querySelector(`[data-print-id='${elementId}']`) as HTMLElement)
    );
  };

  let el = getEl();
  if (el) return el;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 50));
    el = getEl();
    if (el) return el;
  }

  return null;
}

/**
 * Direct file download for multi-page official A4 bank forms bundle.
 */
export async function downloadCombinedFormsPdf(
  _elementIds: string[] = ["bank-forms-bundle"],
  filename: string = "Official_A4_Forms_Bundle.pdf"
): Promise<void> {
  const container = await findElementWithRetry("bank-forms-bundle");
  if (!container) {
    throw new Error("Forms bundle container not found in DOM.");
  }

  const pageElements = Array.from(
    container.querySelectorAll<HTMLElement>(".a4-page, .a4-page-container")
  );

  const targets = pageElements.length > 0 ? pageElements : [container];

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  for (let i = 0; i < targets.length; i++) {
    const pageEl = targets[i];
    
    const canvas = await html2canvas(pageEl, {
      scale: 2, // High resolution (300 DPI equivalent)
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedPages = clonedDoc.querySelectorAll<HTMLElement>(".a4-page, .a4-page-container");
        if (clonedPages.length > 0) {
          clonedPages.forEach((p, idx) => {
            if (idx === i) {
              p.style.display = "block";
              p.style.position = "static";
              p.style.visibility = "visible";
              p.style.opacity = "1";
              p.style.margin = "0 auto";
              p.style.boxShadow = "none";
              p.style.border = "none";
            } else {
              p.style.display = "none";
            }
          });
        }

        const bundle = clonedDoc.getElementById("bank-forms-bundle") || clonedDoc.querySelector("[data-print-id='bank-forms-bundle']");
        if (bundle) {
          (bundle as HTMLElement).style.position = "static";
          (bundle as HTMLElement).style.opacity = "1";
          (bundle as HTMLElement).style.left = "0";
          (bundle as HTMLElement).style.visibility = "visible";
          (bundle as HTMLElement).style.width = "794px";
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (i > 0) {
      pdf.addPage("a4", "portrait");
    }

    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
}

/**
 * Direct file download for single form or customer receipt.
 */
export async function downloadSingleFormPdf(
  elementId: string,
  filename: string = "Customer_Document.pdf"
): Promise<void> {
  const target = await findElementWithRetry(elementId);
  if (!target) {
    throw new Error(`Target document '${elementId}' not found.`);
  }

  const isReceipt = elementId.includes("ack") || elementId.includes("receipt");
  const pageSize = isReceipt ? "a5" : "a4";
  const orientation = isReceipt ? "landscape" : "portrait";
  const pdfWidth = isReceipt ? 210 : 210;
  const pdfHeight = isReceipt ? 148 : 297;

  const pdf = new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: pageSize,
    compress: true,
  });

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: "#ffffff",
    windowWidth: 794,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const el = clonedDoc.getElementById(elementId) || (clonedDoc.querySelector(".ack-slip-print") as HTMLElement) || (clonedDoc.querySelector(".customer-receipt-container") as HTMLElement);
      if (el) {
        let parent = el.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.position = "static";
          parent.style.opacity = "1";
          parent.style.left = "0";
          parent.style.visibility = "visible";
          parent.style.width = "794px";
          parent = parent.parentElement;
        }
        el.style.display = "flex";
        el.style.position = "static";
        el.style.opacity = "1";
        el.style.visibility = "visible";
      }
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
}

/**
 * Native Browser Print Stream (window.print / iframe print preview).
 */
export async function printElement1to1(
  elementId: string,
  options: PrintOptions = {}
): Promise<void> {
  const printContent = await findElementWithRetry(elementId);
  if (!printContent) {
    throw new Error(`Print target element '${elementId}' not found in DOM.`);
  }

  const pageSize = options.pageSize || "A4";
  const orientation = options.orientation || "portrait";
  const margins = options.margins || (pageSize === "A4" ? "6mm" : "8mm");
  const docTitle = options.title || "SK_Online_Bank_Document";

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.zIndex = "-1";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      reject(new Error("Unable to create iframe document context."));
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margins};
    }
    @media print {
      html, body {
        width: 100%;
        height: 100%;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .a4-page, .a4-page-container {
        width: 100% !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: none !important;
      }
      .a4-page:last-child, .a4-page-container:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .no-print {
        display: none !important;
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fff;
      margin: 0;
      padding: 0;
    }
  </style>
`);

    Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).forEach(styleEl => {
      doc.write(styleEl.outerHTML);
    });

    doc.write(`</head><body><div class="print-area">${printContent.innerHTML}</div></body></html>`);
    doc.close();

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve();
          } catch (e) {
            console.error("Iframe print execution error:", e);
            reject(e);
          } finally {
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
            }, 1500);
          }
        }, 350);
      });
    };

    iframe.onload = trigger;
    setTimeout(trigger, 700);
  });
}

/**
 * Direct print trigger.
 */
export function printForms(): void {
  window.print();
}
