import { useEffect, useRef, useState } from "react";
import MathRenderer from "./MathRenderer";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  imageUrl?: string;
}

interface ChatMessageProps {
  message: Message;
  onReportError?: (messageId: string, errorType: string) => void;
}

const ChatMessage = ({ message, onReportError }: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [showReportMenu, setShowReportMenu] = useState(false);

  // Function to format code blocks and LaTeX
  const formatMessage = (text: string) => {
    try {
      // First, handle code blocks separately to avoid conflicts with LaTeX processing
      const codeBlockRegex = /(```[\s\S]*?```)/g;
      const textWithCodePlaceholders = text.replace(
        codeBlockRegex,
        (match, codeBlock, index) => {
          return `__CODE_BLOCK_${index}__`;
        }
      );

      // Store code blocks for later reinsertion
      const codeBlocks: string[] = [];
      let match;
      while ((match = codeBlockRegex.exec(text)) !== null) {
        codeBlocks.push(match[0]);
      }

      // Process LaTeX in the remaining text
      // This regex handles both display and inline LaTeX expressions
      const latexRegex = /(\$\$[\s\S]*?\$\$)|(\$[^$\n]+?\$)/g;

      // Split by paragraphs first to preserve paragraph structure
      const paragraphs = textWithCodePlaceholders.split("\n\n");

      return paragraphs.map((paragraph, paragraphIndex) => {
        // Skip empty paragraphs with smaller spacing
        if (paragraph.trim() === "") {
          return <div key={`p-${paragraphIndex}`} className="h-4"></div>;
        }

        // Replace code block placeholders in this paragraph
        let processedParagraph = paragraph;
        const codePlaceholderRegex = /__CODE_BLOCK_(\d+)__/g;
        let codePlaceholderMatch;

        while (
          (codePlaceholderMatch = codePlaceholderRegex.exec(paragraph)) !== null
        ) {
          const index = parseInt(codePlaceholderMatch[1]);
          if (index < codeBlocks.length) {
            processedParagraph = processedParagraph.replace(
              codePlaceholderMatch[0],
              codeBlocks[index]
            );
          }
        }

        // Process each line in the paragraph
        const lines = processedParagraph.split("\n");

        return (
          <div key={`p-${paragraphIndex}`} className="mb-4 last:mb-0">
            {lines.map((line, lineIndex) => {
              // Skip empty lines with smaller spacing
              if (line.trim() === "") {
                return (
                  <div
                    key={`l-${paragraphIndex}-${lineIndex}`}
                    className="h-2"
                  ></div>
                );
              }

              // Process the line with LaTeX
              const lineParts = line.split(latexRegex).filter(Boolean);

              return (
                <p
                  key={`l-${paragraphIndex}-${lineIndex}`}
                  className="mb-2 last:mb-0 leading-relaxed"
                >
                  {lineParts.map((part, partIndex) => {
                    // Check if this part is a code block
                    if (part.startsWith("```") && part.endsWith("```")) {
                      // Extract language and code
                      const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);

                      if (codeMatch) {
                        const [, language, code] = codeMatch;
                        return (
                          <div
                            key={`c-${paragraphIndex}-${lineIndex}-${partIndex}`}
                            className="my-2 overflow-x-auto w-full"
                          >
                            <div className="bg-gray-800 rounded-t-md px-3 py-1 text-xs text-gray-400">
                              {language || "code"}
                            </div>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded-b-md overflow-x-auto">
                              <code>{code}</code>
                            </pre>
                          </div>
                        );
                      }
                    }

                    // Check if this part is a display math ($$...$$)
                    if (part.startsWith("$$") && part.endsWith("$$")) {
                      const math = part.slice(2, -2);
                      return (
                        <div
                          key={`dm-${paragraphIndex}-${lineIndex}-${partIndex}`}
                          className="my-3 overflow-x-auto w-full"
                        >
                          <MathRenderer math={math} display={true} />
                        </div>
                      );
                    }

                    // Check if this part is an inline math ($...$)
                    if (
                      part.startsWith("$") &&
                      part.endsWith("$") &&
                      part.length > 2
                    ) {
                      const math = part.slice(1, -1);
                      return (
                        <MathRenderer
                          key={`im-${paragraphIndex}-${lineIndex}-${partIndex}`}
                          math={math}
                          display={false}
                        />
                      );
                    }

                    // Regular text
                    return (
                      <span
                        key={`t-${paragraphIndex}-${lineIndex}-${partIndex}`}
                      >
                        {part}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        );
      });
    } catch (error) {
      console.error("Error formatting message:", error);
      return (
        <p className="text-red-500">
          Error displaying message. See console for details.
        </p>
      );
    }
  };

  // Handle reporting an error
  const handleReportError = (errorType: string) => {
    if (onReportError) {
      onReportError(message.id, errorType);
      setShowReportMenu(false);
    }
  };

  // Apply syntax highlighting after component mounts
  useEffect(() => {
    if (messageRef.current) {
      // You could add a syntax highlighting library here if needed
    }
  }, [message.text]);

  return (
    <div
      className={`flex ${
        message.isUser ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {!message.isUser && (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
      )}
      <div
        ref={messageRef}
        className={`rounded-lg p-4 shadow max-w-3xl ${
          message.isUser ? "bg-blue-500 text-white" : "bg-white text-gray-800"
        } relative group`}
        style={{ width: message.isUser ? "auto" : "calc(100% - 3rem)" }}
      >
        {message.imageUrl && (
          <div className="mb-3">
            <img
              src={message.imageUrl}
              alt="Uploaded question"
              className="max-w-full rounded-md"
              style={{ maxHeight: "300px" }}
            />
          </div>
        )}
        <div className="prose prose-md max-w-none overflow-x-auto">
          {formatMessage(message.text)}
        </div>

        {!message.isUser && onReportError && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Report an issue with this response"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
            </button>

            {showReportMenu && (
              <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md py-1 z-10 w-64 text-sm">
                <div className="px-3 py-1 text-gray-500 font-medium border-b">
                  Report an issue
                </div>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700"
                  onClick={() => handleReportError("math_misinterpretation")}
                >
                  Mathematical values misinterpreted
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700"
                  onClick={() => handleReportError("incorrect_solution")}
                >
                  Incorrect solution or approach
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 text-gray-700"
                  onClick={() => handleReportError("unclear_explanation")}
                >
                  Explanation is unclear or confusing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {message.isUser && (
        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
          <span className="text-white font-bold text-sm">U</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
