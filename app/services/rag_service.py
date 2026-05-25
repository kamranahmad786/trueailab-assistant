from typing import Dict, Any
import os
from app.vectorstore.faiss_store import vector_store
from app.services.llm_service import llm_service
from app.utils.memory import memory_manager
from app.models.schemas import ChatResponse

class RAGService:
    def process_chat(self, session_id: str, message: str) -> ChatResponse:
        # 1. Retrieve Context
        top_k = int(os.getenv("TOP_K", "3"))
        retrieved = vector_store.search(message, top_k=top_k)
        
        # 2. Build Context String
        context_parts = []
        for doc, score in retrieved:
            context_parts.append(f"Title: {doc['title']}\nContent: {doc['content']}")
            print(f"Retrieved: {doc['title']} (Score: {score:.4f})")
            
        context_str = "\n\n".join(context_parts)
        
        if not context_str:
            # Fallback if nothing retrieved
            fallback_msg = "I could not find enough information in the knowledge base to answer this question."
            memory_manager.add_message(session_id, "user", message)
            memory_manager.add_message(session_id, "assistant", fallback_msg)
            return ChatResponse(
                reply=fallback_msg,
                tokensUsed=0,
                retrievedChunks=0
            )
            
        # 3. Get Conversation History
        history_str = memory_manager.format_history_for_prompt(session_id)
        
        # 4. Invoke LLM
        llm_result = llm_service.generate_response(context_str, history_str, message)
        
        # 5. Update Memory
        memory_manager.add_message(session_id, "user", message)
        memory_manager.add_message(session_id, "assistant", llm_result["reply"])
        
        # 6. Return Response
        return ChatResponse(
            reply=llm_result["reply"],
            tokensUsed=llm_result["tokens_used"],
            retrievedChunks=len(retrieved)
        )

rag_service = RAGService()
