import { EmbeddingService } from "./embeddings";
import { MathProblem, VectorSearchResult, MathDocument } from "./types";
import Dexie from "dexie";

// Helper functions for metadata conversion
function problemToMetadata(
  problem: MathProblem
): Record<string, string | number | boolean> {
  return {
    id: problem.id,
    question: problem.question,
    topic: problem.topic,
    difficulty: problem.difficulty,
    solution_steps: JSON.stringify(problem.solution.steps),
    final_answer: problem.solution.finalAnswer,
    source: problem.metadata.source,
    vetted: problem.metadata.vetted,
    vetted_by: problem.metadata.vettedBy || "",
    date_added: problem.metadata.dateAdded,
    last_modified: problem.metadata.lastModified,
  };
}

function metadataToProblem(
  metadata: Record<string, string | number | boolean>
): MathProblem {
  return {
    id: String(metadata.id),
    question: String(metadata.question),
    topic: String(metadata.topic),
    difficulty: String(metadata.difficulty) as MathProblem["difficulty"],
    solution: {
      steps: JSON.parse(String(metadata.solution_steps)),
      finalAnswer: String(metadata.final_answer),
    },
    metadata: {
      source: String(metadata.source),
      vetted: Boolean(metadata.vetted),
      vettedBy: metadata.vetted_by ? String(metadata.vetted_by) : undefined,
      dateAdded: String(metadata.date_added),
      lastModified: String(metadata.last_modified),
    },
  };
}

function documentToMetadata(
  document: MathDocument
): Record<string, string | number | boolean> {
  return {
    id: document.id,
    content: document.content,
    type: document.metadata.type,
    title: document.metadata.title,
    subject: document.metadata.subject,
    level: document.metadata.level,
    year: document.metadata.year || 0,
    paper: document.metadata.paper || "",
    source: document.metadata.source,
    topic: document.metadata.topic || "",
    chapter: document.metadata.chapter || "",
    vetted: document.metadata.vetted,
    vetted_by: document.metadata.vettedBy || "",
    date_added: document.metadata.dateAdded,
    last_modified: document.metadata.lastModified,
  };
}

function metadataToDocument(
  metadata: Record<string, string | number | boolean>
): MathDocument {
  return {
    id: String(metadata.id),
    content: String(metadata.content),
    metadata: {
      type: String(metadata.type) as MathDocument["metadata"]["type"],
      title: String(metadata.title),
      subject: String(metadata.subject),
      level: String(metadata.level),
      year: metadata.year ? Number(metadata.year) : undefined,
      paper: metadata.paper ? String(metadata.paper) : undefined,
      source: String(metadata.source),
      topic: metadata.topic ? String(metadata.topic) : undefined,
      chapter: metadata.chapter ? String(metadata.chapter) : undefined,
      vetted: Boolean(metadata.vetted),
      vettedBy: metadata.vetted_by ? String(metadata.vetted_by) : undefined,
      dateAdded: String(metadata.date_added),
      lastModified: String(metadata.last_modified),
    },
  };
}

interface VectorRecord {
  id: string;
  embedding: number[];
  metadata: Record<string, string | number | boolean>;
}

interface SearchResult {
  document: MathDocument;
  similarity: number;
}

class VectorDatabase extends Dexie {
  problems!: Dexie.Table<VectorRecord, string>;
  documents!: Dexie.Table<VectorRecord, string>;

  constructor() {
    super("vectorStore");
    this.version(1).stores({
      problems: "id",
      documents: "id",
    });
  }
}

export class VectorStore {
  private db: VectorDatabase;
  private embeddingService: EmbeddingService;

  constructor() {
    this.db = new VectorDatabase();
    this.embeddingService = new EmbeddingService();
  }

  async initialize(): Promise<void> {
    try {
      await this.db.open();
      console.log("Vector database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector database:", error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async addProblem(problem: MathProblem): Promise<void> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        problem.question
      );
      const metadata = problemToMetadata(problem);

      await this.db.problems.put({
        id: problem.id,
        embedding,
        metadata,
      });
    } catch (error) {
      console.error("Failed to add problem:", error);
      throw error;
    }
  }

  async addDocument(document: MathDocument): Promise<void> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        document.content
      );
      const metadata = documentToMetadata(document);

      await this.db.documents.put({
        id: document.id,
        embedding,
        metadata,
      });
    } catch (error) {
      console.error("Failed to add document:", error);
      throw error;
    }
  }

  async findSimilarProblems(
    question: string,
    limit: number = 3
  ): Promise<VectorSearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        question
      );
      const allProblems = await this.db.problems.toArray();

      return allProblems
        .map((item: VectorRecord) => ({
          id: item.id,
          problem: metadataToProblem(item.metadata),
          similarity: this.cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .sort(
          (a: VectorSearchResult, b: VectorSearchResult) =>
            b.similarity - a.similarity
        )
        .slice(0, limit);
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
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        query
      );
      const allDocuments = await this.db.documents.toArray();

      return allDocuments
        .map((item: VectorRecord) => ({
          document: metadataToDocument(item.metadata),
          similarity: this.cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((item: SearchResult) => item.document);
    } catch (error) {
      console.error("Failed to find similar documents:", error);
      throw error;
    }
  }

  async updateProblem(problem: MathProblem): Promise<void> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        problem.question
      );
      const metadata = problemToMetadata(problem);

      await this.db.problems.put({
        id: problem.id,
        embedding,
        metadata,
      });
    } catch (error) {
      console.error("Failed to update problem:", error);
      throw error;
    }
  }

  async updateDocument(document: MathDocument): Promise<void> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(
        document.content
      );
      const metadata = documentToMetadata(document);

      await this.db.documents.put({
        id: document.id,
        embedding,
        metadata,
      });
    } catch (error) {
      console.error("Failed to update document:", error);
      throw error;
    }
  }

  async deleteProblem(id: string): Promise<void> {
    try {
      await this.db.problems.delete(id);
    } catch (error) {
      console.error("Failed to delete problem:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.db.documents.delete(id);
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  }
}
