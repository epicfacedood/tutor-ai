export class ImageProcessor {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(apiKey: string, apiEndpoint: string) {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
  }

  async processImage(file: File): Promise<string> {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(file);

      // Prepare the request to Claude
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please analyze this question and provide a detailed solution. Include step-by-step explanations and any relevant formulas or concepts.",
                },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: file.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to process image"
      );
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
