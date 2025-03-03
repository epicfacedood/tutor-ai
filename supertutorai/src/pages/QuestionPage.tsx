import React from "react";
import { QuestionAnswerer } from "../components/QuestionAnswerer";
import { ImageProcessor } from "../services/ai/imageProcessor";

// Initialize the image processor with your API credentials
const imageProcessor = new ImageProcessor(
  process.env.VITE_ANTHROPIC_API_KEY || "",
  "https://api.anthropic.com/v1/messages"
);

export const QuestionPage: React.FC = () => {
  const handleImageSubmit = async (file: File): Promise<string> => {
    return imageProcessor.processImage(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Math Question Solver
          </h1>
          <p className="mt-2 text-gray-600">
            Upload a screenshot of your math question to get a detailed solution
          </p>
        </div>

        <QuestionAnswerer onSubmit={handleImageSubmit} />
      </div>
    </div>
  );
};
