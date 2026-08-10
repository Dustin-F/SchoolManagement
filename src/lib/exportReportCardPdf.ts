import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const PDF_MARGIN_MM = 12;
/** A4 width at 96dpi — matches html2canvas layout width */
const CONTENT_WIDTH_PX = 794;
const BLOCK_GAP_PX = 32;
const PAGE_PADDING_X_PX = 32;
const PAGE_PADDING_Y_PX = 24;

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function reportCardPdfFilename(studentName: string, termLabel: string): string {
  return `Report-card-${sanitizeFilenamePart(studentName)}-${sanitizeFilenamePart(termLabel)}.pdf`;
}

function prepareReportCardClone(sourceElement: HTMLElement): HTMLElement {
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(".no-print, .report-card-screen-only, .report-card-running")
    .forEach((node) => node.remove());

  clone.querySelectorAll(".truncate").forEach((node) => node.classList.remove("truncate"));

  clone.querySelectorAll("details").forEach((details) => {
    const summary = details.querySelector("summary");
    if (summary) {
      const label = summary.textContent?.trim();
      summary.remove();
      if (label) {
        const heading = document.createElement("p");
        heading.className = "mb-2 text-xs font-medium text-muted-foreground";
        heading.textContent = label;
        details.insertBefore(heading, details.firstChild);
      }
    }
    details.setAttribute("open", "");
  });

  return clone;
}

function maxPageContentHeightPx(printableHeightMm: number, printableWidthMm: number): number {
  return (printableHeightMm * CONTENT_WIDTH_PX) / printableWidthMm;
}

function measureBlocks(blocks: HTMLElement[]): number[] {
  return blocks.map((block) => block.getBoundingClientRect().height);
}

/** Pack blocks onto pages without splitting individual blocks. */
function packBlocksIntoPages(
  blocks: HTMLElement[],
  heights: number[],
  maxPageHeightPx: number
): HTMLElement[][] {
  const pages: HTMLElement[][] = [];
  let currentPage: HTMLElement[] = [];
  let currentHeight = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const blockHeight = heights[i];
    const gap = currentPage.length > 0 ? BLOCK_GAP_PX : 0;
    const nextHeight = currentHeight + gap + blockHeight;

    if (currentPage.length > 0 && nextHeight > maxPageHeightPx) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeight = blockHeight;
    } else {
      currentPage.push(block);
      currentHeight = nextHeight;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

async function renderPageBlocks(
  blocks: HTMLElement[],
  scale: number
): Promise<HTMLCanvasElement> {
  const pageWrapper = document.createElement("div");
  pageWrapper.className = "report-card-pdf-export report-card-pdf-page";
  pageWrapper.setAttribute("aria-hidden", "true");
  pageWrapper.style.width = `${CONTENT_WIDTH_PX}px`;
  pageWrapper.style.display = "flex";
  pageWrapper.style.flexDirection = "column";
  pageWrapper.style.gap = `${BLOCK_GAP_PX}px`;
  pageWrapper.style.padding = `${PAGE_PADDING_Y_PX}px ${PAGE_PADDING_X_PX}px`;
  pageWrapper.style.background = "#ffffff";

  for (const block of blocks) {
    pageWrapper.appendChild(block.cloneNode(true));
  }

  document.body.appendChild(pageWrapper);

  try {
    return await html2canvas(pageWrapper, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: CONTENT_WIDTH_PX,
      onclone: (clonedDoc) => {
        const exportRoot = clonedDoc.querySelector(".report-card-pdf-export");
        if (exportRoot instanceof HTMLElement) {
          exportRoot.style.background = "#ffffff";
          exportRoot.style.color = "#0f172a";
        }
      },
    });
  } finally {
    document.body.removeChild(pageWrapper);
  }
}

function addCanvasToPdfPage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  printableWidthMm: number,
  printableHeightMm: number,
  marginMm: number
): void {
  let imgWidth = printableWidthMm;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > printableHeightMm) {
    const fitScale = printableHeightMm / imgHeight;
    imgWidth *= fitScale;
    imgHeight = printableHeightMm;
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const x = (pageWidth - imgWidth) / 2;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", x, marginMm, imgWidth, imgHeight);
}

/**
 * Renders a report-card DOM node to a multi-page A4 PDF with a fixed light theme.
 * Each logical block stays together — no mid-section page cuts.
 */
export async function exportReportCardPdf(
  sourceElement: HTMLElement,
  filename: string
): Promise<void> {
  const clone = prepareReportCardClone(sourceElement);

  const measureWrapper = document.createElement("div");
  measureWrapper.className = "report-card-pdf-export";
  measureWrapper.setAttribute("aria-hidden", "true");
    measureWrapper.style.width = `${CONTENT_WIDTH_PX}px`;
    measureWrapper.style.position = "fixed";
    measureWrapper.style.left = "-10000px";
    measureWrapper.style.top = "0";
    measureWrapper.style.padding = `0 ${PAGE_PADDING_X_PX}px ${PAGE_PADDING_Y_PX}px`;
    measureWrapper.appendChild(clone);
  document.body.appendChild(measureWrapper);

  try {
    const blocks = Array.from(
      clone.querySelectorAll<HTMLElement>(".report-card-pdf-block")
    );
    if (blocks.length === 0) {
      throw new Error("Report card has no exportable sections.");
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const printableWidthMm = pdf.internal.pageSize.getWidth() - PDF_MARGIN_MM * 2;
    const printableHeightMm = pdf.internal.pageSize.getHeight() - PDF_MARGIN_MM * 2;
    const maxPageHeightPx = maxPageContentHeightPx(printableHeightMm, printableWidthMm);
    const maxBlocksHeightPx = maxPageHeightPx - PAGE_PADDING_Y_PX * 2;

    const heights = measureBlocks(blocks);
    const pageGroups = packBlocksIntoPages(blocks, heights, maxBlocksHeightPx);

    for (let i = 0; i < pageGroups.length; i += 1) {
      if (i > 0) pdf.addPage();
      const canvas = await renderPageBlocks(pageGroups[i], 2);
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("PDF export produced an empty canvas.");
      }
      addCanvasToPdfPage(pdf, canvas, printableWidthMm, printableHeightMm, PDF_MARGIN_MM);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(measureWrapper);
  }
}
