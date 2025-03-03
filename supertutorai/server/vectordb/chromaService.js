import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Constants
const COLLECTION_NAME = "math_papers";
const EMBEDDING_MODEL = "text-embedding-3-small";

class ChromaService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.embeddingFunction = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMA_DB_URL || "http://localhost:8000",
      });

      // Initialize embedding function
      this.embeddingFunction = new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY,
        model_name: EMBEDDING_MODEL,
      });

      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: this.embeddingFunction,
        metadata: {
          description: "Collection of math papers and problems",
        },
      });

      this.initialized = true;
      console.log("ChromaDB service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize ChromaDB service:", error);
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Add a document to the collection
  async addDocument(document) {
    await this.ensureInitialized();

    const id = document.id || uuidv4();
    const metadata = {
      type: document.metadata.type,
      title: document.metadata.title,
      subject: document.metadata.subject,
      level: document.metadata.level,
      topic: document.metadata.topic || "",
      subtopic: document.metadata.subtopic || "",
      difficulty: document.metadata.difficulty,
      source: document.metadata.source,
      year: document.metadata.year,
      paper: document.metadata.paper || "",
      chapter: document.metadata.chapter || "",
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      vetted: document.metadata.vetted || false,
      vettedBy: document.metadata.vettedBy || "",
    };

    try {
      await this.collection.add({
        ids: [id],
        documents: [document.content],
        metadatas: [metadata],
      });

      return { id, success: true };
    } catch (error) {
      console.error("Failed to add document to ChromaDB:", error);
      throw error;
    }
  }

  // Add a math problem to the collection
  async addProblem(problem) {
    await this.ensureInitialized();

    const id = problem.id || uuidv4();
    const metadata = {
      type: "problem",
      question: problem.question,
      topic: problem.topic,
      difficulty: problem.difficulty,
      solution: JSON.stringify(problem.solution),
      source: problem.metadata.source,
      vetted: problem.metadata.vetted || false,
      vettedBy: problem.metadata.vettedBy || "",
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    try {
      await this.collection.add({
        ids: [id],
        documents: [problem.question],
        metadatas: [metadata],
      });

      return { id, success: true };
    } catch (error) {
      console.error("Failed to add problem to ChromaDB:", error);
      throw error;
    }
  }

  // Query similar documents
  async querySimilarDocuments(query, filter = {}, limit = 5) {
    await this.ensureInitialized();

    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
        where: filter,
      });

      // Format results
      const formattedResults = [];
      if (results.ids[0] && results.ids[0].length > 0) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formattedResults.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance: results.distances[0][i],
          });
        }
      }

      return formattedResults;
    } catch (error) {
      console.error("Failed to query ChromaDB:", error);
      throw error;
    }
  }

  // Get a document by ID
  async getDocument(id) {
    await this.ensureInitialized();

    try {
      const result = await this.collection.get({
        ids: [id],
      });

      if (result.ids.length === 0) {
        return null;
      }

      return {
        id: result.ids[0],
        content: result.documents[0],
        metadata: result.metadatas[0],
      };
    } catch (error) {
      console.error(`Failed to get document ${id} from ChromaDB:`, error);
      throw error;
    }
  }

  // Update a document
  async updateDocument(id, document) {
    await this.ensureInitialized();

    const metadata = {
      ...document.metadata,
      lastModified: new Date().toISOString(),
    };

    try {
      await this.collection.update({
        ids: [id],
        documents: [document.content],
        metadatas: [metadata],
      });

      return { id, success: true };
    } catch (error) {
      console.error(`Failed to update document ${id} in ChromaDB:`, error);
      throw error;
    }
  }

  // Delete a document
  async deleteDocument(id) {
    await this.ensureInitialized();

    try {
      await this.collection.delete({
        ids: [id],
      });

      return { success: true };
    } catch (error) {
      console.error(`Failed to delete document ${id} from ChromaDB:`, error);
      throw error;
    }
  }

  // Get collection info
  async getCollectionInfo() {
    await this.ensureInitialized();

    try {
      const count = await this.collection.count();
      return {
        name: COLLECTION_NAME,
        count,
        embeddingModel: EMBEDDING_MODEL,
      };
    } catch (error) {
      console.error("Failed to get collection info from ChromaDB:", error);
      throw error;
    }
  }
}

// Export a singleton instance
const chromaService = new ChromaService();
export default chromaService;
