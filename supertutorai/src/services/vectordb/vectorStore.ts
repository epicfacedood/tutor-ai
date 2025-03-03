import { MathProblem, MathDocument, DocumentType, Difficulty } from "./types";
import vectorDBClient from "./apiClient";
import { ApiDocument, ApiProblem } from "./apiTypes";

// Define a custom interface for our search results
interface ProblemSearchResult {
  id: string;
  problem: MathProblem;
  similarity: number;
}

export class VectorStore {
  private initialized = false;

  constructor() {}

  async initialize(): Promise<void> {
    try {
      // Check if the vector database service is running
      await vectorDBClient.checkStatus();
      this.initialized = true;
      console.log("Vector database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector database:", error);
      throw error;
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async addProblem(problem: MathProblem): Promise<void> {
    try {
      await this.ensureInitialized();

      // Convert to API format
      const apiProblem: ApiProblem = {
        id: problem.id,
        question: problem.question,
        topic: problem.metadata.topic,
        difficulty: problem.metadata.difficulty,
        solution: JSON.stringify(problem.solution),
        metadata: {
          type: problem.metadata.type,
          title: problem.metadata.title,
          subject: problem.metadata.subject,
          level: problem.metadata.level,
          topic: problem.metadata.topic,
          difficulty: problem.metadata.difficulty,
          source: problem.metadata.source,
          year: problem.metadata.year,
          dateAdded: problem.metadata.dateAdded.toISOString(),
          lastModified: problem.metadata.lastModified.toISOString(),
          vetted: problem.metadata.vetted,
          vettedBy: problem.metadata.vettedBy || "",
        },
      };

      await vectorDBClient.addProblem(apiProblem);
    } catch (error) {
      console.error("Failed to add problem:", error);
      throw error;
    }
  }

  async addDocument(document: MathDocument): Promise<void> {
    try {
      await this.ensureInitialized();

      // Convert to API format
      const apiDocument: ApiDocument = {
        id: document.id,
        content: document.content,
        sections: document.sections,
        metadata: {
          type: document.metadata.type,
          title: document.metadata.title,
          subject: document.metadata.subject,
          level: document.metadata.level,
          topic: document.metadata.topic,
          subtopic: document.metadata.subtopic || "",
          difficulty: document.metadata.difficulty,
          source: document.metadata.source,
          year: document.metadata.year,
          paper: document.metadata.paper || "",
          chapter: document.metadata.chapter || "",
          dateAdded: document.metadata.dateAdded.toISOString(),
          lastModified: document.metadata.lastModified.toISOString(),
          vetted: document.metadata.vetted,
          vettedBy: document.metadata.vettedBy || "",
        },
      };

      await vectorDBClient.addDocument(apiDocument);
    } catch (error) {
      console.error("Failed to add document:", error);
      throw error;
    }
  }

  async findSimilarProblems(
    question: string,
    limit: number = 3
  ): Promise<ProblemSearchResult[]> {
    try {
      await this.ensureInitialized();

      const filter = { type: "problem" };
      const results = await vectorDBClient.querySimilarDocuments(
        question,
        filter,
        limit
      );

      return results.map((result) => {
        // Parse the solution from string to object
        const solutionObj =
          typeof result.metadata.solution === "string"
            ? JSON.parse(result.metadata.solution)
            : result.metadata.solution;

        return {
          id: result.id,
          problem: {
            id: result.id,
            question: result.metadata.question as string,
            metadata: {
              type: (result.metadata.type as DocumentType) || "exam",
              title: (result.metadata.title as string) || "",
              subject: (result.metadata.subject as string) || "",
              level: (result.metadata.level as string) || "",
              topic: (result.metadata.topic as string) || "",
              difficulty:
                (result.metadata.difficulty as Difficulty) || "medium",
              source: (result.metadata.source as string) || "",
              year: Number(result.metadata.year || 0),
              dateAdded: new Date(
                (result.metadata.dateAdded as string) ||
                  new Date().toISOString()
              ),
              lastModified: new Date(
                (result.metadata.lastModified as string) ||
                  new Date().toISOString()
              ),
              vetted: Boolean(result.metadata.vetted),
              vettedBy: (result.metadata.vettedBy as string) || "",
            },
            solution: solutionObj,
          },
          similarity: 1 - (result.distance || 0), // Convert distance to similarity
        };
      });
    } catch (error) {
      console.error("Failed to find similar problems:", error);
      throw error;
    }
  }

  async findSimilarDocuments(
    query: string,
    limit: number = 3
  ): Promise<MathDocument[]> {
    try {
      await this.ensureInitialized();

      // Exclude problems from the search using a string-based filter
      const filter = { type: "exam" }; // Only search for exam documents
      const results = await vectorDBClient.querySimilarDocuments(
        query,
        filter,
        limit
      );

      return results.map((result) => ({
        id: result.id,
        content: result.content,
        metadata: {
          type: (result.metadata.type as DocumentType) || "exam",
          title: (result.metadata.title as string) || "",
          subject: (result.metadata.subject as string) || "",
          level: (result.metadata.level as string) || "",
          topic: (result.metadata.topic as string) || "",
          subtopic: (result.metadata.subtopic as string) || "",
          difficulty: (result.metadata.difficulty as Difficulty) || "medium",
          source: (result.metadata.source as string) || "",
          year: Number(result.metadata.year || 0),
          paper: (result.metadata.paper as string) || "",
          chapter: (result.metadata.chapter as string) || "",
          dateAdded: new Date(
            (result.metadata.dateAdded as string) || new Date().toISOString()
          ),
          lastModified: new Date(
            (result.metadata.lastModified as string) || new Date().toISOString()
          ),
          vetted: Boolean(result.metadata.vetted),
          vettedBy: (result.metadata.vettedBy as string) || "",
        },
      }));
    } catch (error) {
      console.error("Failed to find similar documents:", error);
      throw error;
    }
  }

  async updateProblem(problem: MathProblem): Promise<void> {
    try {
      await this.ensureInitialized();

      // First get the existing document to preserve any fields
      const existingDoc = await vectorDBClient.getDocument(problem.id);

      // Create updated document with proper date formatting
      const updatedDoc: ApiDocument = {
        ...existingDoc,
        content: problem.question,
        metadata: {
          ...existingDoc.metadata,
          question: problem.question,
          lastModified: new Date().toISOString(),
        },
      };

      await vectorDBClient.updateDocument(problem.id, updatedDoc);
    } catch (error) {
      console.error("Failed to update problem:", error);
      throw error;
    }
  }

  async updateDocument(document: MathDocument): Promise<void> {
    try {
      await this.ensureInitialized();

      // Convert Date objects to ISO strings for API
      const apiDocument: ApiDocument = {
        id: document.id,
        content: document.content,
        sections: document.sections,
        metadata: {
          type: document.metadata.type,
          title: document.metadata.title,
          subject: document.metadata.subject,
          level: document.metadata.level,
          topic: document.metadata.topic,
          subtopic: document.metadata.subtopic || "",
          difficulty: document.metadata.difficulty,
          source: document.metadata.source,
          year: document.metadata.year,
          paper: document.metadata.paper || "",
          chapter: document.metadata.chapter || "",
          dateAdded: document.metadata.dateAdded.toISOString(),
          lastModified: new Date().toISOString(),
          vetted: document.metadata.vetted,
          vettedBy: document.metadata.vettedBy || "",
        },
      };

      await vectorDBClient.updateDocument(document.id, apiDocument);
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await vectorDBClient.deleteDocument(id);
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  }
}
