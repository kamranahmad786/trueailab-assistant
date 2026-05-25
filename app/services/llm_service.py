import os
import google.generativeai as genai
from typing import Dict, Any

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

# Initialize Gemini Model
model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    system_instruction="You are an AI assistant for TRUEAILAB. Your primary job is to answer questions using ONLY the provided context. If the provided context does not contain the answer to the user's question, politely explain that you don't have enough information in your knowledge base.",
    generation_config=genai.types.GenerationConfig(
        temperature=0.1, 
    )
)

class LLMService:
    def generate_response(self, context: str, history: str, question: str) -> Dict[str, Any]:
        prompt = f"""
Context:
{context}

Conversation History:
{history}

Question:
{question}
"""
        try:
            response = model.generate_content(prompt)
            # Rough estimate of tokens or we could use the usage metadata
            tokens_used = 0
            if response.usage_metadata:
                tokens_used = response.usage_metadata.total_token_count
                
            return {
                "reply": response.text,
                "tokens_used": tokens_used
            }
        except Exception as e:
            print(f"LLM Error: {e}")
            return {
                "reply": "I'm sorry, I encountered an error while trying to process your request.",
                "tokens_used": 0
            }

llm_service = LLMService()
