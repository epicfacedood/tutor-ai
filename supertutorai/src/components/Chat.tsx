import { useState, useRef, useEffect } from "react";
import {
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import ChatMessage from "./ChatMessage";
import ALevelSubjects from "./ALevelSubjects";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  imageUrl?: string;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendImage?: (file: File, textContext?: string) => void;
  onReportError?: (messageId: string, errorType: string) => void;
  isProcessing?: boolean;
}

const Chat = ({
  messages,
  onSendMessage,
  onSendImage,
  onReportError,
  isProcessing = false,
}: ChatProps) => {
  const [input, setInput] = useState("");
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [pastedImagePreview, setPastedImagePreview] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a pasted image, send it first
    if (pastedImage && onSendImage) {
      onSendImage(pastedImage, input.trim());
      clearPastedImage();
      setInput(""); // Clear the input after sending
      setIsLocalLoading(true);
      return;
    }

    if (input.trim() === "") return;

    onSendMessage(input);
    setInput("");
    setIsLocalLoading(true);

    // Reset local loading after a short delay if isProcessing is not provided
    if (!isProcessing) {
      setTimeout(() => {
        setIsLocalLoading(false);
      }, 1000);
    }
  };

  // Update local loading state based on isProcessing prop
  useEffect(() => {
    if (!isProcessing) {
      setIsLocalLoading(false);
    }
  }, [isProcessing]);

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = "auto";

    // Set the height to scrollHeight (capped at 150px)
    const newHeight = Math.min(e.target.scrollHeight, 150);
    e.target.style.height = `${newHeight}px`;
  };

  // Handle paste event to capture images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file && onSendImage) {
          e.preventDefault(); // Prevent pasting the image into the textarea
          setPastedImage(file);
          const imageUrl = URL.createObjectURL(file);
          setPastedImagePreview(imageUrl);
          break;
        }
      }
    }
  };

  // Clear pasted image
  const clearPastedImage = () => {
    if (pastedImagePreview) {
      URL.revokeObjectURL(pastedImagePreview);
    }
    setPastedImage(null);
    setPastedImagePreview(null);
  };

  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Call the regular submit handler function directly
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendImage) {
      // If there's text in the input, use it as context
      const textContext = input.trim();

      if (textContext) {
        // Send the image with text context immediately
        onSendImage(file, textContext);
        setInput("");

        // Reset the input value so the same file can be selected again
        e.target.value = "";
      } else {
        // Clear any previously pasted image
        clearPastedImage();

        // Set the new image
        setPastedImage(file);
        const imageUrl = URL.createObjectURL(file);
        setPastedImagePreview(imageUrl);

        // Reset the input value so the same file can be selected again
        e.target.value = "";
      }
    }
  };

  // Trigger file input click
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle subject selection
  const handleSubjectSelect = (subject: string) => {
    const message = `I need help with my A Level ${subject} studies. Can you provide an overview of the key topics and exam techniques for this subject?`;
    onSendMessage(message);
  };

  // Handle error reporting
  const handleReportError = (messageId: string, errorType: string) => {
    if (onReportError) {
      onReportError(messageId, errorType);
    }
  };

  // Determine if we should show the loading indicator
  const showLoading = isProcessing || isLocalLoading;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-md p-6 bg-white rounded-lg shadow-sm mb-4">
              <h3 className="text-xl font-semibold mb-2">
                Welcome to SuperTutorAI for A Levels
              </h3>
              <p className="text-gray-600 mb-4">
                I'm your specialized A Level tutor, ready to help with
                Mathematics, Further Mathematics, Physics, Chemistry, Biology,
                Economics, and other A Level subjects. Ask me any A Level
                question or upload an exam paper for step-by-step solutions.
              </p>
              <h4 className="text-md font-medium text-gray-700 mb-2">
                Select a subject to get started:
              </h4>
            </div>
            <ALevelSubjects onSelectSubject={handleSubjectSelect} />
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onReportError={handleReportError}
            />
          ))
        )}
        {showLoading && (
          <div className="flex items-center space-x-2 text-gray-500 p-3 bg-white rounded-lg shadow-sm max-w-md mx-auto">
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <span className="text-sm text-gray-500 ml-1">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-3 bg-white">
        {pastedImagePreview && (
          <div className="max-w-4xl mx-auto mb-2 relative">
            <div className="inline-block relative">
              <img
                src={pastedImagePreview}
                alt="Pasted image"
                className="h-20 rounded-md border border-gray-300"
              />
              <button
                onClick={clearPastedImage}
                className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-200"
                title="Remove image"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex items-end space-x-2 max-w-4xl mx-auto"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                pastedImage
                  ? "Add context about this image (optional)..."
                  : "Ask your A Level question here..."
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ minHeight: "44px", maxHeight: "150px" }}
              disabled={isProcessing}
            />
          </div>
          {onSendImage && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
                title="Upload an exam question or notes"
              >
                <PhotoIcon className="h-5 w-5 text-gray-600" />
              </button>
            </>
          )}
          <button
            type="submit"
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            disabled={isProcessing || (input.trim() === "" && !pastedImage)}
          >
            <PaperAirplaneIcon className="h-5 w-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
