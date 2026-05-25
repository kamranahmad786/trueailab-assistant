from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.models.schemas import ChatRequest, ChatResponse, ErrorResponse
from app.services.rag_service import rag_service
from app.vectorstore.faiss_store import vector_store # Import to initialize

app = FastAPI(title="TRUEAILAB GenAI Assistant")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message field is required")
        
    try:
        response = rag_service.process_chat(request.sessionId, request.message)
        return response
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Serve the static frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
