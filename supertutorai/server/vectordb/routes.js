import express from "express";
import chromaService from "./chromaService.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Initialize ChromaDB service
router.get("/status", async (req, res) => {
  try {
    await chromaService.initialize();
    const info = await chromaService.getCollectionInfo();
    res.json({
      status: "ok",
      message: "ChromaDB service is running",
      collection: info,
    });
  } catch (error) {
    console.error("Error checking ChromaDB status:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to connect to ChromaDB service",
      error: error.message,
    });
  }
});

// Add a document
router.post("/documents", async (req, res) => {
  try {
    const document = req.body;

    // Validate document
    if (!document.content || !document.metadata) {
      return res.status(400).json({
        status: "error",
        message: "Invalid document format. Content and metadata are required.",
      });
    }

    // Ensure document has an ID
    if (!document.id) {
      document.id = uuidv4();
    }

    const result = await chromaService.addDocument(document);
    res.status(201).json({
      status: "success",
      message: "Document added successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add document",
      error: error.message,
    });
  }
});

// Add a problem
router.post("/problems", async (req, res) => {
  try {
    const problem = req.body;

    // Validate problem
    if (!problem.question || !problem.topic) {
      return res.status(400).json({
        status: "error",
        message: "Invalid problem format. Question and topic are required.",
      });
    }

    // Ensure problem has an ID
    if (!problem.id) {
      problem.id = uuidv4();
    }

    const result = await chromaService.addProblem(problem);
    res.status(201).json({
      status: "success",
      message: "Problem added successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Error adding problem:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add problem",
      error: error.message,
    });
  }
});

// Query similar documents
router.post("/query", async (req, res) => {
  try {
    const { query, filter, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        status: "error",
        message: "Query text is required",
      });
    }

    const results = await chromaService.querySimilarDocuments(
      query,
      filter || {},
      limit || 5
    );

    res.json({
      status: "success",
      results,
    });
  } catch (error) {
    console.error("Error querying documents:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to query documents",
      error: error.message,
    });
  }
});

// Get a document by ID
router.get("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await chromaService.getDocument(id);

    if (!document) {
      return res.status(404).json({
        status: "error",
        message: `Document with ID ${id} not found`,
      });
    }

    res.json({
      status: "success",
      document,
    });
  } catch (error) {
    console.error(`Error getting document ${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      message: "Failed to get document",
      error: error.message,
    });
  }
});

// Update a document
router.put("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = req.body;

    // Validate document
    if (!document.content || !document.metadata) {
      return res.status(400).json({
        status: "error",
        message: "Invalid document format. Content and metadata are required.",
      });
    }

    const result = await chromaService.updateDocument(id, document);
    res.json({
      status: "success",
      message: "Document updated successfully",
      id: result.id,
    });
  } catch (error) {
    console.error(`Error updating document ${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      message: "Failed to update document",
      error: error.message,
    });
  }
});

// Delete a document
router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await chromaService.deleteDocument(id);

    res.json({
      status: "success",
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting document ${req.params.id}:`, error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete document",
      error: error.message,
    });
  }
});

export default router;
