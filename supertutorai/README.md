# SuperTutorAI

An AI-powered tutoring application for mathematics.

## Features

- Chat with an AI tutor to get help with math problems
- Upload and process math papers and solutions
- Vector database for storing and retrieving similar math problems and documents
- Image processing for analyzing math questions from images

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker (for running ChromaDB)
- OpenAI API key (for embeddings)
- Claude API key (for the AI tutor)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/supertutorai.git
   cd supertutorai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:

   ```
   cp .env.example .env
   ```

4. Edit the `.env` file and add your API keys:
   ```
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   CHROMA_DB_URL=http://localhost:8000
   ```

### Running the Application

1. Start the ChromaDB vector database using Docker:

   ```
   docker-compose up -d
   ```

2. Start the development server:

   ```
   npm run dev:all
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Vector Database

SuperTutorAI uses ChromaDB as a vector database for storing and retrieving math problems and documents. This enables semantic search capabilities for finding similar problems or relevant documents.

### API Endpoints

The vector database API is available at `http://localhost:3002/api/vectordb` and provides the following endpoints:

- `GET /status` - Check the status of the vector database
- `POST /documents` - Add a document to the vector database
- `POST /problems` - Add a problem to the vector database
- `POST /query` - Query the vector database for similar documents
- `GET /documents/:id` - Get a document by ID
- `PUT /documents/:id` - Update a document
- `DELETE /documents/:id` - Delete a document

### Adding Documents

To add a document to the vector database, use the AdminPage component, which provides a form for uploading documents and their metadata.

### Querying Similar Documents

You can query the vector database for similar documents using the `VectorStore` class:

```typescript
import { VectorStore } from "./services/vectordb/vectorStore";

const vectorStore = new VectorStore();
await vectorStore.initialize();

// Find similar problems
const similarProblems = await vectorStore.findSimilarProblems(
  "What is the derivative of x^2?"
);

// Find similar documents
const similarDocuments = await vectorStore.findSimilarDocuments(
  "calculus integration"
);
```

## License

MIT
