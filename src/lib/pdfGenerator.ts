/**
 * Unified High-Fidelity 1:1 Print & PDF Engine
 * Routes all document downloads and print actions directly to the native browser
 * vector print/save stream, completely discarding html2canvas raster routines
 * to guarantee 100% 1:1 page-for-page fidelity with zero box shifting, overlapping text, or cut logos.
 */

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
      (elementId === "ack-slip-print" || elementId === "customer-receipt-print"
        ? document.getElementById("ack-slip-print") ||
          document.getElementById("customer-receipt-print") ||
          (document.querySelector(".ack-slip-print") as HTMLElement) ||
          (document.querySelector(".customer-receipt-container") as HTMLElement)
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
 * High-Fidelity Native Browser Print/Save Stream.
 * Injects DOM into an isolated iframe with exact page-break rules, CSS resets,
 * and high-resolution color/font reproduction.
 */
export async function printElement1to1(
  elementId: string,
  options: PrintOptions = {}
): Promise<void> {
  const printContent = await findElementWithRetry(elementId);
  if (!printContent) {
    throw new Error(`Print target element '${elementId}' not found in DOM.`);
  }

  const isReceipt = elementId.includes("ack") || elementId.includes("receipt");
  const pageSize = options.pageSize || (isReceipt ? "A5" : "A4");
  const orientation = options.orientation || (isReceipt ? "landscape" : "portrait");
  const margins = options.margins || (pageSize === "A4" ? "6mm" : "5mm");
  const docTitle = options.title || (isReceipt ? "Customer_Receipt" : "Official_A4_Bank_Forms_Bundle");

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
      .customer-receipt-container, .ack-slip-print {
        width: 100% !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin: 0 auto !important;
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
        }, 300);
      });
    };

    iframe.onload = trigger;
    setTimeout(trigger, 600);
  });
}

/**
 * Route bundle downloads to high-fidelity native print/save stream.
 */
export async function downloadCombinedFormsPdf(
  _elementIds: string[] = ["bank-forms-bundle"],
  filename: string = "Official_A4_Forms_Bundle.pdf"
): Promise<void> {
  return printElement1to1("bank-forms-bundle", {
    pageSize: "A4",
    orientation: "portrait",
    margins: "6mm",
    title: filename.replace(/\.pdf$/i, ""),
  });
}

/**
 * Route single form / receipt downloads to high-fidelity native print/save stream.
 */
export async function downloadSingleFormPdf(
  elementId: string,
  filename: string = "Customer_Document.pdf"
): Promise<void> {
  const isReceipt = elementId.includes("ack") || elementId.includes("receipt");
  return printElement1to1(elementId, {
    pageSize: isReceipt ? "A5" : "A4",
    orientation: isReceipt ? "landscape" : "portrait",
    margins: isReceipt ? "5mm" : "6mm",
    title: filename.replace(/\.pdf$/i, ""),
  });
}

/**
 * Direct print trigger.
 */
export function printForms(): void {
  window.print();
}
