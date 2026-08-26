import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Captures an array of DOM element IDs and generates a multi-page A4 PDF file.
 */
export async function downloadCombinedFormsPdf(
  elementIds: string[],
  filename: string = "Account_Opening_Forms_A4.pdf"
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let isFirstPage = true;

  for (const id of elementIds) {
    const el = document.getElementById(id);
    if (!el) continue;

    // Render element to high-DPI canvas
    const canvas = await html2canvas(el, {
      scale: 2, // High resolution capture
      useCORS: true, // Support CORS image data URLs
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (!isFirstPage) {
      pdf.addPage("a4", "portrait");
    }

    // A4 dimensions: 210mm x 297mm
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    isFirstPage = false;
  }

  pdf.save(filename);
}

/**
 * Captures a single DOM element and downloads it as an A4 PDF.
 */
export async function downloadSingleFormPdf(
  elementId: string,
  filename: string = "Form_A4.pdf"
): Promise<void> {
  await downloadCombinedFormsPdf([elementId], filename);
}

/**
 * Triggers standard high-resolution browser printing for A4 PDF forms.
 */
export function printForms(): void {
  window.print();
}
