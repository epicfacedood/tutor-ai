export type DocumentType = "exam" | "syllabus" | "notes" | "worksheet";

export type Difficulty = "easy" | "medium" | "hard";

export interface DocumentMetadata {
  type: DocumentType;
  title: string;
  subject: string;
  level: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  source: string;
  year: number;
  paper?: string;
  chapter?: string;
  dateAdded: Date;
  lastModified: Date;
  vetted: boolean;
  vettedBy?: string;
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
}

export interface MathDocument {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  sections?: Array<{
    title: string;
    content: string;
    pageNumber: number;
  }>;
}

export interface MathProblem {
  id: string;
  question: string;
  solution?: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

export interface VectorSearchResult<T> {
  document: T;
  score: number;
}

export type EmbeddingVector = number[];

export interface VectorDBConfig {
  path: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dot";
}
