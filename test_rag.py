from app.vectorstore.faiss_store import vector_store
res = vector_store.search("How can I reset my password?", top_k=5)
print("Search results:")
for doc, score in res:
    print(f"- {doc['title']}: {score}")
print(f"Total results > SIMILARITY_THRESHOLD: {len(res)}")
print("All vector similarities:")
import numpy as np
query_vec = vector_store._get_embedding("How can I reset my password?")
sims = np.dot(vector_store.vectors, query_vec)
for i, s in enumerate(sims):
    print(f"{i}: {s}")
