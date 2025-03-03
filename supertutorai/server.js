import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import vectorDbRoutes from "./server/vectordb/routes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = 3002;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Configure CORS to allow requests from any origin
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Add a test endpoint
app.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Claude API proxy server is running correctly",
  });
});

// Helper function to convert file buffer to base64
function bufferToBase64(buffer, mimetype) {
  return buffer.toString("base64");
}

// Add endpoint for image processing
app.post("/api/claude/image", upload.single("image"), async (req, res) => {
  console.log("Received request to /api/claude/image");
  console.log("Request body keys:", Object.keys(req.body));
  console.log("Request files:", req.file ? "File present" : "No file");

  try {
    const { file } = req;
    const { apiKey, textContext } = req.body;

    if (!file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No image file provided" });
    }

    if (!apiKey) {
      console.error("No API key in request body");
      return res.status(400).json({ error: "API key is required" });
    }

    console.log(
      "Received image for processing:",
      file.originalname,
      file.mimetype,
      file.size
    );
    console.log("API key length:", apiKey.length);
    console.log("Text context provided:", textContext || "None");

    // Convert image to base64
    const base64Image = bufferToBase64(file.buffer, file.mimetype);
    console.log("Converted image to base64, length:", base64Image.length);

    // System prompt for image analysis with LaTeX instructions
    const systemPrompt = `You are SuperTutorAI, an expert tutor specializing in GCE A Levels examination preparation.
    
When analyzing images of questions, identify if it's an A Level exam question or related to A Level content. Provide a detailed, step-by-step solution following A Level examination standards. For math and science questions, explain the reasoning behind each step, use formulas when relevant, and explain what each variable represents.

CRITICAL FOR IMAGE PROCESSING: 
1. When reading mathematical expressions from images, FIRST transcribe the EXACT content of the image verbatim before attempting any solution
2. Pay extremely close attention to the exact values, coefficients, and variables presented
3. Double-check all numerical values before solving any problem
4. Be especially careful with vector notation (i, j, k components) and ensure you transcribe the exact coefficients
5. For vectors like "ai + bj + ck", verify each coefficient (a, b, c) multiple times before proceeding
6. When you see mathematical expressions in images, ALWAYS begin your response by stating "I see the following in the image:" followed by the exact mathematical expressions
7. If there's any ambiguity in the image, explicitly state your interpretation and ask for confirmation
8. For vectors, matrices, and equations, repeat the original expression in your response to confirm accurate understanding
9. If any part of the image is unclear or potentially ambiguous, mention this and provide your best interpretation

When answering:
1. Identify which A Level subject the question relates to (e.g., Mathematics, Further Mathematics, Physics, Chemistry, Biology)
2. Provide solutions that match the style and approach expected in A Level exams
3. Highlight key concepts, formulas, and definitions that examiners typically look for
4. Include exam techniques and common pitfalls specific to A Level marking schemes
5. When appropriate, mention which exam boards (e.g., Edexcel, AQA, OCR, Cambridge International) the question style is typical for

IMPORTANT: For all mathematical expressions, use LaTeX notation enclosed in dollar signs. Use single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for display math. For example:
- Inline math: The formula $E = mc^2$ shows the relationship between energy and mass.
- Display math: The quadratic formula is:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

For matrices, use the proper LaTeX matrix environments within display math mode. For example:
$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$

For column vectors, use the proper LaTeX vector notation:
$$\\begin{pmatrix} x_1 \\\\ x_2 \\\\ \\vdots \\\\ x_n \\end{pmatrix}$$

For systems of equations, use the aligned environment:
$$\\begin{aligned} 
2x + 3y &= 5 \\\\
4x - 2y &= 8
\\end{aligned}$$

Always maintain a supportive and encouraging tone. If the image is unclear or the question is ambiguous, explain what you can see and ask for clarification.`;

    console.log("Sending request to Claude API");

    // Prepare the user message text based on whether context was provided
    const userMessageText = textContext
      ? `${textContext}\n\nPlease analyze this question and provide a detailed solution. Include step-by-step explanations and use LaTeX for all mathematical expressions.`
      : "Please analyze this question and provide a detailed solution. Include step-by-step explanations and use LaTeX for all mathematical expressions. For complex math, use display math ($$...$$) to make it more readable.";

    // Send to Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userMessageText,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: file.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    console.log("Claude API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from Claude API:", errorText);

      try {
        const errorData = JSON.parse(errorText);
        return res.status(response.status).json(errorData);
      } catch (e) {
        return res.status(response.status).json({
          error: "Failed to process image",
          details: errorText,
        });
      }
    }

    const data = await response.json();
    console.log("Received response from Claude API for image");
    console.log("Response content type:", typeof data.content);
    console.log(
      "Response content length:",
      data.content ? data.content.length : 0
    );

    res.json(data);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.post("/api/claude", async (req, res) => {
  const { messages, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "API key is required" });
  }

  try {
    console.log("Received request for Claude API");
    console.log("Messages:", JSON.stringify(messages, null, 2));

    // Validate messages - Claude API requires at least one message and the first message must be from the user
    if (!messages || messages.length === 0) {
      console.log("No messages provided, returning default response");
      return res.json({
        id: "default-response",
        content: [
          {
            type: "text",
            text: "I'm ready to help you with your GCE A Level studies. I can assist with Mathematics, Further Mathematics, Physics, Chemistry, Biology, Economics, Computer Science, and other A Level subjects. Just ask your question, and I'll provide detailed explanations tailored to A Level standards with exam-focused tips.",
          },
        ],
      });
    }

    // If the first message is from the assistant, skip it
    if (messages[0].role === "assistant") {
      console.log(
        "First message is from assistant, skipping assistant messages until first user message"
      );
      const firstUserIndex = messages.findIndex((msg) => msg.role === "user");
      if (firstUserIndex === -1) {
        console.log("No user messages found after skipping assistant messages");
        return res.json({
          id: "default-response",
          content: [
            {
              type: "text",
              text: "I'm ready to help you with your GCE A Level studies. I can assist with Mathematics, Further Mathematics, Physics, Chemistry, Biology, Economics, Computer Science, and other A Level subjects. Just ask your question, and I'll provide detailed explanations tailored to A Level standards with exam-focused tips.",
            },
          ],
        });
      }
      messages = messages.slice(firstUserIndex);
      console.log(
        "Messages after skipping assistant messages:",
        JSON.stringify(messages, null, 2)
      );
    }

    // Double check that we have at least one message and it's from the user
    if (!messages.length || messages[0].role !== "user") {
      console.log("No valid user messages found, returning default response");
      return res.json({
        id: "default-response",
        content: [
          {
            type: "text",
            text: "I'm ready to help you with your GCE A Level studies. I can assist with Mathematics, Further Mathematics, Physics, Chemistry, Biology, Economics, Computer Science, and other A Level subjects. Just ask your question, and I'll provide detailed explanations tailored to A Level standards with exam-focused tips.",
          },
        ],
      });
    }

    console.log(
      "Proceeding with valid messages:",
      JSON.stringify(messages, null, 2)
    );

    // Use a currently supported model name based on the latest API
    const modelName = "claude-3-haiku-20240307"; // Updated to latest supported model
    console.log("Using model:", modelName);

    // Add a system prompt to instruct Claude to act as a tutor
    const systemPrompt = `You are SuperTutorAI, an expert tutor specializing in GCE A Levels examination preparation. 
    
Your responses should be educational, clear, and specifically tailored to A Level students. Focus on helping students understand complex academic concepts that are relevant to the A Level curriculum in subjects like Mathematics, Further Mathematics, Physics, Chemistry, Biology, Economics, Computer Science, and other A Level subjects.

CRITICAL FOR PROCESSING MATHEMATICAL CONTENT: 
1. When reading mathematical expressions from text or images, FIRST transcribe the EXACT content verbatim before attempting any solution
2. Pay extremely close attention to the exact values, coefficients, and variables presented
3. Double-check all numerical values before solving any problem
4. Be especially careful with vector notation (i, j, k components) and ensure you transcribe the exact coefficients
5. For vectors like "ai + bj + ck", verify each coefficient (a, b, c) multiple times before proceeding
6. When you see mathematical expressions, ALWAYS begin your response by stating "I see the following mathematical content:" followed by the exact mathematical expressions
7. If there's any ambiguity in the input, explicitly state your interpretation and ask for confirmation
8. For vectors, matrices, and equations, repeat the original expression in your response to confirm accurate understanding

When answering questions:
1. Identify which A Level subject the question relates to and frame your answer in the context of the A Level syllabus
2. Provide thorough explanations with examples that match the style and difficulty of A Level exam questions
3. Highlight key concepts, formulas, and definitions that examiners typically look for
4. Include exam techniques and common pitfalls specific to A Level marking schemes
5. When appropriate, mention which exam boards (e.g., Edexcel, AQA, OCR, Cambridge International) the concept is particularly relevant for

For math and science questions, show step-by-step solutions and explain the reasoning behind each step. Use formulas and equations when relevant, and explain what each variable represents. Make sure to use the notation and methods taught in A Level courses.

IMPORTANT: For all mathematical expressions, use LaTeX notation enclosed in dollar signs. Use single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for display math. For example:
- Inline math: The formula $E = mc^2$ shows the relationship between energy and mass.
- Display math: The quadratic formula is:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

For matrices, use the proper LaTeX matrix environments within display math mode. For example:
$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$

For column vectors, use the proper LaTeX vector notation:
$$\\begin{pmatrix} x_1 \\\\ x_2 \\\\ \\vdots \\\\ x_n \\end{pmatrix}$$

For systems of equations, use the aligned environment:
$$\\begin{aligned} 
2x + 3y &= 5 \\\\
4x - 2y &= 8
\\end{aligned}$$

If a question is unclear, ask for clarification rather than making assumptions. Always maintain a supportive and encouraging tone, while emphasizing exam-relevant information.

IMPORTANT: Always respond to the user's question directly. Never respond with a generic message like "I'm ready to help you" when the user has asked a specific question.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4096,
        messages: messages,
        system: systemPrompt,
      }),
    });

    console.log("Response status from Anthropic API:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response text:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: "Failed to parse error response" } };
      }

      console.error("API Error:", errorData);
      console.error("Status:", response.status);
      console.error(
        "Headers:",
        JSON.stringify(Object.fromEntries([...response.headers]))
      );

      // If the model is not found, try a fallback model
      if (
        response.status === 404 &&
        errorData.error?.type === "not_found_error"
      ) {
        console.log(
          "Model not found, trying fallback model claude-3-7-sonnet-20250219"
        );

        const fallbackResponse = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-7-sonnet-20250219",
              max_tokens: 1000,
              messages: messages,
              system: systemPrompt,
            }),
          }
        );

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error("Fallback error response text:", fallbackErrorText);
          res
            .status(fallbackResponse.status)
            .json(JSON.parse(fallbackErrorText));
          return;
        }

        const fallbackData = await fallbackResponse.json();
        console.log(
          "Received response from Anthropic API using fallback model"
        );
        console.log(
          "Fallback response structure:",
          JSON.stringify(Object.keys(fallbackData))
        );

        // Log a sample of the content to help with debugging
        if (
          fallbackData.content &&
          Array.isArray(fallbackData.content) &&
          fallbackData.content.length > 0
        ) {
          console.log(
            "First content item type:",
            typeof fallbackData.content[0]
          );
          console.log(
            "First content item keys:",
            Object.keys(fallbackData.content[0])
          );
        }

        res.json(fallbackData);
        return;
      }

      res.status(response.status).json(errorData);
      return;
    }

    const data = await response.json();
    console.log("Received response from Anthropic API");
    console.log("Response structure:", JSON.stringify(Object.keys(data)));

    // Log a sample of the content to help with debugging
    if (
      data.content &&
      Array.isArray(data.content) &&
      data.content.length > 0
    ) {
      console.log("First content item type:", typeof data.content[0]);
      console.log("First content item keys:", Object.keys(data.content[0]));
    }

    res.json(data);
  } catch (error) {
    console.error("Error proxying request to Claude API:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
});

// Vector database routes
app.use("/api/vectordb", vectorDbRoutes);

// Start the server with error handling
app
  .listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
    console.log(`Test endpoint available at http://localhost:${port}/test`);
    console.log(
      `Vector DB API available at http://localhost:${port}/api/vectordb`
    );
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Please use a different port.`
      );
      process.exit(1);
    } else {
      console.error("Error starting server:", err);
      process.exit(1);
    }
  });
