import { DocumentProcessor } from "./documentProcessor";
import { PDFProcessor } from "./pdfProcessor";
import { VectorStore } from "./vectorStore";
import { UploadedFile, DocumentMetadata } from "./types";
import * as fs from "fs";

export class DocumentUploadHandler {
  private documentProcessor: DocumentProcessor;
  private pdfProcessor: PDFProcessor;
  private vectorStore: VectorStore;

  constructor(uploadDir: string, vectorStore: VectorStore) {
    this.documentProcessor = new DocumentProcessor(uploadDir);
    this.pdfProcessor = new PDFProcessor(uploadDir);
    this.vectorStore = vectorStore;
  }

  async handleDocumentUpload(
    files: {
      document: UploadedFile;
      solution?: UploadedFile;
    },
    metadata: Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  ): Promise<{ processed: number; errors: string[] }> {
    try {
      const errors: string[] = [];
      let processedCount = 0;

      if (metadata.type === "exam") {
        // Handle exam papers with solutions
        if (!files.solution) {
          throw new Error("Solution file is required for exam papers");
        }

        const result = await this.handleExamUpload(
          files.document,
          files.solution,
          {
            year: metadata.year!,
            subject: metadata.subject,
            level: metadata.level,
            paper: metadata.paper!,
            source: metadata.source,
          }
        );

        return result;
      } else {
        // Handle other document types
        const document = await this.documentProcessor.processDocument(
          files.document,
          metadata
        );

        // Add each section to the vector store
        if (document.sections) {
          for (const section of document.sections) {
            try {
              await this.vectorStore.addDocument({
                id: `${document.id}_section_${section.pageNumber}`,
                content: section.content,
                metadata: {
                  ...document.metadata,
                  title: `${document.metadata.title} - ${section.title}`,
                },
              });
              processedCount++;
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              errors.push(
                `Failed to process section "${section.title}": ${errorMessage}`
              );
            }
          }
        } else {
          // Add the entire document if no sections were found
          try {
            await this.vectorStore.addDocument(document);
            processedCount++;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push(`Failed to process document: ${errorMessage}`);
          }
        }

        return {
          processed: processedCount,
          errors,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to process document upload: ${errorMessage}`);
    }
  }

  private async handleExamUpload(
    paperFile: UploadedFile,
    solutionFile: UploadedFile,
    metadata: {
      year: number;
      subject: string;
      level: string;
      paper: string;
      source: string;
    }
  ) {
    // Save PDF files
    const paperPath = await this.pdfProcessor.savePDF(paperFile, "paper");
    const solutionPath = await this.pdfProcessor.savePDF(
      solutionFile,
      "solution"
    );

    try {
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
          errors.push(
            `Failed to process question ${problem.id}: ${errorMessage}`
          );
        }
      }

      return {
        processed: processedCount,
        errors,
      };
    } finally {
      // Clean up uploaded files
      await this.cleanupFiles(paperPath, solutionPath);
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
