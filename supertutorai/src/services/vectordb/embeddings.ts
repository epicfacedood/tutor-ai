import { pipeline, env } from "@xenova/transformers";

// Set environment variables
env.allowLocalModels = false;
env.useBrowserCache = true;

interface TransformerModel {
  (text: string, options: { pooling: string; normalize: boolean }): Promise<{
    data: Float32Array;
  }>;
}

export class EmbeddingService {
  private model: TransformerModel | null = null;
  private modelName = "Xenova/all-MiniLM-L6-v2";
  private dimension = 384; // MiniLM-L6-v2 embedding dimension

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      this.model = await pipeline("feature-extraction", this.modelName);
      console.log("Embedding model initialized successfully");
    } catch (error) {
      console.error("Failed to initialize embedding model:", error);
      throw error;
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.model) {
        await this.initializeModel();
      }

      const output = await this.model!(text, {
        pooling: "mean",
        normalize: true,
      });

      return Array.from(output.data);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  }
}
