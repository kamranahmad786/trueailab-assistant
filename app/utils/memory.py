from typing import List, Dict

class MemoryManager:
    def __init__(self, max_history: int = 5):
        """
        In-memory storage for conversation history.
        Keys are sessionIds, values are lists of dicts containing role and content.
        """
        self.history: Dict[str, List[Dict[str, str]]] = {}
        self.max_history = max_history

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.history:
            self.history[session_id] = []
        
        self.history[session_id].append({"role": role, "content": content})
        
        # Keep only the last N message pairs (2 * max_history)
        if len(self.history[session_id]) > (self.max_history * 2):
            self.history[session_id] = self.history[session_id][-(self.max_history * 2):]

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.history.get(session_id, [])

    def format_history_for_prompt(self, session_id: str) -> str:
        history = self.get_history(session_id)
        if not history:
            return "No prior conversation history."
        
        formatted = []
        for msg in history:
            role_str = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role_str}: {msg['content']}")
        
        return "\n".join(formatted)

# Global instance for in-memory persistence
memory_manager = MemoryManager(max_history=5)
