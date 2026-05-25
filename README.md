# GenAI Assistant with RAG

A production-style GenAI-powered Chat Assistant that answers user questions using Retrieval-Augmented Generation (RAG).

## Features

- **Document Knowledge Base:** Stores and retrieves 5-10 meaningful documents.
- **RAG Implementation:** Uses FAISS for in-memory vector storage with Dot Product / Cosine Similarity.
- **LLM Integration:** Leverages the Gemini API for embeddings (`text-embedding-004`) and responses (`gemini-2.5-flash`).
- **Context Management:** Retains the last 3-5 message pairs per `sessionId` for context.
- **Frontend Chat Interface:** Clean, responsive HTML/JS/CSS frontend.

## Architecture & Workflow

1. **Indexing:** `docs.json` is loaded, embedded using Gemini embeddings, and stored in a FAISS vector index (`IndexFlatIP` combined with L2 normalization to simulate Cosine Similarity).
2. **Retrieving:** When a user asks a query, it's embedded and searched against the FAISS index. The top 3 results are returned if they exceed a similarity threshold.
3. **Generation:** Retrieved context, conversation history, and the user's question are injected into a prompt for the Gemini LLM.
4. **Fallback:** If no relevant documents are found, the system provides a safe fallback response without invoking the LLM with empty context.

## Prerequisites

- Python 3.9+
- A Google Gemini API Key

## Setup Instructions

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository_url>
   cd "TRUEAILAB Assignment"
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the environment:
   Create a `.env` file in the root directory (you can copy `.env.example`) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SIMILARITY_THRESHOLD=0.3
   TOP_K=3
   ```

5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

6. Access the application:
   Open your browser and navigate to `http://localhost:8000/`.
