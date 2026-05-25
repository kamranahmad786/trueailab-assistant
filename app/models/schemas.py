from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    sessionId: str = Field(..., description="Unique identifier for the chat session")
    message: str = Field(..., description="User's message/question", min_length=1)

class ChatResponse(BaseModel):
    reply: str = Field(..., description="The generated reply from the assistant")
    tokensUsed: int = Field(default=0, description="Number of tokens used in the LLM generation (if available)")
    retrievedChunks: int = Field(default=0, description="Number of chunks retrieved from the vector store")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message description")
