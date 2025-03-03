import {
  AcademicCapIcon,
  InformationCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { initializeClaudeService } from "../services/claudeService";

interface HeaderProps {
  apiAvailable: boolean;
  onApiStatusChange: (status: boolean) => void;
}

const Header = ({ apiAvailable, onApiStatusChange }: HeaderProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showApiForm, setShowApiForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const location = useLocation();

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setApiKeyError("API key is required");
      return;
    }

    // Try to initialize the Claude service with the new API key
    const success = initializeClaudeService(apiKey.trim());

    if (success) {
      setApiKeyError("");
      setShowApiForm(false);
      onApiStatusChange(true);
      // Save to localStorage
      localStorage.setItem("claude_api_key", apiKey.trim());
    } else {
      setApiKeyError("Failed to initialize API with the provided key");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SuperTutorAI</h1>
              <p className="text-xs text-gray-500 -mt-1">
                A Level Exam Preparation
              </p>
            </div>
          </Link>
          <div
            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              apiAvailable
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {apiAvailable ? "API Connected" : "API Disconnected"}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to={location.pathname === "/admin" ? "/" : "/admin"}
            className="text-gray-500 hover:text-blue-500 transition-colors flex items-center space-x-1"
          >
            <Cog6ToothIcon className="h-6 w-6" />
            <span className="text-sm">
              {location.pathname === "/admin" ? "Chat" : "Admin"}
            </span>
          </Link>
          <button
            onClick={() => setShowApiForm(!showApiForm)}
            className="text-gray-500 hover:text-blue-500 transition-colors"
            aria-label="API Key"
          >
            <KeyIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-500 hover:text-blue-500 transition-colors"
            aria-label="Information"
          >
            <InformationCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* API Key Form */}
      {showApiForm && (
        <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-20">
          <h3 className="font-bold text-gray-800 mb-2">Set Claude API Key</h3>
          <form onSubmit={handleApiKeySubmit}>
            <div className="mb-3">
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Claude API key"
              />
              {apiKeyError && (
                <p className="mt-1 text-sm text-red-600">{apiKeyError}</p>
              )}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowApiForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Information panel */}
      {showInfo && (
        <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-20">
          <h3 className="font-bold text-gray-800 mb-2">About SuperTutorAI</h3>
          <p className="text-sm text-gray-600 mb-3">
            SuperTutorAI is specialized for GCE A Level exam preparation,
            powered by Claude. It provides step-by-step solutions, exam
            techniques, and subject-specific guidance for A Level students.
          </p>
          <div className="text-xs text-gray-500 flex justify-between items-center">
            <span>Version 1.0.0</span>
            <button
              onClick={() => setShowInfo(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
