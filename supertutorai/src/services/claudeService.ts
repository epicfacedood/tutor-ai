// Let's modify this file to not depend on the Anthropic SDK directly
// Instead, we'll use fetch API to make requests to the Claude API

// Define the type for Claude messages
export type AnthropicMessages = Array<{
  role: "user" | "assistant";
  content: string;
}>;

// Store the API key
let apiKey: string | null = null;

// Initialize the Claude service with the provided API key
const initializeClaudeService = (key: string): boolean => {
  try {
    console.log("Initializing Claude API with provided key");
    apiKey = key;
    console.log("Claude API initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing Claude API:", error);
    return false;
  }
};

// Check if the Claude API is initialized
const isClaudeInitialized = (): boolean => {
  return apiKey !== null;
};

// Convert messages to the format expected by the Anthropic API
const convertToClaudeMessages = (
  messages: Array<{ text: string; isUser: boolean }>
): AnthropicMessages => {
  console.log(
    "Converting messages to Claude format:",
    JSON.stringify(messages, null, 2)
  );

  // Find the first user message
  const firstUserMessageIndex = messages.findIndex((msg) => msg.isUser);
  if (firstUserMessageIndex === -1) {
    console.log("No user messages found, returning empty array");
    return [];
  }

  // Take all messages from the first user message onwards
  const validMessages = messages.slice(firstUserMessageIndex);
  console.log(
    "Messages starting from first user message:",
    JSON.stringify(validMessages, null, 2)
  );

  // Convert to Claude format and ensure proper alternation
  const claudeMessages: AnthropicMessages = [];
  let lastRole: "user" | "assistant" | null = null;

  for (const msg of validMessages) {
    const role = msg.isUser ? "user" : "assistant";

    // Skip consecutive messages with the same role
    if (role === lastRole) {
      console.log(`Skipping consecutive ${role} message:`, msg.text);
      continue;
    }

    claudeMessages.push({
      role: role,
      content: msg.text,
    });
    lastRole = role;
  }

  // Ensure the first message is from the user
  if (claudeMessages.length === 0 || claudeMessages[0].role !== "user") {
    console.log(
      "No valid user messages found or first message is not from user"
    );
    return [];
  }

  console.log(
    "Final Claude messages:",
    JSON.stringify(claudeMessages, null, 2)
  );
  return claudeMessages;
};

// Generate a response from Claude
const generateClaudeResponse = async (
  messages: AnthropicMessages
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Claude API not initialized");
  }

  console.log(
    "generateClaudeResponse called with messages:",
    JSON.stringify(messages, null, 2)
  );
  console.log("API Key available:", !!apiKey);

  try {
    // Use our local proxy server
    console.log("Making request to http://localhost:3002/api/claude");
    const requestBody = {
      messages: messages,
      apiKey: apiKey,
    };
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    const response = await fetch("http://localhost:3002/api/claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("API Error:", errorData);
      } catch (e) {
        console.error("Failed to parse error response:", e);
        errorData = { error: { message: "Unknown error" } };
      }

      if (response.status === 401) {
        throw new Error("Authentication failed: Invalid API key");
      } else if (response.status === 403) {
        throw new Error("Authorization failed: Insufficient permissions");
      } else if (response.status === 404) {
        throw new Error(
          `Model not found: ${
            errorData.error?.message || "Unknown model error"
          }`
        );
      } else {
        throw new Error(
          `API Error: ${response.status} ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }
    }

    const data = await response.json();
    console.log("Response data from proxy:", JSON.stringify(data));

    // Check for the default response format from our server
    if (
      data.id === "default-response" &&
      data.content &&
      Array.isArray(data.content)
    ) {
      console.log("Received default response from server");
      if (data.content.length > 0 && data.content[0].text) {
        return data.content[0].text;
      }
    }

    // Extract the response text from various possible formats

    // Format 1: content array with text property
    if (
      data.content &&
      Array.isArray(data.content) &&
      data.content.length > 0
    ) {
      // Direct text property
      if (data.content[0].text) {
        return data.content[0].text;
      }
      // Type/value format
      else if (data.content[0].type === "text" && data.content[0].value) {
        return data.content[0].value;
      }
      // Type/text format (newer API)
      else if (
        data.content[0].type === "text" &&
        typeof data.content[0].text === "string"
      ) {
        return data.content[0].text;
      }
    }

    // Format 2: message with content
    if (data.message && data.message.content) {
      if (typeof data.message.content === "string") {
        return data.message.content;
      } else if (
        Array.isArray(data.message.content) &&
        data.message.content.length > 0
      ) {
        const firstContent = data.message.content[0];
        if (typeof firstContent === "string") {
          return firstContent;
        } else if (firstContent.text) {
          return firstContent.text;
        } else if (firstContent.type === "text" && firstContent.value) {
          return firstContent.value;
        }
      }
    }

    // Format 3: direct content property
    if (data.content && typeof data.content === "string") {
      return data.content;
    }

    // Format 4: completion property (older API versions)
    if (data.completion) {
      return data.completion;
    }

    // Format 5: text property directly on the response
    if (data.text && typeof data.text === "string") {
      return data.text;
    }

    // Empty content array - likely an initialization message
    if (
      data.content &&
      Array.isArray(data.content) &&
      data.content.length === 0
    ) {
      console.log(
        "Empty content array in response. This might be because the initial message was from the assistant."
      );
      return "I'm ready to help you. What would you like to know?";
    }

    // If we get here, the response format is unexpected
    console.error("Unexpected response format:", data);

    // Last resort - try to extract any useful information
    if (data.id && data.role === "assistant") {
      return "I received your message, but I'm having trouble generating a proper response. Please try again.";
    }

    throw new Error("Received malformed response from Claude API");
  } catch (error) {
    console.error("Error generating Claude response:", error);
    throw error;
  }
};

// Make sure to export all the functions that are used elsewhere
export {
  initializeClaudeService,
  isClaudeInitialized,
  generateClaudeResponse,
  convertToClaudeMessages,
};
