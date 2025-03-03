/**
 * Types for API communication with the vector database
 */

export interface ApiMetadata {
  type: string;
  title?: string;
  subject?: string;
  level?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  source?: string;
  year?: number;
  paper?: string;
  chapter?: string;
  dateAdded: string;
  lastModified: string;
  vetted: boolean;
  vettedBy?: string;
  question?: string;
  solution?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ApiDocument {
  id: string;
  content: string;
  metadata: ApiMetadata;
  embedding?: number[];
  sections?: Array<{
    title: string;
    content: string;
    pageNumber: number;
  }>;
}

export interface ApiProblem {
  id: string;
  question: string;
  topic?: string;
  difficulty?: string;
  solution?: string;
  metadata: ApiMetadata;
}

export interface ApiQueryResult {
  id: string;
  content: string;
  metadata: ApiMetadata;
  distance: number;
}

export interface ApiCollectionInfo {
  name: string;
  count: number;
  embeddingModel: string;
}
