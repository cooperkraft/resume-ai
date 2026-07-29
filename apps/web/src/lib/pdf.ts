import type { TextItem } from "pdfjs-dist/types/src/display/api";

let initialized = false;

async function initPdfJs() {
  if (initialized) return;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  initialized = true;
}

export async function extractPdfText(file: File): Promise<string> {
  await initPdfJs();
  const pdfjs = await import("pdfjs-dist");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n").trim();
}
