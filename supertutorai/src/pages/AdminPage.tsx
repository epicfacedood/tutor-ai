import React, { useState } from "react";
import { AdminUpload } from "../components/AdminUpload";
import { DocumentProcessor } from "../services/vectordb/documentProcessor";
import { VectorStore } from "../services/vectordb/vectorStore";
import { DocumentMetadata } from "../services/vectordb/types";

export const AdminPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<{
    success?: string;
    error?: string;
  }>({});

  const handleUpload = async (
    files: { document: File; solution?: File },
    metadata: Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  ) => {
    try {
      setUploadStatus({});

      // Initialize services
      const vectorStore = new VectorStore();
      await vectorStore.initialize();

      const documentProcessor = new DocumentProcessor();

      // Process the document
      const document = await documentProcessor.processDocument(
        files.document,
        metadata
      );

      // Add to vector store
      await vectorStore.addDocument(document);

      // If this is an exam paper and we have a solution file, process it too
      if (metadata.type === "exam" && files.solution) {
        const solutionMetadata = {
          ...metadata,
          title: `${metadata.title} - Solution`,
        };
        const solutionDocument = await documentProcessor.processDocument(
          files.solution,
          solutionMetadata
        );
        await vectorStore.addDocument(solutionDocument);

        setUploadStatus({
          success: "Successfully processed exam paper and solution",
        });
      } else {
        setUploadStatus({
          success: "Successfully processed document",
        });
      }
    } catch (error) {
      setUploadStatus({
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Management
          </h1>
          <p className="mt-2 text-gray-600">
            Upload and manage educational documents
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus.success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {uploadStatus.success}
          </div>
        )}
        {uploadStatus.error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {uploadStatus.error}
          </div>
        )}

        {/* Upload Component */}
        <AdminUpload onUpload={handleUpload} />
      </div>
    </div>
  );
};
