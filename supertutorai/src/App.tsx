import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Chat from "./components/Chat";
import Sidebar from "./components/Sidebar";
import { AdminPage } from "./pages/AdminPage";
import {
  generateClaudeResponse,
  convertToClaudeMessages,
  initializeClaudeService,
} from "./services/claudeService";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    imageUrl?: string;
  }[];
}

function ChatLayout({
  apiAvailable,
  onApiStatusChange,
  currentChatId,
  chatSessions,
  onUpdateTitle,
  onDeleteChat,
  getCurrentChatMessages,
  handleSendMessage,
  handleSendImage,
  handleReportError,
  isProcessing,
  onNewChat,
  onSelectChat,
}: {
  apiAvailable: boolean;
  onApiStatusChange: (available: boolean) => void;
  currentChatId: string | null;
  chatSessions: ChatSession[];
  onUpdateTitle: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  getCurrentChatMessages: () => ChatSession["messages"];
  handleSendMessage: (text: string) => Promise<void>;
  handleSendImage: (file: File, textContext: string) => Promise<void>;
  handleReportError: (messageId: string, errorType: string) => void;
  isProcessing: boolean;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0">
        <Header
          apiAvailable={apiAvailable}
          onApiStatusChange={onApiStatusChange}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
          <Sidebar
            currentChatId={currentChatId}
            chatSessions={chatSessions}
            onUpdateTitle={onUpdateTitle}
            onDeleteChat={onDeleteChat}
            onNewChat={onNewChat}
            onSelectChat={onSelectChat}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <Chat
            messages={getCurrentChatMessages()}
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onReportError={handleReportError}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    // Try to get the last active chat ID from local storage
    const savedCurrentChatId = localStorage.getItem("currentChatId");
    return savedCurrentChatId || "1";
  });

  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>(
    () => {
      // Try to load saved chat sessions from local storage
      const savedSessions = localStorage.getItem("chatSessions");
      if (savedSessions) {
        return JSON.parse(savedSessions);
      }
      // Return default session if no saved sessions exist
      return {
        "1": {
          id: "1",
          title: "New Chat",
          createdAt: new Date().toISOString(),
          messages: [
            {
              id: "welcome-1",
              text: "Hello! I am SuperTutorAI powered by Claude, specialized in GCE A Level examination preparation. How can I help with your A Level studies today?",
              isUser: false,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    }
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);

  // Initialize Claude service with API key from localStorage if available
  useEffect(() => {
    const savedApiKey = localStorage.getItem("claude_api_key");
    if (savedApiKey) {
      console.log("Found API key in localStorage, initializing Claude service");
      const success = initializeClaudeService(savedApiKey);
      setApiAvailable(success);
      console.log(
        "Claude service initialization:",
        success ? "successful" : "failed"
      );
    } else {
      console.log("No API key found in localStorage");

      // Try to initialize with environment variable as fallback
      const envApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (envApiKey) {
        console.log(
          "Found API key in environment variables, initializing Claude service"
        );
        const initialized = initializeClaudeService(envApiKey);
        setApiAvailable(initialized);
        if (initialized) {
          console.log("Claude API initialized from environment variable");
          // Save to localStorage for future use
          localStorage.setItem("claude_api_key", envApiKey);
        } else {
          console.warn(
            "Failed to initialize Claude API with environment variable"
          );
        }
      } else {
        console.warn(
          "No API key available. Please set your API key in the settings."
        );
        setApiAvailable(false);
      }
    }
  }, []);

  // Save chat sessions to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Save current chat ID to local storage whenever it changes
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem("currentChatId", currentChatId);
    }
  }, [currentChatId]);

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const timestamp = new Date().toISOString();

    setChatSessions((prev) => ({
      ...prev,
      [newChatId]: {
        id: newChatId,
        title: "New Chat",
        createdAt: timestamp,
        messages: [
          {
            id: `welcome-${newChatId}`,
            text: "Hello! I am SuperTutorAI powered by Claude. How can I help you today?",
            isUser: false,
            timestamp: timestamp,
          },
        ],
      },
    }));
    setCurrentChatId(newChatId);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
  };

  const getCurrentChatMessages = () => {
    if (!currentChatId || !chatSessions[currentChatId]) {
      return [];
    }
    return chatSessions[currentChatId].messages;
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChatId) return;

    console.log("handleSendMessage called with text:", text);
    console.log("Current chat ID:", currentChatId);

    try {
      // Add user message
      const userMessageId = `user-${Date.now()}`;
      const timestamp = new Date().toISOString();

      setChatSessions((prev) => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [
            ...prev[currentChatId].messages,
            {
              id: userMessageId,
              text,
              isUser: true,
              timestamp: timestamp,
            },
          ],
        },
      }));

      // If Claude API is not available, return an error message
      if (!apiAvailable) {
        setTimeout(() => {
          const aiMessageId = `ai-${Date.now()}`;
          const errorTimestamp = new Date().toISOString();
          setChatSessions((prev) => ({
            ...prev,
            [currentChatId]: {
              ...prev[currentChatId],
              messages: [
                ...prev[currentChatId].messages,
                {
                  id: aiMessageId,
                  text: "Sorry, the AI service is currently unavailable. Please check the console for more information.",
                  isUser: false,
                  timestamp: errorTimestamp,
                },
              ],
            },
          }));
        }, 500);
        return;
      }

      // Set processing state
      setIsProcessing(true);

      // Get all messages for the current chat
      const currentMessages = [
        ...chatSessions[currentChatId].messages,
        { id: userMessageId, text, isUser: true }, // Include the new message
      ];
      console.log(
        "Current messages before conversion:",
        JSON.stringify(currentMessages, null, 2)
      );

      // For the first user message in a chat, we'll send only that message to Claude
      // This avoids the issue with the welcome message being sent first
      const isFirstUserMessage =
        currentMessages.filter((msg) => msg.isUser).length === 1;

      let messagesToSend = currentMessages;

      // Update chat title based on first user message
      if (isFirstUserMessage) {
        console.log("This is the first user message, updating chat title");
        // Truncate the message if it's too long, and clean it up for the title
        const titleText =
          text.length > 30 ? text.substring(0, 27) + "..." : text;
        setChatSessions((prev) => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            title: titleText,
          },
        }));

        console.log(
          "This is the first user message, sending only this message to Claude"
        );
        messagesToSend = [currentMessages[currentMessages.length - 1]]; // Send only the latest user message
      } else {
        // For subsequent messages, include the conversation history starting from the first user message
        const firstUserIndex = currentMessages.findIndex((msg) => msg.isUser);
        if (firstUserIndex !== -1) {
          messagesToSend = currentMessages.slice(firstUserIndex);
        }
      }

      // Convert to Claude format
      const claudeMessages = convertToClaudeMessages(messagesToSend);
      console.log(
        "Messages converted to Claude format:",
        JSON.stringify(claudeMessages, null, 2)
      );

      // Generate response from Claude
      console.log("Generating response from Claude...");
      const response = await generateClaudeResponse(claudeMessages);
      console.log("Response received from Claude:", response);

      // Add AI response
      const aiMessageId = `ai-${Date.now()}`;
      setChatSessions((prev) => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [
            ...prev[currentChatId].messages,
            {
              id: aiMessageId,
              text: response,
              isUser: false,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      }));
    } catch (error) {
      console.error("Error in handleSendMessage:", error);

      // Add error message
      const errorMessageId = `error-${Date.now()}`;
      setChatSessions((prev) => {
        // Make sure currentChatId exists in prev
        if (!prev[currentChatId]) {
          console.error("Current chat ID not found in chat sessions");
          return prev;
        }

        let errorMessage =
          "Sorry, there was an error generating a response. Please check the console for more details.";

        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes("Invalid API key")) {
            errorMessage =
              "Authentication failed: Invalid API key. Please update your API key using the key icon in the header.";
            setApiAvailable(false);
          } else if (error.message.includes("malformed response")) {
            errorMessage =
              "Error: Received an invalid response from the AI service. This might be due to a temporary issue. Please try again.";
          }
        }

        return {
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [
              ...prev[currentChatId].messages,
              {
                id: errorMessageId,
                text: errorMessage,
                isUser: false,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        };
      });
    } finally {
      // Reset processing state
      setIsProcessing(false);
    }
  };

  const handleSendImage = async (file: File, textContext: string = "") => {
    if (!currentChatId) return;

    try {
      setIsProcessing(true);

      // Create a temporary URL for the image to display in the UI
      const imageUrl = URL.createObjectURL(file);

      // Add user message with image
      const userMessageId = `user-${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Use the provided text context if available
      const messageText = textContext || "";

      setChatSessions((prev) => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [
            ...prev[currentChatId].messages,
            {
              id: userMessageId,
              text: messageText,
              isUser: true,
              timestamp: timestamp,
              imageUrl: imageUrl,
            },
          ],
        },
      }));

      // If Claude API is not available, return an error message
      if (!apiAvailable) {
        setTimeout(() => {
          const aiMessageId = `ai-${Date.now()}`;
          const errorTimestamp = new Date().toISOString();
          setChatSessions((prev) => ({
            ...prev,
            [currentChatId]: {
              ...prev[currentChatId],
              messages: [
                ...prev[currentChatId].messages,
                {
                  id: aiMessageId,
                  text: "Sorry, the AI service is currently unavailable. Please check the console for more information.",
                  isUser: false,
                  timestamp: errorTimestamp,
                },
              ],
            },
          }));
          setIsProcessing(false);
        }, 1000);
        return;
      }

      // Process the image with Claude
      try {
        // Get API key from localStorage
        const apiKey = localStorage.getItem("claude_api_key");

        if (!apiKey) {
          throw new Error(
            "API key not found. Please set your API key in the settings."
          );
        }

        // Create a FormData object to send the image
        const formData = new FormData();
        formData.append("image", file);
        formData.append("apiKey", apiKey);

        // Add text context if provided
        if (textContext) {
          formData.append("textContext", textContext);
        }

        console.log("Sending image to server with API key...");

        // Send the image to the server with the full URL
        const response = await fetch("http://localhost:3002/api/claude/image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(
            `Server responded with ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Received response from server:", data);

        // Add AI response
        const aiMessageId = `ai-${Date.now()}`;
        const aiTimestamp = new Date().toISOString();

        setChatSessions((prev) => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [
              ...prev[currentChatId].messages,
              {
                id: aiMessageId,
                text: data.content[0].text,
                isUser: false,
                timestamp: aiTimestamp,
              },
            ],
          },
        }));
      } catch (error) {
        console.error("Error processing image:", error);

        // Add error message
        const errorMessageId = `ai-${Date.now()}`;
        const errorTimestamp = new Date().toISOString();

        setChatSessions((prev) => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [
              ...prev[currentChatId].messages,
              {
                id: errorMessageId,
                text: `Error processing image: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
                isUser: false,
                timestamp: errorTimestamp,
              },
            ],
          },
        }));
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error handling image upload:", error);
      setIsProcessing(false);
    }
  };

  const handleApiStatusChange = (status: boolean) => {
    setApiAvailable(status);
  };

  const handleChatTitleUpdate = (chatId: string, newTitle: string) => {
    setChatSessions((prev) => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        title: newTitle,
      },
    }));
  };

  const handleDeleteChat = (chatId: string) => {
    setChatSessions((prev) => {
      const newSessions = { ...prev };
      delete newSessions[chatId];

      // If we're deleting the current chat, switch to another chat
      if (chatId === currentChatId) {
        const remainingIds = Object.keys(newSessions);
        if (remainingIds.length > 0) {
          // Switch to the most recent chat
          setCurrentChatId(remainingIds[remainingIds.length - 1]);
        } else {
          // If no chats left, create a new one
          handleNewChat();
        }
      }

      return newSessions;
    });
  };

  // Handle error reporting
  const handleReportError = (messageId: string, errorType: string) => {
    if (!currentChatId) return;

    console.log(`Error reported for message ${messageId}: ${errorType}`);

    // Add a system message acknowledging the report
    const systemMessageId = `system-${Date.now()}`;
    const timestamp = new Date().toISOString();

    let responseMessage = "";

    switch (errorType) {
      case "math_misinterpretation":
        responseMessage =
          "I apologize for misinterpreting the mathematical values. Please clarify the correct values, and I'll provide an updated solution.";
        break;
      case "incorrect_solution":
        responseMessage =
          "I apologize for the incorrect solution. Please point out where I went wrong, and I'll provide a corrected approach.";
        break;
      case "unclear_explanation":
        responseMessage =
          "I apologize for the unclear explanation. Please let me know which part was confusing, and I'll explain it more clearly.";
        break;
      default:
        responseMessage =
          "Thank you for your feedback. How can I improve my response?";
    }

    setChatSessions((prev) => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [
          ...prev[currentChatId].messages,
          {
            id: systemMessageId,
            text: responseMessage,
            isUser: false,
            timestamp: timestamp,
          },
        ],
      },
    }));
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ChatLayout
              apiAvailable={apiAvailable}
              onApiStatusChange={handleApiStatusChange}
              currentChatId={currentChatId}
              chatSessions={Object.values(chatSessions)}
              onUpdateTitle={handleChatTitleUpdate}
              onDeleteChat={handleDeleteChat}
              getCurrentChatMessages={getCurrentChatMessages}
              handleSendMessage={handleSendMessage}
              handleSendImage={handleSendImage}
              handleReportError={handleReportError}
              isProcessing={isProcessing}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
            />
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
