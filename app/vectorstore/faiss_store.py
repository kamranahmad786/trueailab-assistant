import os
import json
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.3"))

class NumpyVectorStore:
    def __init__(self, docs_path: str = "docs.json"):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        
        self.documents: List[Dict] = []
        self.chunk_metadata: List[Dict] = []
        self.vectors: np.ndarray = np.array([])
        
        if os.path.exists(docs_path):
            self.load_and_index_documents(docs_path)

    def _get_embedding(self, text: str) -> np.ndarray:
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                task_type="retrieval_document"
            )
            vec = np.array(result['embedding'], dtype=np.float32)
            # Normalize for Cosine Similarity
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return np.zeros(768, dtype=np.float32)

    def load_and_index_documents(self, docs_path: str):
        with open(docs_path, 'r', encoding='utf-8') as f:
            self.documents = json.load(f)
        
        vector_list = []
        chunk_id = 0
        for doc in self.documents:
            text_to_embed = f"Title: {doc['title']}\nContent: {doc['content']}"
            vec = self._get_embedding(text_to_embed)
            vector_list.append(vec)
            
            self.chunk_metadata.append({
                "chunk_id": chunk_id,
                "title": doc['title'],
                "content": doc['content'],
                "source_document": docs_path
            })
            chunk_id += 1
            
        if vector_list:
            self.vectors = np.vstack(vector_list)
            print(f"Indexed {len(vector_list)} chunks.")

    def search(self, query: str, top_k: int = 3) -> List[Tuple[Dict, float]]:
        if self.vectors.size == 0:
            return []

        try:
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=query,
                task_type="retrieval_query"
            )
            query_vec = np.array(result['embedding'], dtype=np.float32)
            norm = np.linalg.norm(query_vec)
            if norm > 0:
                query_vec = query_vec / norm
        except Exception as e:
            print(f"Error generating query embedding: {e}")
            return []

        # Cosine similarity using dot product on normalized vectors
        similarities = np.dot(self.vectors, query_vec)
        
        # Get top-k indices sorted by highest similarity
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score >= SIMILARITY_THRESHOLD:
                results.append((self.chunk_metadata[idx], score))
        
        return results

# Singleton instance
vector_store = NumpyVectorStore()
