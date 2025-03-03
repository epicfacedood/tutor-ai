import * as pdfjsLib from "pdfjs-dist";
import { DocumentType, DocumentMetadata, MathDocument } from "./types";

// Initialize PDF.js
const loadPdfWorker = async () => {
  if (typeof window === "undefined") return;

  try {
    const worker = await import("pdfjs-dist/build/pdf.worker.entry");
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  } catch (error) {
    console.error("Failed to load PDF.js worker:", error);
    // Fallback to CDN if local worker fails
    const PDFJS_VERSION = "3.11.174";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  }
};

// Load the worker
loadPdfWorker();

export class DocumentProcessor {
  constructor() {
    // No need for upload directory in browser environment
  }

  async processDocument(
    file: File,
    metadata: Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  ): Promise<MathDocument> {
    try {
      // Validate file type
      if (!file.type.includes("pdf")) {
        throw new Error("Invalid file type. Please upload a PDF file.");
      }

      // Ensure worker is loaded
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        await loadPdfWorker();
      }

      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => {
            if ("str" in item) {
              return item.str;
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        fullText += pageText + "\n";
      }

      // Process based on document type
      const document = await this.extractContent(fullText, metadata);
      return document;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to process document: ${errorMessage}`);
    }
  }

  private async extractContent(
    text: string,
    metadata: Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  ): Promise<MathDocument> {
    const now = new Date();
    const sections = await this.extractSections(text, metadata.type);

    return {
      id: `${metadata.type}_${Date.now()}`,
      content: text,
      metadata: {
        ...metadata,
        dateAdded: now,
        lastModified: now,
        vetted: false,
      },
      sections,
    };
  }

  private async extractSections(
    text: string,
    type: DocumentType
  ): Promise<MathDocument["sections"]> {
    const sections: MathDocument["sections"] = [];
    let matches: IterableIterator<RegExpMatchArray>;

    switch (type) {
      case "syllabus":
        // Extract syllabus sections (e.g., learning objectives, assessment criteria)
        matches = text.matchAll(
          /(\d+\.\s+[\w\s]+)\n([\s\S]*?)(?=\d+\.\s+[\w\s]+\n|$)/g
        );
        for (const match of matches) {
          sections.push({
            title: match[1].trim(),
            content: match[2].trim(),
            pageNumber: this.estimatePageNumber(match[0], text),
          });
        }
        break;

      case "notes":
        // Extract lecture notes sections (e.g., chapters, topics)
        matches = text.matchAll(
          /(?:Chapter|Topic)\s+(\d+[.:]\s*[\w\s]+)\n([\s\S]*?)(?=(?:Chapter|Topic)\s+\d+[.:]\s*[\w\s]+\n|$)/g
        );
        for (const match of matches) {
          sections.push({
            title: match[1].trim(),
            content: match[2].trim(),
            pageNumber: this.estimatePageNumber(match[0], text),
          });
        }
        break;

      case "worksheet":
        // Extract worksheet sections (e.g., exercises, problems)
        matches = text.matchAll(
          /(Exercise|Problem)\s+(\d+)[.:]\s*([\s\S]*?)(?=(?:Exercise|Problem)\s+\d+[.:]\s*|$)/g
        );
        for (const match of matches) {
          sections.push({
            title: `${match[1]} ${match[2]}`,
            content: match[3].trim(),
            pageNumber: this.estimatePageNumber(match[0], text),
          });
        }
        break;

      default:
        // For other types, try to find general sections by headers
        matches = text.matchAll(
          /(?:^|\n)(\d+\.\s+[\w\s]+|[A-Z][\w\s]+:)\n([\s\S]*?)(?=(?:^|\n)(?:\d+\.\s+[\w\s]+|[A-Z][\w\s]+:)\n|$)/g
        );
        for (const match of matches) {
          sections.push({
            title: match[1].trim(),
            content: match[2].trim(),
            pageNumber: this.estimatePageNumber(match[0], text),
          });
        }
    }

    return sections;
  }

  private estimatePageNumber(content: string, fullText: string): number {
    // Simple page number estimation based on content position
    const contentStart = fullText.indexOf(content);
    const textBefore = fullText.slice(0, contentStart);
    const newlineCount = (textBefore.match(/\n/g) || []).length;

    // Assuming average of 40 lines per page
    return Math.floor(newlineCount / 40) + 1;
  }
}
