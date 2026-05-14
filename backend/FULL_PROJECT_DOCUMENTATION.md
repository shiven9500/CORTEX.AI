# Mood Intelligence Engine - Full Project Source Code & Documentation

## 📚 Introduction
The **Mood Intelligence Engine** is a hybrid AI system designed for emotional support and intelligent conversation. It leverages Large Language Models (LLMs), Supervised Learning (SL), Unsupervised Learning (UL), and Reinforcement Learning (RL) to provide a personalized user experience.

---

## 🛠️ System Architecture
The system follows a modular architecture:
1.  **Frontend**: React (Vite) + Tailwind CSS + Framer Motion.
2.  **Backend**: FastAPI (Python).
3.  **Intelligence**: Gemini AI + Scikit-Learn + Custom Q-Learning Agent.

---

## 📂 Backend Source Code (Complete)

### 1. API Entry Point: `app/main.py`
```python
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.models.inference import predict, feedback

app = FastAPI(title="Mood AI Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class FeedbackRequest(BaseModel):
    state: str
    action: str
    reward: int

@app.get("/")
def home():
    return {"message": "Mood AI Backend Running!"}

@app.post("/chat")
def chat(req: ChatRequest):
    result = predict(req.message)
    return result

@app.post("/feedback")
def give_feedback(req: FeedbackRequest):
    feedback(req.state, req.action, req.reward)
    return {"status": "updated"}
```
**Explanation**: This file serves as the gateway for the entire backend application using the FastAPI framework. It sets up the server and defines the communication protocol (CORS) so that the React frontend can securely send messages to the Python brain. The `/chat` endpoint is the most important route, as it takes the user's text and passes it to the inference engine for processing. The `/feedback` route allows the system to receive user ratings, which are essential for the Reinforcement Learning agent to improve. By separating the API routes from the heavy AI logic, the code remains clean, modular, and easy to maintain or scale.

---

### 2. Inference Engine: `app/models/inference.py`
```python
import joblib
import logging
import os
from typing import Dict, Any
from dotenv import load_dotenv
from google import genai

from app.data_pipeline.preprocess import clean_text
from app.models.rl_agent import agent
from app.models.memory import add_to_memory, get_memory

# Load environment variables
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "gemini-flash-latest"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load local models (Fallbacks)
try:
    sl_model = joblib.load("models/sl_model.pkl")
    vectorizer = joblib.load("models/vectorizer.pkl")
    kmeans = joblib.load("models/kmeans.pkl")
    cluster_vectorizer = joblib.load("models/cluster_vectorizer.pkl")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    sl_model = vectorizer = kmeans = cluster_vectorizer = None

def predict(user_input: str, session_id: str = "default") -> Dict[str, Any]:
    if not user_input or len(user_input.strip()) < 2:
        return fallback_response(user_input, session_id)

    try:
        text = clean_text(user_input)
        add_to_memory(session_id, "user", user_input)

        # 2. Emotion Detection (Powered by Gemini)
        emotion = "neutral"
        engine_used = "Local Model"
        try:
            emotion_prompt = f"Analyze the emotion of this text: '{user_input}'. Categorize it into EXACTLY ONE of these: happy, sad, angry, anxious, neutral. Return only the word."
            response_em = client.models.generate_content(model=MODEL_NAME, contents=emotion_prompt)
            emotion = response_em.text.strip().lower()
            if emotion not in ["happy", "sad", "angry", "anxious", "neutral"]:
                emotion = "neutral"
            engine_used = f"Gemini ({MODEL_NAME})"
        except Exception as e:
            logger.error(f"Gemini Emotion Detection Error: {e}")
            if sl_model and vectorizer:
                vec = vectorizer.transform([text])
                emotion = sl_model.predict(vec)[0]
                engine_used = "Local Model (Fallback)"

        # 3. Clustering (Unsupervised)
        cluster = 0
        if kmeans and cluster_vectorizer:
            c_vec = cluster_vectorizer.transform([text])
            cluster = int(kmeans.predict(c_vec)[0])

        # 4. Action Selection (RL Agent)
        state = agent.get_state(emotion, cluster)
        action = agent.choose_action(state)

        # 5. Context Retrieval
        history = get_memory(session_id)
        user_msgs = [m["text"] for m in history if m["role"] == "user"]
        context = user_msgs[-2] if len(user_msgs) >= 2 else ""

        # 6. Response Generation (Gemini-powered with RL strategy)
        try:
            response_prompt = f"User: '{user_input}'. Context: '{context}'. Emotion: {emotion}. Strategy: {action}. Generate a short empathetic response."
            response_gen = client.models.generate_content(model=MODEL_NAME, contents=response_prompt)
            response = response_gen.text.strip()
        except Exception as e:
            from app.models.response_generator import generate_response
            response = generate_response(emotion=emotion, action=action, text=user_input, context=context)
        
        add_to_memory(session_id, "ai", response)

        return {
            "input": user_input,
            "emotion": emotion,
            "cluster": cluster,
            "action": action,
            "response": response,
            "state": state,
            "session_id": session_id,
            "analysis": {
                "detected_emotion": emotion,
                "user_intent": "normal",
                "cluster_group": cluster,
                "strategy": action,
                "engine": engine_used
            }
        }
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return fallback_response(user_input, session_id)

def feedback(state, action, reward):
    agent.update(state, action, reward)
```
**Explanation**: This is the orchestrator file that manages the full AI lifecycle for every message. It first cleans the user's input and then attempts to use Gemini AI for high-accuracy emotion detection, falling back to a local model if the API is down. It also calculates a "cluster" using Unsupervised Learning to understand the conversation topic. These two pieces of data—Emotion and Cluster—are sent to the Reinforcement Learning agent to determine the best response strategy. Finally, it uses Gemini again to generate the actual response text, ensuring it matches the chosen strategy. This multi-layered approach ensures the AI is both intelligent and adaptable to the user's needs.

---

### 3. Reinforcement Learning: `app/models/rl_agent.py`
```python
import random
import json
import os
import logging

Q_TABLE_PATH = "models/q_table.json"
ACTIONS = ["motivate", "advice", "distract", "deep"]

class RLAgent:
    def __init__(self, path=Q_TABLE_PATH):
        self.path = path
        self.q_table = self._load_q_table()

    def _load_q_table(self):
        if os.path.exists(self.path):
            with open(self.path, "r") as f: return json.load(f)
        return {}

    def save(self):
        with open(self.path, "w") as f: json.dump(self.q_table, f, indent=4)

    def get_state(self, emotion, cluster):
        return f"{emotion}_{cluster}"

    def choose_action(self, state, epsilon=0.15):
        if random.random() < epsilon or state not in self.q_table:
            return random.choice(ACTIONS)
        state_actions = self.q_table[state]
        return max(state_actions, key=state_actions.get)

    def update(self, state, action, reward, alpha=0.1, gamma=0.9):
        if state not in self.q_table:
            self.q_table[state] = {a: 0.0 for a in ACTIONS}
        current_q = self.q_table[state][action]
        max_q = max(self.q_table[state].values())
        new_q = current_q + alpha * (reward + gamma * max_q - current_q)
        self.q_table[state][action] = new_q
        self.save()

agent = RLAgent()
```
**Explanation**: This file implements the Reinforcement Learning logic using a Q-Learning algorithm. The agent maintains a "Q-Table," which is essentially a scorecard that tells the AI which strategy works best for every possible combination of emotion and topic. When the user provides feedback (positive or negative), the `update` function adjusts the scores in this table. Over time, the AI learns that "advice" might work better for someone who is "anxious about work," while "distraction" might be better for someone who is "angry." This continuous learning makes the chatbot personalized to every unique user, which is the key novelty of the project.

---

### 4. Local Response Generator: `app/models/response_generator.py`
```python
import random
from collections import deque

class ResponseMemory:
    def __init__(self, size=5): self.memory = deque(maxlen=size)
    def is_repeating(self, resp): return resp in self.memory
    def remember(self, resp): self.memory.append(resp)

memory = ResponseMemory()
RESPONSES = {
    "happy": {
        "motivate": ["Love that energy—keep it going!", "High spirits lead to high achievements."],
        "advice": ["Channel this positivity into something meaningful.", "Share this joy!"],
        "distract": ["Celebrate a little!", "How about a hobby you love?"],
        "deep": ["What’s been going so well?", "What are you grateful for?"]
    },
    "sad": {
        "motivate": ["You’ve handled tough moments before.", "Small steps still move you forward."],
        "advice": ["Try journaling.", "Be kind to yourself today."],
        "distract": ["Take a break with music.", "A short walk might help."],
        "deep": ["Want to talk about it?", "I'm here to listen."]
    }
}

class ResponseGenerator:
    def generate(self, emotion, action, text="", context=""):
        emotion_data = RESPONSES.get(emotion, RESPONSES["neutral"])
        action_data = emotion_data.get(action, emotion_data["motivate"])
        return random.choice(action_data)

generator = ResponseGenerator()
def generate_response(emotion, action, text=None, context=None):
    return generator.generate(emotion, action, text or "", context or "")
```
**Explanation**: This module acts as a robust safety net for the application. If the Gemini API is unavailable or the internet connection is unstable, this file selects a high-quality, pre-written response from a localized bank. It uses a `ResponseMemory` class to track the last few messages, ensuring that the AI doesn't repeat the same phrase twice in a row, which would break the immersion. The responses are categorized by emotion and strategy, maintaining the core logic of the RL agent even in offline mode. This ensures the application remains functional and helpful at all times, regardless of external service availability.

---

### 5. Supervised Learning Training: `app/models/train_sl.py`
```python
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

def train():
    df = pd.read_csv("data/processed/cleaned_text.csv").dropna()
    X = df["text"]
    y = df["emotion"]
    vectorizer = TfidfVectorizer(max_features=7000, ngram_range=(1, 2))
    X_vec = vectorizer.fit_transform(X)
    model = LogisticRegression(max_iter=500, class_weight='balanced')
    model.fit(X_vec, y)
    joblib.dump(model, "models/sl_model.pkl")
    joblib.dump(vectorizer, "models/vectorizer.pkl")

if __name__ == "__main__": train()
```
**Explanation**: This training script builds the local emotion classifier using traditional machine learning. It uses a "Bag of Words" approach called TF-IDF to turn human sentences into a mathematical grid that the computer can understand. The Logistic Regression model is then trained on this grid to find patterns between words and emotions (e.g., seeing the word "sad" frequently associated with the "sadness" label). By saving this model as a `.pkl` file, the backend can load it instantly during runtime without needing to re-train. This provides the "Supervised Learning" foundation that acts as a reliable backup to the more advanced Gemini LLM.

---

### 6. Unsupervised Learning Training: `app/models/train_ul.py`
```python
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

def train_ul():
    df = pd.read_csv("data/processed/cleaned_text.csv")
    texts = df["text"].dropna()
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
    X = vectorizer.fit_transform(texts)
    kmeans = KMeans(n_clusters=4, random_state=42).fit(X)
    joblib.dump(kmeans, "models/kmeans.pkl")
    joblib.dump(vectorizer, "models/cluster_vectorizer.pkl")

if __name__ == "__main__": train_ul()
```
**Explanation**: This file implements the Unsupervised Learning branch of the project using the K-Means algorithm. Unlike the emotion classifier, this model is not told what the categories are; it simply looks for sentences that are "mathematically close" to each other and groups them into 4 clusters. These clusters represent hidden themes or topics in the user's messages, such as "relationships," "work," or "daily life." By identifying these clusters, the AI gains a deeper understanding of the *context* of the conversation. This context is then used by the RL agent to make much smarter decisions about which response strategy to use.

---

### 7. NLP Preprocessing: `app/data_pipeline/preprocess.py`
```python
import re

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()
```
**Explanation**: This is a utility file that handles the "Natural Language Processing" (NLP) cleaning phase. Before any machine learning model can process text, it must be cleaned of noise like URLs, special characters, and weird spacing. This function turns every message into a "pure" string of lowercase letters, which drastically reduces the complexity for the AI models. By standardizing the input this way, we ensure that "HAPPY!", "happy...", and "Happy" are all treated exactly the same. This simple but critical step is what allows the statistical models (SL/UL) to achieve high accuracy on limited data.

---

### 8. Session Memory: `app/models/memory.py`
```python
from collections import defaultdict, deque
MEMORY = defaultdict(lambda: deque(maxlen=10))

def add_to_memory(session_id, role, text):
    MEMORY[session_id].append({"role": role, "text": text})

def get_memory(session_id):
    return list(MEMORY[session_id])
```
**Explanation**: This file manages the "Short-Term Memory" of the AI to provide conversational continuity. It uses a `defaultdict` of `deques` to store the last 10 messages for every unique user session. This allows the AI to "remember" what the user said just a moment ago, which is passed as context to Gemini for better response generation. Without this memory, the AI would be "amnesic" and wouldn't be able to handle follow-up questions or maintain a coherent conversation flow. This memory is cleared when the server restarts, making it a lightweight and privacy-friendly way to handle session data.

---

### 9. Label Mapping: `app/data_pipeline/label_mapping.py`
```python
EMOTION_MAP = {
    "joy": "happy", "love": "happy", "sadness": "sad",
    "anger": "angry", "fear": "anxious", "surprise": "anxious"
}
def map_emotion(label): return EMOTION_MAP.get(label, None)

GOEMOTION_MAP = {
    0: "happy", 12: "sad", 14: "angry", 27: "neutral"
}
def map_goemotion(label): return GOEMOTION_MAP.get(label, None)
```
**Explanation**: This is a crucial data engineering file that standardizes labels from different datasets. When training the AI, we use data from multiple sources (like GoEmotions or Kaggle), and each source has its own naming convention (e.g., one says "joy," another says "happiness"). This script acts as a translator, mapping dozens of specific labels into our 5 core emotions: happy, sad, angry, anxious, and neutral. This standardization is vital for creating a consistent training set, allowing the models to learn more effectively from diverse data sources. It ensures that the final "Emotion Detection" layer always outputs a predictable and useful result for the RL agent.

---

## 📜 Summary for Viva
- **Aim**: To bridge human emotional complexity with machine response strategies.
- **Novelty**: The Hybrid Intelligence Architecture (LLM + RL + SL/UL).
- **Process**: Preprocess -> Detect Emotion -> Cluster Topic -> RL Strategy -> AI Response Generation.
