import json
import os
from collections import defaultdict, deque
from typing import List, Dict

MEMORY_PATH = "models/neural_memory.json"
KNOWLEDGE_PATH = "models/user_knowledge.json"

class NeuralMemory:
    def __init__(self):
        self.sessions = defaultdict(lambda: deque(maxlen=20))
        self.knowledge = self._load_json(KNOWLEDGE_PATH, {"insights": []})

    def _load_json(self, path, default):
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except:
                pass
        return default

    def save_knowledge(self):
        with open(KNOWLEDGE_PATH, "w") as f:
            json.dump(self.knowledge, f, indent=4)

    def add_to_memory(self, session_id, role, text):
        self.sessions[session_id].append({
            "role": role,
            "text": text,
            "timestamp": os.times()[4] # Rough timestamp
        })

    def get_memory(self, session_id) -> List[Dict]:
        return list(self.sessions[session_id])

    def add_insight(self, topic: str, value: str):
        # Update existing topic or add new
        for insight in self.knowledge["insights"]:
            if insight["topic"] == topic:
                insight["value"] = value
                self.save_knowledge()
                return
        self.knowledge["insights"].append({"topic": topic, "value": value})
        # Cap at 15 insights to prevent prompt bloat
        if len(self.knowledge["insights"]) > 15:
            self.knowledge["insights"] = self.knowledge["insights"][-15:]
        self.save_knowledge()

    def get_insights_summary(self) -> str:
        if not self.knowledge["insights"]:
            return "No persistent knowledge yet."
        # Only use last 10 insights in the prompt to save tokens
        recent = self.knowledge["insights"][-10:]
        return "\n".join([f"- {i['topic']}: {i['value']}" for i in recent])

memory_manager = NeuralMemory()

def add_to_memory(session_id, role, text):
    memory_manager.add_to_memory(session_id, role, text)

def get_memory(session_id):
    return memory_manager.get_memory(session_id)

def add_user_insight(topic, value):
    memory_manager.add_insight(topic, value)

def get_knowledge_context():
    return memory_manager.get_insights_summary()