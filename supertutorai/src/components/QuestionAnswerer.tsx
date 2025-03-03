import React, { useState } from "react";
import { ClipboardIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface QuestionAnswererProps {
  onSubmit: (imageFile: File) => Promise<string>;
}

export const QuestionAnswerer: React.FC<QuestionAnswererProps> = ({
  onSubmit,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      // Reset states
      setError(null);
      setAnswer(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);

      // Show loading state
      setIsLoading(true);

      // Get answer from AI
      const response = await onSubmit(file);
      setAnswer(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;

    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
          break;
        }
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400" />
          </div>
          <div className="text-gray-600">
            <p className="text-lg font-semibold">Upload a question image</p>
            <p className="text-sm">
              Drag and drop, paste from clipboard, or{" "}
              <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
          </div>
        </div>
      </div>

      {/* Preview and Answer Area */}
      {(imagePreview || isLoading || error || answer) && (
        <div className="mt-8 space-y-6">
          {/* Image Preview */}
          {imagePreview && (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Question preview"
                className="max-w-full h-auto"
              />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Analyzing your question...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Answer */}
          {answer && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(answer)}
                  className="text-gray-400 hover:text-gray-500"
                  title="Copy answer"
                >
                  <ClipboardIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
