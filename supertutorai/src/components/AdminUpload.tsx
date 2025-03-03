import React, { useState } from "react";
import {
  DocumentMetadata,
  DocumentType,
  Difficulty,
} from "../services/vectordb/types";

interface AdminUploadProps {
  onUpload: (
    files: { document: File; solution?: File },
    metadata: Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  ) => Promise<void>;
}

export const AdminUpload: React.FC<AdminUploadProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<{
    document?: File;
    solution?: File;
  }>({});

  const [metadata, setMetadata] = useState<
    Omit<DocumentMetadata, "dateAdded" | "lastModified" | "vetted">
  >({
    type: "exam",
    title: "",
    subject: "",
    level: "",
    topic: "",
    subtopic: "",
    difficulty: "medium",
    source: "",
    year: new Date().getFullYear(),
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "document" | "solution"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [fileType]: file }));
    }
  };

  const handleMetadataChange = (
    field: keyof Omit<
      DocumentMetadata,
      "dateAdded" | "lastModified" | "vetted"
    >,
    value: string | number
  ) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!files.document) {
      alert("Please select a document to upload");
      return;
    }
    await onUpload(files as { document: File; solution?: File }, metadata);
    // Reset form
    setFiles({});
    const form = event.target as HTMLFormElement;
    form.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            value={metadata.type}
            onChange={(e) =>
              handleMetadataChange("type", e.target.value as DocumentType)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="exam">Exam Paper</option>
            <option value="syllabus">Syllabus</option>
            <option value="notes">Notes</option>
            <option value="worksheet">Worksheet</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => handleMetadataChange("title", e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            type="text"
            value={metadata.subject}
            onChange={(e) => handleMetadataChange("subject", e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Level
          </label>
          <input
            type="text"
            value={metadata.level}
            onChange={(e) => handleMetadataChange("level", e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Topic
          </label>
          <input
            type="text"
            value={metadata.topic}
            onChange={(e) => handleMetadataChange("topic", e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Subtopic */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subtopic
          </label>
          <input
            type="text"
            value={metadata.subtopic}
            onChange={(e) => handleMetadataChange("subtopic", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <select
            value={metadata.difficulty}
            onChange={(e) =>
              handleMetadataChange("difficulty", e.target.value as Difficulty)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source
          </label>
          <input
            type="text"
            value={metadata.source}
            onChange={(e) => handleMetadataChange("source", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            type="number"
            value={metadata.year}
            onChange={(e) =>
              handleMetadataChange("year", parseInt(e.target.value))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Paper Number (for exams) */}
        {metadata.type === "exam" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Paper Number
            </label>
            <input
              type="text"
              value={metadata.paper || ""}
              onChange={(e) => handleMetadataChange("paper", e.target.value)}
              placeholder="e.g., P1, P2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Chapter (for notes and worksheets) */}
        {(metadata.type === "notes" || metadata.type === "worksheet") && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Chapter
            </label>
            <input
              type="text"
              value={metadata.chapter || ""}
              onChange={(e) => handleMetadataChange("chapter", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* File Uploads */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Document PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, "document")}
              required
              className="mt-1 block w-full"
            />
          </div>

          {metadata.type === "exam" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Solution PDF (Optional)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, "solution")}
                className="mt-1 block w-full"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Upload Document
          </button>
        </div>
      </div>
    </form>
  );
};
