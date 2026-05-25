import os
from dotenv import load_dotenv
load_dotenv()
from app.services.llm_service import llm_service
context = "Title: Reset Password\nContent: Users can reset their password from Settings > Security. An email will be sent to the registered email address with a reset link that expires in 24 hours."
history = ""
question = "How do I reset my password?"
res = llm_service.generate_response(context, history, question)
print("LLM Response:")
print(res)
