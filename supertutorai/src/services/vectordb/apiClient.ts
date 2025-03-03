import axios from "axios";
import {
  ApiDocument,
  ApiProblem,
  ApiQueryResult,
  ApiCollectionInfo,
} from "./apiTypes";

const API_BASE_URL = "http://localhost:3002/api/vectordb";

export interface VectorDBQueryResult {
  id: string;
  content: string;
  metadata: Record<string, string | number | boolean>;
  distance: number;
}

export interface CollectionInfo {
  name: string;
  count: number;
  embeddingModel: string;
}

export class VectorDBClient {
  /**
   * Check if the vector database service is running
   */
  async checkStatus(): Promise<{
    status: string;
    collection: ApiCollectionInfo;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      return response.data;
    } catch (error) {
      console.error("Failed to check vector database status:", error);
      throw error;
    }
  }

  /**
   * Add a document to the vector database
   */
  async addDocument(document: ApiDocument): Promise<{ id: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/documents`, document);
      return response.data;
    } catch (error) {
      console.error("Failed to add document to vector database:", error);
      throw error;
    }
  }

  /**
   * Add a problem to the vector database
   */
  async addProblem(problem: ApiProblem): Promise<{ id: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/problems`, problem);
      return response.data;
    } catch (error) {
      console.error("Failed to add problem to vector database:", error);
      throw error;
    }
  }

  /**
   * Query the vector database for similar documents
   */
  async querySimilarDocuments(
    query: string,
    filter: Record<string, string | number | boolean> = {},
    limit: number = 5
  ): Promise<ApiQueryResult[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/query`, {
        query,
        filter,
        limit,
      });
      return response.data.results;
    } catch (error) {
      console.error("Failed to query vector database:", error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<ApiDocument> {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${id}`);
      return response.data.document;
    } catch (error) {
      console.error(
        `Failed to get document ${id} from vector database:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(
    id: string,
    document: ApiDocument
  ): Promise<{ id: string }> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/documents/${id}`,
        document
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to update document ${id} in vector database:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to delete document ${id} from vector database:`,
        error
      );
      throw error;
    }
  }
}

// Export a singleton instance
const vectorDBClient = new VectorDBClient();
export default vectorDBClient;
