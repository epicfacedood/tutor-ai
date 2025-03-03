import { PDFProcessor } from "./pdfProcessor";
import { VectorStore } from "./vectorStore";
import * as fs from "fs";

// Define a minimal interface for the file object we need
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
}

export class UploadHandler {
  private pdfProcessor: PDFProcessor;
  private vectorStore: VectorStore;

  constructor(uploadDir: string, vectorStore: VectorStore) {
    this.pdfProcessor = new PDFProcessor(uploadDir);
    this.vectorStore = vectorStore;
  }

  async handlePDFUpload(
    paperFile: UploadedFile,
    solutionFile: UploadedFile,
    metadata: {
      year: number;
      subject: string;
      level: string;
      paper: string;
      source: string;
    }
  ): Promise<{ processed: number; errors: string[] }> {
    try {
      // Save PDF files
      const paperPath = await this.pdfProcessor.savePDF(paperFile, "paper");
      const solutionPath = await this.pdfProcessor.savePDF(
        solutionFile,
        "solution"
      );

      // Process PDFs and extract problems
      const problems = await this.pdfProcessor.processPDFPair({
        paperPath,
        solutionPath,
        metadata,
      });

      // Add each problem to the vector store
      const errors: string[] = [];
      let processedCount = 0;

      for (const problem of problems) {
        try {
          await this.vectorStore.addProblem(problem);
          processedCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`Failed to add problem ${problem.id}:`, errorMessage);
          errors.push(
            `Failed to process question ${problem.id}: ${errorMessage}`
          );
        }
      }

      // Clean up uploaded files
      await this.cleanupFiles(paperPath, solutionPath);

      return {
        processed: processedCount,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error handling PDF upload:", errorMessage);
      throw new Error(`Failed to process PDF files: ${errorMessage}`);
    }
  }

  private async cleanupFiles(...filePaths: string[]) {
    for (const filepath of filePaths) {
      try {
        await fs.promises.unlink(filepath);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Failed to delete file ${filepath}:`, errorMessage);
      }
    }
  }
}
